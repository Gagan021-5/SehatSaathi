import { useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Mic, MicOff } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { sendMessage } from '../../services/api';
import { useVoiceLoop } from '../../hooks/useVoiceLoop';

const BAR_COUNT = 24;

function Waveform({ listening, speaking }) {
    const active = listening || speaking;
    if (!active) return null;

    return (
        <div className="flex items-end justify-center gap-[2.5px] h-12">
            {Array.from({ length: BAR_COUNT }, (_, i) => {
                const center = (BAR_COUNT - 1) / 2;
                const dist = Math.abs(i - center) / center;
                const maxH = speaking ? 36 - dist * 24 : 24 - dist * 16;
                const minH = 4;
                const dur = speaking ? 0.35 + dist * 0.15 : 0.7 + dist * 0.3;

                return (
                    <motion.div
                        key={i}
                        animate={{ height: [minH, maxH, minH] }}
                        transition={{
                            duration: dur,
                            repeat: Infinity,
                            repeatType: 'mirror',
                            ease: 'easeInOut',
                            delay: i * 0.03,
                        }}
                        className="rounded-full flex-shrink-0"
                        style={{
                            width: 3,
                            background: speaking
                                ? `rgba(20,184,166,${0.6 + (1 - dist) * 0.4})`   // teal
                                : `rgba(99,102,241,${0.5 + (1 - dist) * 0.5})`,  // indigo
                        }}
                    />
                );
            })}
        </div>
    );
}

export default function FloatingVoiceAgent() {
    const { currentLanguage } = useLanguage();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const audioRef = useRef(null);

    const {
        isListening, isSpeaking,
        sessionActive, voiceError,
        startSession, stopSession, resetSession, speakText,
    } = useVoiceLoop({
        lang: currentLanguage.speechCode || 'en-IN',
        onSpeechResult: useCallback((transcript) => {
            runAI(transcript);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []),
    });

    const phase = loading ? 'thinking' : isSpeaking ? 'speaking' : isListening ? 'listening' : 'idle';

    async function runAI(transcript) {
        if (!transcript?.trim() || loading) return;
        try {
            setLoading(true);
            const { data } = await sendMessage({
                message: transcript,
                history: messages.map(m => ({ role: m.role, content: m.content })),
                language: currentLanguage.code,
            });
            const replyText = data?.text || '';
            setMessages(prev => [
                ...prev,
                { role: 'user', content: transcript },
                { role: 'assistant', content: replyText },
            ]);
            if (data?.audioBase64) {
                await playAudio(data.audioBase64);
            } else {
                speakText(replyText);
            }
        } catch {
            toast.error('Connection lost. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    async function playAudio(base64) {
        const was = sessionActive;
        if (was) stopSession();
        const url = URL.createObjectURL(new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], { type: 'audio/mpeg' }));
        const audio = new Audio(url);
        audioRef.current = audio;
        try {
            await audio.play();
            await new Promise(res => { audio.onended = res; });
        } finally {
            URL.revokeObjectURL(url);
            if (was) setTimeout(() => startSession(), 250);
        }
    }

    function toggle() {
        if (sessionActive) { stopSession(); audioRef.current?.pause(); }
        else startSession();
    }

    const orbColor = phase === 'speaking' ? '#14b8a6'
        : phase === 'thinking' ? '#f59e0b'
            : phase === 'listening' ? '#4f46e5'
                : 'rgba(255, 255, 255, 0.9)';

    const glowColor = phase === 'speaking' ? 'rgba(20,184,166,0.35)'
        : phase === 'thinking' ? 'rgba(245,158,11,0.35)'
            : phase === 'listening' ? 'rgba(99,102,241,0.35)'
                : 'rgba(0,0,0,0.05)';

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-4 pointer-events-none">

            {/* Waveform Wrapper */}
            <div className="pointer-events-auto flex items-end justify-center h-12 w-full">
                <AnimatePresence>
                    {phase !== 'idle' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                        >
                            {phase === 'thinking' ? (
                                <div className="flex items-end justify-center gap-[2.5px] h-12">
                                    {Array.from({ length: 16 }, (_, i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ opacity: [0.3, 0.7, 0.3], height: [4, 10, 4] }}
                                            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.05 }}
                                            className="rounded-full bg-amber-400 w-[3px]"
                                        />
                                    ))}
                                </div>
                            ) : (
                                <Waveform listening={phase === 'listening'} speaking={phase === 'speaking'} />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Voice Orb */}
            <button
                onClick={toggle}
                className="pointer-events-auto relative focus:outline-none group flex flex-col items-center"
                aria-label="Toggle voice session"
            >
                {/* Glow rings */}
                <AnimatePresence>
                    {sessionActive && (
                        <>
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 0.6, 0], scale: [1, 1.4, 1] }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                className="absolute inset-0 rounded-full"
                                style={{ background: glowColor, filter: 'blur(3px)' }}
                            />
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 0.4, 0], scale: [1, 1.8, 1] }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                                className="absolute inset-0 rounded-full"
                                style={{ background: glowColor, filter: 'blur(6px)' }}
                            />
                        </>
                    )}
                </AnimatePresence>

                {/* Orb body */}
                <motion.div
                    animate={{ scale: phase === 'listening' ? [1, 1.05, 1] : phase === 'speaking' ? [1, 1.03, 1] : 1 }}
                    transition={{ duration: phase === 'listening' ? 1.4 : 0.7, repeat: sessionActive ? Infinity : 0, ease: 'easeInOut' }}
                    className={`relative flex items-center justify-center rounded-full transition-all duration-500 shadow-2xl backdrop-blur-3xl border border-white/60`}
                    style={{
                        width: 72, height: 72,
                        background: orbColor,
                        boxShadow: sessionActive ? `0 10px 30px -5px ${glowColor}` : '0 10px 25px -5px rgba(0,0,0,0.1)'
                    }}
                >
                    {phase === 'speaking' ? (
                        <div className="flex items-center gap-1">
                            {[0, 1, 2].map(i => (
                                <motion.div key={i}
                                    animate={{ height: [4, 14 - Math.abs(i - 1) * 4, 4] }}
                                    transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
                                    className="w-[2.5px] rounded-full bg-white"
                                />
                            ))}
                        </div>
                    ) : phase === 'thinking' ? (
                        <Loader2 size={24} className="text-white animate-spin" />
                    ) : sessionActive ? (
                        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                            <Mic size={24} className="text-white" />
                        </motion.div>
                    ) : (
                        <MicOff size={24} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    )}
                </motion.div>
            </button>

            {/* Error recovery */}
            <AnimatePresence>
                {voiceError && (
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        onClick={resetSession}
                        className="pointer-events-auto absolute -top-10 px-4 py-1.5 bg-white/90 backdrop-blur-md border border-rose-200 text-rose-500 font-bold text-[9px] uppercase tracking-widest rounded-full hover:bg-rose-50 transition-colors shadow-lg"
                    >
                        Reset Mic
                    </motion.button>
                )}
            </AnimatePresence>

        </div>
    );
}
