from flask import Blueprint, current_app, request, jsonify
from app.services.train_service import search_trains

train_bp = Blueprint('train_bp', __name__)

@train_bp.route('/search', methods=['POST'])
def search_for_trains():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid input format."}), 400
        
    source = data.get('source')
    destination = data.get('destination')
    journey_date = data.get('date')
    preference = data.get('preference')
    
    if not source or not destination or not journey_date:
        return jsonify({"error": "Missing required fields: source, destination, date."}), 400
        
    try:
        results = search_trains(source, destination, journey_date, preference)
        return jsonify({"success": True, "data": results}), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception:
        current_app.logger.exception("Train search failed")
        return jsonify({"error": "Internal server error."}), 500
