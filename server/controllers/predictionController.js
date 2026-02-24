import { predictDisease } from '../services/mlService.js';
import { explainPrediction } from '../services/geminiService.js';

export async function predictAndExplain(req, res) {
    try {
        const { symptoms, language = 'en' } = req.body;
        if (!symptoms || !symptoms.length) return res.status(400).json({ error: 'Symptoms required' });

        const mlResult = await predictDisease(symptoms);
        mlResult.symptoms = symptoms;

        let explanation = '';
        try { explanation = await explainPrediction(mlResult, language); }
        catch { explanation = 'Please consult a doctor for detailed analysis.'; }

        res.json({
            prediction: mlResult.prediction || mlResult.disease,
            confidence: mlResult.confidence,
            topPredictions: mlResult.top_predictions,
            explanation, symptoms
        });
    } catch (err) {
        console.error('Prediction error:', err.message);
        res.status(500).json({ error: 'Prediction failed' });
    }
}
