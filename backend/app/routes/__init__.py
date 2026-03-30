from flask import Blueprint

# Ensure blueprints are importable
from app.routes.ai_routes import ai_bp
from app.routes.train_routes import train_bp
from app.routes.booking_routes import booking_bp
