import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { predictDiabetes } from '../services/api';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import {
    Stethoscope, ChevronDown, Plus, Minus, Loader2, Volume2, VolumeX,
    AlertTriangle, Shield, TrendingUp, Activity, Info, CheckCircle2, XCircle,
} from 'lucide-react';

const SMOKING = [
    { value: 'never', label: '🚭 Never', emoji: '🚭' },
    { value: 'former', label: '🔄 Former', emoji: '🔄' },
    { value: 'current', label: '🚬 Current', emoji: '🚬' },
    { value: 'ever', label: '⚡ Ever', emoji: '⚡' },
    { value: 'not current', label: '↩️ Not Current', emoji: '↩️' },
    { value: 'No Info', label: '📋 No Info', emoji: '📋' },
];

function RangeBar({ value, ranges, unit = '' }) {
    if (!value && value !== 0) return null;
    const v = Number(value);
    let color = 'bg-green-500', label = 'Normal', pct = 0;
    for (const r of ranges) {
        if (v >= r.min && (r.max === undefined || v < r.max)) {
            color = r.color; label = r.label;
            pct = r.max ? ((v - r.min) / (r.max - r.min)) * (r.pctEnd - r.pctStart) + r.pctStart : r.pctEnd;
            break;
        }
    }
    return (
        <div className="mt-2">
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 w-1/3 bg-green-200" />
                <div className="absolute inset-y-0 left-1/3 w-1/3 bg-yellow-200" />
                <div className="absolute inset-y-0 left-2/3 w-1/3 bg-red-200" />
                <div className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-md ${color}`}
                    style={{ left: `${Math.min(Math.max(pct, 2), 98)}%` }} />
            </div>
            <p className={`text-[11px] mt-1 font-semibold ${color.replace('bg-', 'text-')}`}>{label} — {v}{unit}</p>
        </div>
    );
}

const BMI_RANGES = [
    { min: 0, max: 25, color: 'bg-green-500', label: 'Normal', pctStart: 0, pctEnd: 33 },
    { min: 25, max: 30, color: 'bg-yellow-500', label: 'Overweight', pctStart: 33, pctEnd: 66 },
    { min: 30, max: 100, color: 'bg-red-500', label: 'Obese', pctStart: 66, pctEnd: 100 },
];
const HBA1C_RANGES = [
    { min: 0, max: 5.7, color: 'bg-green-500', label: 'Normal', pctStart: 0, pctEnd: 33 },
    { min: 5.7, max: 6.5, color: 'bg-yellow-500', label: 'Pre-diabetic', pctStart: 33, pctEnd: 66 },
    { min: 6.5, max: 20, color: 'bg-red-500', label: 'Diabetic Range', pctStart: 66, pctEnd: 100 },
];
const GLUCOSE_RANGES = [
    { min: 0, max: 100, color: 'bg-green-500', label: 'Normal', pctStart: 0, pctEnd: 33 },
    { min: 100, max: 126, color: 'bg-yellow-500', label: 'Pre-diabetic', pctStart: 33, pctEnd: 66 },
    { min: 126, max: 500, color: 'bg-red-500', label: 'Diabetic Range', pctStart: 66, pctEnd: 100 },
];

function RiskGauge({ score, animatedScore }) {
    const radius = 80, stroke = 12;
    const circ = 2 * Math.PI * radius;
    const arc = circ * 0.75;
    const filled = (animatedScore / 100) * arc;
    const getColor = (s) => { if (s <= 25) return '#22c55e'; if (s <= 50) return '#3b82f6'; if (s <= 75) return '#f59e0b'; return '#ef4444'; };
    const color = getColor(animatedScore);

    return (
        <div className="flex justify-center">
            <svg width="200" height="170" viewBox="0 0 200 180">
                <circle cx="100" cy="100" r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke}
                    strokeDasharray={`${arc} ${circ}`} strokeDashoffset={0} strokeLinecap="round"
                    transform="rotate(135, 100, 100)" />
                <circle cx="100" cy="100" r={radius} fill="none" stroke={color} strokeWidth={stroke}
                    strokeDasharray={`${filled} ${circ}`} strokeDashoffset={0} strokeLinecap="round"
                    transform="rotate(135, 100, 100)" style={{ transition: 'stroke-dasharray 1.5s ease-out' }} />
                <text x="100" y="90" textAnchor="middle" fontSize="36" fontWeight="800" fill={color}>{Math.round(animatedScore)}</text>
                <text x="100" y="115" textAnchor="middle" fontSize="14" fill="#64748b" fontWeight="600">% Risk</text>
            </svg>
        </div>
    );
}

export default function DiabetesPage() {
    const { currentLanguage } = useLanguage();
    const [form, setForm] = useState({
        gender: '', age: 45, hypertension: 0, heart_disease: 0,
        smoking_history: '', bmi: '', HbA1c_level: '', blood_glucose_level: '',
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [animatedScore, setAnimatedScore] = useState(0);
    const [speaking, setSpeaking] = useState(false);
    const resultRef = useRef(null);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const canSubmit = form.gender && form.smoking_history && form.bmi && form.HbA1c_level && form.blood_glucose_level;

    useEffect(() => {
        if (!result) return;
        const target = result.ml_prediction?.risk_score || (result.ml_prediction?.probability?.diabetic * 100) || 0;
        let current = 0;
        const step = target / 60;
        const interval = setInterval(() => {
            current += step;
            if (current >= target) { setAnimatedScore(target); clearInterval(interval); }
            else setAnimatedScore(current);
        }, 25);
        return () => clearInterval(interval);
    }, [result]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!canSubmit) return;
        setLoading(true);
        setResult(null);
        try {
            const { data } = await predictDiabetes({ ...form, language: currentLanguage.code });
            setResult(data);
            toast.success('Analysis complete!');
            setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Analysis failed. Check if ML service is running.');
        }
        setLoading(false);
    }

    function speakText(text) {
        if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = currentLanguage.speechCode || 'en-IN';
        utter.onend = () => setSpeaking(false);
        setSpeaking(true);
        window.speechSynthesis.speak(utter);
    }

    const ml = result?.ml_prediction;
    const ai = result?.ai_explanation;
    const riskScore = ml?.risk_score || (ml?.probability?.diabetic ? ml.probability.diabetic * 100 : 0);

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 animate-fadeInUp">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white">
                        <Stethoscope size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">AI Diabetes Risk Assessment</h1>
                        <p className="text-sm text-gray-500">Powered by Machine Learning + Gemini AI</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 mb-6 animate-fadeInUp delay-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Gender */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Gender</label>
                        <div className="flex gap-2">
                            {['Female', 'Male'].map(g => (
                                <button key={g} type="button" onClick={() => set('gender', g)}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${form.gender === g ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                    {g === 'Female' ? '♀' : '♂'} {g}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Age */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Age</label>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => set('age', Math.max(1, form.age - 1))}
                                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-500"><Minus size={16} /></button>
                            <input type="number" min={1} max={100} value={form.age}
                                onChange={e => set('age', Math.min(100, Math.max(1, +e.target.value)))}
                                className="flex-1 text-center py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                            <button type="button" onClick={() => set('age', Math.min(100, form.age + 1))}
                                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-500"><Plus size={16} /></button>
                        </div>
                    </div>

                    {/* BMI */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">BMI (Body Mass Index)</label>
                        <input type="number" step="0.1" min={10} max={60} placeholder="e.g. 27.5"
                            value={form.bmi} onChange={e => set('bmi', e.target.value)}
                            className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" required />
                        <RangeBar value={form.bmi} ranges={BMI_RANGES} />
                    </div>

                    {/* Smoking */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Smoking History</label>
                        <div className="relative">
                            <select value={form.smoking_history} onChange={e => set('smoking_history', e.target.value)}
                                className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl appearance-none cursor-pointer focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" required>
                                <option value="">Select...</option>
                                {SMOKING.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Hypertension */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Hypertension</label>
                        <button type="button" onClick={() => set('hypertension', form.hypertension ? 0 : 1)}
                            className={`w-16 h-8 rounded-full relative transition-all ${form.hypertension ? 'bg-red-500' : 'bg-gray-300'}`}>
                            <div className={`w-6 h-6 rounded-full bg-white shadow absolute top-1 transition-all ${form.hypertension ? 'left-9' : 'left-1'}`} />
                        </button>
                        <span className="ml-3 text-sm text-gray-600">{form.hypertension ? 'Yes' : 'No'}</span>
                    </div>

                    {/* Heart Disease */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Heart Disease</label>
                        <button type="button" onClick={() => set('heart_disease', form.heart_disease ? 0 : 1)}
                            className={`w-16 h-8 rounded-full relative transition-all ${form.heart_disease ? 'bg-red-500' : 'bg-gray-300'}`}>
                            <div className={`w-6 h-6 rounded-full bg-white shadow absolute top-1 transition-all ${form.heart_disease ? 'left-9' : 'left-1'}`} />
                        </button>
                        <span className="ml-3 text-sm text-gray-600">{form.heart_disease ? 'Yes' : 'No'}</span>
                    </div>

                    {/* HbA1c */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">HbA1c Level (%)</label>
                        <input type="number" step="0.1" min={3} max={15} placeholder="e.g. 6.5"
                            value={form.HbA1c_level} onChange={e => set('HbA1c_level', e.target.value)}
                            className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" required />
                        <RangeBar value={form.HbA1c_level} ranges={HBA1C_RANGES} unit="%" />
                    </div>

                    {/* Blood Glucose */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Blood Glucose (mg/dL)</label>
                        <input type="number" step="1" min={50} max={500} placeholder="e.g. 140"
                            value={form.blood_glucose_level} onChange={e => set('blood_glucose_level', e.target.value)}
                            className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" required />
                        <RangeBar value={form.blood_glucose_level} ranges={GLUCOSE_RANGES} unit=" mg/dL" />
                    </div>
                </div>

                {/* Submit */}
                <button type="submit" disabled={!canSubmit || loading}
                    className={`mt-6 w-full py-3.5 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg ${canSubmit && !loading ? 'bg-gradient-to-r from-blue-600 to-blue-700 shadow-blue-500/20 hover:shadow-xl active:scale-[0.98] animate-pulseGlow' : 'bg-gray-300 cursor-not-allowed shadow-none'}`}>
                    {loading ? <><Loader2 size={20} className="animate-spin" /> Analyzing with AI...</> : <><Stethoscope size={20} /> 🩺 Analyze Diabetes Risk</>}
                </button>
                <p className="text-xs text-gray-400 text-center mt-3">⚠️ This is an AI-powered screening tool, not a medical diagnosis. Always consult a qualified healthcare professional.</p>
            </form>

            {/* ── Results ── */}
            {result && (
                <div ref={resultRef} className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-6 animate-slideUp">
                    {/* ML Results */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Activity size={20} className="text-blue-600" /> ML Analysis Results</h3>

                        <RiskGauge score={riskScore} animatedScore={animatedScore} />

                        {/* Prediction */}
                        <div className={`p-4 rounded-xl border-2 text-center font-bold text-lg ${riskScore > 50 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                            {ml?.prediction_label || (ml?.prediction === 1 ? 'Diabetes Risk Detected' : 'Low Diabetes Risk')}
                        </div>

                        {/* Risk Factors */}
                        {ml?.top_risk_factors?.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1"><TrendingUp size={16} /> Top Risk Factors</h4>
                                <div className="space-y-2">
                                    {ml.top_risk_factors.slice(0, 5).map((f, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <span className="text-xs text-gray-500 w-28 truncate">{f.feature}</span>
                                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000"
                                                    style={{ width: `${Math.min(f.importance * 100, 100)}%`, animationDelay: `${i * 0.1}s` }} />
                                            </div>
                                            <span className="text-xs font-semibold text-gray-700 w-12 text-right">{(f.importance * 100).toFixed(0)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Medical Flags */}
                        {ml?.medical_flags?.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1"><AlertTriangle size={16} /> Medical Indicators</h4>
                                <div className="space-y-2">
                                    {ml.medical_flags.map((f, i) => {
                                        const colors = { HIGH: 'bg-red-50 border-red-200 text-red-700', BORDERLINE: 'bg-yellow-50 border-yellow-200 text-yellow-700', NORMAL: 'bg-green-50 border-green-200 text-green-700' };
                                        const c = colors[f.status] || colors.NORMAL;
                                        return (
                                            <div key={i} className={`p-3 rounded-xl border ${c} text-sm`}>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold">{f.indicator}</span>
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/60">{f.status}</span>
                                                </div>
                                                <p className="text-xs mt-1 opacity-80">Value: {f.value} | Normal: {f.normal_range}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Model Info */}
                        {ml?.model_info && (
                            <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-500 flex flex-wrap gap-4">
                                <span>🤖 {ml.model_info.name}</span>
                                <span>📊 Accuracy: {(ml.model_info.accuracy * 100).toFixed(1)}%</span>
                                <span>📈 F1: {(ml.model_info.f1_score * 100).toFixed(1)}%</span>
                                <span>📚 {ml.model_info.dataset_size?.toLocaleString()} samples</span>
                            </div>
                        )}
                    </div>

                    {/* AI Explanation */}
                    <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-200 p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-violet-900 flex items-center gap-2">
                                <Shield size={20} /> AI Health Advisor
                            </h3>
                            <button onClick={() => speakText(ai?.summary || ai?.raw || '')}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-100 text-violet-700 text-xs font-semibold hover:bg-violet-200 transition-colors">
                                {speaking ? <><VolumeX size={14} /> Stop</> : <><Volume2 size={14} /> 🔊 Listen</>}
                            </button>
                        </div>

                        {ai?.summary && (
                            <div className="prose prose-sm text-violet-900/80"><ReactMarkdown>{ai.summary}</ReactMarkdown></div>
                        )}
                        {ai?.raw && !ai?.summary && (
                            <div className="prose prose-sm text-violet-900/80"><ReactMarkdown>{ai.raw}</ReactMarkdown></div>
                        )}

                        {ai?.recommendations?.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-violet-800 mb-2">✅ Recommendations</h4>
                                <ul className="space-y-1.5">
                                    {ai.recommendations.map((r, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-violet-800">
                                            <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" /> {r}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {ai?.diet_advice && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                                    <h5 className="text-xs font-bold text-green-700 mb-1.5">✅ Foods to Eat</h5>
                                    <ul className="space-y-1">{ai.diet_advice.eat?.map((f, i) => <li key={i} className="text-xs text-green-700">• {f}</li>)}</ul>
                                </div>
                                <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                                    <h5 className="text-xs font-bold text-red-700 mb-1.5">❌ Foods to Avoid</h5>
                                    <ul className="space-y-1">{ai.diet_advice.avoid?.map((f, i) => <li key={i} className="text-xs text-red-700">• {f}</li>)}</ul>
                                </div>
                            </div>
                        )}

                        {ai?.exercise && (
                            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                                <h5 className="text-xs font-bold text-blue-700 mb-1">🏃 Exercise</h5>
                                <p className="text-xs text-blue-700">{ai.exercise}</p>
                            </div>
                        )}

                        {ai?.when_to_see_doctor && (
                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                                <h5 className="text-xs font-bold text-amber-700 mb-1">🩺 When to See a Doctor</h5>
                                <p className="text-xs text-amber-700">{ai.when_to_see_doctor}</p>
                                {ai?.specialist_type && <p className="text-xs text-amber-600 mt-1">Specialist: <strong>{ai.specialist_type}</strong></p>}
                            </div>
                        )}

                        <p className="text-[10px] text-violet-400 border-t border-violet-200 pt-3">
                            ⚠️ AI-generated guidance. Not a substitute for professional medical advice.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
