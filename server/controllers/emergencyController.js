import { getEmergencyGuidance as getGuidanceFromAI } from '../services/geminiService.js';

export async function getGuidance(req, res) {
    try {
        const { situation, language = 'en' } = req.body;
        if (!situation) return res.status(400).json({ error: 'Emergency situation required' });
        let guidance;
        try {
            guidance = await getGuidanceFromAI(situation, language);
        } catch (err) {
            console.error('Emergency AI fallback:', err.message);
            guidance = {
                title: 'Emergency Guidance',
                steps: [
                    'Call emergency services immediately.',
                    'Keep the person calm and breathing normally.',
                    'Do not give food or drink unless instructed by a professional.',
                ],
                do_not: ['Do not delay seeking professional help.'],
                while_waiting: ['Monitor breathing and consciousness continuously.'],
                call_emergency: true,
                severity: 'serious',
            };
        }
        res.json({ guidance, situation });
    } catch (err) {
        console.error('Emergency error:', err.message);
        res.status(500).json({ error: 'Failed to get emergency guidance' });
    }
}
