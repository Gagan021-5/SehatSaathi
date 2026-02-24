import { getEmergencyGuidance as getGuidanceFromAI } from '../services/geminiService.js';

export async function getGuidance(req, res) {
    try {
        const { situation, language = 'en' } = req.body;
        if (!situation) return res.status(400).json({ error: 'Emergency situation required' });
        const guidance = await getGuidanceFromAI(situation, language);
        res.json({ guidance, situation });
    } catch (err) {
        console.error('Emergency error:', err.message);
        res.status(500).json({ error: 'Failed to get emergency guidance' });
    }
}
