import axios from 'axios';
import { parseNumber, validateRequired } from '../utils/helpers.js';

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

export async function diabetesPredict(req, res) {
    const required = ['gender', 'age', 'hypertension', 'heart_disease',
        'smoking_history', 'bmi', 'HbA1c_level', 'blood_glucose_level'];

    const missing = validateRequired(req.body, required);
    if (missing) return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });

    const payload = {
        gender: String(req.body.gender),
        age: parseNumber(req.body.age),
        hypertension: parseNumber(req.body.hypertension),
        heart_disease: parseNumber(req.body.heart_disease),
        smoking_history: String(req.body.smoking_history),
        bmi: parseNumber(req.body.bmi),
        HbA1c_level: parseNumber(req.body.HbA1c_level),
        blood_glucose_level: parseNumber(req.body.blood_glucose_level),
    };

    try {
        const mlRes = await axios.post(`${ML_URL}/predict`, payload, { timeout: 15000 });
        res.json(mlRes.data);
    } catch (err) {
        console.error('Diabetes prediction error:', err.message);
        if (err.response) return res.status(err.response.status).json(err.response.data);
        res.status(503).json({ error: 'ML service unavailable. Please try again later.' });
    }
}
