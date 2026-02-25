import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Brain, CheckCircle2, Loader2, Volume2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { predictDisease } from '../services/api';
import Card from '../components/common/Card';
import PageTransition from '../components/common/PageTransition';

const symptoms = [
    'fever',
    'headache',
    'nausea',
    'vomiting',
    'cough',
    'shortness_of_breath',
    'fatigue',
    'joint_pain',
    'chest_pain',
    'runny_nose',
    'dizziness',
    'sore_throat',
    'abdominal_pain',
    'insomnia',
    'bloating',
    'diarrhea',
    'chills',
    'sweating',
    'skin_rash',
    'blurred_vision',
];

export default function PredictionPage() {
    const { currentLanguage } = useLanguage();
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    function toggleSymptom(symptom) {
        setSelectedSymptoms((prev) =>
            prev.includes(symptom) ? prev.filter((item) => item !== symptom) : [...prev, symptom]
        );
    }

    async function handlePredict() {
        if (!selectedSymptoms.length) {
            toast.error('Select at least one symptom.');
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            const { data } = await predictDisease({
                symptoms: selectedSymptoms,
                language: currentLanguage.code,
            });
            setResult(data);
        } catch {
            toast.error('Unable to run prediction right now.');
        } finally {
            setLoading(false);
        }
    }

    function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ''));
        utterance.lang = currentLanguage.speechCode || 'en-IN';
        window.speechSynthesis.speak(utterance);
    }

    const ml = result?.ml_prediction;
    const ai = result?.ai_explanation;

    return (
        <PageTransition className="mx-auto max-w-6xl space-y-4">
            <Card className="p-6">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/20 grid place-items-center">
                        <Brain size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Symptom Checker</h1>
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            Select symptoms for disease probability estimation.
                        </p>
                    </div>
                </div>
            </Card>

            <Card className="p-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold tracking-tight text-zinc-900">Symptoms</h2>
                    <span className="text-xs text-zinc-500">{selectedSymptoms.length} selected</span>
                </div>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {symptoms.map((symptom, index) => {
                        const active = selectedSymptoms.includes(symptom);
                        return (
                            <motion.button
                                type="button"
                                key={symptom}
                                onClick={() => toggleSymptom(symptom)}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.02 }}
                                className={`rounded-lg px-3 py-2 text-sm border transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-95 ${
                                    active
                                        ? 'bg-gradient-to-r from-blue-600 to-teal-500 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-white hover:shadow-zinc-200/40'
                                }`}
                            >
                                {symptom}
                            </motion.button>
                        );
                    })}
                </div>
                <button
                    type="button"
                    onClick={handlePredict}
                    disabled={loading || !selectedSymptoms.length}
                    className="mt-4 w-full rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 py-3 text-white font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-50 inline-flex justify-center items-center gap-2 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 active:translate-y-0 active:scale-95"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
                    {loading ? 'Analyzing...' : 'Predict Disease'}
                </button>
            </Card>

            {result && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="p-5">
                        <h2 className="text-base font-semibold tracking-tight text-zinc-900 mb-3">ML Predictions</h2>
                        <div className="space-y-3">
                            {(ml?.predictions || []).map((prediction, index) => (
                                <motion.div
                                    key={`${prediction.disease}-${index}`}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, ease: 'easeOut', delay: index * 0.05 }}
                                >
                                    <div className="flex items-center justify-between text-sm text-zinc-700">
                                        <span>{prediction.disease}</span>
                                        <span className="font-semibold text-zinc-900">
                                            {Math.round((prediction.confidence || 0) * 100)}%
                                        </span>
                                    </div>
                                    <div className="mt-1 h-2 rounded-full bg-zinc-100 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-600 to-teal-500"
                                            style={{ width: `${Math.round((prediction.confidence || 0) * 100)}%` }}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-5">
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <h2 className="text-base font-semibold tracking-tight text-zinc-900">AI Explanation</h2>
                            <button
                                type="button"
                                onClick={() => speak(ai?.summary || ai?.raw || '')}
                                className="rounded-lg border border-zinc-200/70 bg-white/90 px-3 py-2 text-xs text-blue-600 inline-flex items-center gap-1 shadow-lg shadow-zinc-200/20 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10 active:translate-y-0 active:scale-95"
                            >
                                <Volume2 size={14} /> Listen
                            </button>
                        </div>
                        <div className="prose prose-sm max-w-none text-zinc-700">
                            <ReactMarkdown>{ai?.summary || ai?.raw || 'Prediction completed.'}</ReactMarkdown>
                        </div>
                        {ai?.recommendations?.length > 0 && (
                            <ul className="mt-4 space-y-2">
                                {ai.recommendations.map((item, index) => (
                                    <li key={`${item}-${index}`} className="flex items-start gap-2 text-sm text-zinc-700">
                                        <CheckCircle2 size={15} className="text-blue-600 mt-0.5 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>
            )}
        </PageTransition>
    );
}

