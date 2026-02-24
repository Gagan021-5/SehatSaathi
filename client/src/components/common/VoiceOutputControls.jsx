import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import useVoiceOutput from '../../hooks/useVoiceOutput';
import './VoiceOutputControls.css';

export default function VoiceOutputControls({ text, className = '' }) {
    const { t } = useLanguage();
    const { isSpeaking, isPaused, rate, isSupported, speak, pause, resume, stop, changeRate } = useVoiceOutput();
    const [showSpeed, setShowSpeed] = useState(false);
    const speeds = [0.5, 0.75, 1, 1.25, 1.5];

    if (!isSupported) return null;

    return (
        <div className={`voice-out-controls ${className}`}>
            <button
                className={`vo-btn ${isSpeaking ? 'vo-btn-active' : ''}`}
                onClick={() => {
                    if (isSpeaking && !isPaused) pause();
                    else if (isPaused) resume();
                    else speak(text);
                }}
                title={isSpeaking ? (isPaused ? 'Resume' : 'Pause') : t('voice.readAloud')}
            >
                {isSpeaking && !isPaused ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8.5v7a4.49 4.49 0 0 0 2.5-3.5zM14 3.23v2.06a6.51 6.51 0 0 1 0 13.42v2.06A8.5 8.5 0 0 0 14 3.23z" /></svg>
                )}
                {isSpeaking && !isPaused && (
                    <span className="vo-wave">
                        <span className="vo-wave-bar vo-w1" /><span className="vo-wave-bar vo-w2" /><span className="vo-wave-bar vo-w3" />
                    </span>
                )}
            </button>

            {isSpeaking && (
                <button className="vo-btn vo-btn-stop" onClick={stop} title={t('voice.stop')}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
                </button>
            )}

            <div className="vo-speed-wrap">
                <button className="vo-speed-btn" onClick={() => setShowSpeed(!showSpeed)}>
                    {rate}x
                </button>
                {showSpeed && (
                    <div className="vo-speed-dropdown">
                        {speeds.map(s => (
                            <button key={s} className={`vo-speed-opt ${rate === s ? 'active' : ''}`} onClick={() => { changeRate(s); setShowSpeed(false); }}>
                                {s}x
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
