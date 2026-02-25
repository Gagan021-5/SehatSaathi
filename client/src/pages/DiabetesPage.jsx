import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Stethoscope,
    Volume2,
    VolumeX,
    Activity,
    Info
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { predictDiabetes } from '../services/api';
import Card from '../components/common/Card';
import PageTransition from '../components/common/PageTransition';
import ServiceOfflineBanner from '../components/common/ServiceOfflineBanner';

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
    const { currentLanguage } = useLanguage();
    const [form, setForm] = useState({
        gender: '', age: 45, hypertension: 0, heart_disease: 0,
        smoking_history: '', bmi: '', HbA1c_level: '', blood_glucose_level: '',
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [serverError, setServerError] = useState('');

    const canSubmit = form.gender && form.smoking_history && form.bmi && form.HbA1c_level && form.blood_glucose_level;

    const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    async function handleSubmit(event) {
        event.preventDefault();
        if (!canSubmit) return;
        setLoading(true);
        setResult(null);
        setServerError('');
        try {
            const { data } = await predictDiabetes({ ...form, language: currentLanguage.code });
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

    function speakSummary() {
        const text = result?.ai_explanation?.summary || result?.ai_explanation?.raw || '';
        if (!text) return;
        if (speaking) {
            window.speechSynthesis.cancel();
            setSpeaking(false);
            return;
        }
        const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ''));
        utterance.lang = currentLanguage.speechCode || 'en-IN';
        utterance.onend = () => setSpeaking(false);
        setSpeaking(true);
        window.speechSynthesis.speak(utterance);
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
                    Diabetes <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">Risk Intelligence</span>
                </h1>
                <p className="mt-4 text-zinc-500 max-w-xl mx-auto">
                    Advanced clinical screening powered by Machine Learning and AI Guidance.
                </p>
            </header>

            {/* Form Section */}
            <Card className="overflow-hidden border-none shadow-2xl bg-white/70 backdrop-blur-xl ring-1 ring-zinc-200">
                <form onSubmit={handleSubmit} className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Gender */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                                <Activity size={14} className="text-blue-500" /> Gender
                            </label>
                            <select 
                                className="w-full h-11 px-4 rounded-xl border-zinc-200 bg-white/50 focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none"
                                value={form.gender} 
                                onChange={(e) => setField('gender', e.target.value)} 
                                required
                            >
                                <option value="">Select...</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>

                        {/* Age */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700">Age</label>
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
                            <label className="text-sm font-semibold text-zinc-700">BMI (Body Mass Index)</label>
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
                            <label className="text-sm font-semibold text-zinc-700">Smoking History</label>
                            <select
                                className="w-full h-11 px-4 rounded-xl border-zinc-200 bg-white/50 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={form.smoking_history}
                                onChange={(e) => setField('smoking_history', e.target.value)}
                                required
                            >
                                <option value="">Select History</option>
                                {smokingOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>

                        {/* HbA1c */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700">HbA1c Level (%)</label>
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
                            <label className="text-sm font-semibold text-zinc-700">Blood Glucose (mg/dL)</label>
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
                            <span className="text-sm font-medium text-zinc-700">Hypertension</span>
                            <ToggleButton active={form.hypertension} onClick={() => setField('hypertension', form.hypertension ? 0 : 1)} />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                            <span className="text-sm font-medium text-zinc-700">Heart Disease</span>
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
                        {loading ? 'Processing Data...' : 'Generate Analysis Report'}
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
                                        <h2 className="text-xl font-bold text-zinc-900">AI Medical Insights</h2>
                                    </div>
                                    <button
                                        onClick={speakSummary}
                                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 text-zinc-600 text-sm font-medium hover:bg-zinc-200 transition-colors"
                                    >
                                        {speaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                        {speaking ? 'Stop' : 'Listen'}
                                    </button>
                                </div>

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