import { GoogleGenerativeAI } from '@google/generative-ai';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const sessions = new Map();
const GEMINI_MODEL = 'gemini-2.5-flash';
const ELEVEN_MODEL = 'eleven_flash_v2_5';
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'TX3LPaxmHKxFfWicjFpg';

const SYSTEM_INSTRUCTION = `You are the SehatSaathi AI Clinical Assistant, an empathetic medical triage agent for Indian users.
CORE RULES:
1. EMPATHY FIRST: Briefly validate their symptom.
2. ALWAYS ASK A QUESTION: End every response with exactly ONE relevant follow-up question using PQRST.
3. NEVER DIAGNOSE: Do not declare a disease or prescribe medication.
4. EMERGENCY RULE: If severe chest pain, stroke signs, or severe bleeding are mentioned, immediately advise calling 112 or visiting ER.
5. Keep responses short (under 90 words) and conversational.

OUTPUT FORMAT RULE:
You must return ONLY valid JSON and nothing else.
Schema:
{
  "mood": "Calm" | "Anxious" | "Urgent",
  "text": "assistant response"
}

Mood policy:
- Calm: routine guidance and stable conversation.
- Anxious: distress, uncertainty, fear, or worsening symptoms.
- Urgent: emergency cues (chest pain, stroke signs, severe bleeding, breathing distress).`;

const MOOD_SETTINGS = {
    Calm: {
        stability: 0.8,
        similarityBoost: 0.8,
    },
    Anxious: {
        stability: 0.4,
        similarityBoost: 0.7,
        style: 0.5,
    },
    Urgent: {
        stability: 0.2,
        similarityBoost: 0.65,
        style: 1.0,
    },
};

const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

const elevenLabsApiKey = `${process.env.ELEVENLABS_API_KEY || ''}`.trim();
const elevenlabs = elevenLabsApiKey
    ? new ElevenLabsClient({ apiKey: elevenLabsApiKey })
    : null;

function toGeminiHistory(history = []) {
    if (!Array.isArray(history)) return [];
    return history
        .map((item) => {
            const text = `${item?.content ?? item?.text ?? item?.parts?.[0]?.text ?? ''}`.trim();
            if (!text) return null;
            const role = item?.role === 'assistant' || item?.role === 'model' ? 'model' : 'user';
            return { role, parts: [{ text }] };
        })
        .filter(Boolean);
}

function normalizeMood(value) {
    const mood = `${value || ''}`.trim();
    if (mood === 'Urgent') return 'Urgent';
    if (mood === 'Anxious') return 'Anxious';
    return 'Calm';
}

function extractJsonCandidate(rawText = '') {
    const direct = `${rawText || ''}`.trim();
    if (!direct) return '';

    // Handles both ```json ... ``` and plain ``` ... ``` responses.
    const fencedMatch = direct.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fencedMatch?.[1]) return fencedMatch[1].trim();

    return direct
        .replace(/^```[\w-]*\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
}

function tryParseStructuredPayload(rawText = '') {
    const directAttempt = `${rawText || ''}`.trim();
    const candidate = extractJsonCandidate(directAttempt);

    const attempts = [];
    for (const source of [candidate, directAttempt]) {
        if (!source) continue;
        attempts.push(source);
        const objectMatch = source.match(/\{[\s\S]*\}/);
        if (objectMatch?.[0]) attempts.push(objectMatch[0]);
    }

    for (const entry of attempts) {
        try {
            const parsed = JSON.parse(entry);
            if (parsed && typeof parsed === 'object') {
                const text = `${parsed.text || parsed.response || ''}`.trim();
                const mood = normalizeMood(parsed.mood);
                if (text) return { mood, text };
            }
        } catch {
            // Keep trying.
        }
    }

    return {
        mood: 'Calm',
        text: directAttempt || 'I understand. Please share one more symptom detail.',
    };
}

async function readableStreamToBuffer(stream) {
    if (!stream) return Buffer.alloc(0);

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

async function synthesizeMoodAudio(text, mood) {
    const safeText = typeof text === 'string' ? text.trim() : '';
    const safeMood = typeof mood === 'string' ? mood : '';
    if (!safeText) {
        console.warn('[ELEVENLABS] Skipping synthesis because text is empty or invalid.');
        return { audioBase64: '', audioMimeType: '' };
    }
    if (!elevenlabs) {
        console.warn('[ELEVENLABS] ELEVENLABS_API_KEY is missing. Returning text-only response.');
        return { audioBase64: '', audioMimeType: '' };
    }

    const voiceSettings = MOOD_SETTINGS[normalizeMood(safeMood)] || MOOD_SETTINGS.Calm;
    const audioStream = await elevenlabs.textToSpeech.convert(DEFAULT_VOICE_ID, {
        text: safeText,
        modelId: ELEVEN_MODEL,
        outputFormat: 'mp3_44100_128',
        voiceSettings,
    });

    const buffer = await readableStreamToBuffer(audioStream);
    return {
        audioBase64: buffer.length ? buffer.toString('base64') : '',
        audioMimeType: 'audio/mpeg',
    };
}

export async function sendMessage(req, res) {
    try {
        const { message, history, language, sessionId } = req.body || {};
        const userMessage = typeof message === 'string' ? message.trim() : '';
        const safeHistory = Array.isArray(history) ? history : [];
        const safeLanguage = typeof language === 'string' && language.trim() ? language.trim() : 'en';

        if (!userMessage) return res.status(400).json({ error: 'Message is required' });
        if (!genAI) {
            return res.status(500).json({
                success: false,
                error: 'GEMINI_API_KEY is not configured on server',
            });
        }

        const sid = sessionId || `session_${Date.now()}`;
        if (!sessions.has(sid)) sessions.set(sid, { messages: [], language: safeLanguage });

        const session = sessions.get(sid);
        session.language = safeLanguage;
        const formattedHistory = toGeminiHistory(safeHistory);
        session.messages = formattedHistory.map((entry) => ({
            role: entry.role === 'model' ? 'assistant' : 'user',
            content: entry.parts[0].text,
        }));

        const model = genAI.getGenerativeModel({
            model: GEMINI_MODEL,
            systemInstruction: SYSTEM_INSTRUCTION,
        });

        const chat = model.startChat({
            history: formattedHistory,
            generationConfig: {
                temperature: 0.55,
                maxOutputTokens: 350,
            },
        });

        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        const rawText = response.text();
        const structured = tryParseStructuredPayload(rawText);
        const mood = normalizeMood(structured.mood);
        const text = structured.text;

        session.messages.push({ role: 'user', content: userMessage });
        session.messages.push({ role: 'assistant', content: text, mood });

        let audioPayload = { audioBase64: '', audioMimeType: '' };
        try {
            audioPayload = await synthesizeMoodAudio(text, mood);
        } catch (ttsError) {
            console.error('[ELEVENLABS] synthesis failed:', {
                message: ttsError?.message,
                stack: ttsError?.stack,
                hasApiKey: Boolean(elevenLabsApiKey),
                textLength: text?.length || 0,
                mood,
            });
        }

        return res.json({
            success: true,
            sessionId: sid,
            mood,
            text,
            response: text,
            audioBase64: audioPayload.audioBase64,
            audioMimeType: audioPayload.audioMimeType,
        });
    } catch (err) {
        console.error('[CHAT /message] error:', {
            message: err?.message,
            stack: err?.stack,
            bodyKeys: Object.keys(req.body || {}),
            hasMessage: typeof req.body?.message === 'string',
            historyType: Array.isArray(req.body?.history) ? 'array' : typeof req.body?.history,
            languageType: typeof req.body?.language,
            sessionId: req.body?.sessionId || null,
        });
        return res.status(500).json({
            success: false,
            error: 'Failed to process chat request',
        });
    }
}

export function getHistory(req, res) {
    const session = sessions.get(req.params.sessionId);
    res.json({ messages: session ? session.messages : [] });
}

export function getSessions(req, res) {
    const list = Array.from(sessions.entries()).map(([id, s]) => ({
        id,
        messageCount: s.messages.length,
        language: s.language,
        lastMessage: s.messages[s.messages.length - 1]?.content?.substring(0, 50),
    }));
    res.json(list);
}
