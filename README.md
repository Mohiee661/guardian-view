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
pip install -r requirements.txt
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

Create `frontend/.env` before running or deploying the frontend:

```bash
VITE_API_URL=https://YOUR-BACKEND-URL.onrender.com
```

## Deploy Backend on Render

Use these settings if the Render service root is the repository root:

- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn --chdir backend app:app`

Add this environment variable in Render:

- `GROQ_API_KEY`

If you set Render's Root Directory to `backend`, use:

- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn app:app`

## Deploy Frontend on Vercel

Use these settings:

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

Add this Vercel environment variable:

- `VITE_API_URL=https://YOUR-BACKEND-URL.onrender.com`
