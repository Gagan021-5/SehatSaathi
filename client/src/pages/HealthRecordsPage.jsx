import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getHealthRecords, addVital, analyzeHealth } from '../services/api';
import toast from 'react-hot-toast';
import { Activity, Plus, Bot, Loader2, X, TrendingUp, Heart, Thermometer, Droplets, Scale, Wind } from 'lucide-react';

const VITAL_TYPES = [
    { type: 'blood_pressure', label: 'Blood Pressure', emoji: '🩸', icon: Activity, unit: 'mmHg', color: 'text-red-600 bg-red-50' },
    { type: 'heart_rate', label: 'Heart Rate', emoji: '❤️', icon: Heart, unit: 'bpm', color: 'text-pink-600 bg-pink-50' },
    { type: 'temperature', label: 'Temperature', emoji: '🌡️', icon: Thermometer, unit: '°F', color: 'text-orange-600 bg-orange-50' },
    { type: 'blood_sugar', label: 'Blood Sugar', emoji: '🍬', icon: Droplets, unit: 'mg/dL', color: 'text-purple-600 bg-purple-50' },
    { type: 'weight', label: 'Weight', emoji: '⚖️', icon: Scale, unit: 'kg', color: 'text-blue-600 bg-blue-50' },
    { type: 'oxygen', label: 'Oxygen Level', emoji: '💨', icon: Wind, unit: '%', color: 'text-teal-600 bg-teal-50' },
];

export default function HealthRecordsPage() {
    const { currentLanguage } = useLanguage();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [addType, setAddType] = useState('blood_pressure');
    const [addValue, setAddValue] = useState('');
    const [saving, setSaving] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => { fetchRecords(); }, []);

    async function fetchRecords() {
        try {
            const { data } = await getHealthRecords();
            setRecords(Array.isArray(data) ? data : []);
        } catch { setRecords([]); }
        setLoading(false);
    }

    async function handleAdd() {
        if (!addValue) { toast.error('Enter a value'); return; }
        setSaving(true);
        try {
            await addVital({ type: addType, value: addValue });
            toast.success('Vital recorded!');
            setShowAdd(false); setAddValue('');
            fetchRecords();
        } catch { toast.error('Failed to save'); }
        setSaving(false);
    }

    async function handleAnalyze() {
        setAnalyzing(true);
        try {
            const { data } = await analyzeHealth(currentLanguage.code);
            setAnalysis(data);
            toast.success('Analysis complete!');
        } catch { toast.error('Analysis failed'); }
        setAnalyzing(false);
    }

    function getLatest(type) {
        const r = records.find(x => x.type === type);
        return r ? { value: r.value, date: new Date(r.createdAt).toLocaleDateString() } : null;
    }

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6 animate-fadeInUp">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white"><Activity size={24} /></div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Health Records</h1>
                        <p className="text-sm text-gray-500">Track your vitals & get AI insights</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowAdd(true)}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 hover:shadow-xl flex items-center gap-1.5 transition-all">
                        <Plus size={16} /> Add Vital
                    </button>
                    <button onClick={handleAnalyze} disabled={analyzing}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 text-white font-semibold text-sm shadow-lg shadow-purple-500/20 hover:shadow-xl flex items-center gap-1.5 transition-all disabled:opacity-50">
                        {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />} AI Analysis
                    </button>
                </div>
            </div>

            {/* Vital Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {VITAL_TYPES.map((v, i) => {
                    const latest = getLatest(v.type);
                    const Icon = v.icon;
                    return (
                        <div key={v.type} className={`bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all animate-fadeInUp delay-${i + 1}`}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-xl ${v.color} flex items-center justify-center`}><Icon size={20} /></div>
                                <span className="text-sm font-semibold text-gray-700">{v.emoji} {v.label}</span>
                            </div>
                            {latest ? (
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{latest.value} <span className="text-sm font-normal text-gray-400">{v.unit}</span></p>
                                    <p className="text-xs text-gray-400 mt-1">{latest.date}</p>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">No data yet</p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add Vital Panel */}
            {showAdd && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 mb-6 animate-slideUp">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900">Add Vital Reading</h3>
                        <button onClick={() => setShowAdd(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <select value={addType} onChange={e => setAddType(e.target.value)}
                            className="flex-1 py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10">
                            {VITAL_TYPES.map(v => <option key={v.type} value={v.type}>{v.emoji} {v.label}</option>)}
                        </select>
                        <input type="number" placeholder="Value" value={addValue} onChange={e => setAddValue(e.target.value)}
                            className="flex-1 py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
                        <button onClick={handleAdd} disabled={saving}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Save
                        </button>
                    </div>
                </div>
            )}

            {/* AI Analysis */}
            {analysis && (
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl border border-purple-200 p-6 animate-slideUp">
                    <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2"><Bot size={20} /> AI Health Analysis</h3>
                    {analysis.health_score !== undefined && (
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-20 h-20 rounded-full border-4 border-purple-300 flex items-center justify-center">
                                <span className="text-2xl font-bold text-purple-700">{analysis.health_score}</span>
                            </div>
                            <p className="text-sm text-purple-800">{analysis.summary}</p>
                        </div>
                    )}
                    {analysis.recommendations?.length > 0 && (
                        <ul className="space-y-1.5">
                            {analysis.recommendations.map((r, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-purple-800">
                                    <TrendingUp size={14} className="text-purple-500 mt-0.5" /> {r}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
                </div>
            )}
        </div>
    );
}
