from datetime import date, datetime, time, timedelta
from typing import Any, Optional
from zlib import crc32

from sqlalchemy import func
from sqlalchemy.orm import joinedload

from app.models.train import Train
from app.services.external_train_service import (
    fetch_external_trains,
    is_external_train_api_enabled,
)
from app.utils.database import db


DEFAULT_PREFERENCE = "balanced"
DEFAULT_TIME_PREFERENCE = "any"
SEARCH_PROVIDER_LOCAL = "local"
SEARCH_PROVIDER_EXTERNAL = "external"
SEARCH_PROVIDER_NONE = "none"
ALLOWED_TIME_PREFERENCES = {"morning", "afternoon", "evening", "night", "any"}
PREFERENCE_WEIGHTS = {
    "balanced": {
        "availability": 0.5,
        "duration": 0.3,
        "price": 0.2,
    },
    "cheapest": {
        "availability": 0.15,
        "duration": 0.15,
        "price": 0.7,
    },
    "fastest": {
        "availability": 0.15,
        "duration": 0.7,
        "price": 0.15,
    },
    "availability": {
        "availability": 0.7,
        "duration": 0.15,
        "price": 0.15,
    },
}


def _normalize_location(value: str, field_name: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field_name} is required.")

    return " ".join(value.strip().lower().split())


def _display_location(normalized_location: str) -> str:
    return " ".join(part.capitalize() for part in normalized_location.split())


def _parse_journey_date(journey_date: str) -> date:
    if not isinstance(journey_date, str) or not journey_date.strip():
        raise ValueError("date is required.")

    raw_journey_date = journey_date.strip()
    parsed_date = None

    for supported_format in ("%Y-%m-%d", "%d-%m-%Y"):
        try:
            parsed_date = datetime.strptime(raw_journey_date, supported_format).date()
            break
        except ValueError:
            continue

    if parsed_date is None:
        raise ValueError("Invalid date format. Expected YYYY-MM-DD or DD-MM-YYYY.")

    if parsed_date < date.today():
        raise ValueError("Journey date cannot be in the past.")

    return parsed_date


def _normalize_optional_class_type(class_type: Optional[str]) -> Optional[str]:
    if not isinstance(class_type, str) or not class_type.strip():
        return None

    return " ".join(class_type.strip().split())


def _normalize_preference(preference: str) -> str:
    if not isinstance(preference, str) or not preference.strip():
        return DEFAULT_PREFERENCE

    normalized_preference = preference.strip().lower()
    return normalized_preference if normalized_preference in PREFERENCE_WEIGHTS else DEFAULT_PREFERENCE


def _classify_time_bucket(clock_time: time) -> str:
    if time(5, 0) <= clock_time < time(12, 0):
        return "morning"
    if time(12, 0) <= clock_time < time(17, 0):
        return "afternoon"
    if time(17, 0) <= clock_time < time(21, 0):
        return "evening"
    return "night"


def _normalize_time_preference(time_preference: Optional[str]) -> str:
    if not isinstance(time_preference, str) or not time_preference.strip():
        return DEFAULT_TIME_PREFERENCE

    normalized_value = " ".join(time_preference.strip().lower().split()).replace(".", "")
    if normalized_value in ALLOWED_TIME_PREFERENCES:
        return normalized_value

    if normalized_value == "noon":
        return "afternoon"
    if normalized_value == "midnight":
        return "night"

    for supported_format in ("%H:%M", "%H:%M:%S", "%I %p", "%I:%M %p"):
        try:
            return _classify_time_bucket(datetime.strptime(normalized_value.upper(), supported_format).time())
        except ValueError:
            continue

    return DEFAULT_TIME_PREFERENCE


def _matches_time_preference(clock_time: time, time_preference: str) -> bool:
    if time_preference == DEFAULT_TIME_PREFERENCE:
        return True

    return _classify_time_bucket(clock_time) == time_preference


def _calculate_travel_hours(departure_time: time, arrival_time: time, journey_date: date) -> float:
    departure_datetime = datetime.combine(journey_date, departure_time)
    arrival_datetime = datetime.combine(journey_date, arrival_time)

    if arrival_datetime <= departure_datetime:
        arrival_datetime += timedelta(days=1)

    travel_seconds = (arrival_datetime - departure_datetime).total_seconds()
    if travel_seconds <= 0:
        travel_seconds += 24 * 60 * 60

    return max(travel_seconds / 3600.0, 1 / 60.0)


def _build_explanation(
    preference: str,
    available_seats: int,
    travel_hours: float,
    price: float,
    has_seat_data: bool = True,
) -> str:
    if not has_seat_data:
        return "Schedule found in the local database, but seat availability and fare data are not loaded for this train yet."

    if preference == "cheapest":
        return f"Cheaper option at {price:.2f} with {available_seats} seats currently open."
    if preference == "fastest":
        return f"Faster trip at {travel_hours:.1f} hours with {available_seats} seats available."
    if preference == "availability":
        return f"Better seat availability with {available_seats} seats left for booking."

    return (
        f"Balanced option with {available_seats} seats, "
        f"{travel_hours:.1f} hours travel time, and fare {price:.2f}."
    )


def _build_sort_key(result: dict, preference: str) -> tuple:
    missing_seat_data = 0 if result.get("has_seat_data", True) else 1

    if preference == "cheapest":
        return (
            missing_seat_data,
            -result["score"],
            result["price"],
            result["travel_hours"],
            -result["available_seats"],
            result["train_id"],
            result["class_type"],
        )
    if preference == "fastest":
        return (
            missing_seat_data,
            -result["score"],
            result["travel_hours"],
            result["price"],
            -result["available_seats"],
            result["train_id"],
            result["class_type"],
        )
    if preference == "availability":
        return (
            missing_seat_data,
            -result["score"],
            -result["available_seats"],
            result["travel_hours"],
            result["price"],
            result["train_id"],
            result["class_type"],
        )

    return (
        missing_seat_data,
        -result["score"],
        -result["available_seats"],
        result["travel_hours"],
        result["price"],
        result["train_id"],
        result["class_type"],
    )


def _calculate_score(
    available_seats: int,
    total_seats: int,
    travel_hours: float,
    price: float,
    preference: str,
) -> float:
    weights = PREFERENCE_WEIGHTS[preference]
    availability_ratio = (available_seats / total_seats) if total_seats > 0 else 0.0
    inverse_travel_time = 1.0 / travel_hours if travel_hours > 0 else 0.0
    inverse_price = 1.0 / price if price > 0 else 0.0

    return (
        (weights["availability"] * availability_ratio) +
        (weights["duration"] * inverse_travel_time) +
        (weights["price"] * inverse_price)
    )


def _build_result(
    train_id: int,
    train_name: str,
    source: str,
    destination: str,
    journey_date: date,
    departure_time: time,
    arrival_time: time,
    class_type: str,
    price: float,
    available_seats: int,
    total_seats: int,
    preference: str,
    has_seat_data: bool = True,
) -> dict:
    safe_total_seats = max(int(total_seats or 0), 0)
    safe_available_seats = max(int(available_seats or 0), 0)
    travel_hours = _calculate_travel_hours(departure_time, arrival_time, journey_date)
    score = _calculate_score(
        safe_available_seats,
        safe_total_seats,
        travel_hours,
        float(price or 0),
        preference,
    )

    return {
        "train_id": int(train_id),
        "train_name": train_name,
        "source": source,
        "destination": destination,
        "journey_date": journey_date.isoformat(),
        "departure_time": departure_time.strftime("%H:%M:%S"),
        "arrival_time": arrival_time.strftime("%H:%M:%S"),
        "travel_hours": round(travel_hours, 2),
        "class_type": class_type,
        "price": round(float(price or 0), 2),
        "available_seats": safe_available_seats,
        "total_seats": safe_total_seats,
        "has_seat_data": has_seat_data,
        "score": round(score, 4),
        "explanation": _build_explanation(
            preference,
            safe_available_seats,
            travel_hours,
            float(price or 0),
            has_seat_data=has_seat_data,
        ),
    }


def _search_local_trains(
    normalized_source: str,
    normalized_destination: str,
    parsed_date: date,
    normalized_preference: str,
    normalized_class_type: Optional[str],
    normalized_time_preference: str,
) -> list[dict]:
    train_rows = (
        db.session.query(Train)
        .options(joinedload(Train.seat_availabilities))
        .filter(
            func.lower(func.trim(Train.source)) == normalized_source,
            func.lower(func.trim(Train.destination)) == normalized_destination,
            Train.journey_date == parsed_date,
        )
        .order_by(Train.departure_time.asc(), Train.id.asc())
        .all()
    )

    results = []
    for train in train_rows:
        if not _matches_time_preference(train.departure_time, normalized_time_preference):
            continue

        seat_rows = sorted(
            train.seat_availabilities,
            key=lambda seat: ((seat.class_type or "").lower(), seat.id),
        )

        if not seat_rows:
            results.append(
                _build_result(
                    train_id=train.id,
                    train_name=train.name,
                    source=train.source,
                    destination=train.destination,
                    journey_date=train.journey_date,
                    departure_time=train.departure_time,
                    arrival_time=train.arrival_time,
                    class_type=normalized_class_type or "General",
                    price=0.0,
                    available_seats=0,
                    total_seats=0,
                    preference=normalized_preference,
                    has_seat_data=False,
                )
            )
            continue

        for seat in seat_rows:
            results.append(
                _build_result(
                    train_id=train.id,
                    train_name=train.name,
                    source=train.source,
                    destination=train.destination,
                    journey_date=train.journey_date,
                    departure_time=train.departure_time,
                    arrival_time=train.arrival_time,
                    class_type=seat.class_type,
                    price=float(seat.price or 0),
                    available_seats=int(seat.available_seats or 0),
                    total_seats=int(seat.total_seats or 0),
                    preference=normalized_preference,
                )
            )

    return sorted(results, key=lambda result: _build_sort_key(result, normalized_preference))


def _get_nested_value(payload: dict, *paths: str) -> Any:
    for path in paths:
        value = payload
        for segment in path.split("."):
            if isinstance(value, dict) and segment in value:
                value = value[segment]
            else:
                break
        else:
            return value

    return None


def _parse_time_value(raw_value: Any) -> Optional[time]:
    if isinstance(raw_value, time):
        return raw_value

    if isinstance(raw_value, datetime):
        return raw_value.time()

    if not isinstance(raw_value, str) or not raw_value.strip():
        return None

    normalized_value = raw_value.strip()
    for supported_format in (
        "%H:%M:%S",
        "%H:%M",
        "%I:%M %p",
        "%I %p",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
    ):
        try:
            parsed = datetime.strptime(normalized_value.upper(), supported_format)
            return parsed.time()
        except ValueError:
            continue

    try:
        return datetime.fromisoformat(normalized_value.replace("Z", "+00:00")).time()
    except ValueError:
        return None


def _parse_external_date(raw_value: Any, fallback_date: date) -> date:
    if isinstance(raw_value, date) and not isinstance(raw_value, datetime):
        return raw_value

    if isinstance(raw_value, datetime):
        return raw_value.date()

    if not isinstance(raw_value, str) or not raw_value.strip():
        return fallback_date

    normalized_value = raw_value.strip()
    for supported_format in ("%Y-%m-%d", "%d-%m-%Y", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(normalized_value, supported_format).date()
        except ValueError:
            continue

    try:
        return datetime.fromisoformat(normalized_value.replace("Z", "+00:00")).date()
    except ValueError:
        return fallback_date


def _to_int(raw_value: Any, default: int = 0) -> int:
    try:
        return int(raw_value)
    except (TypeError, ValueError):
        return default


def _to_float(raw_value: Any, default: float = 0.0) -> float:
    try:
        return float(raw_value)
    except (TypeError, ValueError):
        return default


def _build_fallback_train_id(index: int, seed: str) -> int:
    return crc32(f"{index}:{seed}".encode("utf-8")) & 0xFFFFFFFF


def _normalize_external_results(
    external_rows: list[dict],
    requested_source: str,
    requested_destination: str,
    parsed_date: date,
    normalized_preference: str,
    normalized_time_preference: str,
    normalized_class_type: Optional[str],
) -> list[dict]:
    results = []

    for index, row in enumerate(external_rows, start=1):
        departure_time = _parse_time_value(
            _get_nested_value(row, "departure_time", "departure", "departureTime", "times.departure")
        )
        arrival_time = _parse_time_value(
            _get_nested_value(row, "arrival_time", "arrival", "arrivalTime", "times.arrival")
        )
        if departure_time is None or arrival_time is None:
            continue

        if not _matches_time_preference(departure_time, normalized_time_preference):
            continue

        external_date = _parse_external_date(
            _get_nested_value(row, "journey_date", "date", "travel_date"),
            parsed_date,
        )

        train_name = str(
            _get_nested_value(row, "train_name", "name", "train.name", "train_name_display")
            or f"External Train {index}"
        )
        source = str(
            _get_nested_value(row, "source", "from", "route.source", "origin")
            or requested_source
        )
        destination = str(
            _get_nested_value(row, "destination", "to", "route.destination", "destination_name")
            or requested_destination
        )
        class_type = str(
            _get_nested_value(row, "class_type", "travel_class", "class", "seat.class_type")
            or normalized_class_type
            or "General"
        )
        available_seats = _to_int(
            _get_nested_value(row, "available_seats", "seats_available", "seat.available", "availability")
        )
        total_seats = _to_int(
            _get_nested_value(row, "total_seats", "seat.total", "capacity", "seats_total"),
            default=available_seats,
        )
        if total_seats < available_seats:
            total_seats = available_seats

        train_id = _to_int(
            _get_nested_value(row, "train_id", "id", "train.id", "train.number"),
            default=_build_fallback_train_id(index, f"{train_name}-{source}-{destination}-{external_date.isoformat()}"),
        )

        results.append(
            _build_result(
                train_id=train_id,
                train_name=train_name,
                source=source,
                destination=destination,
                journey_date=external_date,
                departure_time=departure_time,
                arrival_time=arrival_time,
                class_type=class_type,
                price=_to_float(_get_nested_value(row, "price", "fare", "seat.price")),
                available_seats=available_seats,
                total_seats=total_seats,
                preference=normalized_preference,
            )
        )

    return sorted(results, key=lambda result: _build_sort_key(result, normalized_preference))


def _build_search_message(provider: str, result_count: int, external_enabled: bool) -> str:
    if provider == SEARCH_PROVIDER_LOCAL:
        return f"Showing {result_count} train option(s) from the local database."
    if provider == SEARCH_PROVIDER_EXTERNAL:
        return "No local trains matched, so these results came from the external train provider."
    if external_enabled:
        return "No trains were found in the local database or the external train provider."
    return "No trains were found in the local database, and external fallback is disabled."


def search_trains(
    source: str,
    destination: str,
    journey_date: str,
    preference: str = DEFAULT_PREFERENCE,
    class_type: Optional[str] = None,
    time_preference: Optional[str] = DEFAULT_TIME_PREFERENCE,
) -> dict:
    normalized_source = _normalize_location(source, "source")
    normalized_destination = _normalize_location(destination, "destination")
    if normalized_source == normalized_destination:
        raise ValueError("source and destination must be different.")

    parsed_date = _parse_journey_date(journey_date)
    normalized_preference = _normalize_preference(preference)
    normalized_class_type = _normalize_optional_class_type(class_type)
    normalized_time_preference = _normalize_time_preference(time_preference)
    external_enabled = is_external_train_api_enabled()

    print(
        "[train_search] "
        f"source={source.strip()} "
        f"destination={destination.strip()} "
        f"incoming_date={journey_date.strip()} "
        f"normalized_date={parsed_date.isoformat()} "
        f"class_type={normalized_class_type or ''} "
        f"time_preference={normalized_time_preference} "
        f"external_enabled={external_enabled}"
    )

    local_results = _search_local_trains(
        normalized_source,
        normalized_destination,
        parsed_date,
        normalized_preference,
        normalized_class_type,
        normalized_time_preference,
    )
    if local_results:
        return {
            "data": local_results,
            "provider": SEARCH_PROVIDER_LOCAL,
            "message": _build_search_message(SEARCH_PROVIDER_LOCAL, len(local_results), external_enabled),
        }

    external_results = []
    if external_enabled:
        external_rows = fetch_external_trains(
            source=_display_location(normalized_source),
            destination=_display_location(normalized_destination),
            journey_date=parsed_date.isoformat(),
            time_preference=normalized_time_preference,
            class_type=normalized_class_type,
            preference=normalized_preference,
        )
        external_results = _normalize_external_results(
            external_rows=external_rows,
            requested_source=_display_location(normalized_source),
            requested_destination=_display_location(normalized_destination),
            parsed_date=parsed_date,
            normalized_preference=normalized_preference,
            normalized_time_preference=normalized_time_preference,
            normalized_class_type=normalized_class_type,
        )

    if external_results:
        return {
            "data": external_results,
            "provider": SEARCH_PROVIDER_EXTERNAL,
            "message": _build_search_message(SEARCH_PROVIDER_EXTERNAL, len(external_results), external_enabled),
        }

    return {
        "data": [],
        "provider": SEARCH_PROVIDER_NONE,
        "message": _build_search_message(SEARCH_PROVIDER_NONE, 0, external_enabled),
    }
