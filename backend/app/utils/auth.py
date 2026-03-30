from flask import Request


class AuthenticationError(ValueError):
    pass


def get_authenticated_user_id(request: Request) -> int:
    raw_user_id = request.headers.get("X-User-Id", "").strip()
    if not raw_user_id:
        raise AuthenticationError("Authentication required.")

    try:
        user_id = int(raw_user_id)
    except ValueError as exc:
        raise AuthenticationError("Invalid authenticated user.") from exc

    if user_id <= 0:
        raise AuthenticationError("Invalid authenticated user.")

    return user_id
