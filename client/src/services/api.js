import axios from 'axios';
import toast from 'react-hot-toast';
import { auth } from '../config/firebase';

const NODE_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ML_BASE_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:5001';

const networkToast = () =>
    toast.error('Server unreachable. Please check your connection.', { id: 'server-unreachable' });

export const api = axios.create({
    baseURL: NODE_BASE_URL,
    timeout: 30000,
});

export const mlApi = axios.create({
    baseURL: ML_BASE_URL,
    timeout: 30000,
});

api.interceptors.request.use(async (config) => {
    try {
        const currentUser = auth.currentUser;
        if (currentUser) {
            const token = await currentUser.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch {
        // Keep request unauthenticated if token fetch fails.
    }
    return config;
});

const responseError = (error) => {
    if (error?.code === 'ERR_NETWORK') networkToast();
    return Promise.reject(error);
};

api.interceptors.response.use((response) => response, responseError);
mlApi.interceptors.response.use((response) => response, responseError);

export const syncUser = (data) => api.post('/auth/sync', data);
export const getProfile = () => api.get('/auth/profile');
export const updateProfile = (data) => api.put('/auth/profile', data);

export const predictDiabetes = (data) => api.post('/predict/diabetes', data);
export const assessRisk = (data) => api.post('/predict/risk', data);
export const getModelInfo = () => api.get('/predict/model-info');
export const getDiabetesHistory = () => api.get('/predict/diabetes/history');

export const startChat = (data) => api.post('/chat/start', data);
export const sendMessage = (data) => api.post('/chat/message', data);
export const getChatHistory = () => api.get('/chat/history');
export const getEmergencyGuidance = (data) => api.post('/chat/emergency', data);

export const uploadPrescription = (payload) => {
    if (payload instanceof FormData) {
        return api.post('/prescription/upload', payload, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
        });
    }

    return api.post('/prescription/upload', payload, {
        timeout: 60000,
    });
};
export const getPrescriptions = () => api.get('/prescription/');
export const getPrescription = (id) => api.get(`/prescription/${id}`);

export const getHealthRecords = () => api.get('/health/');
export const addVital = (data) => api.post('/health/vitals', data);
export const analyzeHealth = (lang) => api.get('/health/analyze', { params: { language: lang } });

export const getMedicineReminders = () => api.get('/medicines');
export const createMedicineReminder = (data) => api.post('/medicines', data);
export const updateMedicineReminder = (id, data) => api.put(`/medicines/${id}`, data);
export const deleteMedicineReminder = (id) => api.delete(`/medicines/${id}`);
export const markMedicineTaken = (id) => api.post(`/medicines/${id}/taken`);

export const getFamilyMembers = () => api.get('/family/members');
export const createFamilyMember = (data) => api.post('/family/members', data);
export const updateFamilyMember = (id, data) => api.put(`/family/members/${id}`, data);
export const deleteFamilyMember = (id) => api.delete(`/family/members/${id}`);
export const getFamilyDocuments = (params) => api.get('/family/documents', { params });
export const createFamilyDocument = (data) => api.post('/family/documents', data);
export const deleteFamilyDocument = (id) => api.delete(`/family/documents/${id}`);

export const getHealthToolResults = () => api.get('/health-tools');
export const saveHealthToolResult = (data) => api.post('/health-tools', data);
export const deleteHealthToolResult = (id) => api.delete(`/health-tools/${id}`);

export const searchHospitals = (params) => api.get('/hospitals/nearby', { params });
export const searchPHCHospitals = (params) => api.get('/hospitals/phc', { params });
export const getHospitalRoute = (params) => api.get('/hospitals/route', { params });

export const getMlHealth = () => mlApi.get('/health');

export default api;

