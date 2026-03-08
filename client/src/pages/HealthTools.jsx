import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    Brain, Droplets, Flame, HeartPulse, Save, Scale,
    CheckCircle2, Activity, ChevronLeft, ChevronRight
} from 'lucide-react';
import { saveHealthToolResult } from '../services/api';
import PageTransition from '../components/common/PageTransition';
import { useLanguage } from '../context/LanguageContext';

// --- Constants & Logic ---
const activityMultipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };

function round(value, digits = 1) {
    if (!Number.isFinite(value)) return 0;
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
}

function getBmiCategory(value) {
    if (value < 18.5) return 'Mild';
    if (value < 25) return 'Minimal';
    if (value < 30) return 'Moderate';
    return 'Severe';
}

function getPhqSeverity(score) {
    if (score <= 4) return 'Minimal';
    if (score <= 9) return 'Mild';
    if (score <= 14) return 'Moderate';
    return 'Severe';
}

function getGadSeverity(score) {
    if (score <= 4) return 'Minimal';
    if (score <= 9) return 'Mild';
    if (score <= 14) return 'Moderate';
    return 'Severe';
}

// --- Premium Gauge Component ---
function Gauge({ value, max, label, suffix = '', color = '#3b82f6', glowColor = 'rgba(59, 130, 246, 0.4)' }) {
    const safeValue = Math.max(0, Math.min(value, max));
    const percent = max > 0 ? (safeValue / max) * 100 : 0;
    const radius = 46;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (percent / 100) * circumference;

    return (
        <div className="relative flex flex-col items-center justify-center p-4">
            <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90 drop-shadow-xl" style={{ filter: `drop-shadow(0 0 12px ${glowColor})` }}>
                <circle cx="70" cy="70" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
                <motion.circle
                    cx="70" cy="70" r={radius} fill="none"
                    stroke={color} strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: dashOffset }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                <p className="text-3xl font-black tracking-tighter text-slate-900">
                    {round(value, 1)}<span className="text-sm font-bold text-slate-400">{suffix}</span>
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{label}</p>
            </div>
        </div>
    );
}

// --- Main Component ---
export default function HealthTools() {
    const { t } = useLanguage();
    const [mainTab, setMainTab] = useState('physical');

    // Physical State
    const [bmiInput, setBmiInput] = useState({ heightCm: 170, weightKg: 70 });
    const [bmrInput, setBmrInput] = useState({ gender: 'male', age: 30, heightCm: 170, weightKg: 70, activity: 'moderate' });
    const [waterInput, setWaterInput] = useState({ weightKg: 70, activity: 'moderate', climate: 'normal' });

    // Mental State — length derived from translated questions array, so we seed with fixed sizes
    const [activeScreener, setActiveScreener] = useState('phq9');
    const [phqStep, setPhqStep] = useState(0);
    const [gadStep, setGadStep] = useState(0);
    const [phqAnswers, setPhqAnswers] = useState(Array(9).fill(null));
    const [gadAnswers, setGadAnswers] = useState(Array(7).fill(null));

    // Translated question arrays (re-derived on every language change)
    const phq9Questions = [
        t('healthTools.mental.phq9.q0'), t('healthTools.mental.phq9.q1'),
        t('healthTools.mental.phq9.q2'), t('healthTools.mental.phq9.q3'),
        t('healthTools.mental.phq9.q4'), t('healthTools.mental.phq9.q5'),
        t('healthTools.mental.phq9.q6'), t('healthTools.mental.phq9.q7'),
        t('healthTools.mental.phq9.q8'),
    ];
    const gad7Questions = [
        t('healthTools.mental.gad7.q0'), t('healthTools.mental.gad7.q1'),
        t('healthTools.mental.gad7.q2'), t('healthTools.mental.gad7.q3'),
        t('healthTools.mental.gad7.q4'), t('healthTools.mental.gad7.q5'),
        t('healthTools.mental.gad7.q6'),
    ];
    const answerOptions = [
        { label: t('healthTools.mental.options.notAtAll'), value: 0 },
        { label: t('healthTools.mental.options.severalDays'), value: 1 },
        { label: t('healthTools.mental.options.moreThanHalf'), value: 2 },
        { label: t('healthTools.mental.options.nearlyEvery'), value: 3 },
    ];

    // Calculations
    const bmiValue = useMemo(() => {
        const heightM = Number(bmiInput.heightCm) / 100;
        const weight = Number(bmiInput.weightKg);
        if (!heightM || !weight) return 0;
        return weight / (heightM * heightM);
    }, [bmiInput]);
    const bmiCategory = getBmiCategory(bmiValue);

    const bmrBase = useMemo(() => {
        const { weightKg, heightCm, age, gender } = bmrInput;
        if (!weightKg || !heightCm || !age) return 0;
        const raw = 10 * weightKg + 6.25 * heightCm - 5 * age + (gender === 'male' ? 5 : -161);
        return Math.max(0, raw);
    }, [bmrInput]);

    const dailyCalories = useMemo(() => bmrBase * (activityMultipliers[bmrInput.activity] || 1.55), [bmrBase, bmrInput.activity]);

    const waterLiters = useMemo(() => {
        const base = (Number(waterInput.weightKg) || 0) * 0.033;
        const actBoost = waterInput.activity === 'active' ? 0.6 : waterInput.activity === 'moderate' ? 0.35 : 0.15;
        const climBoost = waterInput.climate === 'hot' ? 0.5 : waterInput.climate === 'cold' ? -0.2 : 0;
        return Math.max(1.5, base + actBoost + climBoost);
    }, [waterInput]);

    // Mental Logic
    const isPhq = activeScreener === 'phq9';
    const questions = isPhq ? phq9Questions : gad7Questions;
    const answers = isPhq ? phqAnswers : gadAnswers;
    const step = isPhq ? phqStep : gadStep;
    const score = answers.reduce((sum, val) => sum + (Number(val) || 0), 0);
    const completed = answers.every((val) => val !== null);
    const severity = isPhq ? getPhqSeverity(score) : getGadSeverity(score);

    function recordAnswer(value) {
        if (isPhq) {
            const next = [...phqAnswers]; next[step] = value; setPhqAnswers(next);
            if (step < questions.length - 1) setTimeout(() => setPhqStep(step + 1), 250);
        } else {
            const next = [...gadAnswers]; next[step] = value; setGadAnswers(next);
            if (step < questions.length - 1) setTimeout(() => setGadStep(step + 1), 250);
        }
    }

    function moveStep(dir) {
        isPhq ? setPhqStep(p => Math.max(0, Math.min(questions.length - 1, p + dir)))
            : setGadStep(p => Math.max(0, Math.min(questions.length - 1, p + dir)));
    }

    async function persistResult(payload) {
        try {
            await saveHealthToolResult(payload);
            toast.success(t('healthTools.saved'));
        } catch {
            const key = 'sehat_saathi_health_tool_results';
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            existing.unshift({ ...payload, savedAt: new Date().toISOString() });
            localStorage.setItem(key, JSON.stringify(existing.slice(0, 100)));
            toast.success(t('healthTools.savedOffline'));
        }
    }

    return (
        <PageTransition className="mx-auto max-w-[1400px] space-y-8 pb-12 px-2">
            {/* Premium Header */}
            <header className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-12 text-white shadow-2xl shadow-slate-900/20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.3),transparent_50%)]" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-300 ring-1 ring-inset ring-blue-500/30 mb-4">
                            <Activity size={14} /> {t('healthTools.clinicalUtilities')}
                        </div>
                        <h1 className="text-4xl text-white font-black tracking-tight lg:text-5xl">
                            {t('healthTools.pageTitle')}
                        </h1>
                        <p className="mt-3 max-w-xl text-slate-400 text-lg">
                            {t('healthTools.pageSubtitle')}
                        </p>
                    </div>
                </div>
            </header>

            {/* Segmented Control */}
            <div className="flex justify-center">
                <div className="flex p-1.5 space-x-2 bg-slate-100/80 rounded-2xl backdrop-blur-xl border border-slate-200/60 shadow-inner">
                    {['physical', 'mental'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setMainTab(tab)}
                            className={`relative px-8 py-3 text-sm font-bold capitalize tracking-wide rounded-xl transition-colors duration-300 ${mainTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {mainTab === tab && (
                                <motion.div
                                    layoutId="mainTabIndicator"
                                    className="absolute inset-0 bg-slate-900 rounded-xl shadow-lg"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                {tab === 'physical' ? <HeartPulse size={16} /> : <Brain size={16} />}
                                {tab === 'physical' ? t('healthTools.tabs.physical') : t('healthTools.tabs.mental')}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {mainTab === 'physical' ? (
                    <motion.div
                        key="physical"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                    >
                        {/* BMI Card */}
                        <div className="flex flex-col rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/40 border border-slate-100 hover:shadow-2xl transition-shadow">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <Scale size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">{t('healthTools.physical.bmi.title')}</h2>
                                    <p className="text-xs text-slate-500 font-medium">{t('healthTools.physical.bmi.subtitle')}</p>
                                </div>
                            </div>
                            <div className="space-y-3 flex-1">
                                <InputField label={t('healthTools.physical.bmi.heightCm')} value={bmiInput.heightCm} onChange={(v) => setBmiInput(p => ({ ...p, heightCm: v }))} />
                                <InputField label={t('healthTools.physical.bmi.weightKg')} value={bmiInput.weightKg} onChange={(v) => setBmiInput(p => ({ ...p, weightKg: v }))} />
                            </div>
                            <div className="py-6"><Gauge value={bmiValue} max={40} label={t(`healthTools.mental.severityLevels.${bmiCategory}`)} color="#6366f1" glowColor="rgba(99,102,241,0.4)" /></div>
                            <SaveButton label={t('healthTools.saveToDashboard')} onClick={() => persistResult({ type: 'calculator', title: 'BMI', score: round(bmiValue, 1), severity: bmiCategory, payload: bmiInput })} />
                        </div>

                        {/* BMR Card */}
                        <div className="flex flex-col rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/40 border border-slate-100 hover:shadow-2xl transition-shadow">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-12 w-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                    <Flame size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">{t('healthTools.physical.bmr.title')}</h2>
                                    <p className="text-xs text-slate-500 font-medium">{t('healthTools.physical.bmr.subtitle')}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 flex-1">
                                <SelectField value={bmrInput.gender} onChange={(v) => setBmrInput(p => ({ ...p, gender: v }))} options={[
                                    { l: t('healthTools.physical.bmr.gender.male'), v: 'male' },
                                    { l: t('healthTools.physical.bmr.gender.female'), v: 'female' },
                                ]} />
                                <InputField label={t('healthTools.physical.bmr.age')} value={bmrInput.age} onChange={(v) => setBmrInput(p => ({ ...p, age: v }))} />
                                <InputField label={t('healthTools.physical.bmr.heightCm')} value={bmrInput.heightCm} onChange={(v) => setBmrInput(p => ({ ...p, heightCm: v }))} />
                                <InputField label={t('healthTools.physical.bmr.weightKg')} value={bmrInput.weightKg} onChange={(v) => setBmrInput(p => ({ ...p, weightKg: v }))} />
                                <div className="col-span-2">
                                    <SelectField value={bmrInput.activity} onChange={(v) => setBmrInput(p => ({ ...p, activity: v }))} options={[
                                        { l: t('healthTools.physical.bmr.activity.sedentary'), v: 'sedentary' },
                                        { l: t('healthTools.physical.bmr.activity.light'), v: 'light' },
                                        { l: t('healthTools.physical.bmr.activity.moderate'), v: 'moderate' },
                                        { l: t('healthTools.physical.bmr.activity.active'), v: 'active' },
                                    ]} />
                                </div>
                            </div>
                            <div className="py-2"><Gauge value={dailyCalories} max={4000} label={t('healthTools.physical.bmr.kcalDay')} color="#f97316" glowColor="rgba(249,115,22,0.4)" /></div>
                            <SaveButton label={t('healthTools.saveToDashboard')} onClick={() => persistResult({ type: 'calculator', title: 'BMR', score: round(dailyCalories, 0), severity: 'Minimal', payload: bmrInput })} />
                        </div>

                        {/* Water Card */}
                        <div className="flex flex-col rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/40 border border-slate-100 hover:shadow-2xl transition-shadow">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-12 w-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                                    <Droplets size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">{t('healthTools.physical.water.title')}</h2>
                                    <p className="text-xs text-slate-500 font-medium">{t('healthTools.physical.water.subtitle')}</p>
                                </div>
                            </div>
                            <div className="space-y-3 flex-1">
                                <InputField label={t('healthTools.physical.water.weightKg')} value={waterInput.weightKg} onChange={(v) => setWaterInput(p => ({ ...p, weightKg: v }))} />
                                <SelectField value={waterInput.activity} onChange={(v) => setWaterInput(p => ({ ...p, activity: v }))} options={[
                                    { l: t('healthTools.physical.water.activity.light'), v: 'light' },
                                    { l: t('healthTools.physical.water.activity.moderate'), v: 'moderate' },
                                    { l: t('healthTools.physical.water.activity.active'), v: 'active' },
                                ]} />
                                <SelectField value={waterInput.climate} onChange={(v) => setWaterInput(p => ({ ...p, climate: v }))} options={[
                                    { l: t('healthTools.physical.water.climate.cold'), v: 'cold' },
                                    { l: t('healthTools.physical.water.climate.normal'), v: 'normal' },
                                    { l: t('healthTools.physical.water.climate.hot'), v: 'hot' },
                                ]} />
                            </div>
                            <div className="py-6"><Gauge value={waterLiters} max={6} label={t('healthTools.physical.water.litersDay')} color="#06b6d4" glowColor="rgba(6,182,212,0.4)" /></div>
                            <SaveButton label={t('healthTools.saveToDashboard')} onClick={() => persistResult({ type: 'calculator', title: 'Hydration', score: round(waterLiters, 1), severity: 'Minimal', payload: waterInput })} />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="mental"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="max-w-4xl mx-auto space-y-6"
                    >
                        {/* Screener Tabs */}
                        <div className="flex p-1.5 space-x-2 bg-slate-100 rounded-2xl w-fit mx-auto">
                            {['phq9', 'gad7'].map((scr) => (
                                <button
                                    key={scr} onClick={() => setActiveScreener(scr)}
                                    className={`relative px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${activeScreener === scr ? 'text-slate-900 shadow-sm bg-white' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {scr === 'phq9' ? t('healthTools.mental.screenerTabs.phq9') : t('healthTools.mental.screenerTabs.gad7')}
                                </button>
                            ))}
                        </div>

                        {!completed ? (
                            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-slate-200/50 border border-slate-100">
                                <div className="mb-10">
                                    <div className="flex justify-between items-end mb-4">
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                            {t('healthTools.mental.question')} {step + 1} {t('healthTools.mental.of')} {questions.length}
                                        </p>
                                        <p className="text-sm font-bold text-blue-600">{Math.round(((step) / questions.length) * 100)}%</p>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-blue-600 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${((step) / questions.length) * 100}%` }}
                                            transition={{ ease: "easeInOut" }}
                                        />
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`${activeScreener}-${step}`}
                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.25 }}
                                    >
                                        <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-8">
                                            {questions[step]}
                                        </h2>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {answerOptions.map((opt) => {
                                                const isSelected = answers[step] === opt.value;
                                                return (
                                                    <button
                                                        key={opt.value} onClick={() => recordAnswer(opt.value)}
                                                        className={`group flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-200 outline-none ${isSelected ? 'border-blue-600 bg-blue-50/50 shadow-lg shadow-blue-600/10' : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        <span className={`text-base font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700 group-hover:text-slate-900'}`}>
                                                            {opt.label}
                                                        </span>
                                                        <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'}`}>
                                                            {isSelected && <CheckCircle2 size={14} />}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                </AnimatePresence>

                                <div className="mt-12 flex justify-between items-center pt-6 border-t border-slate-100">
                                    <button
                                        onClick={() => moveStep(-1)} disabled={step === 0}
                                        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 disabled:opacity-30 transition-colors"
                                    >
                                        <ChevronLeft size={16} /> {t('healthTools.mental.previous')}
                                    </button>
                                    <button
                                        onClick={() => moveStep(1)} disabled={step === questions.length - 1}
                                        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 disabled:opacity-30 transition-colors"
                                    >
                                        {t('healthTools.mental.next')} <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-100">
                                <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-12 items-center">
                                    <div className="flex justify-center border-r border-slate-100 pr-0 md:pr-12">
                                        <Gauge value={score} max={isPhq ? 27 : 21} label={`${activeScreener.toUpperCase()} Score`} color="#8b5cf6" glowColor="rgba(139,92,246,0.4)" />
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">{t('healthTools.mental.clinicalIndication')}</h3>
                                            <div className="inline-flex items-center gap-2 rounded-2xl bg-indigo-50 px-4 py-2 text-lg font-black text-indigo-700">
                                                <Brain size={20} /> {t(`healthTools.mental.severityLevels.${severity}`)} {t('healthTools.mental.severityLabel')}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">{t('healthTools.mental.recommendation')}</h3>
                                            <p className="text-lg font-medium text-slate-700 leading-relaxed">{t(`healthTools.mental.recommendations.${severity}`)}</p>
                                        </div>
                                        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                                            <button
                                                onClick={() => persistResult({ type: 'screening', title: isPhq ? 'PHQ-9' : 'GAD-7', score, severity, payload: { screener: activeScreener, answers } })}
                                                className="flex-1 h-14 rounded-2xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/20"
                                            >
                                                <Save size={18} /> {t('healthTools.saveToDashboard')}
                                            </button>
                                            <button
                                                onClick={() => { isPhq ? setPhqAnswers(Array(9).fill(null)) : setGadAnswers(Array(7).fill(null)); moveStep(-step); }}
                                                className="flex-1 h-14 rounded-2xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200 transition-all active:scale-95"
                                            >
                                                {t('healthTools.mental.retake')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </PageTransition>
    );
}

// --- Micro UI Components ---
function InputField({ label, value, onChange }) {
    return (
        <div className="relative">
            <input
                type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
                className="peer w-full h-14 rounded-xl border border-slate-200 bg-slate-50 px-4 pt-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 hover:bg-slate-100"
            />
            <label className="absolute left-4 top-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-all peer-focus:text-blue-500">
                {label}
            </label>
        </div>
    );
}

function SelectField({ value, onChange, options }) {
    return (
        <select
            value={value} onChange={(e) => onChange(e.target.value)}
            className="w-full h-14 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 hover:bg-slate-100 appearance-none"
        >
            {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
    );
}

function SaveButton({ onClick, label }) {
    return (
        <button
            onClick={onClick}
            className="w-full h-12 mt-4 rounded-xl bg-slate-900 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
        >
            <Save size={16} /> {label}
        </button>
    );
}