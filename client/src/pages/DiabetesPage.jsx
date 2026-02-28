import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Stethoscope,
    Volume2,
    VolumeX,
    Activity,
    Info,
    Mic,
    MicOff,
    Bot
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { predictDiabetes, sendMessage, synthesizeSpeech } from '../services/api';
import Card from '../components/common/Card';
import PageTransition from '../components/common/PageTransition';
import ServiceOfflineBanner from '../components/common/ServiceOfflineBanner';
import { useVoiceLoop } from '../hooks/useVoiceLoop';

const smokingOptions = ['never', 'former', 'current', 'ever', 'not current', 'No Info'];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
};

export default function DiabetesPage() {
    const { currentLanguage, t } = useLanguage();
    const { user } = useAuth();
    const [form, setForm] = useState({
        gender: '', age: 45, hypertension: 0, heart_disease: 0,
        smoking_history: '', bmi: '', HbA1c_level: '', blood_glucose_level: '',
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');

    const audioPlayerRef = React.useRef(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [voiceLoading, setVoiceLoading] = useState(false);

    const {
        isListening,
        isSpeaking: isVoiceSpeaking,
        sessionActive,
        startSession,
        stopSession,
        speakText
    } = useVoiceLoop({
        lang: currentLanguage.speechCode || 'en-IN',
        onSpeechResult: async (transcript) => {
            if (!transcript || voiceLoading) return;
            setVoiceLoading(true);

            try {
                // Add the AI explanation as context in the first message if history is empty
                const contextPrefix = chatHistory.length === 0
                    ? `Context: The user just received a diabetes risk report. Report details: ${result?.ai_explanation?.raw}. `
                    : '';

                const nextMessage = { role: 'user', content: transcript };
                const newHistory = [...chatHistory, nextMessage];
                setChatHistory(newHistory);

                const { data } = await sendMessage({
                    message: contextPrefix + transcript,
                    history: chatHistory,
                    language: currentLanguage.code
                });

                setChatHistory(prev => [...prev, { role: 'assistant', content: data.text }]);

                if (data?.audioBase64) {
                    await playAudio(data.audioBase64);
                } else if (sessionActive) {
                    speakText(data.text);
                }
            } catch (error) {
                toast.error('Voice sync failed.');
                if (sessionActive) {
                    setTimeout(() => startSession(), 200);
                }
            } finally {
                setVoiceLoading(false);
            }
        }
    });

    async function playAudio(base64) {
        if (sessionActive) stopSession();
        const blob = new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioPlayerRef.current = audio;

        try {
            await audio.play();
            await new Promise(res => audio.onended = res);
        } finally {
            URL.revokeObjectURL(url);
            if (sessionActive) {
                setTimeout(() => startSession(), 200);
            }
        }
    }

    const canSubmit = form.gender && form.smoking_history && form.bmi && form.HbA1c_level && form.blood_glucose_level;

    const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    async function handleSubmit(event) {
        event.preventDefault();
        if (!canSubmit) return;
        setLoading(true);
        setResult(null);
        setServerError('');
        setChatHistory([]); // Reset voice chat history for new report
        if (sessionActive) stopSession();

        try {
            const { data } = await predictDiabetes({ ...form, language: currentLanguage.code, patientName: user?.name || '' });
            setResult(data);
            toast.success('Analysis completed.');
        } catch (error) {
            if (error?.code === 'ERR_NETWORK') {
                setServerError('Service Offline: unable to reach backend or ML service.');
            } else {
                toast.error(error?.response?.data?.error || 'Diabetes analysis failed.');
            }
        } finally {
            setLoading(false);
        }
    }

    async function toggleVoiceInsights() {
        if (sessionActive) {
            stopSession();
            if (audioPlayerRef.current) audioPlayerRef.current.pause();
        } else {
            const text = result?.ai_explanation?.summary || result?.ai_explanation?.raw || '';
            if (!text) return;

            setVoiceLoading(true);
            try {
                // Fetch high-quality ElevenLabs TTS for the initial insight summary
                const { data } = await synthesizeSpeech({ text: text.replace(/[*#_`]/g, ''), mood: 'Calm' });
                startSession(); // Starts session logically so UI updates immediately
                if (data?.audioBase64) {
                    await playAudio(data.audioBase64);
                } else {
                    // Fallback to basic if ElevenLabs fails entirely (no key)
                    speakText(text.replace(/[*#_`]/g, ''));
                }
            } catch (error) {
                toast.error('Voice synthesis failed.');
                startSession();
                speakText(text.replace(/[*#_`]/g, '')); // fallback
            } finally {
                setVoiceLoading(false);
            }
        }
    }

    const ml = result?.ml_prediction;
    const ai = result?.ai_explanation;
    const riskPercent = useMemo(() => {
        const val = ml?.risk_score ?? (ml?.probability?.diabetic != null ? ml.probability.diabetic * 100 : Number(ml?.probability || 0) * 100);
        return Math.round(val);
    }, [ml]);

    return (
        <PageTransition className="mx-auto max-w-5xl px-4 pb-20 space-y-8">
            {serverError && <ServiceOfflineBanner message={serverError} />}

            {/* Header Section */}
            <header className="relative py-8 text-center">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_50%,rgba(59,130,246,0.08)_0%,transparent_100%)]" />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-2xl shadow-blue-500/40 mb-6"
                >
                    <Stethoscope size={32} />
                </motion.div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
                    {t('diabetes.title').split(' ').slice(0, 1).join(' ')}{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
                        {t('diabetes.title').split(' ').slice(1).join(' ')}
                    </span>
                </h1>
                <p className="mt-4 text-zinc-500 max-w-xl mx-auto">
                    {t('diabetes.subtitle')}
                </p>
            </header>

            {/* Form Section */}
            <Card className="overflow-hidden border-none shadow-2xl bg-white/70 backdrop-blur-xl ring-1 ring-zinc-200">
                <form onSubmit={handleSubmit} className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Gender */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                                <Activity size={14} className="text-blue-500" /> {t('diabetes.fields.gender')}
                            </label>
                            <select
                                className="w-full h-11 px-4 rounded-xl border-zinc-200 bg-white/50 focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none"
                                value={form.gender}
                                onChange={(e) => setField('gender', e.target.value)}
                                required
                            >
                                <option value="">{t('diabetes.options.selectGender')}</option>
                                <option value="Male">{t('diabetes.options.male')}</option>
                                <option value="Female">{t('diabetes.options.female')}</option>
                            </select>
                        </div>

                        {/* Age */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700">{t('diabetes.fields.age')}</label>
                            <input
                                type="number"
                                className="w-full h-11 px-4 rounded-xl border-zinc-200 bg-white/50 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={form.age}
                                onChange={(e) => setField('age', Number(e.target.value))}
                                required
                            />
                        </div>

                        {/* BMI */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700">{t('diabetes.fields.bmi')}</label>
                            <input
                                type="number" step="0.1" placeholder="24.5"
                                className="w-full h-11 px-4 rounded-xl border-zinc-200 bg-white/50 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={form.bmi}
                                onChange={(e) => setField('bmi', e.target.value)}
                                required
                            />
                        </div>

                        {/* Smoking */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700">{t('diabetes.fields.smokingHistory')}</label>
                            <select
                                className="w-full h-11 px-4 rounded-xl border-zinc-200 bg-white/50 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={form.smoking_history}
                                onChange={(e) => setField('smoking_history', e.target.value)}
                                required
                            >
                                <option value="">{t('diabetes.options.selectGender').replace('Gender', 'History')}</option>
                                {smokingOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>

                        {/* HbA1c */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700">{t('diabetes.fields.hba1c')}</label>
                            <input
                                type="number" step="0.1"
                                className="w-full h-11 px-4 rounded-xl border-zinc-200 bg-white/50 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={form.HbA1c_level}
                                onChange={(e) => setField('HbA1c_level', e.target.value)}
                                required
                            />
                        </div>

                        {/* Glucose */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700">{t('diabetes.fields.bloodGlucose')}</label>
                            <input
                                type="number"
                                className="w-full h-11 px-4 rounded-xl border-zinc-200 bg-white/50 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={form.blood_glucose_level}
                                onChange={(e) => setField('blood_glucose_level', e.target.value)}
                                required
                            />
                        </div>

                        {/* Toggles */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                            <span className="text-sm font-medium text-zinc-700">{t('diabetes.fields.hypertension')}</span>
                            <ToggleButton active={form.hypertension} onClick={() => setField('hypertension', form.hypertension ? 0 : 1)} />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                            <span className="text-sm font-medium text-zinc-700">{t('diabetes.fields.heartDisease')}</span>
                            <ToggleButton active={form.heart_disease} onClick={() => setField('heart_disease', form.heart_disease ? 0 : 1)} />
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={!canSubmit || loading}
                        className="mt-8 w-full h-14 rounded-2xl bg-zinc-900 text-white font-bold shadow-xl shadow-zinc-500/20 disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Activity size={20} />}
                        {loading ? t('common.analyzing') : t('diabetes.submit')}
                    </motion.button>
                </form>
            </Card>

            {/* Results Section */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        variants={containerVariants} initial="hidden" animate="visible"
                        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                    >
                        {/* ML Metric Card */}
                        <motion.div variants={itemVariants} className="lg:col-span-1">
                            <Card className="h-full p-6 bg-gradient-to-b from-white to-zinc-50 border-none shadow-xl ring-1 ring-zinc-200">
                                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Statistical Risk</h3>
                                <div className="mt-6 flex flex-col items-center">
                                    <div className="relative flex items-center justify-center">
                                        <svg className="h-32 w-32 -rotate-90">
                                            <circle cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-zinc-100" />
                                            <circle
                                                cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="8"
                                                strokeDasharray={364.4}
                                                strokeDashoffset={364.4 - (364.4 * riskPercent) / 100}
                                                className={`${riskPercent > 50 ? 'text-red-500' : 'text-blue-500'} transition-all duration-1000`}
                                            />
                                        </svg>
                                        <span className="absolute text-3xl font-black text-zinc-900">{riskPercent}%</span>
                                    </div>
                                    <div className="mt-6 text-center">
                                        <p className="font-bold text-zinc-800">{ml?.prediction_label || (ml?.prediction === 1 ? 'High Risk detected' : 'Low Risk detected')}</p>
                                        <p className="text-xs text-zinc-500 mt-1">Confidence Score: {ml?.confidence || 0}%</p>
                                    </div>
                                </div>

                                <div className="mt-8 space-y-3">
                                    {ml?.medical_flags?.map((flag, i) => (
                                        <div key={i} className="p-3 rounded-xl bg-white border border-zinc-100 text-xs shadow-sm">
                                            <div className="flex justify-between font-bold text-zinc-900 mb-1">
                                                <span>{flag.indicator}</span>
                                                <span className={flag.status === 'High' ? 'text-red-500' : 'text-zinc-500'}>{flag.status}</span>
                                            </div>
                                            <p className="text-zinc-500">Value recorded: {flag.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </motion.div>

                        {/* AI Guidance Card */}
                        <motion.div variants={itemVariants} className="lg:col-span-2">
                            <Card className="h-full p-8 border-none shadow-xl ring-1 ring-zinc-200">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 grid place-items-center">
                                            <Info size={18} />
                                        </div>
                                        <h2 className="text-xl font-bold text-zinc-900">{t('diabetes.aiMedicalInsights')}</h2>
                                    </div>
                                    <button
                                        onClick={toggleVoiceInsights}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${sessionActive
                                            ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                            }`}
                                    >
                                        {sessionActive ? <MicOff size={16} /> : <Volume2 size={16} />}
                                        {sessionActive ? t('diabetes.endVoiceSession') : t('diabetes.listenAndDiscuss')}
                                    </button>
                                </div>

                                {/* Voice Visualizer & Chat Status */}
                                <AnimatePresence>
                                    {sessionActive && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mb-6 overflow-hidden"
                                        >
                                            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 text-white shadow-lg relative overflow-hidden">
                                                <div className="absolute inset-0 bg-blue-500/10 blur-xl" />
                                                <div className="relative flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                                                        <Bot size={20} className="text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold">{t('diabetes.clinicalVoiceAssistant')}</p>
                                                        <p className="text-xs text-blue-200/70">
                                                            {voiceLoading ? t('diabetes.analyzing2') : isVoiceSpeaking ? t('chat.speaking') : isListening ? t('chat.listening') : t('chat.thinking')}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Mini Waveform */}
                                                {(isListening || isVoiceSpeaking) && (
                                                    <div className="relative flex items-center gap-1 h-8">
                                                        {[...Array(6)].map((_, i) => (
                                                            <motion.div
                                                                key={i}
                                                                animate={{ height: isListening ? [10, 24, 10] : [6, 32, 6] }}
                                                                transition={{ duration: isListening ? 1.5 : 0.8, repeat: Infinity, delay: i * 0.1 }}
                                                                className="w-1 rounded-full bg-blue-400/80"
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="prose prose-blue prose-zinc max-w-none">
                                    <ReactMarkdown>{ai?.summary || ai?.raw || ''}</ReactMarkdown>
                                </div>

                                {ai?.recommendations?.length > 0 && (
                                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {ai.recommendations.map((item, i) => (
                                            <div key={i} className="flex gap-3 p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-sm text-zinc-700">
                                                <CheckCircle2 size={18} className="text-blue-600 shrink-0" />
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-8 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3 text-xs text-amber-800 leading-relaxed">
                                    <AlertTriangle size={18} className="shrink-0" />
                                    <p><b>Clinical Disclaimer:</b> This report is generated by AI for educational purposes. It does not replace professional medical advice. Always consult a licensed physician for diagnosis.</p>
                                </div>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </PageTransition>
    );
}

// Helper Component for Premium Toggle
function ToggleButton({ active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`h-6 w-11 rounded-full p-1 transition-all duration-300 ${active ? 'bg-blue-600' : 'bg-zinc-300'}`}
        >
            <div className={`h-4 w-4 rounded-full bg-white transition-all duration-300 ${active ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );
}