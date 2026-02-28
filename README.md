<div align="center">
  <h1>🏥 SehatSaathi</h1>
  <p><b>AI-First Healthcare Platform for Multilingual Triage, Preventive Screening & Rural Outreach</b></p>
  
  [![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
  [![Flask](https://img.shields.io/badge/Flask-ML-lightgrey.svg)](https://flask.palletsprojects.com/)
  [![Gemini AI](https://img.shields.io/badge/Gemini-AI-orange.svg)](https://deepmind.google/technologies/gemini/)
  
  <br />
  <a href="#-live-demo">Live Demo</a> •
  <a href="#-demo-video--walkthrough">Demo Video</a> •
  <a href="#-documentation">Documentation</a> •
  <a href="#-ml--genai-integration">AI Architecture</a> •
  <a href="#-quick-start">Quick Start</a>
</div>

---

## 📖 Overview of the Prototype

**SehatSaathi** is a comprehensive, monorepo-based health-tech platform designed to deliver intelligent healthcare workflows to both urban smartphone users and rural populations via NGO/ASHA worker proxies and SMS systems. It integrates Generative AI and Machine Learning to provide multilingual clinical triage, early disease risk screening, automated prescription interpretation, and seamless hospital discovery.

---

## 🎯 Our Motive: The Problem Statement

**The Problem:** 
Healthcare access is highly asymmetrical. While urban centers have rapid access to doctors, rural and elderly populations suffer from a lack of primary diagnosis, digital literacy, and internet parity. Furthermore, understanding complex medical prescriptions and tracking multi-generational family health is cumbersome.

**How SehatSaathi Addresses It:**
We chose this problem statement to democratize healthcare triage. By utilizing AI to speak the user's language and SMS APIs for offline access, SehatSaathi ensures that critical early warnings (like diabetes risk or emergency triage) reach patients regardless of their geographical or digital boundaries.

---

## 💡 The Solution & Key Insights

1. **Multilingual AI Triage:** Users don't need medical jargon. They chat in their native language, and the system triages their symptoms, escalating emergencies instantly.
2. **Offline-First Rural Outreach:** ASHA workers can manage patient rosters offline, while automated SMS ensures ongoing patient engagement without requiring smartphone ownership.
3. **Prescription Intelligence:** OCR and GenAI combined to turn confusing handwritten prescriptions into actionable, understandable dosage schedules and warnings.
4. **Predictive Analytics:** Simple ML models (like our Diabetes screening) provide probabilistic risk assessments using minimal user input.

---

## 🚀 Live Demo
> **[Checkout the Live App Here](#)** *(Link to be updated once deployed)*

---

## 🎥 Demo Video & Walkthrough

**[Watch the full demo on YouTube / Loom](#)** *(Demo Link to be added here)*

### Prototype Walkthrough
- **User Onboarding:** Firebase-authenticated profile setup and seamless authentication.
- **Premium Voice-to-Voice AI:** A centered, zero-text "Premium Voice Orb" powered by Framer Motion waveforms, featuring dual-mode Gemini triage and ElevenLabs high-quality Text-to-Speech audio.
- **Diabetes Risk Assessment:** Filling out the structured health form and receiving an instant, scalable Flask ML prediction.
- **Vital Trends Dashboard:** Logging vitals (BPM, Sugar, Blood Pressure) and viewing premium, interactive Framer Motion charts within a Glassmorphism design system.
- **Rural Dashboard:** A specialized administrative flow for NGOs/volunteers to register remote patients and trigger cron-based Fast2SMS reminders.

---

## 🧠 ML & GenAI Integration

SehatSaathi relies heavily on intelligent services mapped to a distributed architecture:

### 1. Generative AI (Google Gemini)
- **Clinical Triage:** Context-aware conversations parsing informal text into structured clinical paths. Translates real-world health situations into actionable system inputs with adaptive moods (Calm, Anxious, Urgent).
- **Medicine Explanation:** Translating raw OCR text from prescriptions (via Multer mapping) into plain-language dosage and precaution instructions safely.

### 2. Lifelike Speech Synthesis (ElevenLabs)
- **Voice Agent:** Converts Gemini's structured clinical responses into hyper-realistic audio tailored to the patient's severity mood.
- **Read Aloud:** Provides robust accessibility for emergency protocols and prescriptions.

### 3. Machine Learning (Flask Microservice)
- **Model:** `scikit-learn` based predictive model exposed via an isolated Python Flask REST API.
- **Use Case:** Predictive diabetes probability screening leveraging structured demographic and numeric inputs (glucose, BMI, age, etc.).

---

## 📐 Architecture & Approach

Our approach relies on a decoupled monorepo architecture, prioritizing separation of concerns and future scalability.

**Assumptions & Design Choices:**
- **Monorepo:** Chose a single repository to coordinate the React Client, Node API, and Flask ML service easily during development.
- **BFF (Backend-For-Frontend) Pattern:** The Node Express server acts as the central orchestrator, communicating with the ML service independently, protecting model logic from the frontend.
- **Cron + Webhook Hybrid:** For rural SMS, considering the lack of a dedicated Virtual Mobile Number (VMN) for two-way SMS, we simulate inbound webhooks and handle outbound reminders via scheduled Node cron jobs.

```text
React Client (Vite, Tailwind, Framer)
       │
       ▼ (Firebase Auth)
Node API (Express, Gemini, MongoDB)
 ├─▶ MongoDB Atlas (Data Store)
 ├─▶ Fast2SMS (Outbound/Inbound SMS handling)
 └─▶ Scheduled Node-Cron workers
       │
       ▼ (REST /predict)
Flask ML Service (Diabetes Inference)
```

---

## ⚖️ Ethical, Bias, & Limitation Considerations

- **Medical Liability:** The platform is explicitly a **triage and screening aide**, NOT a replacement for a certified doctor. Important disclaimers and guardrails are embedded in the AI chat logic.
- **AI Hallucinations:** GenAI could generate plausible but incorrect medical advice. We control this by enforcing narrow context constraints via system prompts and conservative temperature settings, escalating to human doctors for anything high-risk.
- **Data Bias:** The current ML model is trained on standard datasets (e.g., Pima Indians Diabetes Database) which carry inherent demographic biases. For a robust clinical release, the model would need fine-tuning with localized, verified Indian demographic data.
- **Data Privacy:** Health data is extremely sensitive. Real-world implementations require strict HIPAA/ABDM (Ayushman Bharat Digital Mission) compliance, end-to-end encryption at rest, and anonymized AI processing.

---

## 💼 Business Feasibility

**Monetization Strategy:**
1. **B2B Licensing:** Providing the rural outreach software/dashboard (SaaS model) to NGOs, local government healthcare initiatives, and hospital CSR wings.
2. **Freemium B2C App:** Basic AI triage/chat is free for all. Premium subscriptions could unlock continuous vital hardware monitoring sync, family-vault digital document storage, and direct telehealth consultations.
3. **Telehealth Marketplace Integration:** Earning affiliate commission or booking fees on doctor appointments or verified pharmacy medicine orders facilitated directly through the platform's API integrations.

**Scalability:**
The architecture utilizes serverless-ready Node/React configurations and lightweight ML microservices that seamlessly scale horizontally (e.g. AWS ECS/Lambda or GCP Cloud Run).

---

## 🛠 Tech Stack

| Domain | Technologies |
|---|---|
| **Frontend UI/UX** | React 19, Vite, Tailwind CSS 4 (Glassmorphism), Framer Motion, Recharts |
| **Backend** | Node.js, Express 5, Mongoose, Firebase Admin |
| **AI / ML** | Google Gemini SDK, ElevenLabs API, Python 3.10, Flask, scikit-learn, joblib |
| **Database** | MongoDB Atlas |
| **Messaging** | Fast2SMS |

---

## ⚙️ Quick Start

### 1. Prerequisites
- Node.js `18+` & npm `9+`
- Python `3.10+`
- MongoDB URI
- Firebase Project (Auth enabled)
- Gemini API Key, Fast2SMS API Key

### 2. Install Dependencies
```bash
npm install               # Root (concurrently)
cd client && npm install  # Frontend
cd ../server && npm install # Backend
cd ../ml-service && pip install -r requirements.txt # ML Service
```

### 3. Environment Configuration
Create the following `.env` files based on the `.env.example` implementations:

<details>
<summary><code>client/.env</code></summary>

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
</details>

<details>
<summary><code>server/.env</code></summary>

```env
PORT=5000
MONGO_URI=...
ML_SERVICE_URL=http://localhost:5001
GEMINI_API_KEY=...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
ORS_API_KEY=...
FAST2SMS_API_KEY=...
SMS_CRON_TIMEZONE=Asia/Kolkata
FIREBASE_PROJECT_ID=...
```
</details>

### 4. Run the Full Stack
```bash
npm run dev
```
_Starts Client (`:5173`), API (`:5000`), and ML Service (`:5001`)._

---

## 📡 API Overview
Base URL: `http://localhost:5000/api`

- **Auth:** `POST /auth/sync`, `GET /auth/profile`
- **Chat:** `POST /chat/start`, `POST /chat/message`, `GET /chat/history`
- **Prediction:** `POST /predict/diabetes`, `POST /predict/risk`
- **Prescription:** `POST /prescription/upload`, `POST /prescription/analyze`
- **Health:** `GET /health`, `POST /health/vitals`
- **Hospitals:** `GET /hospitals/nearby`, `GET /hospitals/search`
- **Rural SMS Proxy:** `POST /sms/simulate-inbound`, `GET /sms/patients`

---

<div align="center">
  <p><i>Built for inclusive, multilingual, and accessible healthcare workflows across India. 🇮🇳</i></p>
</div>
