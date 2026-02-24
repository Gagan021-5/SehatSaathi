import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import VoiceInputButton from '../components/common/VoiceInputButton';
import VoiceOutputControls from '../components/common/VoiceOutputControls';
import { getEmergencyGuidance } from '../services/api';
import './EmergencyPage.css';

const EMERGENCIES = [
    { icon: '🫀', key: 'Heart Attack', color: '#ef4444' },
    { icon: '🤕', key: 'Head Injury', color: '#f59e0b' },
    { icon: '🔥', key: 'Burns', color: '#f97316' },
    { icon: '🐍', key: 'Snake Bite', color: '#10b981' },
    { icon: '💧', key: 'Drowning', color: '#06b6d4' },
    { icon: '🩸', key: 'Heavy Bleeding', color: '#dc2626' },
    { icon: '⚡', key: 'Electric Shock', color: '#8b5cf6' },
    { icon: '🤒', key: 'High Fever', color: '#ec4899' },
];

export default function EmergencyPage() {
    const { t, currentLanguage } = useLanguage();
    const [selectedEmergency, setSelectedEmergency] = useState(null);
    const [guidance, setGuidance] = useState(null);
    const [loading, setLoading] = useState(false);
    const [customSituation, setCustomSituation] = useState('');

    const handleEmergency = async (situation) => {
        setSelectedEmergency(situation);
        setLoading(true);
        try {
            const res = await getEmergencyGuidance({ situation, language: currentLanguage.code });
            setGuidance(res.data?.guidance || res.data?.steps || 'Follow basic first-aid procedures and call 112 immediately.');
        } catch {
            setGuidance(t('common.error'));
        }
        setLoading(false);
    };

    const handleVoiceTranscript = (text) => {
        setCustomSituation(text);
        handleEmergency(text);
    };

    return (
        <div className="emg-page">
            <div className="emg-top-bar">
                <a href="tel:112" className="emg-call-112">
                    📞 {t('emergency.call')} — 112
                </a>
            </div>

            <h1 className="emg-title">🚨 {t('emergency.title')}</h1>

            <div className="emg-voice-section">
                <p className="emg-voice-label">{t('chat.voiceHint')}</p>
                <VoiceInputButton onTranscript={handleVoiceTranscript} size="lg" />
            </div>

            <div className="emg-grid">
                {EMERGENCIES.map((e, i) => (
                    <button key={i} className={`emg-card ${selectedEmergency === e.key ? 'emg-card-active' : ''}`} style={{ '--emg-color': e.color }} onClick={() => handleEmergency(e.key)}>
                        <span className="emg-card-icon">{e.icon}</span>
                        <span className="emg-card-label">{e.key}</span>
                    </button>
                ))}
            </div>

            {loading && (
                <div className="emg-loading">
                    <div className="emg-loading-spin" />
                    <span>{t('common.loading')}</span>
                </div>
            )}

            {guidance && !loading && (
                <div className="emg-guidance">
                    <div className="emg-guidance-header">
                        <h2>🏥 {t('emergency.firstAid')}: {selectedEmergency}</h2>
                        <VoiceOutputControls text={typeof guidance === 'string' ? guidance : JSON.stringify(guidance)} />
                    </div>
                    <div className="emg-guidance-content">
                        {typeof guidance === 'string' ? (
                            <p>{guidance}</p>
                        ) : (
                            <ul>{guidance.map((step, i) => <li key={i}>{step}</li>)}</ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
