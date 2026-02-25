import axios from 'axios';
import { auth } from '../config/firebase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE, timeout: 30000 });

// Attach Firebase token to every request
api.interceptors.request.use(async (config) => {
    try {
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch { /* continue without token */ }
    return config;
});

// On 401, sign out
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            auth.signOut().catch(() => { });
        }
        return Promise.reject(err);
    }
);

// ── Auth ──
export const syncUser = (data) => api.post('/auth/sync', data);
export const getProfile = () => api.get('/auth/profile');
export const updateProfile = (data) => api.put('/auth/profile', data);

// ── Predictions ──
export const predictDiabetes = (data) => api.post('/predict/diabetes', data);
export const predictDisease = (data) => api.post('/predict/disease', data);
export const assessRisk = (data) => api.post('/predict/risk', data);
export const getModelInfo = () => api.get('/predict/model-info');
export const getDiabetesHistory = () => api.get('/predict/diabetes/history');

// ── Chat ──
export const startChat = (data) => api.post('/chat/start', data);
export const sendMessage = (data) => api.post('/chat/message', data);
export const getChatHistory = () => api.get('/chat/history');
export const getEmergencyGuidance = (data) => api.post('/chat/emergency', data);

// ── Prescription ──
export const uploadPrescription = (formData) =>
    api.post('/prescription/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 });
export const getPrescriptions = () => api.get('/prescription/');
export const getPrescription = (id) => api.get(`/prescription/${id}`);

// ── Health ──
export const getHealthRecords = () => api.get('/health/');
export const addVital = (data) => api.post('/health/vitals', data);
export const analyzeHealth = (lang) => api.get('/health/analyze', { params: { language: lang } });

// ── Hospitals ──
export const searchHospitals = (params) => api.get('/hospitals/nearby', { params });

export default api;
