import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Brain, Droplets, Flame, HeartPulse, Save, Scale } from 'lucide-react';
import { saveHealthToolResult } from '../services/api';
import Card from '../components/common/Card';
import PageTransition from '../components/common/PageTransition';

const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
};

const phq9Questions = [
    'Little interest or pleasure in doing things',
    'Feeling down, depressed, or hopeless',
    'Trouble falling or staying asleep, or sleeping too much',
    'Feeling tired or having little energy',
    'Poor appetite or overeating',
    'Feeling bad about yourself or that you are a failure',
    'Trouble concentrating on things',
    'Moving or speaking so slowly that others noticed, or being restless',
    'Thoughts that you would be better off dead or hurting yourself',
];

const gad7Questions = [
    'Feeling nervous, anxious, or on edge',
    'Not being able to stop or control worrying',
    'Worrying too much about different things',
    'Trouble relaxing',
    'Being so restless that it is hard to sit still',
    'Becoming easily annoyed or irritable',
    'Feeling afraid as if something awful might happen',
];

const answerOptions = [
    { label: 'Not at all', value: 0 },
    { label: 'Several days', value: 1 },
    { label: 'More than half the days', value: 2 },
    { label: 'Nearly every day', value: 3 },
];

const recommendationMap = {
    Minimal: 'Maintain healthy routines and continue regular self-checks.',
    Mild: 'Monitor symptoms weekly and strengthen sleep, activity, and social support habits.',
    Moderate: 'Consider speaking with a licensed mental health professional for structured support.',
    Severe: 'Seek professional care promptly. If you feel unsafe, contact emergency support immediately.',
};

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

function Gauge({ value, max, label, suffix = '', color = '#2563eb' }) {
    const safeValue = Math.max(0, Math.min(value, max));
    const percent = max > 0 ? (safeValue / max) * 100 : 0;
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (percent / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-2">
            <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
                <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
                <motion.circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: dashOffset }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                />
            </svg>
            <p className="-mt-20 text-2xl font-semibold tracking-tight text-slate-900">
                {round(value, 1)}
                {suffix}
            </p>
            <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        </div>
    );
}

async function persistResult(payload) {
    try {
        await saveHealthToolResult(payload);
        toast.success('Saved to dashboard.');
    } catch {
        const storageKey = 'sehat_saathi_health_tool_results';
        const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
        existing.unshift({ ...payload, savedAt: new Date().toISOString() });
        localStorage.setItem(storageKey, JSON.stringify(existing.slice(0, 100)));
        toast.success('Saved locally.');
    }
}

export default function HealthTools() {
    const [mainTab, setMainTab] = useState('physical');

    const [bmiInput, setBmiInput] = useState({ heightCm: 170, weightKg: 70 });
    const [bmrInput, setBmrInput] = useState({
        gender: 'male',
        age: 30,
        heightCm: 170,
        weightKg: 70,
        activity: 'moderate',
    });
    const [waterInput, setWaterInput] = useState({
        weightKg: 70,
        activity: 'moderate',
        climate: 'normal',
    });

    const [activeScreener, setActiveScreener] = useState('phq9');
    const [phqStep, setPhqStep] = useState(0);
    const [gadStep, setGadStep] = useState(0);
    const [phqAnswers, setPhqAnswers] = useState(Array(phq9Questions.length).fill(null));
    const [gadAnswers, setGadAnswers] = useState(Array(gad7Questions.length).fill(null));

    const bmiValue = useMemo(() => {
        const heightM = Number(bmiInput.heightCm) / 100;
        const weight = Number(bmiInput.weightKg);
        if (!heightM || !weight) return 0;
        return weight / (heightM * heightM);
    }, [bmiInput]);
    const bmiCategory = getBmiCategory(bmiValue);

    const bmrBase = useMemo(() => {
        const weight = Number(bmrInput.weightKg);
        const height = Number(bmrInput.heightCm);
        const age = Number(bmrInput.age);
        if (!weight || !height || !age) return 0;
        const raw = 10 * weight + 6.25 * height - 5 * age + (bmrInput.gender === 'male' ? 5 : -161);
        return Math.max(0, raw);
    }, [bmrInput]);

    const dailyCalories = useMemo(() => {
        const multiplier = activityMultipliers[bmrInput.activity] || activityMultipliers.moderate;
        return bmrBase * multiplier;
    }, [bmrBase, bmrInput.activity]);

    const waterLiters = useMemo(() => {
        const weight = Number(waterInput.weightKg) || 0;
        const base = weight * 0.033;
        const activityBoost = waterInput.activity === 'active' ? 0.6 : waterInput.activity === 'moderate' ? 0.35 : 0.15;
        const climateBoost = waterInput.climate === 'hot' ? 0.5 : waterInput.climate === 'cold' ? -0.2 : 0;
        return Math.max(1.5, base + activityBoost + climateBoost);
    }, [waterInput]);

    const isPhq = activeScreener === 'phq9';
    const questions = isPhq ? phq9Questions : gad7Questions;
    const answers = isPhq ? phqAnswers : gadAnswers;
    const step = isPhq ? phqStep : gadStep;
    const score = answers.reduce((sum, value) => sum + (Number(value) || 0), 0);
    const completed = answers.every((value) => value !== null);
    const severity = isPhq ? getPhqSeverity(score) : getGadSeverity(score);

    function recordAnswer(value) {
        const currentStep = step;
        if (isPhq) {
            setPhqAnswers((prev) => {
                const next = [...prev];
                next[currentStep] = value;
                return next;
            });
            if (currentStep < phq9Questions.length - 1) setTimeout(() => setPhqStep(currentStep + 1), 120);
        } else {
            setGadAnswers((prev) => {
                const next = [...prev];
                next[currentStep] = value;
                return next;
            });
            if (currentStep < gad7Questions.length - 1) setTimeout(() => setGadStep(currentStep + 1), 120);
        }
    }

    function moveStep(direction) {
        if (isPhq) {
            setPhqStep((prev) => Math.max(0, Math.min(phq9Questions.length - 1, prev + direction)));
        } else {
            setGadStep((prev) => Math.max(0, Math.min(gad7Questions.length - 1, prev + direction)));
        }
    }

    return (
        <PageTransition className="mx-auto max-w-7xl space-y-4">
            <Card className="p-6 md:p-7 bg-gradient-to-r from-zinc-900 via-blue-900 to-teal-700 text-white border-transparent">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-blue-100">Health Calculators & Screening Suite</p>
                        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Health Tools</h1>
                        <p className="mt-2 max-w-2xl text-sm text-blue-100">
                            Physical vitals calculators and validated self-screening questionnaires running fully client-side.
                        </p>
                    </div>
                    <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs text-blue-50">
                        Local calculations • No paid AI dependency
                    </div>
                </div>
            </Card>

            <Card className="p-3">
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setMainTab('physical')}
                        className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                            mainTab === 'physical'
                                ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white'
                                : 'bg-white text-slate-600 ring-1 ring-slate-200'
                        }`}
                    >
                        Physical Vitals
                    </button>
                    <button
                        type="button"
                        onClick={() => setMainTab('mental')}
                        className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                            mainTab === 'mental'
                                ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white'
                                : 'bg-white text-slate-600 ring-1 ring-slate-200'
                        }`}
                    >
                        Mental Health
                    </button>
                </div>
            </Card>

            {mainTab === 'physical' ? (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <Card className="p-5">
                        <div className="flex items-center gap-2">
                            <Scale size={16} className="text-blue-600" />
                            <h2 className="text-base font-semibold tracking-tight text-slate-900">BMI Calculator</h2>
                        </div>
                        <div className="mt-3 space-y-2">
                            <input
                                type="number"
                                min="50"
                                value={bmiInput.heightCm}
                                onChange={(event) => setBmiInput((prev) => ({ ...prev, heightCm: Number(event.target.value) }))}
                                placeholder="Height (cm)"
                            />
                            <input
                                type="number"
                                min="10"
                                value={bmiInput.weightKg}
                                onChange={(event) => setBmiInput((prev) => ({ ...prev, weightKg: Number(event.target.value) }))}
                                placeholder="Weight (kg)"
                            />
                        </div>
                        <div className="mt-4">
                            <Gauge value={bmiValue} max={40} label={`BMI • ${bmiCategory}`} color="#2563eb" />
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                persistResult({
                                    type: 'calculator',
                                    title: 'BMI Calculator',
                                    score: round(bmiValue, 1),
                                    severity: bmiCategory,
                                    payload: bmiInput,
                                })
                            }
                            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                        >
                            <Save size={14} /> Save to Dashboard
                        </button>
                    </Card>

                    <Card className="p-5">
                        <div className="flex items-center gap-2">
                            <Flame size={16} className="text-orange-600" />
                            <h2 className="text-base font-semibold tracking-tight text-slate-900">Calorie / BMR</h2>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <select
                                value={bmrInput.gender}
                                onChange={(event) => setBmrInput((prev) => ({ ...prev, gender: event.target.value }))}
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                            <input
                                type="number"
                                value={bmrInput.age}
                                onChange={(event) => setBmrInput((prev) => ({ ...prev, age: Number(event.target.value) }))}
                                placeholder="Age"
                            />
                            <input
                                type="number"
                                value={bmrInput.heightCm}
                                onChange={(event) => setBmrInput((prev) => ({ ...prev, heightCm: Number(event.target.value) }))}
                                placeholder="Height cm"
                            />
                            <input
                                type="number"
                                value={bmrInput.weightKg}
                                onChange={(event) => setBmrInput((prev) => ({ ...prev, weightKg: Number(event.target.value) }))}
                                placeholder="Weight kg"
                            />
                        </div>
                        <div className="mt-2">
                            <select
                                value={bmrInput.activity}
                                onChange={(event) => setBmrInput((prev) => ({ ...prev, activity: event.target.value }))}
                            >
                                <option value="sedentary">Sedentary</option>
                                <option value="light">Lightly Active</option>
                                <option value="moderate">Moderately Active</option>
                                <option value="active">Very Active</option>
                            </select>
                        </div>
                        <div className="mt-4">
                            <Gauge value={dailyCalories} max={3500} label="Daily Calories" suffix=" kcal" color="#ea580c" />
                        </div>
                        <p className="text-xs text-slate-500">BMR: {round(bmrBase, 0)} kcal/day (Mifflin-St Jeor)</p>
                        <button
                            type="button"
                            onClick={() =>
                                persistResult({
                                    type: 'calculator',
                                    title: 'Calorie/BMR Calculator',
                                    score: round(dailyCalories, 0),
                                    severity: 'Minimal',
                                    payload: { ...bmrInput, bmrBase: round(bmrBase, 1) },
                                })
                            }
                            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                        >
                            <Save size={14} /> Save to Dashboard
                        </button>
                    </Card>

                    <Card className="p-5">
                        <div className="flex items-center gap-2">
                            <Droplets size={16} className="text-cyan-600" />
                            <h2 className="text-base font-semibold tracking-tight text-slate-900">Water Intake</h2>
                        </div>
                        <div className="mt-3 space-y-2">
                            <input
                                type="number"
                                value={waterInput.weightKg}
                                onChange={(event) => setWaterInput((prev) => ({ ...prev, weightKg: Number(event.target.value) }))}
                                placeholder="Weight (kg)"
                            />
                            <select
                                value={waterInput.activity}
                                onChange={(event) => setWaterInput((prev) => ({ ...prev, activity: event.target.value }))}
                            >
                                <option value="light">Low Activity</option>
                                <option value="moderate">Moderate Activity</option>
                                <option value="active">High Activity</option>
                            </select>
                            <select
                                value={waterInput.climate}
                                onChange={(event) => setWaterInput((prev) => ({ ...prev, climate: event.target.value }))}
                            >
                                <option value="cold">Cold Climate</option>
                                <option value="normal">Normal Climate</option>
                                <option value="hot">Hot Climate</option>
                            </select>
                        </div>
                        <div className="mt-4">
                            <Gauge value={waterLiters} max={5} label="Daily Water" suffix=" L" color="#0891b2" />
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                persistResult({
                                    type: 'calculator',
                                    title: 'Water Intake Calculator',
                                    score: round(waterLiters, 1),
                                    severity: 'Minimal',
                                    payload: waterInput,
                                })
                            }
                            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                        >
                            <Save size={14} /> Save to Dashboard
                        </button>
                    </Card>
                </div>
            ) : (
                <div className="space-y-4">
                    <Card className="p-3">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveScreener('phq9')}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                                    activeScreener === 'phq9'
                                        ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white'
                                        : 'bg-white text-slate-600 ring-1 ring-slate-200'
                                }`}
                            >
                                PHQ-9
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveScreener('gad7')}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                                    activeScreener === 'gad7'
                                        ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white'
                                        : 'bg-white text-slate-600 ring-1 ring-slate-200'
                                }`}
                            >
                                GAD-7
                            </button>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-500">
                                Question {step + 1} of {questions.length}
                            </p>
                            <div className="h-2 w-40 rounded-full bg-slate-100 overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-blue-600 to-teal-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((step + 1) / questions.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${activeScreener}-${step}`}
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -16 }}
                                transition={{ duration: 0.2 }}
                                className="mt-4"
                            >
                                <h2 className="text-xl font-semibold tracking-tight text-slate-900">{questions[step]}</h2>
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {answerOptions.map((option) => {
                                        const selected = answers[step] === option.value;
                                        return (
                                            <button
                                                key={option.label}
                                                type="button"
                                                onClick={() => recordAnswer(option.value)}
                                                className={`rounded-xl border px-4 py-4 text-left text-sm font-medium transition-all ${
                                                    selected
                                                        ? 'border-blue-300 bg-blue-50 text-blue-700 shadow-lg shadow-blue-500/10'
                                                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        <div className="mt-5 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => moveStep(-1)}
                                disabled={step === 0}
                                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-45"
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                onClick={() => moveStep(1)}
                                disabled={step === questions.length - 1}
                                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-45"
                            >
                                Next
                            </button>
                        </div>
                    </Card>

                    {completed ? (
                        <Card className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-6 items-center">
                                <Gauge
                                    value={score}
                                    max={isPhq ? 27 : 21}
                                    label={`${isPhq ? 'PHQ-9' : 'GAD-7'} Score`}
                                    color="#0d9488"
                                />
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700">
                                        <Brain size={14} /> {severity}
                                    </div>
                                    <p className="mt-3 text-sm text-slate-600">{recommendationMap[severity]}</p>
                                    <p className="mt-2 text-xs text-slate-500">
                                        This is a screening tool, not a diagnosis. Consult a clinician for formal assessment.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            persistResult({
                                                type: 'screening',
                                                title: isPhq ? 'PHQ-9 Depression Screener' : 'GAD-7 Anxiety Screener',
                                                score,
                                                severity,
                                                payload: {
                                                    screener: activeScreener,
                                                    answers,
                                                },
                                            })
                                        }
                                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                                    >
                                        <HeartPulse size={15} /> Save to Dashboard
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ) : null}
                </div>
            )}
        </PageTransition>
    );
}
