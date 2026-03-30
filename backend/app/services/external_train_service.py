import json
import os
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


TRUTHY_VALUES = {"1", "true", "yes", "on"}
DEFAULT_TIMEOUT_SECONDS = 8


def is_external_train_api_enabled() -> bool:
    enabled = os.getenv("ENABLE_EXTERNAL_TRAIN_API", "").strip().lower() in TRUTHY_VALUES
    base_url = os.getenv("EXTERNAL_TRAIN_API_URL", "").strip()
    return enabled and bool(base_url)


def _extract_rows(payload: Any) -> list[dict]:
    if isinstance(payload, list):
        return [row for row in payload if isinstance(row, dict)]

    if not isinstance(payload, dict):
        return []

    for key in ("data", "trains", "results"):
        rows = payload.get(key)
        if isinstance(rows, list):
            return [row for row in rows if isinstance(row, dict)]

    return []


def fetch_external_trains(
    source: str,
    destination: str,
    journey_date: str,
    time_preference: str = "any",
    class_type: str | None = None,
    preference: str | None = None,
) -> list[dict]:
    if not is_external_train_api_enabled():
        return []

    base_url = os.getenv("EXTERNAL_TRAIN_API_URL", "").strip()
    api_key = os.getenv("EXTERNAL_TRAIN_API_KEY", "").strip()
    timeout_seconds = int(os.getenv("EXTERNAL_TRAIN_API_TIMEOUT", DEFAULT_TIMEOUT_SECONDS))

    query_params = {
        "source": source,
        "destination": destination,
        "date": journey_date,
        "time_preference": time_preference,
    }
    if class_type:
        query_params["class_type"] = class_type
    if preference:
        query_params["preference"] = preference

    request = Request(
        url=f"{base_url}?{urlencode(query_params)}",
        headers={
            "Accept": "application/json",
            **({"Authorization": f"Bearer {api_key}"} if api_key else {}),
        },
        method="GET",
    )

    try:
        with urlopen(request, timeout=timeout_seconds) as response:
            raw_body = response.read().decode("utf-8")
    except (HTTPError, URLError, TimeoutError):
        return []

    if not raw_body.strip():
        return []

    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError:
        return []

    return _extract_rows(payload)
