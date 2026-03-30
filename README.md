# Railwise-AI

## 🚀 Problem

IRCTC-style railway booking systems are often slow, confusing, and inefficient—especially during high-demand scenarios like Tatkal booking. Users face issues such as unclear flows, repeated errors, and low success rates.


## 💡 Solution

Railwise-AI introduces an AI-powered assistant that simplifies and optimizes the booking experience by:

* Understanding natural language queries
* Recommending optimal trains
* Reducing booking steps
* Minimizing user errors


## 🧠 Features

* Natural language-based booking queries
* AI-powered train recommendations
* Optimized booking workflow
* Modular backend with AI service integration


## 🛠 Tech Stack

* **Backend:** Django (Python)
* **Frontend:** React + Vite
* **AI Integration:** Google Gemini API
* **Database:** PostgreSQL


## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Aryan966-1/Railwise-AI.git
cd Railwise-AI
```

### 2. Create Environment File

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_api_key_here
```

---

### 3. Install Dependencies

#### Backend

```bash
pip install -r backend/requirements.txt
```

#### Frontend

```bash
cd frontend
npm install
```


### 4. Run the Project

#### Backend

```bash
python manage.py runserver
```

#### Frontend

```bash
npm run dev
```


## 🎯 Demo Flow

User enters a query → AI processes intent → system recommends trains → booking flow is executed efficiently


## 📌 Future Improvements

* Real-time IRCTC API integration
* Secure payment gateway integration
* ML-based seat availability prediction
* User authentication and booking history


## ⚠️ Important Notes

* Do NOT commit your `.env` file
* Always use your own API key
* `.env.example` is provided for reference


## 📄 License

This project is for educational and hackathon purposes.
