import dotenv from 'dotenv';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { getEmergencyGuidance as getGuidanceFromAI } from '../services/geminiService.js';

dotenv.config();

const elevenlabs = process.env.ELEVENLABS_API_KEY ? new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY }) : null;

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
        if (elevenlabs && guidance?.steps?.length > 0) {
            try {
                // Same defaults as chatController
                const voiceSettings = { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true };
                const textToSpeak = guidance.steps.join('. ');

                const audioStream = await elevenlabs.textToSpeech.convert(process.env.ELEVENLABS_VOICE_ID || 'TX3LPaxmHKxFfWicjFpg', {
                    text: textToSpeak,
                    modelId: 'eleven_flash_v2_5',
                    outputFormat: 'mp3_44100_128',
                    voiceSettings,
                });

                const audioBuffer = await streamToBuffer(audioStream);
                finalAudioBase64 = audioBuffer.toString('base64');
            } catch (ttsErr) {
                console.error('[ELEVENLABS EMERGENCY] Error generating audio:', ttsErr.message);
            }
        }

        res.json({ guidance, situation, audioBase64: finalAudioBase64 });
    } catch (err) {
        console.error('Emergency error:', err.message);
        res.status(500).json({ error: 'Failed to get emergency guidance' });
    }
}
