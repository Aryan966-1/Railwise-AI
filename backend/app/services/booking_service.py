from datetime import datetime
from math import ceil

from sqlalchemy import func

from app.models.booking import Booking
from app.models.seat_availability import SeatAvailability
from app.models.train import Train
from app.models.user import User
from app.utils.database import db


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


def create_booking(user_id: int, train_id: int, class_type: str = "General") -> dict:
    if not isinstance(user_id, int) or user_id <= 0:
        raise ValueError("Invalid user_id.")

    if not isinstance(train_id, int) or train_id <= 0:
        raise ValueError("Invalid train_id.")

    normalized_class_type = _normalize_class_type(class_type)
    normalized_class_key = normalized_class_type.lower()

    try:
        with db.session.begin():
            user = db.session.get(User, user_id)
            if user is None:
                raise ValueError("User does not exist.")

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

            booking_time = datetime.utcnow()
            temporary_booking_reference = f"TMP{booking_time.strftime('%H%M%S%f')}"
            new_booking = Booking(
                user_id=user.id,
                train_id=train.id,
                class_type=normalized_class_type,
                status=status,
                booking_reference=temporary_booking_reference,
                fare_snapshot=float(seat.price or 0),
                booking_time=booking_time,
            )

            db.session.add(new_booking)
            db.session.flush()

            booking_reference = _build_booking_reference(new_booking.id, booking_time)
            new_booking.booking_reference = booking_reference

        return {
            "booking_id": new_booking.id,
            "booking_reference": booking_reference,
            "status": status,
        }
    except Exception:
        db.session.rollback()
        raise
