import { useState } from 'react';
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
    Activity
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getEmergencyGuidance } from '../services/api';
import Card from '../components/common/Card';
import PageTransition from '../components/common/PageTransition';

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
    const { currentLanguage } = useLanguage();

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedType, setSelectedType] = useState('');
    const [customDesc, setCustomDesc] = useState('');
    const [listening, setListening] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    async function handleEmergency(situation) {
        const query = (typeof situation === 'string' ? situation : customDesc).trim();
        if (!query || loading) return;

        setSelectedType(query);
        setLoading(true);
        setResult(null);
        
        try {
            const { data } = await getEmergencyGuidance({ situation: query, language: currentLanguage.code });
            setResult(data);
        } catch {
            toast.error('Unable to fetch emergency guidance right now.');
        } finally {
            setLoading(false);
        }
    }

    function toggleMic() {
        if (listening) return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error('Speech recognition is not supported in this browser.');
            return;
        }
        const recognizer = new SpeechRecognition();
        recognizer.lang = currentLanguage.speechCode || 'en-IN';
        recognizer.onresult = (event) => {
            setCustomDesc(event.results[0][0].transcript || '');
            setListening(false);
        };
        recognizer.onerror = () => setListening(false);
        recognizer.onend = () => setListening(false);
        recognizer.start();
        setListening(true);
    }

    const steps = result?.steps || result?.result?.steps || [];
    const doNot = result?.do_not || result?.result?.do_not || [];
    const whileWaiting = result?.while_waiting || result?.result?.while_waiting || [];

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
                                        Emergency SOS
                                    </h1>
                                    <p className="mt-1 text-sm font-medium text-rose-700/80">
                                        Immediate life-saving guidance. Call for help first.
                                    </p>
                                </div>
                            </div>
                            
                            <a
                                href="tel:112"
                                className="group relative flex w-full md:w-auto items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-b from-rose-500 to-red-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-red-500/25 ring-1 ring-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-red-500/40 active:scale-95"
                            >
                                <PhoneCall size={20} className="animate-pulse" />
                                CALL 112 NOW
                                <div className="absolute inset-0 rounded-2xl bg-white opacity-0 transition-opacity group-hover:opacity-10" />
                            </a>
                        </div>
                    </Card>
                </motion.div>

                {!result && !loading && (
                    <motion.div variants={itemVariants} className="flex flex-col gap-6">
                        {/* Quick Action Grid */}
                        <Card className="rounded-[2rem] border border-white/40 bg-white/60 p-6 md:p-8 shadow-xl shadow-zinc-200/40 backdrop-blur-xl">
                            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-zinc-800">
                                <HeartPulse size={20} className="text-rose-500" /> Quick Select
                            </h2>
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                {emergencies.map((item) => (
                                    <button
                                        type="button"
                                        key={item}
                                        onClick={() => handleEmergency(item)}
                                        className="group flex items-center justify-between rounded-2xl border border-zinc-200/60 bg-white/80 px-4 py-3.5 text-[15px] font-semibold text-zinc-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-rose-300 hover:bg-gradient-to-br hover:from-rose-50 hover:to-red-50 hover:text-rose-800 hover:shadow-md hover:shadow-rose-500/10 active:translate-y-0"
                                    >
                                        <span>{item}</span>
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
                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                                        listening
                                            ? 'bg-rose-100 text-rose-600 shadow-inner shadow-rose-200 ring-2 ring-rose-500/30 animate-pulse'
                                            : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
                                    }`}
                                >
                                    {listening ? <MicOff size={22} /> : <Mic size={22} />}
                                </button>
                                
                                <input
                                    type="text"
                                    value={customDesc}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    onChange={(event) => setCustomDesc(event.target.value)}
                                    placeholder="Or describe the emergency (e.g., 'Child swallowed a coin')"
                                    className="h-12 w-full bg-transparent px-2 text-[15px] font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && handleEmergency(customDesc)}
                                />
                                
                                <button
                                    type="button"
                                    onClick={() => handleEmergency(customDesc)}
                                    disabled={!customDesc.trim()}
                                    className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 font-semibold text-white shadow-md transition-all duration-300 hover:scale-105 hover:bg-zinc-800 hover:shadow-zinc-900/30 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-zinc-900 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    Get Guidance
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
                        <h3 className="mt-6 text-xl font-bold text-zinc-800">Analyzing Situation</h3>
                        <p className="mt-2 text-zinc-500">Retrieving certified first-aid protocols...</p>
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
                                            {selectedType || 'Emergency'} Protocols
                                        </h3>
                                        {!!steps.length && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const utterance = new SpeechSynthesisUtterance(steps.join('. '));
                                                    utterance.lang = currentLanguage.speechCode || 'en-IN';
                                                    window.speechSynthesis.speak(utterance);
                                                }}
                                                className="group flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600 transition-all hover:bg-blue-100 hover:shadow-md active:scale-95"
                                            >
                                                <Volume2 size={16} className="transition-transform group-hover:scale-110" /> Read Aloud
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
                                        ← Back to Emergency Selection
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
                                            <h4 className="text-lg font-bold text-red-950">CRITICAL: Do Not</h4>
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
                                            <h4 className="text-lg font-bold text-slate-900">While Waiting</h4>
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
        </PageTransition>
    );
}