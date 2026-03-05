import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle,
    HeartPulse,
    Info,
    Loader2,
    Mic,
    MicOff,
    PhoneCall,
    Siren,
    Volume2,
    ChevronRight,
    Activity,
    Smartphone
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getEmergencyGuidance, sendEmergencySMS } from '../services/api';
import Card from '../components/common/Card';
import PageTransition from '../components/common/PageTransition';
import { useVoiceLoop } from '../hooks/useVoiceLoop';
import { useRef } from 'react';

const emergencies = [
    'Heart Attack',
    'Choking',
    'Severe Bleeding',
    'Burns',
    'Seizure',
    'Allergic Reaction',
    'Fracture',
    'Drowning',
];

export default function EmergencyPage() {
    const { currentLanguage, t } = useLanguage();

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sosSending, setSosSending] = useState(false);
    const [selectedType, setSelectedType] = useState('');
    const [customDesc, setCustomDesc] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [emergencyAudio, setEmergencyAudio] = useState(null);
    const [testPhoneNumber, setTestPhoneNumber] = useState('');
    const [ussdLoading, setUssdLoading] = useState(false);

    // Extracted robust audio play ref
    const audioRef = useRef(null);

    const {
        isListening,
        isSpeaking,
        sessionActive,
        startSession,
        stopSession,
        speakText
    } = useVoiceLoop({
        lang: currentLanguage.speechCode || 'en-IN',
        onSpeechResult: (transcript) => {
            setCustomDesc(transcript);
            handleEmergency(transcript);
        }
    });

    useEffect(() => {
        return () => {
            stopSession();
        };
    }, [stopSession]);

    async function handleSOSClick() {
        if (sosSending) return;
        setSosSending(true);
        const toastId = toast.loading('📍 Getting your location...');

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 8000,
                    enableHighAccuracy: true,
                });
            });

            const { latitude: lat, longitude: lng } = position.coords;
            toast.loading('🚨 Sending emergency alert...', { id: toastId });
            const { data } = await sendEmergencySMS({ lat, lng, locationDenied: false });

            if (data?.sent === false && data?.reason === 'no_contact') {
                toast.error('⚠️ No emergency contact saved. Please add one in your Profile.', { id: toastId, duration: 5000 });
            } else {
                toast.success(
                    `✅ Emergency alert sent to ${data?.recipient || 'your contact'} with your location!`,
                    { id: toastId, duration: 5000 }
                );
            }
        } catch (geoError) {
            // Location denied or timed out — send without coords
            try {
                toast.loading('🚨 Sending emergency alert (no location)...', { id: toastId });
                const { data } = await sendEmergencySMS({ locationDenied: true });

                if (data?.sent === false && data?.reason === 'no_contact') {
                    toast.error('⚠️ No emergency contact saved. Please add one in your Profile.', { id: toastId, duration: 5000 });
                } else {
                    toast.success('✅ Location denied, but emergency alert sent to your contact!', { id: toastId, duration: 5000 });
                }
            } catch {
                toast.error('❌ Failed to send emergency alert. Please call 112 directly.', { id: toastId, duration: 5000 });
            }
        } finally {
            setSosSending(false);
        }
    }

    async function handleEmergency(situation) {
        const query = (typeof situation === 'string' ? situation : customDesc).trim();
        if (!query || loading) return;

        setSelectedType(query);
        setLoading(true);
        setResult(null);
        setEmergencyAudio(null);

        try {
            const { data } = await getEmergencyGuidance({ situation: query, language: currentLanguage.code });
            setResult(data);
            if (data?.audioBase64) {
                setEmergencyAudio(data.audioBase64);
            }

            // Text-to-Speech the guidance steps if loop is active
            if (sessionActive) {
                if (data?.audioBase64) {
                    await playAudio(data.audioBase64);
                } else if (data?.guidance?.steps?.length > 0) {
                    // Fallback if ElevenLabs is unavailable
                    speakText(data.guidance.steps.join('. '));
                }
            }
        } catch {
            toast.error(t('emergency.disclaimer'));
        } finally {
            setLoading(false);
        }
    }

    async function playAudio(base64) {
        const wasActive = sessionActive;
        if (wasActive) stopSession();

        // Ensure any previous audio is paused
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

    function toggleMic() {
        if (sessionActive) stopSession();
        else startSession();
    }

    async function handleUSSDTrigger() {
        if (!testPhoneNumber.trim()) {
            toast.error('📵 Please enter a phone number to simulate.');
            return;
        }
        setUssdLoading(true);
        const toastId = toast.loading('📡 Dialing *123# via USSD...');
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/emergency/ussd-webhook`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phoneNumber: testPhoneNumber, text: '*123#' }),
                }
            );
            const data = await res.json();
            if (res.ok) {
                toast.success(
                    `✅ USSD Alert sent! SMS dispatched to ${testPhoneNumber}.`,
                    { id: toastId, duration: 6000 }
                );
            } else {
                toast.error(`❌ ${data?.error || 'USSD trigger failed.'}`, { id: toastId, duration: 5000 });
            }
        } catch (err) {
            toast.error('❌ Network error. Check your connection.', { id: toastId, duration: 5000 });
        } finally {
            setUssdLoading(false);
        }
    }

    const steps = result?.guidance?.steps || result?.steps || result?.result?.steps || [];
    const doNot = result?.guidance?.do_not || result?.do_not || result?.result?.do_not || [];
    const whileWaiting = result?.guidance?.while_waiting || result?.while_waiting || result?.result?.while_waiting || [];

    // --- Premium Animations ---
    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 300 } }
    };

    const orbVariants = {
        animate: {
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }
    };

    return (
        <PageTransition className="mx-auto max-w-5xl px-4 py-6 md:py-8 min-h-screen relative flex flex-col gap-6">

            {/* Urgent Ambient Background Glows */}
            <motion.div
                variants={orbVariants} animate="animate"
                className="pointer-events-none absolute top-0 left-10 h-64 w-64 rounded-full bg-rose-500/15 blur-[100px]"
            />
            <motion.div
                variants={orbVariants} animate="animate" style={{ animationDelay: "-2s" }}
                className="pointer-events-none absolute top-40 right-10 h-72 w-72 rounded-full bg-red-500/10 blur-[100px]"
            />

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="relative z-10 flex flex-col gap-6">

                {/* Header SOS Card */}
                <motion.div variants={itemVariants}>
                    <Card className="relative overflow-hidden rounded-[2rem] border border-rose-200/50 bg-white/60 p-1 shadow-2xl shadow-rose-900/5 backdrop-blur-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-50/80 to-red-50/80 -z-10" />

                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-5 md:p-6">
                            <div className="flex items-center gap-5 w-full md:w-auto">
                                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-600 to-red-500 text-white shadow-lg shadow-rose-500/30 ring-1 ring-white/20">
                                    <Siren size={28} className="drop-shadow-md" />
                                    {/* Pulsing indicator */}
                                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-red-500"></span>
                                    </span>
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-rose-950">
                                        {t('emergency.title')}
                                    </h1>
                                    <p className="mt-1 text-sm font-medium text-rose-700/80">
                                        {t('emergency.subtitle')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                                {/* SOS SMS Button */}
                                <button
                                    type="button"
                                    onClick={handleSOSClick}
                                    disabled={sosSending}
                                    className="group relative flex w-full md:w-auto items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-b from-amber-500 to-orange-600 px-6 py-4 text-base font-bold text-white shadow-xl shadow-orange-500/25 ring-1 ring-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-orange-500/40 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {sosSending
                                        ? <Loader2 size={20} className="animate-spin" />
                                        : <Siren size={20} className="animate-pulse" />
                                    }
                                    {sosSending ? 'Sending...' : '🚨 SOS to Family'}
                                    <div className="absolute inset-0 rounded-2xl bg-white opacity-0 transition-opacity group-hover:opacity-10" />
                                </button>

                                {/* Call 112 Button */}
                                <a
                                    href="tel:112"
                                    className="group relative flex w-full md:w-auto items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-b from-rose-500 to-red-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-red-500/25 ring-1 ring-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-red-500/40 active:scale-95"
                                >
                                    <PhoneCall size={20} className="animate-pulse" />
                                    {t('emergency.callNow')}
                                    <div className="absolute inset-0 rounded-2xl bg-white opacity-0 transition-opacity group-hover:opacity-10" />
                                </a>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {!result && !loading && (
                    <motion.div variants={itemVariants} className="flex flex-col gap-6">
                        {/* Quick Action Grid */}
                        <Card className="rounded-[2rem] border border-white/40 bg-white/60 p-6 md:p-8 shadow-xl shadow-zinc-200/40 backdrop-blur-xl">
                            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-zinc-800">
                                <HeartPulse size={20} className="text-rose-500" /> {t('Quick Select') || 'Quick Select'}
                            </h2>
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                {emergencies.map((item) => (
                                    <button
                                        type="button"
                                        key={item}
                                        onClick={() => handleEmergency(item)}
                                        className="group flex items-center justify-between rounded-2xl border border-zinc-200/60 bg-white/80 px-4 py-3.5 text-[15px] font-semibold text-zinc-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-rose-300 hover:bg-gradient-to-br hover:from-rose-50 hover:to-red-50 hover:text-rose-800 hover:shadow-md hover:shadow-rose-500/10 active:translate-y-0"
                                    >
                                        <span>{t(item) || item}</span>
                                        <ChevronRight size={16} className="text-zinc-300 transition-colors group-hover:text-rose-500" />
                                    </button>
                                ))}
                            </div>
                        </Card>

                        {/* Custom Search/Voice Input */}
                        <div className="relative mx-auto w-full max-w-3xl">
                            <div className={`relative flex items-center gap-2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-xl transition-all duration-500 ${isFocused ? 'shadow-rose-500/20 ring-2 ring-rose-500/40' : 'shadow-zinc-200/50 ring-1 ring-zinc-200/80'}`}>
                                <button
                                    type="button"
                                    onClick={toggleMic}
                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${isListening
                                        ? 'bg-rose-100 text-rose-600 shadow-inner shadow-rose-200 ring-2 ring-rose-500/30 animate-pulse'
                                        : sessionActive
                                            ? 'bg-amber-100 text-amber-600 shadow-inner ring-2 ring-amber-500/30'
                                            : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
                                        }`}
                                >
                                    {sessionActive ? <MicOff size={22} /> : <Mic size={22} />}
                                </button>

                                <input
                                    type="text"
                                    value={customDesc}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    onChange={(event) => setCustomDesc(event.target.value)}
                                    placeholder={t("Or describe the emergency (e.g., 'Child swallowed a coin')") || "Or describe the emergency (e.g., 'Child swallowed a coin')"}
                                    className="h-12 w-full bg-transparent px-2 text-[15px] font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && handleEmergency(customDesc)}
                                />

                                <button
                                    type="button"
                                    onClick={() => handleEmergency(customDesc)}
                                    disabled={!customDesc.trim()}
                                    className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 font-semibold text-white shadow-md transition-all duration-300 hover:scale-105 hover:bg-zinc-800 hover:shadow-zinc-900/30 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-zinc-900 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    {t('Get Guidance') || 'Get Guidance'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {loading && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-20 text-center"
                    >
                        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-2xl shadow-rose-500/20 ring-1 ring-zinc-200">
                            <Loader2 size={32} className="animate-spin text-rose-500" />
                            <div className="absolute inset-0 animate-ping rounded-3xl border-2 border-rose-500/20" />
                        </div>
                        <h3 className="mt-6 text-xl font-bold text-zinc-800">{t('Analyzing Situation') || 'Analyzing Situation'}</h3>
                        <p className="mt-2 text-zinc-500">{t('Retrieving certified first-aid protocols...') || 'Retrieving certified first-aid protocols...'}</p>
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    {result && !loading && (
                        <motion.div
                            key="results"
                            variants={containerVariants} initial="hidden" animate="show"
                            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                        >
                            {/* Main Steps Column */}
                            <motion.div variants={itemVariants} className="lg:col-span-8">
                                <Card className="h-full rounded-[2.5rem] border border-white/60 bg-white/80 p-6 md:p-8 shadow-2xl shadow-zinc-200/50 backdrop-blur-xl flex flex-col">
                                    <div className="flex items-center justify-between border-b border-zinc-200/60 pb-5 mb-6">
                                        <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2.5">
                                            <Activity className="text-rose-500" size={24} />
                                            {t(selectedType) || selectedType || t('Emergency')} {t('Protocols') || 'Protocols'}
                                        </h3>
                                        {!!steps.length && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    console.log("Audio State:", !!emergencyAudio, !!result?.audioBase64);
                                                    const targetAudio = emergencyAudio || result?.audioBase64;

                                                    if (targetAudio) {
                                                        playAudio(targetAudio);
                                                    } else {
                                                        const utterance = new SpeechSynthesisUtterance(steps.join('. '));
                                                        utterance.lang = currentLanguage.speechCode || 'en-IN';
                                                        window.speechSynthesis.speak(utterance);
                                                    }
                                                }}
                                                className="group flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600 transition-all hover:bg-blue-100 hover:shadow-md active:scale-95"
                                            >
                                                <Volume2 size={16} className={`transition-transform group-hover:scale-110 ${isSpeaking ? 'text-rose-500 animate-pulse' : ''}`} /> {t('Read Aloud') || 'Read Aloud'}
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        {steps.map((step, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="flex gap-4 rounded-2xl bg-zinc-50/80 p-4 border border-zinc-100"
                                            >
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-600">
                                                    {index + 1}
                                                </div>
                                                <p className="mt-1 text-[15.5px] leading-relaxed text-zinc-800 font-medium">
                                                    {step}
                                                </p>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setResult(null)}
                                        className="mt-8 self-start text-sm font-semibold text-zinc-400 hover:text-zinc-600"
                                    >
                                        ← {t('Back to Emergency Selection') || 'Back to Emergency Selection'}
                                    </button>
                                </Card>
                            </motion.div>

                            {/* Sidebar Column (Do Nots & While Waiting) */}
                            <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col gap-6">
                                {doNot.length > 0 && (
                                    <Card className="rounded-[2rem] border border-rose-200/60 bg-gradient-to-b from-rose-50/80 to-red-50/50 p-6 shadow-xl shadow-rose-900/5 backdrop-blur-md">
                                        <div className="mb-4 flex items-center gap-2">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                                                <AlertTriangle size={20} />
                                            </div>
                                            <h4 className="text-lg font-bold text-red-950">{t('CRITICAL: Do Not') || 'CRITICAL: Do Not'}</h4>
                                        </div>
                                        <ul className="space-y-3">
                                            {doNot.map((item, index) => (
                                                <li key={index} className="flex gap-3 text-[14.5px] font-medium text-red-900/80">
                                                    <span className="mt-1 flex h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </Card>
                                )}

                                {whileWaiting.length > 0 && (
                                    <Card className="rounded-[2rem] border border-blue-200/60 bg-gradient-to-b from-blue-50/80 to-slate-50/50 p-6 shadow-xl shadow-blue-900/5 backdrop-blur-md">
                                        <div className="mb-4 flex items-center gap-2">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                                                <Info size={20} />
                                            </div>
                                            <h4 className="text-lg font-bold text-slate-900">{t('While Waiting') || 'While Waiting'}</h4>
                                        </div>
                                        <ul className="space-y-3">
                                            {whileWaiting.map((item, index) => (
                                                <li key={index} className="flex gap-3 text-[14.5px] font-medium text-slate-700">
                                                    <span className="mt-1 flex h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </Card>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </motion.div>

            {/* ── USSD Simulator Section ─────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: 'spring', damping: 20 }}
                className="relative z-10 mt-2"
            >
                <Card className="rounded-[2rem] border border-emerald-200/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 shadow-2xl shadow-slate-900/40 overflow-hidden">
                    {/* Decorative scanline overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.015)_2px,rgba(255,255,255,0.015)_4px)] rounded-[2rem]" />

                    <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">

                        {/* Left: Feature-phone mockup */}
                        <div className="shrink-0 flex flex-col items-center gap-2">
                            <div className="relative flex flex-col items-center justify-start w-36 rounded-[2rem] border-4 border-slate-600 bg-slate-950 shadow-inner shadow-slate-700 p-3 gap-2">
                                {/* Screen */}
                                <div className="w-full rounded-xl bg-green-950 border border-green-800 p-2 min-h-[72px] flex flex-col justify-between font-mono">
                                    <p className="text-[9px] text-green-400 leading-tight">SehatSaathi</p>
                                    <p className="text-[11px] font-bold text-green-300 tracking-widest">*123#</p>
                                    <p className="text-[8px] text-green-500/70 mt-1">USSD • OFFLINE</p>
                                </div>
                                {/* Keypad dots */}
                                <div className="grid grid-cols-3 gap-1 w-full px-1">
                                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(k => (
                                        <div key={k} className="flex h-5 w-full items-center justify-center rounded bg-slate-700 text-[8px] font-bold text-slate-300">{k}</div>
                                    ))}
                                </div>
                                {/* Call button */}
                                <div className="flex gap-1 w-full">
                                    <div className="flex-1 h-4 rounded bg-green-700 text-center text-[7px] text-white font-bold leading-4">CALL</div>
                                    <div className="flex-1 h-4 rounded bg-red-700 text-center text-[7px] text-white font-bold leading-4">END</div>
                                </div>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">Nokia-style</span>
                        </div>

                        {/* Right: Controls */}
                        <div className="flex-1 flex flex-col gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Smartphone size={16} className="text-emerald-400" />
                                    <h3 className="text-base font-bold text-white">Offline USSD Simulator <span className="text-xs font-normal text-emerald-400 ml-1">(Demo)</span></h3>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Simulates a feature-phone user dialing <span className="font-mono text-emerald-300">*123#</span> with zero internet. The backend triggers an SMS alert — no smartphone required.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-mono">+91</span>
                                    <input
                                        type="tel"
                                        maxLength={10}
                                        value={testPhoneNumber}
                                        onChange={e => setTestPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                        placeholder="10-digit mobile number"
                                        className="w-full rounded-xl border border-slate-600 bg-slate-800 py-3 pl-10 pr-4 text-sm font-mono text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleUSSDTrigger}
                                    disabled={ussdLoading}
                                    className="group relative flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-emerald-500 to-green-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 ring-1 ring-white/10 transition-all duration-300 hover:scale-[1.03] hover:shadow-emerald-500/40 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {ussdLoading
                                        ? <Loader2 size={16} className="animate-spin" />
                                        : <PhoneCall size={16} className="group-hover:animate-pulse" />
                                    }
                                    {ussdLoading ? 'Dialing...' : 'Dial *123#'}
                                </button>
                            </div>

                            <p className="text-[11px] text-slate-500 font-mono border-t border-slate-700 pt-3">
                                ⚡ Works even on 2G and no smartphones needed — designed for rural India.
                            </p>
                        </div>
                    </div>
                </Card>
            </motion.div>

        </PageTransition>
    );
}