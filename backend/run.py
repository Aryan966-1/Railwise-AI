'''from app import create_app
from app.utils.database import db

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)'''
from app import create_app
from app.utils.database import db

app = create_app()

with app.app_context():
    db.create_all()
    print("Tables created successfully.")

if __name__ == "__main__":
    app.run(debug=True)
