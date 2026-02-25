import { analyzePrescription as analyzeRx, explainMedicineSimply } from '../services/geminiService.js';

export async function analyze(req, res) {
    try {
        const language = req.body.language || 'en';
        if (!req.file && !req.body.image) return res.status(400).json({ error: 'Prescription image required' });

        let imageBase64;
        if (req.file) imageBase64 = req.file.buffer.toString('base64');
        else imageBase64 = req.body.image.replace(/^data:image\/\w+;base64,/, '');

        let result;
        try {
            result = await analyzeRx(imageBase64, language);
        } catch (err) {
            console.error('Prescription AI fallback:', err.message);
            const message = String(err?.message || '').toLowerCase();
            const quotaExceeded = message.includes('quota') || message.includes('too many requests') || message.includes('429');
            const modelUnavailable = message.includes('not found') || message.includes('model');
            result = {
                text: '',
                medicines: [],
                doctor: '',
                notes: '',
                interactions: [],
                generic_alternatives: [],
                dietary_advice: [],
                ai_error: quotaExceeded ? 'quota_exceeded' : modelUnavailable ? 'model_unavailable' : 'service_unavailable',
                summary: quotaExceeded
                    ? 'AI extraction is unavailable because Gemini API quota is exceeded. Please try again later or update billing/quota settings.'
                    : modelUnavailable
                        ? 'AI extraction is unavailable due to model configuration. Please contact support to update the AI model.'
                        : 'AI extraction is temporarily unavailable. Please retry in a moment.',
            };
        }
        res.json(result);
    } catch (err) {
        console.error('Prescription error:', err.message);
        res.status(500).json({ error: 'Failed to analyze prescription' });
    }
}

export async function explainMedicine(req, res) {
    try {
        const { medicine, language = 'en' } = req.body;
        if (!medicine) return res.status(400).json({ error: 'Medicine name required' });
        let explanation;
        try {
            explanation = await explainMedicineSimply(medicine, language);
        } catch (err) {
            console.error('Medicine explanation AI fallback:', err.message);
            const medName = typeof medicine === 'string' ? medicine : medicine.name;
            explanation = {
                name: medName || 'Medicine',
                simpleExplanation: 'Medicine explanation is temporarily unavailable.',
                timing: { morning: false, afternoon: false, evening: false, night: false },
                withFood: true,
                warnings: [],
                avoidWith: [],
            };
        }
        res.json(explanation);
    } catch (err) {
        console.error('Medicine explanation error:', err.message);
        res.status(500).json({ error: 'Failed to explain medicine' });
    }
}
