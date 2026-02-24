import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import useVoiceInput from '../../hooks/useVoiceInput';
import './VoiceInputButton.css';

export default function VoiceInputButton({ onTranscript, className = '', size = 'md' }) {
    const { t } = useLanguage();
    const { isListening, transcript, interimTranscript, error, isSupported, startListening, stopListening } = useVoiceInput();
    const prevListeningRef = useRef(false);

    const sizes = { sm: 36, md: 48, lg: 56 };
    const btnSize = sizes[size] || sizes.md;

    useEffect(() => {
        if (prevListeningRef.current && !isListening && transcript) {
            onTranscript?.(transcript.trim());
        }
        prevListeningRef.current = isListening;
    }, [isListening, transcript, onTranscript]);

    const handleClick = () => {
        if (isListening) stopListening();
        else startListening();
    };

    if (!isSupported) {
        return (
            <button className={`voice-btn voice-btn-disabled ${className}`} style={{ width: btnSize, height: btnSize }} disabled title="Voice not supported">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /><line x1="1" y1="1" x2="23" y2="23" stroke="#ef4444" /></svg>
            </button>
        );
    }

    return (
        <div className={`voice-btn-wrapper ${className}`}>
            <button
                className={`voice-btn ${isListening ? 'voice-btn-active' : ''}`}
                style={{ width: btnSize, height: btnSize }}
                onClick={handleClick}
                title={isListening ? t('voice.tapToStop') : t('chat.voiceHint')}
            >
                {isListening && (
                    <>
                        <span className="voice-pulse-ring voice-pulse-ring-1" style={{ width: btnSize, height: btnSize }} />
                        <span className="voice-pulse-ring voice-pulse-ring-2" style={{ width: btnSize, height: btnSize }} />
                        <span className="voice-pulse-ring voice-pulse-ring-3" style={{ width: btnSize, height: btnSize }} />
                    </>
                )}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                {isListening && (
                    <div className="voice-waveform">
                        <span className="wave-bar wave-bar-1" /><span className="wave-bar wave-bar-2" />
                        <span className="wave-bar wave-bar-3" /><span className="wave-bar wave-bar-4" />
                        <span className="wave-bar wave-bar-5" />
                    </div>
                )}
            </button>
            {isListening && (
                <div className="voice-status">
                    <span className="voice-status-dot" />
                    {interimTranscript || t('chat.listening')}
                </div>
            )}
            {error && <div className="voice-error">{error}</div>}
        </div>
    );
}
