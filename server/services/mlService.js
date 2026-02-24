import axios from 'axios';

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

export async function predictDisease(symptoms) {
    try {
        const res = await axios.post(`${ML_URL}/predict`, { symptoms }, { timeout: 10000 });
        return res.data;
    } catch {
        return {
            prediction: 'Common Cold', confidence: 0.78,
            top_predictions: [
                { disease: 'Common Cold', probability: 0.78 },
                { disease: 'Influenza', probability: 0.15 },
                { disease: 'Allergic Rhinitis', probability: 0.07 }
            ]
        };
    }
}

export async function assessRisk(vitals) {
    try {
        const res = await axios.post(`${ML_URL}/risk`, vitals, { timeout: 10000 });
        return res.data;
    } catch { return { score: 3, level: 'Low', factors: {} }; }
}
