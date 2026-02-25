import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Loader2, Mic, MicOff, Send, User, Volume2, Sparkles, Activity } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { sendMessage, startChat } from '../services/api';
import Card from '../components/common/Card';
import PageTransition from '../components/common/PageTransition';

const quickPrompts = [
    'Fever for 2 days',
    'Persistent headache',
    'Nausea after meals',
    'Mild chest discomfort',
    'Seasonal cough',
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

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    async function initChat() {
        try {
            const { data } = await startChat({ language: currentLanguage.code });
            const nextId = data.sessionId || data._id;
            setSessionId(nextId);
            return nextId;
        } catch {
            return null;
        }
    }

    async function handleSend(text) {
        const nextText = (text || input).trim();
        if (!nextText || loading) return;

        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: nextText }]);
        setLoading(true);

        try {
            let activeSessionId = sessionId;
            if (!activeSessionId) activeSessionId = await initChat();

            const { data } = await sendMessage({
                sessionId: activeSessionId,
                message: nextText,
                language: currentLanguage.code,
            });

            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: data.response || data.message || 'I understand. Please share more detail.',
                },
            ]);
        } catch {
            toast.error('Unable to fetch chat response right now.');
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Service is currently unavailable. Please retry shortly.' },
            ]);
        } finally {
            setLoading(false);
        }
    }

    function toggleMic() {
        if (listening) {
            recognitionRef.current?.stop();
            setListening(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error('Speech recognition is not supported in this browser.');
            return;
        }

        const recognizer = new SpeechRecognition();
        recognizer.lang = currentLanguage.speechCode || 'en-IN';
        recognizer.continuous = false;
        recognizer.onresult = (event) => {
            setInput(event.results[0][0].transcript || '');
            setListening(false);
        };
        recognizer.onerror = () => setListening(false);
        recognizer.onend = () => setListening(false);

        recognitionRef.current = recognizer;
        recognizer.start();
        setListening(true);
    }

    function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ''));
        utterance.lang = currentLanguage.speechCode || 'en-IN';
        window.speechSynthesis.speak(utterance);
    }

    // --- Animation Variants ---
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.8, 0.25, 1], staggerChildren: 0.1 } },
    };

    const messageVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', bounce: 0.4, duration: 0.6 } },
    };

    const typingDotVariants = {
        hidden: { y: 0 },
        show: { y: -5, transition: { duration: 0.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" } }
    };

    return (
        <PageTransition className="mx-auto max-w-5xl px-4 py-6">
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="relative">
                {/* Animated Ambient Background Orbs */}
                <motion.div 
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} 
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-blue-500/10 blur-[80px]" 
                />
                <motion.div 
                    animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }} 
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-teal-400/10 blur-[80px]" 
                />

                <Card className="relative h-[calc(100vh-8rem)] overflow-hidden rounded-[2rem] border border-zinc-200/50 bg-white/60 p-0 shadow-2xl shadow-zinc-200/50 backdrop-blur-2xl flex flex-col">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between gap-4 border-b border-zinc-200/50 bg-white/40 px-6 py-5 backdrop-blur-md z-10">
                        <div className="flex items-center gap-4">
                            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/30">
                                <Bot size={22} />
                                <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500"></span>
                                </span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-zinc-900">AI Medical Assistant</h1>
                                <p className="text-sm font-medium text-zinc-500">
                                    {t('chat.subtitle') || 'Powered by clinical intelligence'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 scroll-smooth z-0">
                        {messages.length === 0 && (
                            <motion.div
                                variants={messageVariants}
                                className="flex h-full flex-col items-center justify-center text-center pb-12"
                            >
                                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-teal-50 shadow-inner">
                                    <Sparkles className="h-10 w-10 text-blue-500" />
                                </div>
                                <h2 className="mb-2 text-2xl font-bold text-zinc-800">How are you feeling today?</h2>
                                <p className="mb-8 max-w-md text-zinc-500">Describe your symptoms in detail, or choose from one of the common prompts below to get started.</p>
                                
                                <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
                                    {quickPrompts.map((prompt) => (
                                        <button
                                            key={prompt}
                                            type="button"
                                            onClick={() => handleSend(prompt)}
                                            className="group flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/80 px-5 py-2.5 text-sm font-medium text-zinc-600 transition-all hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:shadow-xl hover:shadow-blue-500/10 active:translate-y-0"
                                        >
                                            <Activity size={16} className="text-zinc-400 group-hover:text-blue-500 transition-colors" />
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        <AnimatePresence initial={false}>
                            {messages.map((message, index) => (
                                <motion.div
                                    key={`${message.role}-${index}`}
                                    variants={messageVariants}
                                    initial="hidden"
                                    animate="show"
                                    className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-md shadow-blue-500/20">
                                            <Bot size={18} />
                                        </div>
                                    )}
                                    
                                    <div
                                        className={`group relative max-w-[80%] rounded-[1.5rem] px-6 py-4 text-[15px] leading-relaxed shadow-sm transition-all hover:shadow-md ${
                                            message.role === 'user'
                                                ? 'rounded-tr-sm bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-blue-500/20'
                                                : 'rounded-tl-sm border border-zinc-200/50 bg-white/90 text-zinc-800 shadow-zinc-200/50 backdrop-blur-md'
                                        }`}
                                    >
                                        {message.role === 'assistant' ? (
                                            <div>
                                                <div className="prose prose-zinc prose-sm max-w-none">
                                                    <ReactMarkdown>{message.content}</ReactMarkdown>
                                                </div>
                                                <div className="mt-3 flex items-center gap-2 border-t border-zinc-200/50 pt-3 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <button
                                                        type="button"
                                                        onClick={() => speak(message.content)}
                                                        className="flex items-center gap-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:text-blue-700 active:scale-95"
                                                    >
                                                        <Volume2 size={14} /> Read aloud
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p>{message.content}</p>
                                        )}
                                    </div>

                                    {message.role === 'user' && (
                                        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-md shadow-zinc-900/20">
                                            <User size={18} />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {loading && (
                            <motion.div
                                variants={messageVariants}
                                initial="hidden"
                                animate="show"
                                className="flex gap-4 justify-start"
                            >
                                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-md shadow-blue-500/20">
                                    <Bot size={18} />
                                </div>
                                <div className="flex items-center gap-1.5 rounded-[1.5rem] rounded-tl-sm border border-zinc-200/50 bg-white/90 px-6 py-5 shadow-sm backdrop-blur-md">
                                    <motion.span variants={typingDotVariants} className="h-2 w-2 rounded-full bg-zinc-400" />
                                    <motion.span variants={typingDotVariants} transition={{ delay: 0.1 }} className="h-2 w-2 rounded-full bg-zinc-400" />
                                    <motion.span variants={typingDotVariants} transition={{ delay: 0.2 }} className="h-2 w-2 rounded-full bg-zinc-400" />
                                </div>
                            </motion.div>
                        )}
                        <div ref={chatEndRef} className="h-4" />
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-zinc-200/50 bg-white/40 p-4 md:px-6 md:py-5 backdrop-blur-md z-10">
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                handleSend();
                            }}
                            className="relative flex items-end gap-3 rounded-[1.5rem] bg-white p-2 shadow-lg shadow-zinc-200/50 ring-1 ring-zinc-200/60 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all"
                        >
                            <button
                                type="button"
                                onClick={toggleMic}
                                className={`ml-1 mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                                    listening
                                        ? 'bg-rose-100 text-rose-600 shadow-inner shadow-rose-200 animate-pulse'
                                        : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700'
                                }`}
                            >
                                {listening ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>
                            
                            <textarea
                                rows={Math.min(3, input.split('\n').length || 1)}
                                value={input}
                                onChange={(event) => setInput(event.target.value)}
                                placeholder={t('chat.placeholder') || 'Describe your symptoms...'}
                                className="my-auto max-h-32 w-full resize-none bg-transparent py-3 px-2 text-[15px] text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' && !event.shiftKey) {
                                        event.preventDefault();
                                        handleSend();
                                    }
                                }}
                            />
                            
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="mb-1 mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white shadow-md transition-all duration-300 hover:scale-105 hover:bg-zinc-800 hover:shadow-zinc-900/30 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-zinc-900"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                            </button>
                        </form>
                        <p className="mt-3 text-center text-xs text-zinc-400">
                            AI-generated advice is for informational purposes only and does not replace professional medical consultation.
                        </p>
                    </div>
                </Card>
            </motion.div>
        </PageTransition>
    );
}