from flask import Blueprint, current_app, jsonify, request

from app.services.booking_service import create_booking, list_user_bookings
from app.utils.auth import AuthenticationError, get_authenticated_user_id


booking_bp = Blueprint("booking_bp", __name__)


@booking_bp.route("/book", methods=["POST"])
def book_ticket():
    data = request.get_json(silent=True) or {}

    train_id = data.get("train_id")
    class_type = data.get("class_type", "General")

    if not train_id:
        return jsonify({"error": "Missing required fields: train_id."}), 400

    try:
        authenticated_user_id = get_authenticated_user_id(request)
        booking_result = create_booking(
            authenticated_user_id=authenticated_user_id,
            train_id=train_id,
            class_type=class_type,
        )
        return jsonify({"message": "Booking successful", "booking": booking_result}), 201
    except AuthenticationError as auth_error:
        return jsonify({"error": str(auth_error)}), 401
    except ValueError as value_error:
        return jsonify({"error": str(value_error)}), 400
    except Exception:
        current_app.logger.exception("Booking creation failed")
        return jsonify({"error": "Internal server error."}), 500


@booking_bp.route("/bookings/my", methods=["GET"])
def get_my_bookings():
    try:
        authenticated_user_id = get_authenticated_user_id(request)
        bookings = list_user_bookings(authenticated_user_id)
        return jsonify({"success": True, "data": bookings}), 200
    except AuthenticationError as auth_error:
        return jsonify({"error": str(auth_error)}), 401
    except ValueError as value_error:
        return jsonify({"error": str(value_error)}), 400
    except Exception:
        current_app.logger.exception("Fetching booking history failed")
        return jsonify({"error": "Internal server error."}), 500
