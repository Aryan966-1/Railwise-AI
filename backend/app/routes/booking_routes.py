from flask import Blueprint, request, jsonify
from app.services.booking_service import create_booking

booking_bp = Blueprint('booking_bp', __name__)

@booking_bp.route('/book', methods=['POST'])
def book_ticket():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid input format."}), 400
        
    user_id = data.get('user_id')
    train_id = data.get('train_id')
    class_type = data.get('class_type', 'General')
    
    if not user_id or not train_id:
        return jsonify({"error": "Missing required fields: user_id, train_id."}), 400
        
    try:
        booking_result = create_booking(user_id=user_id, train_id=train_id, class_type=class_type)
        return jsonify({"message": "Booking successful", "booking": booking_result}), 201
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": "Internal server error."}), 500
