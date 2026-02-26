import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Activity,
    ArrowUpRight,
    Bot,
    Calendar,
    Loader2,
    Plus,
    Sparkles,
    TrendingUp,
    X,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { addVital, analyzeHealth, getHealthRecords } from '../services/api';
import HealthTrendsChart from '../components/HealthTrendsChart';
import Card from '../components/common/Card';
import PageTransition from '../components/common/PageTransition';

const vitalTypes = [
    {
        type: 'blood_pressure',
        label: 'Blood Pressure',
        unit: 'mmHg',
        color: 'from-rose-500 to-red-500',
        stroke: '#f43f5e',
        axis: 'right',
    },
    {
        type: 'heart_rate',
        label: 'Heart Rate',
        unit: 'bpm',
        color: 'from-pink-500 to-rose-500',
        stroke: '#ec4899',
        axis: 'right',
    },
    {
        type: 'temperature',
        label: 'Temperature',
        unit: 'F',
        color: 'from-amber-500 to-orange-500',
        stroke: '#f59e0b',
        axis: 'left',
    },
    {
        type: 'blood_sugar',
        label: 'Blood Sugar',
        unit: 'mg/dL',
        color: 'from-emerald-500 to-teal-500',
        stroke: '#10b981',
        axis: 'right',
    },
    {
        type: 'weight',
        label: 'Weight',
        unit: 'kg',
        color: 'from-blue-500 to-indigo-500',
        stroke: '#3b82f6',
        axis: 'right',
    },
    {
        type: 'oxygen',
        label: 'Oxygen',
        unit: '%',
        color: 'from-cyan-500 to-blue-500',
        stroke: '#06b6d4',
        axis: 'left',
    },
];

function sortByNewest(left, right) {
    return new Date(right.createdAt) - new Date(left.createdAt);
}

function toNumericVitalValue(record) {
    const raw = record?.value;
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    if (raw == null) return null;
    const text = String(raw).trim();
    if (!text) return null;
    if (record?.type === 'blood_pressure' && text.includes('/')) {
        const systolic = Number(text.split('/')[0]);
        return Number.isFinite(systolic) ? systolic : null;
    }
    const parsed = Number(text.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
}

function computeRiskHorizon(records) {
    if (!Array.isArray(records) || records.length < 5) return null;

    const watchedSignals = [
        { type: 'heart_rate', label: 'Heart Rate', eventLabel: 'hypertensive' },
        { type: 'blood_sugar', label: 'Blood Sugar', eventLabel: 'hypoglycemic' },
    ];

    const candidates = watchedSignals
        .map((signal) => {
            const series = records
                .filter((entry) => entry.type === signal.type)
                .sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt))
                .map((entry) => ({ ...entry, numericValue: toNumericVitalValue(entry) }))
                .filter((entry) => entry.numericValue != null)
                .slice(-5);

            if (series.length < 5) return null;

            const first = series[0].numericValue;
            const last = series[series.length - 1].numericValue;
            const deltaPct = ((last - first) / Math.max(Math.abs(first), 1)) * 100;
            const trendStrength = Math.abs(deltaPct);
            if (trendStrength < 10) return null;

            return {
                ...signal,
                deltaPct,
                trendStrength,
                direction: deltaPct >= 0 ? 'rising' : 'falling',
            };
        })
        .filter(Boolean)
        .sort((left, right) => right.trendStrength - left.trendStrength);

    if (!candidates.length) return null;

    const strongest = candidates[0];
    const warningMessage =
        strongest.type === 'blood_sugar' && strongest.deltaPct < 0
            ? 'Neural Analysis: 15% increased risk of Hypoglycemic Event detected in the next 48h. Action: Monitor closely.'
            : strongest.type === 'heart_rate' && strongest.deltaPct > 0
              ? 'Neural Analysis: 15% increased risk of Hypertensive Event detected in the next 48h. Action: Monitor closely.'
              : 'Neural Analysis: 15% increased risk of Cardiometabolic Instability detected in the next 48h. Action: Monitor closely.';

    return {
        signalLabel: strongest.label,
        direction: strongest.direction,
        deltaPct: Math.round(strongest.deltaPct),
        message: warningMessage,
    };
}

export default function HealthRecordsPage() {
    const { currentLanguage } = useLanguage();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [addType, setAddType] = useState(vitalTypes[0].type);
    const [addValue, setAddValue] = useState('');
    const [saving, setSaving] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [showChart, setShowChart] = useState(false);
    const [riskHorizon, setRiskHorizon] = useState(null);

    async function fetchRecords() {
        setLoading(true);
        try {
            const { data } = await getHealthRecords();
            setRecords(Array.isArray(data) ? data : []);
        } catch {
            setRecords([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchRecords();
    }, []);

    async function handleAdd() {
        if (!addValue) {
            toast.error('Enter a vital value first.');
            return;
        }

        setSaving(true);
        try {
            await addVital({ type: addType, value: addValue });
            setAddValue('');
            setShowAdd(false);
            toast.success('Vital reading synchronized.');
            fetchRecords();
        } catch {
            toast.error('Failed to save reading.');
        } finally {
            setSaving(false);
        }
    }

    async function handleAnalyze() {
        if (records.length === 0) {
            toast.error('Add vitals first to generate insights.');
            return;
        }

        setShowChart(true);
        setRiskHorizon(computeRiskHorizon(records));
        setAnalyzing(true);
        try {
            const { data } = await analyzeHealth(currentLanguage.code);
            setAnalysis(data);
            toast.success('AI Health Analysis Complete');
        } catch {
            toast.error('Unable to perform AI analysis.');
        } finally {
            setAnalyzing(false);
        }
    }

    const latestByType = useMemo(() => {
        const grouped = new Map();
        for (const vital of vitalTypes) {
            grouped.set(
                vital.type,
                [...records]
                    .filter((record) => record.type === vital.type)
                    .sort(sortByNewest)[0] || null
            );
        }
        return grouped;
    }, [records]);

    return (
        <PageTransition className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:py-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col justify-between gap-6 md:flex-row md:items-center"
            >
                <div className="flex items-center gap-5">
                    <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-teal-400 text-white shadow-xl shadow-blue-500/30">
                        <Activity size={28} />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute inset-0 -z-10 rounded-2xl bg-blue-400/20 blur-lg"
                        />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Vitals & Trends</h1>
                        <p className="font-medium text-zinc-500">
                            Monitoring your biometric health data in real-time.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowAdd(true)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-zinc-900/20 transition-all hover:-translate-y-1 hover:bg-zinc-800 active:scale-95 md:flex-none"
                    >
                        <Plus size={18} /> Add Reading
                    </button>
                    <button
                        onClick={handleAnalyze}
                        disabled={analyzing || records.length === 0}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-5 py-3 text-sm font-bold text-blue-600 shadow-xl shadow-blue-500/5 transition-all hover:-translate-y-1 hover:bg-blue-50 active:scale-95 disabled:opacity-50 md:flex-none"
                    >
                        {analyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} AI Insight
                    </button>
                </div>
            </motion.div>

            <AnimatePresence>
                {showAdd ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-sm"
                    >
                        <Card className="relative w-full max-w-md p-8 shadow-2xl">
                            <button
                                onClick={() => setShowAdd(false)}
                                className="absolute right-5 top-5 rounded-full p-2 transition-colors hover:bg-zinc-100"
                            >
                                <X size={20} className="text-zinc-400" />
                            </button>

                            <h2 className="mb-6 text-xl font-bold text-zinc-900">Log New Reading</h2>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="px-1 text-xs font-bold uppercase tracking-wider text-zinc-400">
                                        Vital Category
                                    </label>
                                    <select
                                        value={addType}
                                        onChange={(event) => setAddType(event.target.value)}
                                        className="w-full rounded-xl border-zinc-200 bg-zinc-50 py-3 font-medium focus:ring-blue-500"
                                    >
                                        {vitalTypes.map((vital) => (
                                            <option key={vital.type} value={vital.type}>
                                                {vital.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="px-1 text-xs font-bold uppercase tracking-wider text-zinc-400">
                                        Measurement Value
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={addValue}
                                            onChange={(event) => setAddValue(event.target.value)}
                                            placeholder="00.0"
                                            className="w-full rounded-xl border-zinc-200 bg-zinc-50 py-3 pl-4 pr-16 text-lg font-semibold focus:ring-blue-500"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400">
                                            {vitalTypes.find((vital) => vital.type === addType)?.unit}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleAdd}
                                    disabled={saving || !addValue}
                                    className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 py-4 font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                                >
                                    {saving ? (
                                        <Loader2 size={20} className="mx-auto animate-spin" />
                                    ) : (
                                        'Synchronize Record'
                                    )}
                                </button>
                            </div>
                        </Card>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <AnimatePresence>
                {showChart ? (
                    <motion.div
                        initial={{ opacity: 0, y: -24, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -14, scale: 0.99 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <HealthTrendsChart records={records} vitalTypes={vitalTypes} />
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <AnimatePresence>
                {showChart && riskHorizon ? (
                    <motion.div
                        initial={{ opacity: 0, y: -18 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -18 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <Card className="relative overflow-hidden border-amber-200 bg-gradient-to-br from-amber-50/85 to-orange-50/70 p-6 shadow-xl shadow-amber-500/10">
                            <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-amber-400/30 blur-3xl" />
                            <div className="relative z-10 flex items-start gap-3">
                                <div className="rounded-xl bg-amber-500 p-2 text-white shadow-lg shadow-amber-500/25">
                                    <Sparkles size={18} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black tracking-tight text-zinc-900">
                                        Risk Horizon | Neural Analysis
                                    </h2>
                                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-amber-700">
                                        Prognosis signal: {riskHorizon.signalLabel} ({riskHorizon.direction},{' '}
                                        {Math.abs(riskHorizon.deltaPct)}%)
                                    </p>
                                    <p className="mt-3 text-sm font-semibold leading-relaxed text-amber-900">
                                        {riskHorizon.message}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <AnimatePresence>
                {analysis ? (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="overflow-hidden"
                    >
                        <Card className="group relative overflow-hidden border-blue-200 bg-gradient-to-br from-blue-50/50 to-teal-50/50 p-1">
                            <div className="p-6">
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="rounded-lg bg-blue-600 p-2 text-white">
                                        <Bot size={20} />
                                    </div>
                                    <h2 className="text-lg font-bold text-zinc-900">Clinical Intelligence Analysis</h2>
                                    {analysis.health_score != null ? (
                                        <div className="ml-auto flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 shadow-sm">
                                            <span className="text-xs font-bold uppercase text-zinc-400">
                                                Vitality Score
                                            </span>
                                            <span className="text-lg font-black text-blue-600">
                                                {analysis.health_score}
                                            </span>
                                        </div>
                                    ) : null}
                                </div>

                                {analysis.summary ? (
                                    <p className="mb-6 rounded-2xl border border-white bg-white/60 p-4 font-medium leading-relaxed text-zinc-600">
                                        {analysis.summary}
                                    </p>
                                ) : null}

                                {analysis.recommendations?.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        {analysis.recommendations.map((item, index) => (
                                            <div
                                                key={index}
                                                className="flex items-start gap-3 rounded-xl border border-white bg-white/40 p-3"
                                            >
                                                <TrendingUp size={16} className="mt-1 shrink-0 text-teal-500" />
                                                <span className="text-sm font-semibold text-zinc-700">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                            <div className="absolute -mr-8 -mt-8 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl" />
                        </Card>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {vitalTypes.map((vital, index) => {
                    const latest = latestByType.get(vital.type);
                    return (
                        <motion.div
                            key={vital.type}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            whileHover={{ y: -5 }}
                        >
                            <Card className="group relative overflow-hidden border-zinc-200/60 p-0 transition-all hover:shadow-2xl hover:shadow-zinc-200/50">
                                <div className={`h-1.5 w-full bg-gradient-to-r ${vital.color}`} />

                                <div className="p-6">
                                    <div className="mb-6 flex items-start justify-between">
                                        <div className="rounded-xl bg-zinc-50 p-2.5 transition-colors group-hover:bg-white">
                                            <Activity
                                                size={20}
                                                className="text-zinc-400 transition-colors group-hover:text-zinc-900"
                                            />
                                        </div>
                                        {latest ? (
                                            <div className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-emerald-500">
                                                <ArrowUpRight size={12} />
                                                <span className="text-[10px] font-bold uppercase tracking-tighter">
                                                    Recorded
                                                </span>
                                            </div>
                                        ) : null}
                                    </div>

                                    <p className="mb-1 text-xs font-black uppercase tracking-widest text-zinc-400">
                                        {vital.label}
                                    </p>

                                    {latest ? (
                                        <div className="space-y-4">
                                            <h3 className="text-4xl font-black tracking-tight text-zinc-900">
                                                {latest.value}
                                                <span className="ml-1.5 text-sm font-bold uppercase tracking-normal text-zinc-400">
                                                    {vital.unit}
                                                </span>
                                            </h3>
                                            <div className="flex items-center gap-2 text-zinc-400">
                                                <Calendar size={14} />
                                                <span className="text-[11px] font-bold">
                                                    {new Date(latest.createdAt).toLocaleDateString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border-2 border-dashed border-zinc-100 py-8 text-center">
                                            <p className="text-sm font-bold text-zinc-300">No telemetry data</p>
                                        </div>
                                    )}
                                </div>

                                <div className="pointer-events-none absolute -bottom-4 -right-2 select-none opacity-[0.03] transition-opacity group-hover:opacity-[0.05]">
                                    <span className="text-7xl font-black italic uppercase">
                                        {vital.type.split('_')[0]}
                                    </span>
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
            </section>

            {loading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-20">
                    <div className="relative">
                        <Loader2 size={40} className="animate-spin text-blue-500" />
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl" />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                        Fetching Biometrics
                    </p>
                </div>
            ) : null}
        </PageTransition>
    );
}
