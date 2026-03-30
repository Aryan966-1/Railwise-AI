from datetime import date, datetime, timedelta

from sqlalchemy import func

from app.models.seat_availability import SeatAvailability
from app.models.train import Train
from app.utils.database import db


DEFAULT_PREFERENCE = "balanced"
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


def _parse_journey_date(journey_date: str) -> date:
    if not isinstance(journey_date, str) or not journey_date.strip():
        raise ValueError("date is required.")

    try:
        parsed_date = datetime.strptime(journey_date.strip(), "%Y-%m-%d").date()
    except ValueError as exc:
        raise ValueError("Invalid date format. Expected YYYY-MM-DD.") from exc

    if parsed_date < date.today():
        raise ValueError("Journey date cannot be in the past.")

    return parsed_date


def _normalize_preference(preference: str) -> str:
    if not isinstance(preference, str) or not preference.strip():
        return DEFAULT_PREFERENCE

    normalized_preference = preference.strip().lower()
    return normalized_preference if normalized_preference in PREFERENCE_WEIGHTS else DEFAULT_PREFERENCE


def _calculate_travel_hours(train: Train, journey_date: date) -> float:
    departure_datetime = datetime.combine(journey_date, train.departure_time)
    arrival_datetime = datetime.combine(journey_date, train.arrival_time)

    if arrival_datetime <= departure_datetime:
        arrival_datetime += timedelta(days=1)

    travel_seconds = (arrival_datetime - departure_datetime).total_seconds()
    if travel_seconds <= 0:
        travel_seconds += 24 * 60 * 60

    return max(travel_seconds / 3600.0, 1 / 60.0)


def _build_explanation(preference: str, available_seats: int, travel_hours: float, price: float) -> str:
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
    if preference == "cheapest":
        return (-result["score"], result["price"], result["travel_hours"], -result["available_seats"], result["train_id"], result["class_type"])
    if preference == "fastest":
        return (-result["score"], result["travel_hours"], result["price"], -result["available_seats"], result["train_id"], result["class_type"])
    if preference == "availability":
        return (-result["score"], -result["available_seats"], result["travel_hours"], result["price"], result["train_id"], result["class_type"])

    return (-result["score"], -result["available_seats"], result["travel_hours"], result["price"], result["train_id"], result["class_type"])


def search_trains(source: str, destination: str, journey_date: str, preference: str = DEFAULT_PREFERENCE) -> list:
    normalized_source = _normalize_location(source, "source")
    normalized_destination = _normalize_location(destination, "destination")
    if normalized_source == normalized_destination:
        raise ValueError("source and destination must be different.")

    parsed_date = _parse_journey_date(journey_date)
    normalized_preference = _normalize_preference(preference)
    weights = PREFERENCE_WEIGHTS[normalized_preference]

    train_rows = (
        db.session.query(Train, SeatAvailability)
        .join(SeatAvailability, SeatAvailability.train_id == Train.id)
        .filter(
            func.lower(func.trim(Train.source)) == normalized_source,
            func.lower(func.trim(Train.destination)) == normalized_destination,
            Train.journey_date == parsed_date,
        )
        .order_by(Train.departure_time.asc(), Train.id.asc(), SeatAvailability.class_type.asc())
        .all()
    )

    if not train_rows:
        return []

    results = []
    for train, seat in train_rows:
        total_seats = max(int(seat.total_seats or 0), 0)
        available_seats = max(int(seat.available_seats or 0), 0)
        availability_ratio = (available_seats / total_seats) if total_seats > 0 else 0.0

        travel_hours = _calculate_travel_hours(train, parsed_date)
        inverse_travel_time = 1.0 / travel_hours if travel_hours > 0 else 0.0

        price = float(seat.price or 0)
        inverse_price = 1.0 / price if price > 0 else 0.0

        score = (
            (weights["availability"] * availability_ratio) +
            (weights["duration"] * inverse_travel_time) +
            (weights["price"] * inverse_price)
        )

        results.append(
            {
                "train_id": train.id,
                "train_name": train.name,
                "source": train.source,
                "destination": train.destination,
                "journey_date": train.journey_date.isoformat(),
                "departure_time": train.departure_time.strftime("%H:%M:%S"),
                "arrival_time": train.arrival_time.strftime("%H:%M:%S"),
                "travel_hours": round(travel_hours, 2),
                "class_type": seat.class_type,
                "price": round(price, 2),
                "available_seats": available_seats,
                "total_seats": total_seats,
                "score": round(score, 4),
                "explanation": _build_explanation(
                    normalized_preference,
                    available_seats,
                    travel_hours,
                    price,
                ),
            }
        )

    return sorted(results, key=lambda result: _build_sort_key(result, normalized_preference))
