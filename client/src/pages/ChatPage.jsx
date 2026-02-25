import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Loader2, Mic, MicOff, Send, User, Volume2 } from 'lucide-react';
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

    const containerVariants = {
        hidden: { opacity: 0, y: 15 },
        show: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4, ease: 'easeOut', staggerChildren: 0.06 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
    };

    return (
        <PageTransition className="mx-auto max-w-6xl">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="relative grid grid-cols-1 gap-4"
            >
                <div className="pointer-events-none absolute -top-8 -left-10 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-10 -right-10 h-44 w-44 rounded-full bg-teal-400/20 blur-3xl" />

                <motion.div variants={itemVariants}>
                    <Card className="relative h-[calc(100vh-10.5rem)] overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/80 p-0 shadow-xl shadow-zinc-200/40 backdrop-blur-xl">
                        <div className="flex items-center justify-between gap-3 border-b border-zinc-200/60 bg-white/70 px-5 py-4 backdrop-blur-xl md:px-6">
                            <div>
                                <h1 className="text-xl tracking-tight text-zinc-900 font-semibold">AI Doctor Chat</h1>
                                <p className="text-sm text-zinc-500 leading-relaxed">
                                    {t('chat.subtitle') || 'Describe symptoms and receive guided responses.'}
                                </p>
                            </div>
                            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/20 grid place-items-center">
                                <Bot size={18} />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6 md:py-6 space-y-4">
                            {messages.length === 0 && (
                                <motion.div
                                    variants={itemVariants}
                                    className="rounded-2xl border border-zinc-200/60 bg-white/80 p-5 shadow-xl shadow-zinc-200/30 backdrop-blur-xl"
                                >
                                    <p className="mb-3 text-sm text-zinc-500">Quick start prompts</p>
                                    <div className="flex flex-wrap gap-2.5">
                                        {quickPrompts.map((prompt) => (
                                            <button
                                                key={prompt}
                                                type="button"
                                                onClick={() => handleSend(prompt)}
                                                className="rounded-lg border border-zinc-200/70 bg-white/90 px-3.5 py-2 text-xs font-medium text-zinc-700 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-200/40 active:translate-y-0 active:scale-95"
                                            >
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
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.32, ease: 'easeOut' }}
                                        className={`flex gap-2.5 ${
                                            message.role === 'user' ? 'justify-end' : 'justify-start'
                                        }`}
                                    >
                                        {message.role === 'assistant' && (
                                            <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/20 grid place-items-center">
                                                <Bot size={14} />
                                            </div>
                                        )}
                                        <div
                                            className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm border ${
                                                message.role === 'user'
                                                    ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white border-blue-500/30 shadow-lg shadow-blue-500/20'
                                                    : 'border-zinc-200/60 bg-white/85 text-zinc-700 shadow-xl shadow-zinc-200/30 backdrop-blur-xl'
                                            }`}
                                        >
                                            {message.role === 'assistant' ? (
                                                <div>
                                                    <div className="leading-relaxed">
                                                        <ReactMarkdown>{message.content}</ReactMarkdown>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => speak(message.content)}
                                                        className="mt-2 inline-flex items-center gap-1 rounded-lg border border-zinc-200/60 bg-white/90 px-2.5 py-1.5 text-xs text-blue-600 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10 active:translate-y-0 active:scale-95"
                                                    >
                                                        <Volume2 size={12} /> Listen
                                                    </button>
                                                </div>
                                            ) : (
                                                <p className="leading-relaxed">{message.content}</p>
                                            )}
                                        </div>
                                        {message.role === 'user' && (
                                            <div className="h-8 w-8 shrink-0 rounded-lg bg-zinc-900 text-white shadow-lg shadow-zinc-400/20 grid place-items-center">
                                                <User size={14} />
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.32, ease: 'easeOut' }}
                                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-200/60 bg-white/85 px-3 py-2 text-sm text-zinc-500 shadow-xl shadow-zinc-200/30 backdrop-blur-xl"
                                >
                                    <Loader2 size={15} className="animate-spin" /> Generating response...
                                </motion.div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                handleSend();
                            }}
                            className="border-t border-zinc-200/60 bg-white/70 px-5 py-4 backdrop-blur-xl md:px-6"
                        >
                            <div className="flex items-end gap-2.5">
                                <textarea
                                    rows={2}
                                    value={input}
                                    onChange={(event) => setInput(event.target.value)}
                                    placeholder={t('chat.placeholder') || 'Type your message'}
                                    className="flex-1 resize-none rounded-xl border border-zinc-200/70 bg-white/90 px-4 py-3 text-sm text-zinc-800 transition-all duration-300 ease-out focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' && !event.shiftKey) {
                                            event.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={toggleMic}
                                    className={`h-11 w-11 rounded-lg grid place-items-center transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-95 ${
                                        listening
                                            ? 'border border-rose-200 bg-rose-50 text-rose-600 shadow-lg shadow-rose-500/10'
                                            : 'border border-zinc-200/70 bg-white/90 text-zinc-500 shadow-lg shadow-zinc-200/30'
                                    }`}
                                >
                                    {listening ? <MicOff size={17} /> : <Mic size={17} />}
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !input.trim()}
                                    className="h-11 w-11 rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/20 grid place-items-center transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 active:translate-y-0 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                </button>
                            </div>
                        </form>
                    </Card>
                </motion.div>
            </motion.div>
        </PageTransition>
    );
}



