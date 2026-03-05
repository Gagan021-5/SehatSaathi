import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { getEmergencyGuidance as getGuidanceFromAI } from '../services/geminiService.js';
import { sendSMS } from '../utils/sendSMS.js';

// Lazy singleton — reads ELEVENLABS_API_KEY at call-time, not module load time.
let _elevenLabsClient = null;
function getElevenLabsClient() {
    const key = `${process.env.ELEVENLABS_API_KEY || ''}`.trim();
    if (!key) return null;
    if (!_elevenLabsClient) {
        _elevenLabsClient = new ElevenLabsClient({ apiKey: key });
        console.log('[ELEVENLABS/EMERGENCY] ✓ Client initialized.');
    }
    return _elevenLabsClient;
}


// Utility to read stream to buffer
async function streamToBuffer(stream) {
    if (typeof stream.getReader === 'function') {
        const reader = stream.getReader();
        const chunks = [];
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) chunks.push(Buffer.from(value));
        }
        return Buffer.concat(chunks);
    }
    if (typeof stream[Symbol.asyncIterator] === 'function') {
        const chunks = [];
        for await (const value of stream) {
            if (value) chunks.push(Buffer.from(value));
        }
        return Buffer.concat(chunks);
    }
    return Buffer.alloc(0);
}

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
        const elevenClient = getElevenLabsClient();
        if (elevenClient && guidance?.steps?.length > 0) {
            try {
                const voiceSettings = { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true };
                const textToSpeak = guidance.steps.join('. ');
                console.log(`[ELEVENLABS/EMERGENCY] Key loaded: ${!!process.env.ELEVENLABS_API_KEY} | Synthesizing ${textToSpeak.length} chars`);

                const audioStream = await elevenClient.textToSpeech.convert(process.env.ELEVENLABS_VOICE_ID || 'TX3LPaxmHKxFfWicjFpg', {
                    text: textToSpeak,
                    modelId: 'eleven_flash_v2_5',
                    outputFormat: 'mp3_44100_128',
                    voiceSettings,
                });

                const audioBuffer = await streamToBuffer(audioStream);
                finalAudioBase64 = audioBuffer.toString('base64');
                console.log(`[ELEVENLABS/EMERGENCY] ✓ ${audioBuffer.length} bytes generated`);
            } catch (ttsErr) {
                console.error('[ELEVENLABS/EMERGENCY] TTS failed:', {
                    message: ttsErr?.message,
                    responseData: ttsErr?.response?.data,
                    status: ttsErr?.response?.status,
                    hasApiKey: !!process.env.ELEVENLABS_API_KEY,
                });
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
