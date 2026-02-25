import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Stethoscope,
    Volume2,
    VolumeX,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { predictDiabetes } from '../services/api';
import Card from '../components/common/Card';
import PageTransition from '../components/common/PageTransition';
import ServiceOfflineBanner from '../components/common/ServiceOfflineBanner';

const smokingOptions = [
    'never',
    'former',
    'current',
    'ever',
    'not current',
    'No Info',
];

export default function DiabetesPage() {
    const { currentLanguage } = useLanguage();

    const [form, setForm] = useState({
        gender: '',
        age: 45,
        hypertension: 0,
        heart_disease: 0,
        smoking_history: '',
        bmi: '',
        HbA1c_level: '',
        blood_glucose_level: '',
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [serverError, setServerError] = useState('');

    const canSubmit =
        form.gender &&
        form.smoking_history &&
        form.bmi &&
        form.HbA1c_level &&
        form.blood_glucose_level;

    const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    async function handleSubmit(event) {
        event.preventDefault();
        if (!canSubmit) return;

        setLoading(true);
        setResult(null);
        setServerError('');
        try {
            const { data } = await predictDiabetes({
                ...form,
                language: currentLanguage.code,
            });
            setResult(data);
            toast.success('Analysis completed.');
        } catch (error) {
            if (error?.code === 'ERR_NETWORK') {
                setServerError('Service Offline: unable to reach backend or ML service. Please try again later.');
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
        const byRiskScore = ml?.risk_score;
        const byNestedProb = ml?.probability?.diabetic != null ? ml.probability.diabetic * 100 : null;
        const byProbability = ml?.probability != null ? Number(ml.probability) * 100 : null;
        if (typeof byRiskScore === 'number') return byRiskScore;
        if (typeof byNestedProb === 'number') return byNestedProb;
        if (typeof byProbability === 'number') return byProbability;
        return 0;
    }, [ml]);

    return (
        <PageTransition className="mx-auto max-w-6xl space-y-5">
            {serverError && <ServiceOfflineBanner message={serverError} />}

            <Card className="p-6">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/20 grid place-items-center">
                        <Stethoscope size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Diabetes Risk Assessment</h1>
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            Complete all medical inputs for AI-assisted risk scoring.
                        </p>
                    </div>
                </div>
            </Card>

            <Card as="form" onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1.5 text-xs uppercase tracking-wide text-zinc-500 font-semibold">
                            Gender
                        </label>
                        <select value={form.gender} onChange={(event) => setField('gender', event.target.value)} required>
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1.5 text-xs uppercase tracking-wide text-zinc-500 font-semibold">
                            Age
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={100}
                            value={form.age}
                            onChange={(event) => setField('age', Number(event.target.value))}
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1.5 text-xs uppercase tracking-wide text-zinc-500 font-semibold">
                            BMI
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            min={10}
                            max={60}
                            value={form.bmi}
                            onChange={(event) => setField('bmi', event.target.value)}
                            placeholder="e.g. 27.5"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1.5 text-xs uppercase tracking-wide text-zinc-500 font-semibold">
                            Smoking History
                        </label>
                        <select
                            value={form.smoking_history}
                            onChange={(event) => setField('smoking_history', event.target.value)}
                            required
                        >
                            <option value="">Select history</option>
                            {smokingOptions.map((value) => (
                                <option key={value} value={value}>
                                    {value}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1.5 text-xs uppercase tracking-wide text-zinc-500 font-semibold">
                            HbA1c Level (%)
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            min={3}
                            max={15}
                            value={form.HbA1c_level}
                            onChange={(event) => setField('HbA1c_level', event.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1.5 text-xs uppercase tracking-wide text-zinc-500 font-semibold">
                            Blood Glucose (mg/dL)
                        </label>
                        <input
                            type="number"
                            step="1"
                            min={50}
                            max={500}
                            value={form.blood_glucose_level}
                            onChange={(event) => setField('blood_glucose_level', event.target.value)}
                            required
                        />
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-zinc-200/70 bg-white/85 backdrop-blur-xl px-4 py-3 shadow-xl shadow-zinc-200/20">
                        <p className="text-sm font-medium text-zinc-700">Hypertension</p>
                        <button
                            type="button"
                            onClick={() => setField('hypertension', form.hypertension ? 0 : 1)}
                            className={`h-7 w-14 rounded-full p-1 transition-all duration-300 ease-out ${
                                form.hypertension ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'bg-zinc-300'
                            }`}
                        >
                            <span
                                className={`block h-5 w-5 rounded-full bg-white transition-all duration-300 ease-out ${
                                    form.hypertension ? 'translate-x-7' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-zinc-200/70 bg-white/85 backdrop-blur-xl px-4 py-3 shadow-xl shadow-zinc-200/20">
                        <p className="text-sm font-medium text-zinc-700">Heart Disease</p>
                        <button
                            type="button"
                            onClick={() => setField('heart_disease', form.heart_disease ? 0 : 1)}
                            className={`h-7 w-14 rounded-full p-1 transition-all duration-300 ease-out ${
                                form.heart_disease ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'bg-zinc-300'
                            }`}
                        >
                            <span
                                className={`block h-5 w-5 rounded-full bg-white transition-all duration-300 ease-out ${
                                    form.heart_disease ? 'translate-x-7' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={!canSubmit || loading}
                    className="mt-5 w-full rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 py-3 text-white font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 active:translate-y-0 active:scale-95"
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Stethoscope size={18} />}
                    {loading ? 'Analyzing...' : 'Analyze Diabetes Risk'}
                </button>
            </Card>

            {result && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">ML Prediction</h2>
                        <div className="mt-4 rounded-2xl border border-zinc-200/70 bg-white/85 p-4 shadow-xl shadow-zinc-200/20">
                            <p className="text-sm text-zinc-500">Risk Score</p>
                            <p className="text-3xl font-semibold tracking-tight text-zinc-900">
                                {Math.round(riskPercent)}%
                            </p>
                            <p className="text-sm text-zinc-500 mt-1">
                                {ml?.prediction_label ||
                                    (ml?.prediction === 1 ? 'Diabetes risk detected' : 'Lower risk')}
                            </p>
                            {ml?.confidence != null && (
                                <p className="text-sm text-zinc-500 mt-2">Confidence: {ml.confidence}%</p>
                            )}
                        </div>
                        {ml?.medical_flags?.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {ml.medical_flags.map((flag, index) => (
                                    <motion.div
                                        key={`${flag.indicator}-${index}`}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.35, ease: 'easeOut', delay: index * 0.05 }}
                                        className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
                                    >
                                        <p className="font-semibold text-zinc-900">{flag.indicator}</p>
                                        <p>
                                            Value: {flag.value} | Status: {flag.status}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="text-lg font-semibold tracking-tight text-zinc-900">AI Guidance</h2>
                            <button
                                type="button"
                                onClick={speakSummary}
                                className="rounded-lg border border-zinc-200/70 bg-white/90 px-3 py-2 text-xs text-blue-600 inline-flex items-center gap-1 shadow-lg shadow-zinc-200/20 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10 active:translate-y-0 active:scale-95"
                            >
                                {speaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                {speaking ? 'Stop' : 'Listen'}
                            </button>
                        </div>

                        <div className="mt-4 prose prose-sm max-w-none text-zinc-700">
                            <ReactMarkdown>{ai?.summary || ai?.raw || 'Analysis complete.'}</ReactMarkdown>
                        </div>

                        {ai?.recommendations?.length > 0 && (
                            <ul className="mt-4 space-y-2">
                                {ai.recommendations.map((item, index) => (
                                    <motion.li
                                        key={`${item}-${index}`}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.35, ease: 'easeOut', delay: index * 0.05 }}
                                        className="flex items-start gap-2 text-sm text-zinc-700"
                                    >
                                        <CheckCircle2 size={15} className="text-blue-600 mt-0.5 shrink-0" />
                                        {item}
                                    </motion.li>
                                ))}
                            </ul>
                        )}

                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm flex gap-2">
                            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                            This tool supports screening only and is not a medical diagnosis.
                        </div>
                    </Card>
                </div>
            )}
        </PageTransition>
    );
}


