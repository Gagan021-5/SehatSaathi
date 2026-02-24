import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE, timeout: 30000 });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Chat
export const sendChatMessage = (data) => api.post('/chat/message', data);
export const getChatHistory = (sessionId) => api.get(`/chat/history/${sessionId}`);
export const getChatSessions = () => api.get('/chat/sessions');

// Predictions
export const predictDisease = (data) => api.post('/predict', data);
export const assessRisk = (data) => api.post('/predict/risk', data);

// Prescriptions
export const analyzePrescription = (formData) => api.post('/prescription/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const explainMedicine = (data) => api.post('/prescription/explain-medicine', data);

// Hospitals (OpenStreetMap / Overpass API)
export const searchHospitals = (params) => api.get('/hospitals/nearby', { params });
export const searchPHC = (params) => api.get('/hospitals/phc', { params });
export const getHospitalRoute = (params) => api.get('/hospitals/route', { params });
export const geocodeAddress = (params) => api.get('/geocode', { params });

// Emergency
export const getEmergencyGuidance = (data) => api.post('/emergency/guidance', data);

// Auth
export const loginUser = (data) => api.post('/auth/login', data);
export const registerUser = (data) => api.post('/auth/register', data);

export default api;
