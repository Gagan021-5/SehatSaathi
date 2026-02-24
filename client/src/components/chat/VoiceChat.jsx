import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import useVoiceInput from '../../hooks/useVoiceInput';
import useVoiceOutput from '../../hooks/useVoiceOutput';
import { sendChatMessage } from '../../services/api';
import './VoiceChat.css';

export default function VoiceChat() {
    const { currentLanguage, t } = useLanguage();
    const { isListening, transcript, interimTranscript, isSupported, startListening, stopListening, resetTranscript } = useVoiceInput();
    const { isSpeaking, speak, stop: stopSpeaking, isSupported: ttsSupported } = useVoiceOutput();
    const [state, setState] = useState('idle'); // idle, listening, processing, speaking
    const [lastResponse, setLastResponse] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const prevListeningRef = useRef(false);

    useEffect(() => {
        if (prevListeningRef.current && !isListening && transcript.trim()) {
            handleSend(transcript.trim());
        }
        prevListeningRef.current = isListening;
    }, [isListening]);

    useEffect(() => {
        if (isListening) setState('listening');
    }, [isListening]);

    const handleSend = async (text) => {
        setState('processing');
        try {
            const res = await sendChatMessage({ message: text, language: currentLanguage.code, sessionId });
            const aiMsg = res.data?.reply || res.data?.message || 'No response';
            if (res.data?.sessionId) setSessionId(res.data.sessionId);
            setLastResponse(aiMsg);
            setState('speaking');
            if (ttsSupported) speak(aiMsg);
            else setState('idle');
        } catch (err) {
            setLastResponse(t('common.error'));
            setState('idle');
        }
    };

    useEffect(() => {
        if (state === 'speaking' && !isSpeaking && lastResponse) {
            const timer = setTimeout(() => setState('idle'), 1000);
            return () => clearTimeout(timer);
        }
    }, [isSpeaking, state, lastResponse]);

    const handleMicClick = () => {
        if (isListening) { stopListening(); return; }
        if (isSpeaking) stopSpeaking();
        resetTranscript();
        startListening();
    };

    const stateText = {
        idle: t('chat.voiceHint'),
        listening: t('chat.listening'),
        processing: t('chat.thinking'),
        speaking: t('voice.readAloud')
    };

    return (
        <div className="vc-container">
            <div className="vc-header">
                <span className="vc-lang-badge">{currentLanguage.flag} {currentLanguage.nativeName}</span>
            </div>

            <div className="vc-main">
                <div className={`vc-doctor ${state === 'speaking' ? 'vc-doctor-speaking' : ''}`}>
                    <div className="vc-doctor-avatar">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><path d="M9 14l-1 7h8l-1-7" stroke="none" fill="rgba(255,255,255,0.15)" /></svg>
                    </div>
                    <span className="vc-doctor-label">AI {t('nav.chat').replace('AI ', '')}</span>
                </div>

                <p className="vc-state-text">
                    {state === 'listening' && '🎤 '}
                    {state === 'processing' && '🤔 '}
                    {state === 'speaking' && '🔊 '}
                    {stateText[state]}
                </p>

                {(state === 'listening') && (
                    <p className="vc-interim">{interimTranscript || transcript || '...'}</p>
                )}

                <button className={`vc-mic-btn ${isListening ? 'vc-mic-active' : ''} ${state === 'processing' ? 'vc-mic-disabled' : ''}`} onClick={handleMicClick} disabled={state === 'processing'}>
                    {isListening && (<><span className="vc-pulse vc-pulse-1" /><span className="vc-pulse vc-pulse-2" /><span className="vc-pulse vc-pulse-3" /></>)}
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                </button>

                {lastResponse && (
                    <div className="vc-response">
                        <p className="vc-response-text">{lastResponse}</p>
                        <button className="vc-listen-btn" onClick={() => speak(lastResponse)}>
                            🔊 {t('voice.readAloud')}
                        </button>
                    </div>
                )}
            </div>

            <a href="tel:112" className="vc-sos-btn">🚨 {t('emergency.call')} — 112</a>
        </div>
    );
}
