# SehatSaathi

AI-first health-tech platform focused on multilingual triage, preventive screening, prescription intelligence, and rural outreach workflows.

## Platform Snapshot

SehatSaathi is a monorepo with three coordinated services:

- `client/` -> React + Vite experience layer
- `server/` -> Node.js/Express API + Gemini + MongoDB
- `ml-service/` -> Flask microservice for diabetes inference

It supports both:

- Urban app users with internet and smartphone access
- Rural and elderly users through ASHA/NGO proxy workflows and SMS logic

## Core Experiences

| Module | What It Delivers | Stack |
|---|---|---|
| AI Clinical Chat | Context-aware conversational triage (Gemini) | React + Express + Gemini |
| Diabetes Risk | Structured diabetes probability prediction | Flask ML + Express |
| Vitals & Trends | Interactive multi-line vital trend dashboard | Recharts + Tailwind + Framer Motion |
| Prescription Intelligence | Upload and explain prescriptions/medicines | Multer + API pipeline |
| Hospital Discovery | Nearby hospitals/PHC + route helpers | Express + geospatial search |
| Rural Outreach | Offline-first camp workflow and patient roster | React + localStorage + motion |
| Rural SMS Proxy | Fast2SMS outbound + simulated inbound webhook | Express + Fast2SMS + cron |

## What Is Implemented Now

- Multilingual AI chat and emergency-first triage behavior
- Vital logging with AI insight panel and premium trends chart
- Firebase-authenticated profile, family, medicine, and health-tool flows
- Rural patient CRUD + medicine reminders (cron-based SMS dispatch)
- Simulated inbound SMS endpoint for hackathon demos (no VMN required)

## High-Level Architecture

```text
React Client (Vite, Tailwind, Framer Motion)
    |
    |  Firebase ID token
    v
Node API (Express + Mongoose + Gemini)
    |------------------> MongoDB Atlas
    |------------------> Fast2SMS (outbound)
    |------------------> Cron reminder worker
    |
    v
Flask ML Service (/predict)
```

## Monorepo Layout

```text
Praxis/
  client/
    src/
      components/
      context/
      pages/
      locales/
  server/
    controllers/
    models/
    routes/
    services/
    utils/
  ml-service/
    app.py
    train_model.py
    requirements.txt
```

## Tech Stack

- Frontend: React 19, Vite 7, Tailwind CSS 4, Framer Motion, Recharts
- Backend: Node.js, Express 5, Mongoose, Firebase Admin, Gemini SDK
- ML: Flask, scikit-learn, NumPy, pandas, joblib
- Data: MongoDB Atlas
- Messaging: Fast2SMS

## Quick Start

### 1. Prerequisites

- Node.js `18+`
- npm `9+`
- Python `3.10+`
- MongoDB URI
- Firebase project (Auth enabled)
- Gemini API key

### 2. Install Dependencies

```bash
# root (for concurrently)
npm install

# frontend
cd client
npm install

# backend
cd ../server
npm install

# ml microservice
cd ../ml-service
pip install -r requirements.txt
```

### 3. Configure Environment

Create these files before running:

#### `client/.env`

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

#### `server/.env`

```env
PORT=5000
MONGO_URI=...
ML_SERVICE_URL=http://localhost:5001
GEMINI_API_KEY=...
ORS_API_KEY=...
FAST2SMS_API_KEY=...
SMS_CRON_TIMEZONE=Asia/Kolkata

FIREBASE_PROJECT_ID=...
# Optional for stronger admin auth bootstrap:
# FIREBASE_CLIENT_EMAIL=...
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4. Run the Full Stack

From repo root:

```bash
npm run dev
```

This starts:

- Client: `http://localhost:5173`
- API: `http://localhost:5000`
- ML Service: `http://localhost:5001`

## Useful Scripts

### Root

- `npm run dev` -> run client + server + ML service together
- `npm run client` -> run client only
- `npm run server` -> run server only
- `npm run ml` -> run ML service only

### Client

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`

### Server

- `npm run dev`
- `npm start`

## API Overview

Base URL: `http://localhost:5000/api`

### Auth

- `POST /auth/sync`
- `GET /auth/profile`
- `PUT /auth/profile`

### Chat

- `POST /chat/start`
- `POST /chat/message`
- `GET /chat/history`
- `GET /chat/history/:sessionId`
- `POST /chat/emergency`

### Prediction

- `POST /predict/diabetes`
- `POST /predict/risk`
- `GET /predict/model-info`
- `GET /predict/diabetes/history`

### Prescription

- `POST /prescription/upload`
- `POST /prescription/analyze`
- `POST /prescription/explain-medicine`

### Health + Vitals

- `GET /health`
- `POST /health/vitals`
- `GET /health/analyze`

### Hospitals

- `GET /hospitals/nearby`
- `GET /hospitals/search`
- `GET /hospitals/phc`
- `GET /hospitals/route`
- `GET /hospitals/geocode`

### Medicines

- `GET /medicines`
- `POST /medicines`
- `PUT /medicines/:id`
- `DELETE /medicines/:id`
- `POST /medicines/:id/taken`

### Family Vault

- `GET /family/members`
- `POST /family/members`
- `PUT /family/members/:id`
- `DELETE /family/members/:id`
- `GET /family/documents`
- `POST /family/documents`
- `DELETE /family/documents/:id`

### Rural SMS Proxy

- `POST /sms/webhook`
- `POST /sms/simulate-inbound`
- `GET /sms/patients`
- `POST /sms/patients`
- `PATCH /sms/patients/:id`
- `DELETE /sms/patients/:id`
- `POST /sms/patients/:id/reminders`
- `PATCH /sms/patients/:id/reminders/:reminderId`
- `DELETE /sms/patients/:id/reminders/:reminderId`

## Rural SMS Demo (Postman Friendly)

Use this payload against:

- `POST /api/sms/simulate-inbound`

```json
{
  "senderNumber": "9876543210",
  "textMessage": "HOSPITAL 110042"
}
```

Expected behavior:

- Request is parsed as inbound SMS command
- Reply message is generated and sent through Fast2SMS utility
- If `FAST2SMS_API_KEY` is missing, payload is logged in mock mode (safe local demo)

## Troubleshooting

### Vite: `Outdated Optimize Dep` (Recharts)

If you see stale optimized dependency errors:

```bash
cd client
npm run dev -- --force
```

If needed, clear cache:

```bash
# PowerShell
Remove-Item -Recurse -Force .\node_modules\.vite
```

### Firebase Auth Issues

1. Enable `Email/Password` and `Google` sign-in methods
2. Add `localhost` and `127.0.0.1` in authorized domains
3. Confirm client Firebase project matches server Firebase project
4. Restart services after env changes

### ML Service Not Loading Model

- Ensure `ml-service/diabetes_model.pkl` and `ml-service/label_encoders.pkl` exist
- If missing, run:

```bash
cd ml-service
python train_model.py
```

## Security Notes

- Never commit real production secrets
- Rotate leaked keys immediately
- Restrict API keys by domain/IP where possible
- Keep Firebase admin credentials server-side only

## Contribution Direction

Priority improvements:

1. Unit and integration tests across all three services
2. Docker Compose for one-command environment boot
3. CI pipeline for lint/build/smoke tests
4. Role-based access control and audit events

---

Built for inclusive, multilingual, and accessible healthcare workflows across India.
