import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { startChat, sendMessage } from '../services/api';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { Send, Mic, MicOff, Volume2, Loader2, Bot, User, Sparkles } from 'lucide-react';

const QUICK_PILLS = [
    '🤒 Fever', '🤕 Headache', '🤢 Nausea', '🤧 Cold & Cough',
    '💊 Stomach Pain', '😴 Fatigue', '🫁 Breathing Issue', '🩸 Blood Pressure',
];

export default function ChatPage() {
    const { currentLanguage, t } = useLanguage();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [listening, setListening] = useState(false);
    const chatEndRef = useRef(null);
    const recognitionRef = useRef(null);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    async function initChat() {
        try {
            const { data } = await startChat({ language: currentLanguage.code });
            setSessionId(data.sessionId || data._id);
            return data.sessionId || data._id;
        } catch { return null; }
    }

    async function handleSend(text) {
        const msg = (text || input).trim();
        if (!msg || loading) return;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: msg }]);
        setLoading(true);

        try {
            let sid = sessionId;
            if (!sid) sid = await initChat();
            const { data } = await sendMessage({ sessionId: sid, message: msg, language: currentLanguage.code });
            setMessages(prev => [...prev, { role: 'assistant', content: data.response || data.message || 'I understand. Could you tell me more?' }]);
        } catch {
            toast.error('Failed to get response');
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
        }
        setLoading(false);
    }

    function toggleMic() {
        if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { toast.error('Speech not supported'); return; }
        const r = new SR();
        r.lang = currentLanguage.speechCode || 'en-IN';
        r.continuous = false;
        r.onresult = (e) => { setInput(e.results[0][0].transcript); setListening(false); };
        r.onerror = () => setListening(false);
        r.onend = () => setListening(false);
        recognitionRef.current = r;
        r.start();
        setListening(true);
    }

    function speak(text) {
        const u = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ''));
        u.lang = currentLanguage.speechCode || 'en-IN';
        window.speechSynthesis.speak(u);
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scroll">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center animate-fadeInUp">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white mb-4 animate-float">
                            <Bot size={40} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('chat.title')}</h2>
                        <p className="text-sm text-gray-500 mb-6 max-w-sm">{t('chat.subtitle')}</p>
                        <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                            {QUICK_PILLS.map(pill => (
                                <button key={pill} onClick={() => handleSend(pill)}
                                    className="px-4 py-2 bg-white rounded-full border border-gray-200 text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-all">
                                    {pill}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 animate-fadeInUp ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white flex-shrink-0">
                                <Bot size={16} />
                            </div>
                        )}
                        <div className={`max-w-[75%] ${msg.role === 'user' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl rounded-tr-md px-4 py-3' : 'bg-white border border-gray-100 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm'}`}>
                            {msg.role === 'assistant' ? (
                                <div className="prose prose-sm max-w-none text-gray-700">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    <button onClick={() => speak(msg.content)} className="mt-2 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700">
                                        <Volume2 size={12} /> Listen
                                    </button>
                                </div>
                            ) : <p className="text-sm">{msg.content}</p>}
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white flex-shrink-0">
                                <User size={16} />
                            </div>
                        )}
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-3 animate-fadeInUp">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white"><Bot size={16} /></div>
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-md px-5 py-3 shadow-sm">
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <div className="border-t border-gray-100 bg-white p-4">
                {messages.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {QUICK_PILLS.slice(0, 4).map(pill => (
                            <button key={pill} onClick={() => handleSend(pill)}
                                className="px-3 py-1 bg-gray-50 rounded-full text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all border border-gray-200">
                                {pill}
                            </button>
                        ))}
                    </div>
                )}
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-end gap-2">
                    <div className="flex-1 relative">
                        <textarea
                            value={input} onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder={t('chat.placeholder')}
                            rows={1}
                            className="w-full py-3 px-4 pr-12 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm"
                        />
                        <button type="button" onClick={toggleMic}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${listening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-gray-400 hover:text-gray-600'}`}>
                            {listening ? <MicOff size={18} /> : <Mic size={18} />}
                        </button>
                    </div>
                    <button type="submit" disabled={!input.trim() || loading}
                        className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </form>
            </div>
        </div>
    );
}
