import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function predictDiabetes(formData) {
    const payload = {
        gender: String(formData.gender),
        age: Number(formData.age),
        hypertension: Number(formData.hypertension),
        heart_disease: Number(formData.heart_disease),
        smoking_history: String(formData.smoking_history),
        bmi: Number(formData.bmi),
        HbA1c_level: Number(formData.HbA1c_level),
        blood_glucose_level: Number(formData.blood_glucose_level),
    };

    const res = await axios.post(`${API_BASE}/diabetes/predict`, payload);
    return res.data;
}
