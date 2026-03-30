from flask import Blueprint, current_app, request, jsonify
from app.services.train_service import search_trains

train_bp = Blueprint('train_bp', __name__)

@train_bp.route('/search', methods=['POST'])
def search_for_trains():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid input format."}), 400
        
    source = data.get('source')
    destination = data.get('destination')
    journey_date = data.get('date')
    class_type = data.get('class_type')
    time_preference = data.get('time_preference')
    preference = data.get('preference')
    
    if not source or not destination or not journey_date:
        return jsonify({"error": "Missing required fields: source, destination, date."}), 400
        
    try:
        search_response = search_trains(
            source=source,
            destination=destination,
            journey_date=journey_date,
            preference=preference,
            class_type=class_type,
            time_preference=time_preference,
        )
        return jsonify({"success": True, **search_response}), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception:
        current_app.logger.exception("Train search failed")
        return jsonify({"error": "Internal server error."}), 500
