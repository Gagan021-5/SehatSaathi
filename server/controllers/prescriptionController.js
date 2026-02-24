import { analyzePrescription as analyzeRx, explainMedicineSimply } from '../services/geminiService.js';

export async function analyze(req, res) {
    try {
        const language = req.body.language || 'en';
        if (!req.file && !req.body.image) return res.status(400).json({ error: 'Prescription image required' });

        let imageBase64;
        if (req.file) imageBase64 = req.file.buffer.toString('base64');
        else imageBase64 = req.body.image.replace(/^data:image\/\w+;base64,/, '');

        const result = await analyzeRx(imageBase64, language);
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
        const explanation = await explainMedicineSimply(medicine, language);
        res.json(explanation);
    } catch (err) {
        console.error('Medicine explanation error:', err.message);
        res.status(500).json({ error: 'Failed to explain medicine' });
    }
}
