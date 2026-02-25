import HealthRecord from '../models/HealthRecord.js';
import { analyzeHealthRecords } from '../services/geminiService.js';

export async function getRecords(req, res) {
    try {
        const records = await HealthRecord.find({ userId: req.firebaseUid })
            .sort({ createdAt: -1 }).limit(100).lean();
        res.json(records);
    } catch { res.json([]); }
}

export async function addVital(req, res) {
    try {
        const { type, value, unit, notes } = req.body;
        if (!type || value === undefined) return res.status(400).json({ error: 'Type and value required' });

        const record = await HealthRecord.create({
            userId: req.firebaseUid,
            type,
            value: Number(value),
            unit: unit || '',
            notes: notes || '',
        });
        res.status(201).json(record);
    } catch (err) {
        res.status(500).json({ error: 'Failed to save vital' });
    }
}

export async function analyzeHealth(req, res) {
    try {
        const records = await HealthRecord.find({ userId: req.firebaseUid })
            .sort({ createdAt: -1 }).limit(50).lean();

        const { language = 'en' } = req.query;
        const analysis = await analyzeHealthRecords(records, language);
        res.json(analysis);
    } catch (err) {
        console.error('Health analysis error:', err.message);
        res.json({ health_score: 75, summary: 'Analysis unavailable', recommendations: [] });
    }
}
