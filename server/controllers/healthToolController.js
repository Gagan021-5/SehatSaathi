import HealthToolResult from '../models/HealthToolResult.js';
import { resolveAuthUser } from '../utils/resolveAuthUser.js';

export async function getHealthToolResults(req, res) {
    try {
        const user = await resolveAuthUser(req);
        const results = await HealthToolResult.find({ user: user._id }).sort({ createdAt: -1 }).limit(100).lean();
        res.json(results);
    } catch (error) {
        console.error('Get health tool results error:', error.message);
        res.status(500).json({ error: 'Failed to load saved results' });
    }
}

export async function saveHealthToolResult(req, res) {
    try {
        const user = await resolveAuthUser(req);
        const { type, title, score = null, severity = '', payload = {} } = req.body;

        if (!type || !title) {
            return res.status(400).json({ error: 'type and title are required' });
        }
        if (!['calculator', 'screening'].includes(type)) {
            return res.status(400).json({ error: 'Invalid type' });
        }

        const result = await HealthToolResult.create({
            user: user._id,
            type,
            title: `${title}`.trim(),
            score: score === null || score === undefined ? null : Number(score),
            severity: `${severity}`.trim(),
            payload,
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Save health tool result error:', error.message);
        res.status(500).json({ error: 'Failed to save result' });
    }
}

export async function deleteHealthToolResult(req, res) {
    try {
        const user = await resolveAuthUser(req);
        const deleted = await HealthToolResult.findOneAndDelete({ _id: req.params.id, user: user._id });
        if (!deleted) return res.status(404).json({ error: 'Result not found' });
        res.status(204).send();
    } catch (error) {
        console.error('Delete health tool result error:', error.message);
        res.status(500).json({ error: 'Failed to delete result' });
    }
}
