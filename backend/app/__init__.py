import os

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate

from app.utils.database import db

migrate = Migrate()


def create_app():
    load_dotenv()

    app = Flask(__name__)

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    migrate.init_app(app, db)

    frontend_origins = os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    allowed_origins = [origin.strip() for origin in frontend_origins.split(",") if origin.strip()]
    CORS(app, resources={r"/*": {"origins": allowed_origins}})

    from app.routes.ai_routes import ai_bp
    from app.routes.assistant_routes import assistant_bp
    from app.routes.train_routes import train_bp
    from app.routes.booking_routes import booking_bp

    app.register_blueprint(ai_bp)
    app.register_blueprint(assistant_bp)
    app.register_blueprint(train_bp)
    app.register_blueprint(booking_bp)

    from app.models import user, train, seat_availability, booking

    return app
