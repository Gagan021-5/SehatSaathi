import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Activity, Bot, Loader2, Plus, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { addVital, analyzeHealth, getHealthRecords } from '../services/api';
import Card from '../components/common/Card';
import PageTransition from '../components/common/PageTransition';

const vitalTypes = [
    { type: 'blood_pressure', label: 'Blood Pressure', unit: 'mmHg' },
    { type: 'heart_rate', label: 'Heart Rate', unit: 'bpm' },
    { type: 'temperature', label: 'Temperature', unit: 'F' },
    { type: 'blood_sugar', label: 'Blood Sugar', unit: 'mg/dL' },
    { type: 'weight', label: 'Weight', unit: 'kg' },
    { type: 'oxygen', label: 'Oxygen', unit: '%' },
];

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
            toast.success('Vital added successfully.');
            fetchRecords();
        } catch {
            toast.error('Failed to save vital.');
        } finally {
            setSaving(false);
        }
    }

    async function handleAnalyze() {
        setAnalyzing(true);
        try {
            const { data } = await analyzeHealth(currentLanguage.code);
            setAnalysis(data);
        } catch {
            toast.error('Unable to analyze records right now.');
        } finally {
            setAnalyzing(false);
        }
    }

    const latestByType = (type) => records.find((record) => record.type === type);

    return (
        <PageTransition className="mx-auto max-w-6xl space-y-4">
            <Card className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/20 grid place-items-center">
                            <Activity size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Health Records</h1>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                Track vital signs and request AI trend analysis.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowAdd(true)}
                            className="rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-2 text-sm font-semibold text-white inline-flex items-center gap-1 shadow-lg shadow-blue-500/20 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 active:translate-y-0 active:scale-95"
                        >
                            <Plus size={15} /> Add Vital
                        </button>
                        <button
                            type="button"
                            onClick={handleAnalyze}
                            disabled={analyzing}
                            className="rounded-lg border border-zinc-200/70 bg-white/90 px-4 py-2 text-sm font-semibold text-blue-600 inline-flex items-center gap-1 shadow-lg shadow-zinc-200/20 disabled:opacity-50 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10 active:translate-y-0 active:scale-95"
                        >
                            {analyzing ? <Loader2 size={15} className="animate-spin" /> : <Bot size={15} />} Analyze
                        </button>
                    </div>
                </div>
            </Card>

            {showAdd && (
                <Card className="p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-semibold tracking-tight text-zinc-900">Add Vital</h2>
                        <button type="button" onClick={() => setShowAdd(false)} className="p-1 rounded-lg hover:bg-zinc-100">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
                        <select value={addType} onChange={(event) => setAddType(event.target.value)}>
                            {vitalTypes.map((vital) => (
                                <option key={vital.type} value={vital.type}>
                                    {vital.label}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            value={addValue}
                            onChange={(event) => setAddValue(event.target.value)}
                            placeholder="Enter value"
                        />
                        <button
                            type="button"
                            onClick={handleAdd}
                            disabled={saving}
                            className="rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 active:translate-y-0 active:scale-95"
                        >
                            {saving ? <Loader2 size={15} className="animate-spin" /> : 'Save'}
                        </button>
                    </div>
                </Card>
            )}

            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {vitalTypes.map((vital, index) => {
                    const latest = latestByType(vital.type);
                    return (
                        <motion.div
                            key={vital.type}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, ease: 'easeOut', delay: index * 0.05 }}
                        >
                            <Card className="p-5">
                                <p className="text-sm text-zinc-500">{vital.label}</p>
                                {latest ? (
                                    <>
                                        <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
                                            {latest.value} <span className="text-sm font-medium text-zinc-500">{vital.unit}</span>
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            {new Date(latest.createdAt).toLocaleString()}
                                        </p>
                                    </>
                                ) : (
                                    <p className="mt-2 text-sm text-zinc-500">No readings yet</p>
                                )}
                            </Card>
                        </motion.div>
                    );
                })}
            </section>

            {analysis && (
                <Card className="p-5">
                    <h2 className="text-base font-semibold tracking-tight text-zinc-900">AI Analysis</h2>
                    {analysis.health_score != null && (
                        <p className="mt-2 text-sm text-zinc-700">
                            Health Score: <span className="font-semibold text-zinc-900">{analysis.health_score}</span>
                        </p>
                    )}
                    {analysis.summary && <p className="mt-2 text-sm text-zinc-500 leading-relaxed">{analysis.summary}</p>}
                    {analysis.recommendations?.length > 0 && (
                        <ul className="mt-3 space-y-1">
                            {analysis.recommendations.map((item, index) => (
                                <li key={`${item}-${index}`} className="text-sm text-zinc-700">
                                    - {item}
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            )}

            {loading && (
                <Card className="p-6">
                    <p className="text-sm text-zinc-500 inline-flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" /> Loading health records...
                    </p>
                </Card>
            )}
        </PageTransition>
    );
}


