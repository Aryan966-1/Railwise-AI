from datetime import datetime
from app.utils.database import db


class Booking(db.Model):
    __tablename__ = "bookings"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    train_id = db.Column(db.Integer, db.ForeignKey("trains.id"), nullable=False)
    class_type = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(10), nullable=False)
    booking_reference = db.Column(db.String(20), unique=True, nullable=False)
    fare_snapshot = db.Column(db.Float, nullable=False)
    booking_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    user = db.relationship("User", back_populates="bookings")
    train = db.relationship("Train", back_populates="bookings")

    def __repr__(self):
        return f"<Booking {self.id} {self.booking_reference} {self.status}>"