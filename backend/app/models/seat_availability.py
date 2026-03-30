from app.utils.database import db


class SeatAvailability(db.Model):
    __tablename__ = "seat_availabilities"

    id = db.Column(db.Integer, primary_key=True)
    train_id = db.Column(db.Integer, db.ForeignKey("trains.id"), nullable=False)
    class_type = db.Column(db.String(20), nullable=False)
    total_seats = db.Column(db.Integer, nullable=False)
    available_seats = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)

    train = db.relationship("Train", back_populates="seat_availabilities")

    __table_args__ = (
        db.UniqueConstraint("train_id", "class_type", name="uq_train_class_type"),
    )

    def __repr__(self):
        return f"<SeatAvailability train={self.train_id} class={self.class_type}>"