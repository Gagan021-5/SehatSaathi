import { getEmergencyGuidance as getGuidanceFromAI } from '../services/geminiService.js';
import { sendSMS } from '../utils/sendSMS.js';

const EMERGENCY_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'cgSgspJ2msm6clMCkdW9';

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

        let finalAudioBase64 = '';
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (apiKey && guidance?.steps?.length > 0) {
            try {
                const textToSpeak = guidance.steps.join('. ');
                console.log(`[ELEVENLABS/EMERGENCY] Requesting TTS | ${textToSpeak.length} chars | voice: ${EMERGENCY_VOICE_ID}`);

                const response = await fetch(
                    `https://api.elevenlabs.io/v1/text-to-speech/${EMERGENCY_VOICE_ID}?output_format=mp3_44100_128`,
                    {
                        method: 'POST',
                        headers: {
                            'Accept': 'audio/mpeg',
                            'Content-Type': 'application/json',
                            'xi-api-key': apiKey,
                        },
                        body: JSON.stringify({
                            text: textToSpeak,
                            model_id: 'eleven_multilingual_v2',
                            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
                        }),
                    }
                );

                if (!response.ok) {
                    const errText = await response.text();
                    console.error(`[ELEVENLABS/EMERGENCY] HTTP ${response.status} Error:`, errText);
                } else {
                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    finalAudioBase64 = buffer.toString('base64');
                    console.log(`[ELEVENLABS/EMERGENCY] ✓ ${buffer.length} bytes generated`);
                }
            } catch (ttsErr) {
                console.error('[ELEVENLABS/EMERGENCY] Fetch error:', ttsErr.message);
            }
        }

        res.json({ guidance, situation, audioBase64: finalAudioBase64 });
    } catch (err) {
        console.error('Emergency error:', err.message);
        res.status(500).json({ error: 'Failed to get emergency guidance' });
    }
}

export async function ussdWebhook(req, res) {
    try {
        const { phoneNumber, text } = req.body;

        if (text !== '*123#') {
            return res.status(400).json({ error: 'Invalid USSD code. Expected *123#' });
        }

        const message =
            'SehatSaathi Alert: Emergency USSD triggered. Help is on the way to your registered rural location.';

        await sendSMS(phoneNumber, message);

        return res.status(200).json({
            success: true,
            message: 'USSD emergency alert sent successfully.',
            recipient: phoneNumber,
        });
    } catch (err) {
        console.error('[USSD Webhook] Error:', err.message);
        return res.status(500).json({ error: 'Failed to process USSD webhook.' });
    }
}
