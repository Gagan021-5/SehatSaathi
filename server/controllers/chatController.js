import { chatWithPatient } from '../services/geminiService.js';

const sessions = new Map();

export async function sendMessage(req, res) {
    try {
        const { message, language = 'en', sessionId } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });

        const sid = sessionId || `session_${Date.now()}`;
        if (!sessions.has(sid)) sessions.set(sid, { messages: [], language });

        const session = sessions.get(sid);
        session.language = language;
        session.messages.push({ role: 'user', content: message });

        let reply;
        try {
            reply = await chatWithPatient(session.messages, language);
        } catch (err) {
            console.error('Chat AI fallback:', err.message);
            reply = 'I am temporarily unable to generate a full response. Please try again in a moment or contact a doctor for urgent symptoms.';
        }
        session.messages.push({ role: 'assistant', content: reply });

        res.json({ reply, sessionId: sid });
    } catch (err) {
        console.error('Chat error:', err.message);
        res.status(500).json({ error: 'Failed to get response' });
    }
}

export function getHistory(req, res) {
    const session = sessions.get(req.params.sessionId);
    res.json({ messages: session ? session.messages : [] });
}

export function getSessions(req, res) {
    const list = Array.from(sessions.entries()).map(([id, s]) => ({
        id, messageCount: s.messages.length, language: s.language,
        lastMessage: s.messages[s.messages.length - 1]?.content?.substring(0, 50)
    }));
    res.json(list);
}
