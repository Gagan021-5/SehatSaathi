import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, User, Calendar, Heart, Cigarette,
    Scale, Droplets, Zap, ShieldCheck, AlertTriangle,
    ArrowLeft, Stethoscope, ChevronDown, Loader2,
} from 'lucide-react';
import { predictDiabetes } from '../services/mlApi';
import './DiabetesAssess.css';

const SMOKING_OPTIONS = ['never', 'current', 'former', 'No Info', 'not current', 'ever'];
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

const initial = {
    gender: '', age: 35, hypertension: 0, heart_disease: 0,
    smoking_history: '', bmi: '', HbA1c_level: '', blood_glucose_level: '',
};

export default function DiabetesAssess() {
    const [form, setForm] = useState(initial);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(true);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const canSubmit =
        form.gender && form.smoking_history &&
        form.bmi && form.HbA1c_level && form.blood_glucose_level;

    async function handleSubmit(e) {
        e.preventDefault();
        if (!canSubmit) return;
        setLoading(true);
        setError('');
        try {
            const data = await predictDiabetes(form);
            setResult(data);
            setShowForm(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Analysis failed. Is the ML service running?');
        }
        setLoading(false);
    }

    function resetForm() {
        setResult(null);
        setError('');
        setShowForm(true);
        setForm(initial);
    }

    const isHigh = result?.risk_level === 'high' || result?.risk_level === 'moderate';

    return (
        <div className="da-page">
            <AnimatePresence mode="wait">
                {showForm ? (
                    <motion.div
                        key="form"
                        className="da-card"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* Header */}
                        <div className="da-header">
                            <div className="da-icon-pulse">
                                <Stethoscope size={28} />
                            </div>
                            <div>
                                <h1 className="da-title">AI Health Analysis</h1>
                                <p className="da-subtitle">Diabetes Risk Assessment powered by Machine Learning</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="da-form">
                            <div className="da-grid">
                                {/* Gender */}
                                <div className="da-field">
                                    <label className="da-label"><User size={15} /> Gender</label>
                                    <div className="da-select-wrap">
                                        <select value={form.gender} onChange={e => set('gender', e.target.value)} className="da-select" required>
                                            <option value="">Select gender</option>
                                            {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                        <ChevronDown size={16} className="da-select-icon" />
                                    </div>
                                </div>

                                {/* Age */}
                                <div className="da-field">
                                    <label className="da-label"><Calendar size={15} /> Age</label>
                                    <div className="da-age-row">
                                        <input
                                            type="range" min={1} max={100} value={form.age}
                                            onChange={e => set('age', +e.target.value)}
                                            className="da-slider"
                                        />
                                        <input
                                            type="number" min={1} max={100} value={form.age}
                                            onChange={e => set('age', +e.target.value)}
                                            className="da-age-num"
                                        />
                                    </div>
                                </div>

                                {/* Hypertension toggle */}
                                <div className="da-field">
                                    <label className="da-label"><Activity size={15} /> Hypertension</label>
                                    <button
                                        type="button"
                                        className={`da-toggle ${form.hypertension ? 'da-toggle-on' : ''}`}
                                        onClick={() => set('hypertension', form.hypertension ? 0 : 1)}
                                    >
                                        <span className="da-toggle-thumb" />
                                        <span className="da-toggle-label">{form.hypertension ? 'Yes' : 'No'}</span>
                                    </button>
                                </div>

                                {/* Heart Disease toggle */}
                                <div className="da-field">
                                    <label className="da-label"><Heart size={15} /> Heart Disease</label>
                                    <button
                                        type="button"
                                        className={`da-toggle ${form.heart_disease ? 'da-toggle-on' : ''}`}
                                        onClick={() => set('heart_disease', form.heart_disease ? 0 : 1)}
                                    >
                                        <span className="da-toggle-thumb" />
                                        <span className="da-toggle-label">{form.heart_disease ? 'Yes' : 'No'}</span>
                                    </button>
                                </div>

                                {/* Smoking History */}
                                <div className="da-field">
                                    <label className="da-label"><Cigarette size={15} /> Smoking History</label>
                                    <div className="da-select-wrap">
                                        <select value={form.smoking_history} onChange={e => set('smoking_history', e.target.value)} className="da-select" required>
                                            <option value="">Select history</option>
                                            {SMOKING_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <ChevronDown size={16} className="da-select-icon" />
                                    </div>
                                </div>

                                {/* BMI */}
                                <div className="da-field">
                                    <label className="da-label"><Scale size={15} /> BMI</label>
                                    <input
                                        type="number" step="0.1" min={10} max={100} placeholder="e.g. 27.3"
                                        value={form.bmi} onChange={e => set('bmi', e.target.value)}
                                        className="da-input" required
                                    />
                                </div>

                                {/* HbA1c */}
                                <div className="da-field">
                                    <label className="da-label"><Droplets size={15} /> HbA1c Level</label>
                                    <input
                                        type="number" step="0.1" min={3} max={15} placeholder="e.g. 6.5"
                                        value={form.HbA1c_level} onChange={e => set('HbA1c_level', e.target.value)}
                                        className="da-input" required
                                    />
                                </div>

                                {/* Blood Glucose */}
                                <div className="da-field">
                                    <label className="da-label"><Zap size={15} /> Blood Glucose Level</label>
                                    <input
                                        type="number" step="1" min={50} max={500} placeholder="e.g. 140"
                                        value={form.blood_glucose_level} onChange={e => set('blood_glucose_level', e.target.value)}
                                        className="da-input" required
                                    />
                                </div>
                            </div>

                            {error && <div className="da-error">{error}</div>}

                            <button
                                type="submit"
                                className="da-submit"
                                disabled={!canSubmit || loading}
                            >
                                {loading ? (
                                    <><Loader2 size={20} className="da-spin" /> Processing medical data…</>
                                ) : (
                                    <><Stethoscope size={20} /> Analyze Risk</>
                                )}
                            </button>
                        </form>
                    </motion.div>
                ) : (
                    /* ── Result Panel ── */
                    <motion.div
                        key="result"
                        className="da-card da-result-card"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className={`da-result-hero ${isHigh ? 'da-result-high' : 'da-result-low'}`}>
                            <motion.div
                                className="da-result-icon"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                            >
                                {isHigh ? <AlertTriangle size={56} /> : <ShieldCheck size={56} />}
                            </motion.div>

                            <motion.h2
                                className="da-result-title"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                {isHigh ? 'Elevated Risk Detected' : 'Low Risk'}
                            </motion.h2>

                            <motion.div
                                className="da-result-badge"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                {result?.risk_level?.toUpperCase()} RISK
                            </motion.div>
                        </div>

                        <motion.div
                            className="da-result-details"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <div className="da-stat-grid">
                                <div className="da-stat">
                                    <span className="da-stat-label">Probability</span>
                                    <span className="da-stat-value">{((result?.probability || 0) * 100).toFixed(1)}%</span>
                                </div>
                                <div className="da-stat">
                                    <span className="da-stat-label">Confidence</span>
                                    <span className="da-stat-value">{result?.confidence || 0}%</span>
                                </div>
                            </div>

                            <p className="da-result-message">
                                {isHigh
                                    ? 'Based on the provided health parameters, our AI model has identified elevated markers. We strongly recommend consulting a healthcare professional for a comprehensive evaluation.'
                                    : 'Based on the provided health parameters, your risk indicators appear within normal ranges. Continue maintaining a healthy lifestyle with regular check-ups.'}
                            </p>

                            {isHigh && (
                                <a
                                    href="https://www.who.int/health-topics/diabetes"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="da-cta"
                                >
                                    Learn More About Diabetes →
                                </a>
                            )}
                        </motion.div>

                        <button className="da-back-btn" onClick={resetForm}>
                            <ArrowLeft size={18} /> New Assessment
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
