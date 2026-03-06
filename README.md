# OptionGEX - Real-Time Gamma Exposure Dashboard

Real-time stock option Gamma Exposure (GEX) analysis dashboard. GEX measures how market makers' delta hedging changes with price movement -- key indicator of support/resistance levels and potential volatility.

## Setup

### 1. Get a Tradier API Key

Sign up at [developer.tradier.com](https://developer.tradier.com/) for a free sandbox account.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env and add your TRADIER_API_KEY

python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run
uvicorn app.main:app --reload
```

Backend runs on http://localhost:8000

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173 (proxies /api to backend)

## Usage

- Add tickers using the input field (e.g., SPY, AAPL, NVDA)
- Click ticker chips to switch between views
- Adjust refresh interval (15s/30s/60s)
- Data refreshes automatically in the background

## Rate Limits

Each ticker uses ~6 API calls per refresh cycle. Tradier allows 120 req/min, so max ~10 tickers at 30s intervals.

## Running Tests

```bash
cd backend
pip install pytest
python -m pytest tests/
```
