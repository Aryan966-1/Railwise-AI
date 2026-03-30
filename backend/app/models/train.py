from app.utils.database import db


class Train(db.Model):
    __tablename__ = "trains"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    source = db.Column(db.String(100), nullable=False, index=True)
    destination = db.Column(db.String(100), nullable=False, index=True)
    departure_time = db.Column(db.Time, nullable=False)
    arrival_time = db.Column(db.Time, nullable=False)
    journey_date = db.Column(db.Date, nullable=False, index=True)

    seat_availabilities = db.relationship(
        "SeatAvailability",
        back_populates="train",
        lazy=True,
        cascade="all, delete-orphan"
    )

    bookings = db.relationship(
        "Booking",
        back_populates="train",
        lazy=True
    )

    def __repr__(self):
        return f"<Train {self.id} {self.name}>"