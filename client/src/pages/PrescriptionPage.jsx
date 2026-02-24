import { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import VoiceOutputControls from '../components/common/VoiceOutputControls';
import { analyzePrescription, explainMedicine } from '../services/api';
import './PrescriptionPage.css';

export default function PrescriptionPage() {
    const { t, currentLanguage } = useLanguage();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [medicines, setMedicines] = useState([]);
    const fileRef = useRef(null);

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (f) {
            setFile(f);
            setPreview(URL.createObjectURL(f));
        }
    };

    const handleAnalyze = async () => {
        if (!file || loading) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('language', currentLanguage.code);
            const res = await analyzePrescription(formData);
            setResult(res.data);
            if (res.data?.medicines?.length) {
                const explained = await Promise.all(
                    res.data.medicines.map(m =>
                        explainMedicine({ medicine: m.name || m, language: currentLanguage.code })
                            .then(r => r.data).catch(() => ({ name: m.name || m, simpleExplanation: '' }))
                    )
                );
                setMedicines(explained);
            }
        } catch { setResult({ error: t('common.error') }); }
        setLoading(false);
    };

    return (
        <div className="rx-page">
            <h1 className="rx-title">💊 {t('prescription.title')}</h1>

            <div className="rx-upload-area" onClick={() => fileRef.current?.click()}>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} hidden />
                {preview ? (
                    <img src={preview} alt="Prescription" className="rx-preview" />
                ) : (
                    <div className="rx-upload-placeholder">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                        <p>{t('prescription.upload')}</p>
                    </div>
                )}
            </div>

            {file && (
                <button className="rx-analyze-btn" onClick={handleAnalyze} disabled={loading}>
                    {loading ? t('common.loading') : `🔍 Analyze`}
                </button>
            )}

            {result?.error && <div className="rx-error">{result.error}</div>}

            {result && !result.error && (
                <div className="rx-result">
                    {result.text && (
                        <div className="rx-ocr-text">
                            <h3>📝 OCR Result</h3>
                            <p>{result.text}</p>
                        </div>
                    )}

                    {medicines.length > 0 && (
                        <div className="rx-medicines">
                            <h2 className="rx-medicines-title">💊 {t('prescription.explain')}</h2>
                            {medicines.map((med, i) => (
                                <div key={i} className="rx-med-card">
                                    <div className="rx-med-header">
                                        <span className="rx-med-icon">💊</span>
                                        <h3 className="rx-med-name">{med.name}</h3>
                                    </div>
                                    {med.simpleExplanation && (
                                        <p className="rx-med-explain">{med.simpleExplanation}</p>
                                    )}
                                    <div className="rx-med-timing">
                                        {med.timing?.morning && <span className="rx-timing-badge">☀️ Morning</span>}
                                        {med.timing?.afternoon && <span className="rx-timing-badge">🌤️ Afternoon</span>}
                                        {med.timing?.evening && <span className="rx-timing-badge">🌅 Evening</span>}
                                        {med.timing?.night && <span className="rx-timing-badge">🌙 Night</span>}
                                    </div>
                                    <div className="rx-med-info">
                                        <span className="rx-info-badge">{med.withFood ? '🍽️ ' + t('prescription.withFood') : '⭕ ' + t('prescription.emptyStomach')}</span>
                                    </div>
                                    {med.warnings?.length > 0 && (
                                        <div className="rx-med-warnings">
                                            <span className="rx-warn-label">⚠️ {t('prescription.warnings')}:</span>
                                            {med.warnings.map((w, j) => <span key={j} className="rx-warn-item">{w}</span>)}
                                        </div>
                                    )}
                                    <div className="rx-med-voice">
                                        <VoiceOutputControls text={`${med.name}. ${med.simpleExplanation || ''}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
