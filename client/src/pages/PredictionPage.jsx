import { useState } from 'react';
import { predictDisease } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { Brain, Loader2, Volume2, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const SYMPTOMS = [
    '🤒 fever', '🤕 headache', '🤢 nausea', '🤮 vomiting', '😷 cough',
    '🫁 shortness_of_breath', '💪 fatigue', '🦴 joint_pain', '🩸 chest_pain',
    '🤧 runny_nose', '😵 dizziness', '🔥 sore_throat', '💊 abdominal_pain',
    '😴 insomnia', '🫃 bloating', '💧 diarrhea', '🥶 chills', '😓 sweating',
    '🩹 skin_rash', '👁️ blurred_vision',
];

export default function PredictionPage() {
    const { currentLanguage } = useLanguage();
    const [selected, setSelected] = useState([]);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const toggle = (s) => {
        const sym = s.split(' ').slice(1).join(' ');
        setSelected(prev => prev.includes(sym) ? prev.filter(x => x !== sym) : [...prev, sym]);
    };

    async function handlePredict() {
        if (!selected.length) { toast.error('Select at least one symptom'); return; }
        setLoading(true); setResult(null);
        try {
            const { data } = await predictDisease({ symptoms: selected, language: currentLanguage.code });
            setResult(data);
            toast.success('Analysis complete!');
        } catch { toast.error('Prediction failed'); }
        setLoading(false);
    }

    function speak(text) {
        const u = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ''));
        u.lang = currentLanguage.speechCode;
        window.speechSynthesis.speak(u);
    }

    const ml = result?.ml_prediction;
    const ai = result?.ai_explanation;

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-6 animate-fadeInUp">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white">
                    <Brain size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Symptom Checker</h1>
                    <p className="text-sm text-gray-500">Select symptoms for AI-powered disease prediction</p>
                </div>
            </div>

            {/* Symptoms Grid */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 mb-6 animate-fadeInUp delay-1">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">Select Your Symptoms</h3>
                    {selected.length > 0 && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">{selected.length} selected</span>
                    )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {SYMPTOMS.map((s) => {
                        const sym = s.split(' ').slice(1).join(' ');
                        const isSelected = selected.includes(sym);
                        return (
                            <button key={s} onClick={() => toggle(s)}
                                className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all ${isSelected ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'}`}>
                                {s}
                            </button>
                        );
                    })}
                </div>
                <button onClick={handlePredict} disabled={!selected.length || loading}
                    className="mt-5 w-full py-3.5 rounded-xl text-white font-bold bg-gradient-to-r from-purple-600 to-violet-700 shadow-lg shadow-purple-500/20 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all">
                    {loading ? <><Loader2 size={20} className="animate-spin" /> Analyzing...</> : <><Brain size={20} /> 🧠 Predict Disease</>}
                </button>
            </div>

            {/* Results */}
            {result && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slideUp">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Brain size={20} className="text-purple-600" /> ML Predictions</h3>
                        <div className="space-y-3">
                            {(ml?.predictions || []).map((p, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-sm text-gray-700 w-32 truncate font-medium">{p.disease}</span>
                                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-purple-500 to-violet-600 rounded-full transition-all duration-1000"
                                            style={{ width: `${(p.confidence * 100).toFixed(0)}%` }} />
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 w-14 text-right">{(p.confidence * 100).toFixed(0)}%</span>
                                </div>
                            ))}
                        </div>
                        {ml?.model_info && (
                            <p className="text-xs text-gray-400 mt-4">Model: {ml.model_info.name} | Accuracy: {((ml.model_info.accuracy || 0) * 100).toFixed(0)}%</p>
                        )}
                    </div>

                    <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-violet-900">AI Explanation</h3>
                            <button onClick={() => speak(ai?.summary || ai?.raw || '')} className="flex items-center gap-1 px-3 py-1 bg-violet-100 text-violet-700 text-xs font-semibold rounded-lg hover:bg-violet-200">
                                <Volume2 size={14} /> Listen
                            </button>
                        </div>
                        <div className="prose prose-sm text-violet-900/80 mb-4">
                            <ReactMarkdown>{ai?.summary || ai?.raw || ai?.what_it_is || 'Analysis complete.'}</ReactMarkdown>
                        </div>
                        {ai?.recommendations?.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-violet-800 mb-2">Recommendations</h4>
                                <ul className="space-y-1.5">{ai.recommendations.map((r, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-violet-800"><CheckCircle2 size={16} className="text-green-500 mt-0.5" /> {r}</li>
                                ))}</ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
