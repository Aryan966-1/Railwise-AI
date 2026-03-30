import json
import re
from datetime import datetime

from app.utils.gemini_client import client


ALLOWED_TIME_PREFERENCES = {
    "morning", "afternoon", "evening", "night", "any"
}

ALLOWED_PREFERENCES = {
    "cheapest", "fastest", "best", "safest", "balanced", "any"
}


def _extract_json(text: str) -> dict:
    if not text or not text.strip():
        raise ValueError("Empty Gemini response")

    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("No JSON object found in Gemini response")

    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError as exc:
        raise ValueError("Invalid JSON returned by Gemini") from exc


def _normalize_string(value: str) -> str:
    if not value:
        return ""
    return value.strip().title()


def _normalize_date(value: str) -> str:
    if not value:
        return ""

    value = value.strip()

    try:
        parsed = datetime.strptime(value, "%Y-%m-%d")
        return parsed.strftime("%Y-%m-%d")
    except ValueError as exc:
        raise ValueError("Date must be in YYYY-MM-DD format") from exc


def _normalize_enum(value: str, allowed: set, default: str = "any") -> str:
    if not value:
        return default

    value = value.strip().lower()
    return value if value in allowed else default


def _fallback_parse_intent(user_query: str) -> dict:
    normalized_query = " ".join(user_query.strip().split())

    date_match = re.search(r"\b\d{4}-\d{2}-\d{2}\b", normalized_query)
    route_match = re.search(
        r"\bfrom\s+(?P<source>[A-Za-z ]+?)\s+to\s+(?P<destination>[A-Za-z ]+?)(?:\s+on\b|\s+for\b|$)",
        normalized_query,
        re.IGNORECASE,
    )

    time_preference = "any"
    for candidate in ("morning", "afternoon", "evening", "night"):
        if re.search(rf"\b{candidate}\b", normalized_query, re.IGNORECASE):
            time_preference = candidate
            break

    preference = "any"
    for candidate in ("cheapest", "fastest", "best", "safest", "balanced"):
        if re.search(rf"\b{candidate}\b", normalized_query, re.IGNORECASE):
            preference = candidate
            break

    return {
        "source": _normalize_string(route_match.group("source")) if route_match else "",
        "destination": _normalize_string(route_match.group("destination")) if route_match else "",
        "date": _normalize_date(date_match.group(0)) if date_match else "",
        "time_preference": time_preference,
        "preference": preference,
    }


def _parse_with_gemini(user_query: str) -> dict:
    prompt = f"""
You are an intent parser for a train ticket booking assistant.

Convert the user's natural language query into STRICT JSON only.
Do not include markdown.
Do not include explanations.
Return exactly one JSON object with these keys:
source, destination, date, time_preference, preference

Rules:
- date must be in YYYY-MM-DD format
- time_preference must be one of: morning, afternoon, evening, night, any
- preference must be one of: cheapest, fastest, best, safest, balanced, any
- if a value is missing, use an empty string for source/destination/date, and "any" for time_preference/preference

User query:
{user_query}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )

    raw_text = response.text if hasattr(response, "text") else ""
    return _extract_json(raw_text)


def parse_intent(user_query: str) -> dict:
    if not user_query or not user_query.strip():
        raise ValueError("Query cannot be empty")

    try:
        parsed = _parse_with_gemini(user_query)
    except Exception:
        parsed = _fallback_parse_intent(user_query)

    required_keys = {"source", "destination", "date", "time_preference", "preference"}
    missing = required_keys - set(parsed.keys())
    if missing:
        raise ValueError(f"Missing required keys: {', '.join(sorted(missing))}")

    return {
        "source": _normalize_string(parsed.get("source", "")),
        "destination": _normalize_string(parsed.get("destination", "")),
        "date": _normalize_date(parsed.get("date", "")),
        "time_preference": _normalize_enum(
            parsed.get("time_preference", "any"),
            ALLOWED_TIME_PREFERENCES,
            default="any",
        ),
        "preference": _normalize_enum(
            parsed.get("preference", "any"),
            ALLOWED_PREFERENCES,
            default="any",
        ),
    }
