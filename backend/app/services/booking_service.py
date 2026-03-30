from datetime import datetime
from math import ceil

from sqlalchemy import func, text
from sqlalchemy.orm import joinedload

from app.models.booking import Booking
from app.models.seat_availability import SeatAvailability
from app.models.train import Train
from app.models.user import User
from app.utils.auth import AuthenticationError
from app.utils.database import db


_BOOKING_SCHEMA_READY = False


def _ensure_booking_schema() -> None:
    global _BOOKING_SCHEMA_READY

    if _BOOKING_SCHEMA_READY:
        return

    with db.engine.begin() as connection:
        connection.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source VARCHAR(100)"))
        connection.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS destination VARCHAR(100)"))
        connection.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS journey_date DATE"))
        connection.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE"))
        connection.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_time TIMESTAMP WITHOUT TIME ZONE"))

        connection.execute(
            text(
                """
                UPDATE bookings AS booking
                SET
                    source = COALESCE(booking.source, train.source),
                    destination = COALESCE(booking.destination, train.destination),
                    journey_date = COALESCE(booking.journey_date, train.journey_date)
                FROM trains AS train
                WHERE booking.train_id = train.id
                  AND (
                      booking.source IS NULL
                      OR booking.destination IS NULL
                      OR booking.journey_date IS NULL
                  )
                """
            )
        )
        connection.execute(
            text(
                """
                UPDATE bookings
                SET
                    created_at = COALESCE(created_at, booking_time, CURRENT_TIMESTAMP),
                    booking_time = COALESCE(booking_time, created_at, CURRENT_TIMESTAMP)
                WHERE created_at IS NULL OR booking_time IS NULL
                """
            )
        )

    _BOOKING_SCHEMA_READY = True


def _normalize_class_type(class_type: str) -> str:
    if not isinstance(class_type, str) or not class_type.strip():
        raise ValueError("class_type is required.")

    return " ".join(class_type.strip().split())


def _build_booking_reference(booking_id: int, booking_time: datetime) -> str:
    return f"PNR{booking_time.strftime('%Y%m%d')}{booking_id:06d}"


def _get_rac_limit(total_seats: int) -> int:
    if total_seats <= 0:
        return 0

    return max(1, ceil(total_seats * 0.1))


def _get_authenticated_user(user_id: int) -> User:
    if not isinstance(user_id, int) or user_id <= 0:
        raise AuthenticationError("Authentication required.")

    user = db.session.get(User, user_id)
    if user is None:
        raise AuthenticationError("Authenticated user was not found.")

    return user


def _serialize_booking(booking: Booking) -> dict:
    created_at = booking.created_at or booking.booking_time

    return {
        "booking_id": booking.id,
        "booking_reference": booking.booking_reference,
        "status": booking.status,
        "user_id": booking.user_id,
        "train_id": booking.train_id,
        "train_name": booking.train.name if booking.train else f"Train #{booking.train_id}",
        "source": booking.source,
        "destination": booking.destination,
        "journey_date": booking.journey_date.isoformat() if booking.journey_date else "",
        "class_type": booking.class_type,
        "created_at": created_at.isoformat() if created_at else "",
        "fare": round(float(booking.fare_snapshot or 0), 2),
    }


def create_booking(authenticated_user_id: int, train_id: int, class_type: str = "General") -> dict:
    if not isinstance(train_id, int) or train_id <= 0:
        raise ValueError("Invalid train_id.")

    normalized_class_type = _normalize_class_type(class_type)
    normalized_class_key = normalized_class_type.lower()

    _ensure_booking_schema()

    try:
        with db.session.begin():
            user = _get_authenticated_user(authenticated_user_id)

            train = db.session.get(Train, train_id)
            if train is None:
                raise ValueError("Train does not exist.")

            seat = (
                db.session.query(SeatAvailability)
                .filter(
                    SeatAvailability.train_id == train_id,
                    func.lower(func.trim(SeatAvailability.class_type)) == normalized_class_key,
                )
                .with_for_update()
                .first()
            )

            if seat is None:
                raise ValueError("Invalid class_type for the selected train.")

            total_seats = max(int(seat.total_seats or 0), 0)
            available_seats = max(int(seat.available_seats or 0), 0)
            rac_limit = _get_rac_limit(total_seats)

            current_rac = (
                db.session.query(func.count(Booking.id))
                .filter(
                    Booking.train_id == train_id,
                    func.lower(func.trim(Booking.class_type)) == normalized_class_key,
                    Booking.status == "RAC",
                )
                .scalar()
                or 0
            )

            if available_seats > 0:
                status = "CNF"
                seat.available_seats = available_seats - 1
            elif current_rac < rac_limit:
                status = "RAC"
            else:
                status = "WL"

            if seat.available_seats < 0:
                raise ValueError("Seat availability cannot be negative.")

            created_at = datetime.utcnow()
            new_booking = Booking(
                user_id=user.id,
                train_id=train.id,
                source=train.source,
                destination=train.destination,
                journey_date=train.journey_date,
                class_type=normalized_class_type,
                status=status,
                booking_reference=f"TMP{created_at.strftime('%H%M%S%f')}",
                fare_snapshot=float(seat.price or 0),
                created_at=created_at,
                booking_time=created_at,
            )

            db.session.add(new_booking)
            db.session.flush()

            new_booking.booking_reference = _build_booking_reference(new_booking.id, created_at)
            db.session.flush()
            db.session.refresh(new_booking)

        return _serialize_booking(new_booking)
    except Exception:
        db.session.rollback()
        raise


def list_user_bookings(authenticated_user_id: int) -> list[dict]:
    _ensure_booking_schema()

    user = _get_authenticated_user(authenticated_user_id)

    bookings = (
        db.session.query(Booking)
        .options(joinedload(Booking.train))
        .filter(Booking.user_id == user.id)
        .order_by(func.coalesce(Booking.created_at, Booking.booking_time).desc(), Booking.id.desc())
        .all()
    )

    return [_serialize_booking(booking) for booking in bookings]
