# SehatSaathi

AI-powered healthcare assistant with a React frontend, Node.js API layer, and Python ML microservice.

## Highlights
- AI chat doctor with multilingual responses (Gemini).
- Diabetes risk prediction flow.
- Symptom-based disease prediction (with graceful fallback).
- Prescription image analysis and medicine explanation.
- Emergency guidance workflow.
- Nearby hospitals + routing utilities.
- Firebase Authentication (email/password + Google).
- Health records tracking and AI analysis.

## Tech Stack
- `client/`: React 19, Vite, Tailwind CSS, Firebase Web SDK, Axios
- `server/`: Node.js, Express, Mongoose, Firebase Admin, Gemini SDK
- `ml-service/`: Flask, scikit-learn, NumPy, pandas, joblib
- Database: MongoDB Atlas

## Monorepo Structure
```text
Praxis/
  client/        # React app
  server/        # Node/Express API
  ml-service/    # Flask ML microservice
```

## Architecture
```text
Browser (React)
   |
   v
Node API (Express)
   |------------------> MongoDB (users, predictions, records)
   |------------------> Gemini API (chat/explanations)
   |
   v
ML Service (Flask) --> model inference
```

## Prerequisites
- Node.js `18+`
- npm `9+`
- Python `3.10+` (tested with Python 3.13)
- MongoDB connection string
- Firebase project (Auth enabled)
- Gemini API key

## Environment Variables

### `client/.env`
```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

### `server/.env`
```env
PORT=5000
MONGO_URI=...
ML_SERVICE_URL=http://localhost:5001
GEMINI_API_KEY=...
ORS_API_KEY=...
FIREBASE_PROJECT_ID=...
# Optional for strongest Firebase Admin auth:
# FIREBASE_CLIENT_EMAIL=...
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### `ml-service/requirements.txt`
Already included. Install with:
```bash
pip install -r requirements.txt
```

## Run Locally

### 1) Install dependencies
```bash
cd client && npm install
cd ../server && npm install
cd ../ml-service && pip install -r requirements.txt
```

### 2) Start services (3 terminals)
```bash
# Terminal A
cd ml-service
python app.py
```

```bash
# Terminal B
cd server
npm run dev
```

```bash
# Terminal C
cd client
npm run dev
```

Client: `http://localhost:5173`  
API: `http://localhost:5000`  
ML service: `http://localhost:5001`

## Key API Routes

### Auth
- `POST /api/auth/sync`
- `GET /api/auth/profile`
- `PUT /api/auth/profile`

### Prediction
- `POST /api/predict/diabetes`
- `POST /api/predict/disease`
- `POST /api/predict/risk`
- `GET /api/predict/model-info`
- `GET /api/predict/diabetes/history`

### Chat
- `POST /api/chat/start`
- `POST /api/chat/message`
- `GET /api/chat/history`
- `GET /api/chat/history/:sessionId`
- `POST /api/chat/emergency`

### Prescription
- `POST /api/prescription/upload`
- `POST /api/prescription/explain-medicine`

### Health Records
- `GET /api/health/`
- `POST /api/health/vitals`
- `GET /api/health/analyze`

### Hospitals
- `GET /api/hospitals/nearby`
- `GET /api/hospitals/phc`
- `GET /api/hospitals/route`
- `GET /api/hospitals/geocode`

## Authentication Notes
- Firebase token is attached to API calls from the client.
- Login UX is non-blocking even if backend sync is slow/unavailable.
- Google sign-in uses popup first and falls back to redirect for blocked popups.

## Troubleshooting Login (Important)

If registration/login fails:

1. In Firebase Console -> Authentication -> Sign-in method:
   - Enable `Email/Password`
   - Enable `Google`
2. In Firebase Console -> Authentication -> Settings -> Authorized domains:
   - Add `localhost`
   - Add `127.0.0.1` (if used)
3. Confirm `client/.env` uses the same Firebase project as `server/.env` (`FIREBASE_PROJECT_ID`).
4. Restart both frontend and backend after env changes.
5. If Google popup is blocked:
   - Allow popups for localhost
   - Retry sign-in (redirect fallback is included)

## Build
```bash
cd client
npm run build
```

## Security Notes
- Do not commit real production secrets.
- Rotate leaked keys and move secrets to secure env management.
- Restrict Firebase and Gemini API keys by domain/IP where possible.

## Roadmap Ideas
- Add test coverage (unit + integration).
- Add Docker Compose for one-command local startup.
- Add CI for lint/build/smoke tests.
- Add role-based access and audit logs.

---
If this repo helps you, star it and share feedback.
