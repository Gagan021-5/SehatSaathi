import { GoogleGenerativeAI } from '@google/generative-ai';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import Groq from 'groq-sdk';
import HealthRecord from '../models/HealthRecord.js';
import Prediction from '../models/Prediction.js';
import MedicineReminder from '../models/MedicineReminder.js';
import User from '../models/User.js';

const sessions = new Map();
const GEMINI_MODEL = 'gemini-2.0-flash';
const ELEVEN_MODEL = 'eleven_flash_v2_5';
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'TX3LPaxmHKxFfWicjFpg';

const SYSTEM_INSTRUCTION = `Act as "SehatSaathi" — you are a female AI health companion with a warm, empathetic voice.

Mode A: General Assistant:
You are highly creative, witty, and helpful. If the user wants to write a poem, plan a trip, debug code, or brainstorm ideas, provide comprehensive, high-quality responses. Use Markdown, bolding, and lists to make your answers beautiful and scannable.

Mode B: Clinical Agent (Pro-Health Mode):
When the user asks about their health, vitals, or medical advice:
- Check Data: Inform them about their health metrics if you have context, but do not hallucinate metrics.
- Be Grounded: Only speak about the numbers found in the records.
- Be Safe: Give supportive advice but never "prescribe" medication. Always suggest consulting a local doctor for emergencies.

Behavioral Guidelines:
- No Hallucinations: If you don't know something, say so.
- Adaptive Tone: Match the user's energy. If they are joking, be witty. If they are in pain, be empathetic.
- Always Listening: Keep responses engaging so the conversation never stops.
- JSON Integrity: Never show raw code or JSON braces to the user. Always render information in a clean, human-friendly format in the 'text' field.

CRITICAL HINDI LANGUAGE RULE:
You are a FEMALE assistant. When responding in Hindi, ALWAYS use feminine verb conjugations:
- Use "कर सकती हूँ" NOT "कर सकता हूँ"
- Use "बता सकती हूँ" NOT "बता सकता हूँ"
- Use "समझ सकती हूँ" NOT "समझ सकता हूँ"
- Use "मैं आपकी सहायता कर सकती हूँ" as the standard greeting form
- First-person verbs must always end in "ती हूँ" form, never "ता हूँ"
- This applies to ALL Hindi responses without exception.

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

const elevenLabsApiKey = () => `${process.env.ELEVENLABS_API_KEY || ''}`.trim();

// Lazy singleton — created on first synthesis call, AFTER dotenv has populated process.env.
// This is critical: module-level code runs before dotenv in ES module import graphs.
let _elevenLabsClient = null;
function getElevenLabsClient() {
    const key = elevenLabsApiKey();
    if (!key) return null;
    if (!_elevenLabsClient) {
        _elevenLabsClient = new ElevenLabsClient({ apiKey: key });
        console.log('[ELEVENLABS] ✓ Client initialized with API key.');
    }
    return _elevenLabsClient;
}

console.log(`[ELEVENLABS] ${elevenLabsApiKey() ? '✓ API key present in env at module load' : '✗ API key NOT present at module load (will re-check at first call)'}`);

const groq = process.env.GROQ_API_KEY
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null;

// ---------- HEALTH CONTEXT BUILDER ----------
async function buildHealthContext(userId) {
    if (!userId) return '';

    try {
        // Fetch user first, then everything else in parallel (medicines needs user._id)
        const user = await User.findOne({ firebaseUid: userId }).lean().catch(() => null);

        const [vitals, predictions, medicines] = await Promise.all([
            HealthRecord.find({ userId }).sort({ createdAt: -1 }).limit(50).lean().catch(() => []),
            Prediction.find({ userId }).sort({ createdAt: -1 }).limit(5).lean().catch(() => []),
            user?._id
                ? MedicineReminder.find({ user: user._id }).sort({ createdAt: -1 }).limit(10).lean().catch(() => [])
                : Promise.resolve([]),
        ]);

        const lines = [];
        lines.push('=== PATIENT HEALTH CONTEXT (Live Data) ===');

        // Profile
        if (user) {
            lines.push(`Patient: ${user.name || 'Unknown'} (${user.gender || 'Unknown'} | DoB: ${user.dateOfBirth || 'Unknown'})`);
            lines.push(`Blood Group: ${user.bloodGroup || 'Not set'}`);
            if (user.allergies?.length) lines.push(`Allergies: ${user.allergies.join(', ')}`);
            if (user.conditions?.length) lines.push(`Chronic Conditions: ${user.conditions.join(', ')}`);
        }

        // Latest vitals (most recent per type)
        if (vitals?.length) {
            lines.push('\n--- Latest Vitals ---');
            const vitalTypes = ['blood_pressure', 'heart_rate', 'temperature', 'blood_sugar', 'weight', 'oxygen'];
            const latestByType = {};
            const trendByType = {};

            for (const v of vitals) {
                if (!latestByType[v.type]) {
                    latestByType[v.type] = v;
                    trendByType[v.type] = [];
                }
                if (trendByType[v.type].length < 5) {
                    trendByType[v.type].push(v.value);
                }
            }

            for (const type of vitalTypes) {
                const latest = latestByType[type];
                if (!latest) continue;
                const typeLabel = {
                    blood_pressure: 'Blood Pressure',
                    heart_rate: 'Heart Rate',
                    temperature: 'Temperature',
                    blood_sugar: 'Blood Sugar',
                    weight: 'Weight',
                    oxygen: 'Oxygen Saturation',
                }[type] || type;
                const unit = {
                    blood_pressure: 'mmHg', heart_rate: 'bpm',
                    temperature: '°F', blood_sugar: 'mg/dL',
                    weight: 'kg', oxygen: '%'
                }[type] || '';
                const trend = trendByType[type] || [];
                let trendNote = '';
                if (trend.length >= 3) {
                    const first = trend[trend.length - 1];
                    const last = trend[0];
                    const delta = ((last - first) / Math.abs(first || 1)) * 100;
                    if (Math.abs(delta) > 5) {
                        trendNote = ` (${delta > 0 ? '↑ rising' : '↓ falling'} ${Math.abs(Math.round(delta))}%)`;
                    }
                }
                lines.push(`  ${typeLabel}: ${latest.value} ${unit} (${new Date(latest.createdAt).toLocaleDateString()})${trendNote}`);
            }
        }

        // Latest diabetes assessment
        const diabetesPredictions = predictions?.filter(p => p.type === 'diabetes') || [];
        if (diabetesPredictions.length) {
            const latest = diabetesPredictions[0];
            lines.push('\n--- Diabetes Risk Assessment ---');
            const res = latest.result;
            lines.push(`  Risk Level: ${res?.risk_level || res?.riskLevel || 'Unknown'}`);
            lines.push(`  Probability: ${res?.probability !== undefined ? (res.probability * 100).toFixed(1) + '%' : (res?.diabetesProbability || 'N/A')}`);
            const inp = latest.input || {};
            if (inp.HbA1c_level) lines.push(`  HbA1c: ${inp.HbA1c_level}%`);
            if (inp.blood_glucose_level) lines.push(`  Blood Glucose at Test: ${inp.blood_glucose_level} mg/dL`);
            if (inp.bmi) lines.push(`  BMI at Test: ${inp.bmi}`);
            lines.push(`  Assessed: ${new Date(latest.createdAt).toLocaleDateString()}`);
        }

        // Active medicines
        if (medicines?.length) {
            lines.push('\n--- Active Medications ---');
            for (const med of medicines) {
                lines.push(`  ${med.medicineName} — ${med.dosage} at ${(med.times || []).join(', ')}${med.withFood ? ' (with food)' : ''}`);
            }
        }

        lines.push('=== END OF PATIENT CONTEXT ===');
        return lines.join('\n');
    } catch (err) {
        console.warn('[HEALTH-CONTEXT] Failed to build context:', err.message);
        return '';
    }
}

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

function toGroqHistory(history = []) {
    if (!Array.isArray(history)) return [];
    return history
        .map((item) => {
            const content = `${item?.content ?? item?.text ?? item?.parts?.[0]?.text ?? ''}`.trim();
            if (!content) return null;
            const role = item?.role === 'assistant' || item?.role === 'model' ? 'assistant' : 'user';
            return { role, content };
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

    // Step 1: Look for ```json ... ``` exactly
    let match = direct.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
    if (match?.[1]) return match[1].trim();

    // Step 2: Look for any {...} object
    match = direct.match(/\{[\s\S]*\}/);
    if (match?.[0]) return match[0].trim();

    return direct;
}

function stripJsonComments(str) {
    // Remove single-line // comments that are NOT inside quoted strings
    return str.replace(/("(?:[^"\\]|\\.)*")|\/\/[^\n]*/g, (match, quoted) => {
        return quoted ? quoted : '';
    });
}

function tryParseStructuredPayload(rawText = '') {
    const directAttempt = `${rawText || ''}`.trim();
    const candidate = extractJsonCandidate(directAttempt);

    // First try raw, then try stripping comments
    for (const source of [candidate, stripJsonComments(candidate)]) {
        try {
            const parsed = JSON.parse(source);
            if (parsed && typeof parsed === 'object') {
                const text = `${parsed.text || parsed.response || ''}`.trim();
                const mood = normalizeMood(parsed.mood);
                if (text) return { mood, text };
            }
        } catch {
            // Try next
        }
    }

    // Extreme fallback: If we still failed to parse but text starts with a bracket, strip it
    let cleanFallback = directAttempt;
    if (cleanFallback.startsWith('{')) {
        cleanFallback = "I am having trouble forming a clinical response right now. Please tell me more.";
    }

    return {
        mood: 'Calm',
        text: cleanFallback || 'I understand. Please share one more symptom detail.',
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

    // Key check at call-time (not module load time)
    const keyLoaded = !!process.env.ELEVENLABS_API_KEY;
    console.log(`[ELEVENLABS] Key loaded at call-time: ${keyLoaded} | Voice ID: ${DEFAULT_VOICE_ID} | Model: ${ELEVEN_MODEL}`);

    const elevenlabs = getElevenLabsClient();
    if (!elevenlabs) {
        console.warn('[ELEVENLABS] ✗ No API key — skipping synthesis. Add ELEVENLABS_API_KEY to server/.env');
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
    if (buffer.length) {
        console.log(`[ELEVENLABS] ✓ Synthesized ${text.length} chars → ${buffer.length} bytes audio (mood: ${safeMood})`);
    } else {
        console.warn('[ELEVENLABS] ✗ Synthesis returned empty buffer');
    }
    return {
        audioBase64: buffer.length ? buffer.toString('base64') : '',
        audioMimeType: 'audio/mpeg',
    };
}

export async function voiceChat(req, res) {
    try {
        const { message, history, language, sessionId, userId } = req.body || {};
        const userMessage = typeof message === 'string' ? message.trim() : '';
        const safeHistory = Array.isArray(history) ? history : [];
        const safeLanguage = typeof language === 'string' && language.trim() ? language.trim() : 'en';

        if (!userMessage) return res.status(400).json({ error: 'Message is required' });
        if (!groq) {
            return res.status(500).json({
                success: false,
                error: 'GROQ_API_KEY is not configured on server',
            });
        }

        // Build personalized health context from DB
        const healthContext = userId ? await buildHealthContext(userId) : '';

        const dynamicSystemPrompt = `${SYSTEM_INSTRUCTION}

${healthContext ? `IMPORTANT: The following is the REAL, LIVE health data for this specific patient. When they ask about their vitals, medications, diabetes risk, or health trends — answer using this data directly. Be specific with numbers and dates.

${healthContext}` : 'No personal health data available for this session. Provide general medical guidance.'}`;

        const sid = sessionId || `session_${Date.now()}`;
        if (!sessions.has(sid)) sessions.set(sid, { messages: [], language: safeLanguage });

        const session = sessions.get(sid);
        session.language = safeLanguage;

        const groqHistory = toGroqHistory(safeHistory);
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: dynamicSystemPrompt },
                ...groqHistory,
                { role: "user", content: userMessage }
            ],
            temperature: 0.7,
            max_tokens: 400,
            response_format: { type: "json_object" }
        });

        const rawText = completion.choices[0]?.message?.content || "";
        const structured = tryParseStructuredPayload(rawText);
        const mood = normalizeMood(structured.mood);
        const text = structured.text;

        session.messages.push({ role: 'user', content: userMessage });
        session.messages.push({ role: 'assistant', content: text, mood });

        let audioPayload = { audioBase64: '', audioMimeType: '' };
        if (getElevenLabsClient()) {
            try {
                audioPayload = await synthesizeMoodAudio(text, mood);
            } catch (ttsError) {
                console.error('[GROQ-VOICE] TTS failed:', {
                    message: ttsError?.message,
                    responseData: ttsError?.response?.data,
                    status: ttsError?.response?.status,
                    raw: ttsError,
                });
            }
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
        console.error('[GROQ-VOICE] error:', err);
        return res.status(500).json({ success: false, error: 'Groq interaction failed' });
    }
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
                temperature: 0.7,
                maxOutputTokens: 300,
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
                responseData: ttsError?.response?.data,
                status: ttsError?.response?.status,
                voiceId: DEFAULT_VOICE_ID,
                model: ELEVEN_MODEL,
                hasApiKey: !!process.env.ELEVENLABS_API_KEY,
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

        const isQuotaError = err?.message?.includes('429') || err?.message?.includes('quota');
        return res.status(isQuotaError ? 429 : 500).json({
            success: false,
            error: isQuotaError
                ? 'AI quota exceeded. Please wait a minute and try again.'
                : 'Failed to process chat request',
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

export async function synthesizeSpeechEndpoint(req, res) {
    try {
        const { text, mood } = req.body || {};
        const safeText = typeof text === 'string' ? text.trim() : '';
        if (!safeText) return res.status(400).json({ error: 'Text is required' });

        const audioPayload = await synthesizeMoodAudio(safeText, mood || 'Calm');
        return res.json({
            success: true,
            audioBase64: audioPayload.audioBase64,
            audioMimeType: audioPayload.audioMimeType,
        });
    } catch (err) {
        console.error('[CHAT /synthesize] error:', err);
        return res.status(500).json({ success: false, error: 'Failed to synthesize speech' });
    }
}
