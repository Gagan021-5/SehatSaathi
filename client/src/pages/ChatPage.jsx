import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Loader2, Mic, MicOff, Send, User, Volume2, Sparkles, Activity } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { sendMessage, startChat } from '../services/api';
import PageTransition from '../components/common/PageTransition';

const MOOD_THEME = {
    Calm: { glow: 'rgba(59, 130, 246, 0.5)', pill: 'bg-blue-50 text-blue-700 border-blue-100', wave: '#3b82f6' },
    Anxious: { glow: 'rgba(245, 158, 11, 0.5)', pill: 'bg-amber-50 text-amber-700 border-amber-100', wave: '#f59e0b' },
    Urgent: { glow: 'rgba(244, 63, 94, 0.5)', pill: 'bg-rose-50 text-rose-700 border-rose-100', wave: '#f43f5e' },
};

export default function ChatPage() {
    const { currentLanguage, t } = useLanguage();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [voiceSessionActive, setVoiceSessionActive] = useState(false);
    const [voicePhase, setVoicePhase] = useState('idle'); // idle | listening | thinking | speaking
    const [mood, setMood] = useState('Calm');

    const chatEndRef = useRef(null);
    const audioPlayerRef = useRef(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading, voicePhase]);

    // Handle Clinical Chat Logic
    async function handleSend(text) {
        const nextText = (text || input).trim();
        if (!nextText || loading) return null;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: nextText }]);
        setLoading(true);
        if (voiceSessionActive) setVoicePhase('thinking');

        try {
            const { data } = await sendMessage({
                message: nextText,
                history: messages.map(m => ({ role: m.role, content: m.content })),
                language: currentLanguage.code
            });

            const assistantMood = data?.mood || 'Calm';
            const assistantReply = data?.text || 'I am processing your request.';
            
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: assistantReply, 
                mood: assistantMood,
                audio: data?.audioBase64 
            }]);
            
            setMood(assistantMood);
            
            if (data?.audioBase64) {
                await playAudio(data.audioBase64, assistantMood);
            }

            return { text: assistantReply, mood: assistantMood };
        } catch (error) {
            toast.error('Neural sync failed. Please retry.');
            return null;
        } finally {
            setLoading(false);
            if (!voiceSessionActive) setVoicePhase('idle');
        }
    }

    // High-Fidelity Audio Playback
    async function playAudio(base64, currentMood) {
        const blob = new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioPlayerRef.current = audio;

        setVoicePhase('speaking');
        try {
            await audio.play();
            await new Promise(res => audio.onended = res);
        } finally {
            URL.revokeObjectURL(url);
            if (voiceSessionActive) setVoicePhase('listening');
            else setVoicePhase('idle');
        }
    }

    // Voice Session Management
    function toggleVoiceMode() {
        if (voiceSessionActive) {
            setVoiceSessionActive(false);
            setVoicePhase('idle');
            recognitionRef.current?.stop();
            audioPlayerRef.current?.pause();
        } else {
            setVoiceSessionActive(true);
            startListeningLoop();
        }
    }

    function startListeningLoop() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognizer = new SpeechRecognition();
        recognizer.lang = currentLanguage.speechCode || 'en-IN';
        
        recognizer.onstart = () => setVoicePhase('listening');
        recognizer.onresult = (e) => handleSend(e.results[0][0].transcript);
        recognizer.onend = () => { if (voiceSessionActive && voicePhase === 'listening') recognizer.start(); };
        
        recognitionRef.current = recognizer;
        recognizer.start();
    }

    const theme = MOOD_THEME[mood] || MOOD_THEME.Calm;

    return (
        <PageTransition className="mx-auto max-w-5xl h-[calc(100vh-8rem)] flex flex-col gap-4">
            {/* Clinical Aura Container */}
            <div className="relative flex-1 bg-white/40 backdrop-blur-3xl rounded-[3rem] border border-white shadow-2xl overflow-hidden flex flex-col ring-1 ring-slate-200/50">
                
                {/* Visualizer Overlay */}
                <AnimatePresence>
                    {(voicePhase === 'listening' || voicePhase === 'speaking') && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none"
                        >
                            <VoiceWaveform color={theme.wave} phase={voicePhase} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <header className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/50 bg-white/20">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <motion.div 
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute -inset-2 blur-xl rounded-full"
                                style={{ backgroundColor: theme.glow }}
                            />
                            <div className="relative h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                                <Bot size={24} />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tight text-slate-900">Clinical Intelligence</h1>
                            <div className={`mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${theme.pill}`}>
                                <Sparkles size={10} /> {mood} Mode
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={toggleVoiceMode}
                        className={`group flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
                            voiceSessionActive ? 'bg-rose-500 text-white shadow-rose-500/40' : 'bg-slate-900 text-white shadow-slate-900/20'
                        }`}
                    >
                        {voiceSessionActive ? <MicOff size={16} /> : <Mic size={16} />}
                        {voiceSessionActive ? 'End Session' : 'Voice Mode'}
                    </button>
                </header>

                {/* Messages */}
                <div className="relative z-10 flex-1 overflow-y-auto px-6 py-8 space-y-8 custom-scrollbar">
                    {messages.map((m, i) => (
                        <motion.div 
                            key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {m.role === 'assistant' && (
                                <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                    <Activity size={20} />
                                </div>
                            )}
                            <div className={`max-w-[80%] px-6 py-4 rounded-[2rem] text-[15px] leading-relaxed shadow-sm ${
                                m.role === 'user' 
                                    ? 'bg-slate-900 text-white rounded-tr-sm' 
                                    : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm'
                            }`}>
                                <ReactMarkdown>{m.content}</ReactMarkdown>
                            </div>
                        </motion.div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <footer className="relative z-10 p-6 bg-gradient-to-t from-white via-white/80 to-transparent">
                    <div className="max-w-4xl mx-auto relative flex items-center gap-3 bg-white rounded-[2rem] p-2 shadow-2xl ring-1 ring-slate-200">
                        <input 
                            value={input} onChange={e => setInput(e.target.value)}
                            placeholder="Describe clinical symptoms..."
                            className="flex-1 bg-transparent px-6 py-3 outline-none text-sm font-medium"
                        />
                        <button 
                            onClick={() => handleSend()}
                            className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all active:scale-90"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </div>
                </footer>
            </div>
        </PageTransition>
    );
}

// --- High-End Voice Visualizer ---
function VoiceWaveform({ color, phase }) {
    return (
        <div className="flex items-center gap-1 h-32">
            {[...Array(12)].map((_, i) => (
                <motion.div
                    key={i}
                    animate={{ 
                        height: phase === 'listening' ? [20, 60, 20] : [10, 100, 10],
                        opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ 
                        duration: phase === 'listening' ? 1.5 : 0.8, 
                        repeat: Infinity, 
                        delay: i * 0.1 
                    }}
                    className="w-1.5 rounded-full"
                    style={{ backgroundColor: color }}
                />
            ))}
        </div>
    );
}