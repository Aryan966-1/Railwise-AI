from typing import Any

from app.services.ai_service import parse_intent
from app.services.train_service import search_trains


ASSISTANT_ACTION_FILL_FORM = "fill_form"
ASSISTANT_ACTION_SEARCH_RESULTS = "search_results"
ASSISTANT_ACTION_BOOKING_HELP = "booking_help"
ASSISTANT_ACTION_HELP = "help"
ASSISTANT_ACTION_ERROR = "error"


def _empty_trip_payload() -> dict:
    return {
        "source": "",
        "destination": "",
        "date": "",
        "time_preference": "any",
        "preference": "balanced",
        "class_type": "",
    }


def _normalize_message(message: str) -> str:
    if not isinstance(message, str):
        return ""

    return " ".join(message.strip().split())


def _normalize_current_form(current_form: Any) -> dict:
    if not isinstance(current_form, dict):
        return _empty_trip_payload()

    normalized_payload = _empty_trip_payload()
    normalized_payload["source"] = str(current_form.get("source", "") or "").strip()
    normalized_payload["destination"] = str(current_form.get("destination", "") or "").strip()
    normalized_payload["date"] = str(current_form.get("date", "") or "").strip()
    normalized_payload["time_preference"] = str(current_form.get("time_preference", "any") or "any").strip() or "any"
    normalized_payload["preference"] = str(current_form.get("preference", "balanced") or "balanced").strip() or "balanced"
    normalized_payload["class_type"] = str(current_form.get("class_type", "") or "").strip()
    return normalized_payload


def _build_response(reply: str, action: str, payload: dict | None = None) -> dict:
    return {
        "reply": reply,
        "action": action,
        "payload": payload or {},
    }


def _is_help_message(message: str) -> bool:
    normalized_message = message.strip().lower().rstrip("?.!")
    return normalized_message in {
        "what can you do",
        "how can you help",
        "help",
        "what do you do",
        "how does this work",
    }


def _is_booking_message(message: str) -> bool:
    return any(keyword in message for keyword in (" book ", " ticket", " reserve", " reservation", " booking"))


def _is_search_message(message: str) -> bool:
    return any(
        keyword in message
        for keyword in (
            "find",
            "search",
            "show",
            "available",
            "options",
            "option",
            "trains",
            "train",
            "cheapest",
            "fastest",
        )
    )


def _has_trip_details(payload: dict) -> bool:
    return any(
        (
            payload.get("source"),
            payload.get("destination"),
            payload.get("date"),
            payload.get("time_preference") not in ("", "any"),
            payload.get("preference") not in ("", "any", "balanced"),
        )
    )


def _has_complete_trip(payload: dict) -> bool:
    return bool(payload.get("source") and payload.get("destination") and payload.get("date"))


def _missing_trip_fields(payload: dict) -> list[str]:
    missing = []
    if not payload.get("source"):
        missing.append("source")
    if not payload.get("destination"):
        missing.append("destination")
    if not payload.get("date"):
        missing.append("date")
    return missing


def _form_payload_from_trip(trip: dict) -> dict:
    return {
        "source": trip.get("source", ""),
        "destination": trip.get("destination", ""),
        "date": trip.get("date", ""),
        "time_preference": trip.get("time_preference", "any"),
        "preference": trip.get("preference", "balanced"),
        "class_type": trip.get("class_type", ""),
    }


def _parse_trip_details(message: str) -> dict:
    try:
        parsed = parse_intent(message)
    except Exception:
        parsed = {
            "source": "",
            "destination": "",
            "date": "",
            "time_preference": "any",
            "preference": "any",
        }

    return {
        "source": parsed.get("source", ""),
        "destination": parsed.get("destination", ""),
        "date": parsed.get("date", ""),
        "time_preference": parsed.get("time_preference", "any"),
        "preference": "balanced" if parsed.get("preference") in ("", "any") else parsed.get("preference", "balanced"),
        "class_type": "",
    }


def _search_with_trip(trip: dict) -> dict:
    search_response = search_trains(
        source=trip["source"],
        destination=trip["destination"],
        journey_date=trip["date"],
        preference=trip.get("preference", "balanced"),
        class_type=trip.get("class_type") or None,
        time_preference=trip.get("time_preference", "any"),
    )

    results = search_response.get("data", [])
    provider = search_response.get("provider", "")
    search_message = search_response.get("message", "")

    if results:
        reply = f"I found {len(results)} matching train option(s)."
    else:
        reply = search_message or "I could not find matching trains right now."

    return _build_response(
        reply=reply,
        action=ASSISTANT_ACTION_SEARCH_RESULTS,
        payload={
            "form": _form_payload_from_trip(trip),
            "results": results,
            "provider": provider,
            "message": search_message,
        },
    )


def _contextual_search_trip(current_form: dict, parsed_trip: dict) -> dict:
    merged_trip = {**current_form}

    if parsed_trip.get("date") and not parsed_trip.get("source") and not parsed_trip.get("destination"):
        merged_trip["date"] = parsed_trip["date"]

    if parsed_trip.get("preference") and parsed_trip.get("preference") != "balanced":
        merged_trip["preference"] = parsed_trip["preference"]

    if parsed_trip.get("time_preference") and parsed_trip.get("time_preference") != "any":
        merged_trip["time_preference"] = parsed_trip["time_preference"]

    return merged_trip


def handle_assistant_chat(message: str, current_form: Any = None) -> dict:
    normalized_message = _normalize_message(message)
    current_trip = _normalize_current_form(current_form)

    if not normalized_message:
        return _build_response(
            "Please type a train-related request so I can help.",
            ASSISTANT_ACTION_ERROR,
        )

    lowered_message = f" {normalized_message.lower()} "

    if _is_help_message(normalized_message):
        return _build_response(
            "I can fill the trip form, search train results, and guide you through booking once you pick a train.",
            ASSISTANT_ACTION_HELP,
        )

    parsed_trip = _parse_trip_details(normalized_message)

    if _is_booking_message(lowered_message):
        if _has_trip_details(parsed_trip):
            missing_fields = _missing_trip_fields(parsed_trip)
            if missing_fields:
                return _build_response(
                    f"I can help you book, but I still need {', '.join(missing_fields)} before you can choose a train.",
                    ASSISTANT_ACTION_BOOKING_HELP,
                    {
                        "missing_fields": missing_fields,
                    },
                )

            return _build_response(
                "I filled the trip details. Search trains first, then choose a train before booking.",
                ASSISTANT_ACTION_FILL_FORM,
                _form_payload_from_trip(parsed_trip),
            )

        return _build_response(
            "I can help with booking, but first I need your source, destination, and journey date so you can choose a train.",
            ASSISTANT_ACTION_BOOKING_HELP,
            {
                "missing_fields": _missing_trip_fields(current_trip),
            },
        )

    if _is_search_message(lowered_message):
        if _has_complete_trip(parsed_trip):
            return _search_with_trip(parsed_trip)

        if not parsed_trip.get("source") and not parsed_trip.get("destination") and _has_complete_trip(current_trip):
            contextual_trip = _contextual_search_trip(current_trip, parsed_trip)
            return _search_with_trip(contextual_trip)

        if parsed_trip.get("source") or parsed_trip.get("destination") or parsed_trip.get("date"):
            return _build_response(
                "I filled the trip details I understood. Please review the form and add anything missing before searching.",
                ASSISTANT_ACTION_FILL_FORM,
                _form_payload_from_trip(parsed_trip),
            )

        if _has_complete_trip(current_trip):
            return _search_with_trip(current_trip)

        return _build_response(
            "Tell me at least the source, destination, and date, and I can help search trains.",
            ASSISTANT_ACTION_ERROR,
        )

    if _has_trip_details(parsed_trip):
        return _build_response(
            "I found trip details in your message and filled the form for you.",
            ASSISTANT_ACTION_FILL_FORM,
            _form_payload_from_trip(parsed_trip),
        )

    return _build_response(
        "I can help with train search, form filling, and booking guidance. Try asking for a route and date.",
        ASSISTANT_ACTION_ERROR,
    )
