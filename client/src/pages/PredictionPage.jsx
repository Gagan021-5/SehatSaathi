import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import VoiceOutputControls from '../components/common/VoiceOutputControls';
import { predictDisease } from '../services/api';
import './PredictionPage.css';

const SYMPTOMS = [
    'Fever', 'Headache', 'Cough', 'Cold', 'Body Pain', 'Fatigue', 'Nausea',
    'Vomiting', 'Diarrhea', 'Stomach Pain', 'Chest Pain', 'Breathlessness',
    'Dizziness', 'Skin Rash', 'Joint Pain', 'Sore Throat', 'Loss of Appetite',
    'Weight Loss', 'Sweating', 'Chills', 'Muscle Pain', 'Back Pain',
    'Burning Urination', 'Swelling', 'Itching', 'Blurred Vision'
];

export default function PredictionPage() {
    const { t, currentLanguage } = useLanguage();
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const toggleSymptom = (s) => {
        setSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    };

    const handlePredict = async () => {
        if (selected.length === 0 || loading) return;
        setLoading(true);
        try {
            const res = await predictDisease({ symptoms: selected, language: currentLanguage.code });
            setResult(res.data);
        } catch {
            setResult({ error: t('common.error') });
        }
        setLoading(false);
    };

    return (
        <div className="pred-page">
            <div className="pred-header">
                <h1 className="pred-title">🔬 {t('predict.title')}</h1>
                <p className="pred-subtitle">{t('predict.subtitle')}</p>
            </div>

            <div className="pred-symptoms">
                {SYMPTOMS.map(s => (
                    <button key={s} className={`pred-symptom ${selected.includes(s) ? 'pred-symptom-active' : ''}`} onClick={() => toggleSymptom(s)}>
                        {selected.includes(s) && '✓ '}{s}
                    </button>
                ))}
            </div>

            {selected.length > 0 && (
                <div className="pred-selected-bar">
                    <span>{selected.length} symptoms selected</span>
                    <button className="pred-analyze-btn" onClick={handlePredict} disabled={loading}>
                        {loading ? t('common.loading') : t('predict.analyze')}
                    </button>
                </div>
            )}

            {result && !result.error && (
                <div className="pred-result">
                    <div className="pred-result-header">
                        <h2>📊 {t('predict.result')}</h2>
                    </div>
                    <div className="pred-result-card">
                        <div className="pred-disease">
                            <span className="pred-disease-name">{result.prediction || result.disease || 'Analysis Complete'}</span>
                            {result.confidence && (
                                <div className="pred-confidence">
                                    <span>{t('predict.confidence')}: {Math.round(result.confidence * 100)}%</span>
                                    <div className="pred-conf-bar">
                                        <div className="pred-conf-fill" style={{ width: `${result.confidence * 100}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>
                        {result.explanation && (
                            <div className="pred-explanation">
                                <h3>💡 {t('predict.explanation')}</h3>
                                <p>{result.explanation}</p>
                                <VoiceOutputControls text={result.explanation} />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {result?.error && <div className="pred-error">{result.error}</div>}
        </div>
    );
}
