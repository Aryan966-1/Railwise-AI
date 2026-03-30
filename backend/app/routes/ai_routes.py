from flask import Blueprint, jsonify, request
from app.services.ai_service import parse_intent

ai_bp = Blueprint("ai", __name__, url_prefix="/ai")


@ai_bp.route("/parse", methods=["POST"])
def parse_ai_intent():
    data = request.get_json(silent=True) or {}
    query = data.get("query", "")

    try:
        result = parse_intent(query)
        return jsonify({
            "success": True,
            "data": result
        }), 200

    except ValueError as e:
        return jsonify({
            "success": False,
            "error": {
                "code": "INTENT_PARSE_ERROR",
                "message": str(e)
            }
        }), 400

    except Exception:
        return jsonify({
            "success": False,
            "error": {
                "code": "AI_SERVICE_ERROR",
                "message": "Failed to parse user intent"
            }
        }), 500