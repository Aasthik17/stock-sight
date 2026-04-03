# StockSight — NSE Stock Intelligence Dashboard

A full-stack financial data platform built for the JarNox internship assignment.

## 🌐 Live Links
- **Frontend (Live Demo)**: [https://aasthik17.github.io/stock-sight/](https://aasthik17.github.io/stock-sight/)
- **Backend API**: [https://stock-sight-1-kp1g.onrender.com](https://stock-sight-1-kp1g.onrender.com) (Hosted on Render)


## 🚀 Features
- **Real-time Data**: Fetches 15 NSE blue-chip stocks using `yfinance`.
- **Advanced Metrics**: RSI-14, 7-day/20-day Moving Averages, Volatility Scores.
- **Interactive Charts**: Responsive multi-period price charts using Chart.js.
- **ML Predictions**: 7-day forward price forecasts using `scikit-learn` Linear Regression.
- **Stock Comparison**: Side-by-side performance analysis with Pearson correlation.
- **Market Insights**: Automated detection of top gainers, losers, and overbought/oversold RSI signals.

## 🛠 Tech Stack
- **Backend**: FastAPI, SQLAlchemy (SQLite), Pandas, yfinance, scikit-learn.
- **Frontend**: React (Vite), Chart.js, Lucide-React.

---

## 🏃 Setup & Execution

### 1. Prerequisites
- **Python 3.9+**
- **Node.js 18+** & **npm**

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Create a virtual environment (optional but recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`

# Install dependencies
pip install -r requirements.txt

# Start the server
# Run from the project ROOT directory (to ensure pathing works)
cd ..
PYTHONPATH=. python3 -m uvicorn backend.main:app --reload
```
The API documentation will be available at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
The dashboard will be available at: [http://localhost:5173](http://localhost:5173)

---

## 🧩 Project Structure
- `backend/`: FastAPI application, data collection logic, and ML model.
  - `main.py`: Entry point and API routing.
  - `data_collector.py`: yfinance fetching and metric cleaning.
  - `ml/`: Model training and prediction logic.
- `frontend/`: React application.
  - `src/components/`: Reusable UI components (Charts, Summaries, Sidebar).
  - `src/index.css`: Custom "Terminal Finance" dark theme design system.

---

## 🧪 Verification
- **API Health**: [https://stock-sight-1-kp1g.onrender.com/health](https://stock-sight-1-kp1g.onrender.com/health) (or `http://localhost:8000/health`)
- **Swagger Docs**: [https://stock-sight-1-kp1g.onrender.com/docs](https://stock-sight-1-kp1g.onrender.com/docs) (or `http://localhost:8000/docs`)
- **Dashboard**: [https://aasthik17.github.io/stock-sight/](https://aasthik17.github.io/stock-sight/) (or `http://localhost:5173`)