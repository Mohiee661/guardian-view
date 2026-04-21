# Guardian View

AI insider threat detection dashboard with a Flask backend, anomaly detection,
LLM explanations, and a React/Vite frontend.

## Project Structure

- `backend/` - Flask API, AI model, blockchain, and LLM explainer
- `frontend/` - React/Vite UI
- `.env` - local API keys such as `GROQ_API_KEY`

## Run Backend

```bash
cd backend
python app.py
```

Backend runs at `http://127.0.0.1:5000`.

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://127.0.0.1:8080`.
