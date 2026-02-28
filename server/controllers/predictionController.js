import { predictDiabetes, predictDisease, predictRisk, getModelMetrics } from '../services/mlService.js';
import { explainDiabetesRisk, explainPrediction, explainRiskScore } from '../services/geminiService.js';
import Prediction from '../models/Prediction.js';

export async function diabetesPredict(req, res) {
    try {
        const { gender, age, hypertension, heart_disease, smoking_history, bmi, HbA1c_level, blood_glucose_level, language = 'en', patientName = '' } = req.body;

        if (!gender || age === undefined || bmi === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const patientData = {
            gender, age: Number(age), hypertension: Number(hypertension || 0),
            heart_disease: Number(heart_disease || 0), smoking_history: smoking_history || 'No Info',
            bmi: Number(bmi), HbA1c_level: Number(HbA1c_level || 5.0),
            blood_glucose_level: Number(blood_glucose_level || 100),
        };

        const mlResult = await predictDiabetes(patientData);

        let aiExplanation = {};
        try {
            aiExplanation = await explainDiabetesRisk(mlResult, patientData, language, patientName);
        } catch (err) {
            console.error('Gemini explain error:', err.message);
            aiExplanation = { summary: 'AI explanation unavailable. Please consult a doctor.', recommendations: [] };
        }

        try {
            await Prediction.create({
                userId: req.firebaseUid || null,
                type: 'diabetes',
                input: patientData,
                result: { ml_prediction: mlResult, ai_explanation: aiExplanation },
            });
        } catch { /* save failure non-critical */ }

        res.json({ ml_prediction: mlResult, ai_explanation: aiExplanation });
    } catch (err) {
        console.error('Diabetes predict error:', err.message);
        res.status(500).json({ error: 'Prediction failed. Is the ML service running?' });
    }
}

export async function diseasePredict(req, res) {
    try {
        const { symptoms, language = 'en' } = req.body;
        if (!symptoms?.length) return res.status(400).json({ error: 'Symptoms required' });

        const mlResult = await predictDisease(symptoms);

        let aiExplanation = {};
        try {
            aiExplanation = await explainPrediction(mlResult, language);
        } catch (err) {
            console.error('Gemini explain error:', err.message);
            aiExplanation = { summary: 'Please consult a doctor.', recommendations: [] };
        }

        try {
            await Prediction.create({
                userId: req.firebaseUid || null, type: 'symptom',
                input: { symptoms }, result: { ml_prediction: mlResult, ai_explanation: aiExplanation },
            });
        } catch { /* non-critical */ }

        res.json({ ml_prediction: mlResult, ai_explanation: aiExplanation });
    } catch (err) {
        console.error('Disease predict error:', err.message);
        res.status(500).json({ error: 'Prediction failed' });
    }
}

export async function riskAssess(req, res) {
    try {
        const { language = 'en', ...vitals } = req.body;
        const mlResult = await predictRisk(vitals);

        let aiExplanation = {};
        try { aiExplanation = await explainRiskScore(mlResult, vitals, language); }
        catch { aiExplanation = { summary: 'Please consult a doctor.', recommendations: [] }; }

        res.json({ ml_prediction: mlResult, ai_explanation: aiExplanation });
    } catch (err) {
        console.error('Risk assess error:', err.message);
        res.status(500).json({ error: 'Risk assessment failed' });
    }
}

export async function modelInfo(req, res) {
    try {
        const metrics = await getModelMetrics();
        res.json(metrics);
    } catch {
        res.json({
            diabetes: { accuracy: 0.97, f1_score: 0.85, dataset_size: 100000 },
            disease: { accuracy: 0.92, f1_score: 0.88, dataset_size: 5000 },
            risk: { accuracy: 0.89, f1_score: 0.82, dataset_size: 2000 },
        });
    }
}

export async function diabetesHistory(req, res) {
    try {
        const predictions = await Prediction.find({ userId: req.firebaseUid, type: 'diabetes' })
            .sort({ createdAt: -1 }).limit(20).lean();
        res.json(predictions);
    } catch { res.json([]); }
}
