import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, RefreshCcw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { sendMessage } from '../services/api';
import { useVoiceLoop } from '../hooks/useVoiceLoop';
import toast from 'react-hot-toast';
import PageTransition from '../components/common/PageTransition';

function VoiceWaveform({ phase }) {
    const isListening = phase === 'listening';
    const isSpeaking = phase === 'speaking';
    const isThinking = phase === 'thinking';

    return (
        <div className="flex items-center justify-center gap-1.5 h-12">
            {[0, 1, 2, 3].map((i) => {
                let animate = { height: 6 };
                let transition = { duration: 0.3 };

                if (isListening) {
                    const dancePatterns = [
                        [14, 30, 18, 40, 14],
                        [22, 14, 36, 20, 22],
                        [30, 42, 26, 34, 30],
                        [20, 28, 46, 14, 20]
                    ];
                    animate = { height: dancePatterns[i] };
                    transition = { duration: 0.5, repeat: Infinity, ease: 'linear' };
                } else if (isSpeaking) {
                    animate = { height: [12, 40, 12] };
                    transition = { duration: 0.6, repeat: Infinity, ease: 'easeInOut' };
                } else if (isThinking) {
                    animate = { height: [6, 12, 6] };
                    transition = { duration: 1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 };
                }

                return (
                    <motion.div
                        key={i}
                        animate={animate}
                        transition={transition}
                        className="w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
                        initial={{ height: 6 }}
                    />
                );
            })}
        </div>
    );
}

export default function ChatPage() {
    const { currentLanguage, t } = useLanguage();
    // We still keep messages in state for history/API context, but we don't render them.
    const [messages, setMessages] = useState([
        { role: 'assistant', content: t('Hello! I am SehatSaathi. How can I assist you with your health today?') || 'Hello! I am SehatSaathi. How can I assist you with your health today?' }
    ]);
    const [loading, setLoading] = useState(false);
    const audioRef = useRef(null);

    // Cleanup audio strictly
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const {
        isListening, isSpeaking,
        sessionActive, voiceError,
        startSession, stopSession, resetSession, speakText,
    } = useVoiceLoop({
        lang: currentLanguage.speechCode || 'en-IN',
        onSpeechResult: useCallback((transcript) => {
            handleSend(transcript);
        }, [])
    });

    const phase = loading ? 'thinking' : isSpeaking ? 'speaking' : isListening ? 'listening' : 'idle';

    async function handleSend(transcript) {
        const text = typeof transcript === 'string' ? transcript.trim() : '';
        if (!text || loading) return;

        setMessages(prev => [...prev, { role: 'user', content: text }]);
        setLoading(true);

        try {
            const validHistory = messages.slice(1).map(m => ({ role: m.role, content: m.content }));

            const { data } = await sendMessage({
                message: text,
                history: validHistory,
                language: currentLanguage.code,
            });

            const replyText = data?.text || '';
            setMessages(prev => [...prev, { role: 'assistant', content: replyText }]);

            if (data?.audioBase64) {
                await playAudio(data.audioBase64);
            } else if (sessionActive) {
                speakText(replyText);
            }
        } catch (error) {
            const status = error?.response?.status;
            if (status === 429 || status === 403) {
                toast.error(t('Health Doctor is busy. Please try again later.') || 'Health Doctor is busy. Please try again later.');
            } else {
                toast.error(t('Connection lost. Please try again.') || 'Connection lost. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }

    async function playAudio(base64) {
        const wasActive = sessionActive;
        if (wasActive) stopSession();

        if (audioRef.current) {
            audioRef.current.pause();
        }

        const url = URL.createObjectURL(new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], { type: 'audio/mpeg' }));
        const audio = new Audio(url);
        audioRef.current = audio;

        try {
            await audio.play();
            await new Promise(res => { audio.onended = res; });
        } catch (err) {
            console.error('Audio playback failed', err);
        } finally {
            URL.revokeObjectURL(url);
            if (wasActive) setTimeout(() => startSession(), 250);
        }
    }

    function toggleOrb() {
        if (sessionActive) {
            stopSession();
            if (audioRef.current) audioRef.current.pause();
        } else {
            startSession();
        }
    }

    const orbGlow = sessionActive ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.15)';
    const isThinking = phase === 'thinking';
    const isListeningNow = phase === 'listening';

    return (
        <PageTransition>
            <div className="relative flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center bg-[#fcfdfe] overflow-hidden">
                {/* Ambient blobs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <motion.div
                        animate={{ scale: [1, 1.25, 1], opacity: [0.55, 0.7, 0.55] }}
                        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-blue-100 via-indigo-100 to-violet-100 blur-[90px]"
                    />
                    <motion.div
                        animate={{ scale: [1.15, 1, 1.15], opacity: [0.35, 0.55, 0.35] }}
                        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
                        className="absolute -bottom-40 -right-40 w-[460px] h-[460px] rounded-full bg-gradient-to-br from-teal-50 via-cyan-100 to-sky-100 blur-[80px]"
                    />
                </div>

                {/* Centered Premium Voice UI */}
                <div className="relative z-10 flex flex-col items-center gap-12 p-12">

                    {/* Error Recovery */}
                    <AnimatePresence>
                        {voiceError && (
                            <motion.button
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={resetSession}
                                className="flex items-center justify-center bg-rose-50 text-rose-500 rounded-full px-4 py-2 text-xs uppercase font-black tracking-widest border border-rose-200 shadow-md absolute -top-16"
                            >
                                <RefreshCcw size={14} className="mr-2" /> Reset Connection
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* Instruction / Status Label */}
                    <motion.div
                        animate={phase === 'idle' ? { opacity: 0.7 } : { opacity: 1 }}
                        className="text-center"
                    >
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
                            {phase === 'listening' ? t('Listening...')
                                : phase === 'thinking' ? t('Thinking...')
                                    : phase === 'speaking' ? t('Speaking...')
                                        : t('SehatSaathi Voice')}
                        </h1>
                        <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase">
                            {phase === 'idle' ? t('Tap to speak') : t('Voice interaction active')}
                        </p>
                    </motion.div>

                    {/* Premium Floating Voice Orb [Centered & Scaled Up] */}
                    <button
                        onClick={toggleOrb}
                        className="group relative flex items-center justify-center focus:outline-none outline-none"
                        aria-label="Toggle Voice Interaction"
                    >
                        {/* Listening Pulse Rings (Cyan) */}
                        <AnimatePresence>
                            {isListeningNow && (
                                <>
                                    <motion.span
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: [0, 0.4, 0], scale: [1, 1.4, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                        className="absolute inset-0 rounded-full border-2 border-cyan-400 pointer-events-none"
                                    />
                                    <motion.span
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: [0, 0.2, 0], scale: [1, 1.8, 1] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                                        className="absolute inset-0 rounded-full border border-cyan-300 pointer-events-none"
                                    />
                                </>
                            )}
                        </AnimatePresence>

                        {/* Spinning Loading Border (Thinking) */}
                        {isThinking && (
                            <div className="absolute inset-[-4px] rounded-full border-[4px] border-transparent border-t-cyan-400 border-r-indigo-400 animate-spin pointer-events-none drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
                        )}

                        {/* Glassmorphism Container */}
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`relative flex items-center justify-center rounded-full backdrop-blur-2xl bg-white/30 border-2 border-white/50 transition-all duration-300 ${isThinking ? 'opacity-90' : ''}`}
                            style={{
                                width: 140, height: 140,
                                boxShadow: `0 20px 50px -10px ${orbGlow}`
                            }}
                        >
                            {sessionActive && phase !== 'idle' ? (
                                <VoiceWaveform phase={phase} />
                            ) : (
                                <Mic size={48} className={sessionActive ? "text-cyan-500 drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]" : "text-slate-400"} />
                            )}
                        </motion.div>
                    </button>

                </div>
            </div>
        </PageTransition>
    );
}