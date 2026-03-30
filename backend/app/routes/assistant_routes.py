from flask import Blueprint, current_app, jsonify, request

from app.services.assistant_service import handle_assistant_chat


assistant_bp = Blueprint("assistant_bp", __name__, url_prefix="/assistant")


@assistant_bp.route("/chat", methods=["POST"])
def assistant_chat():
    data = request.get_json(silent=True) or {}
    message = data.get("message", "")
    current_form = data.get("current_form", {})

    try:
        assistant_response = handle_assistant_chat(message=message, current_form=current_form)
        return jsonify({"success": True, "data": assistant_response}), 200
    except Exception:
        current_app.logger.exception("Assistant chat failed")
        return jsonify({
            "success": False,
            "error": "Assistant chat failed.",
            "data": {
                "reply": "I hit a backend issue while processing that request. Please try again.",
                "action": "error",
                "payload": {},
            },
        }), 500
