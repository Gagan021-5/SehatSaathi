import { useState, useRef, useCallback, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function useVoiceOutput() {
    const { currentLanguage } = useLanguage();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [rate, setRate] = useState(1);
    const [isSupported, setIsSupported] = useState(false);
    const [availableVoices, setAvailableVoices] = useState([]);
    const [autoRead, setAutoRead] = useState(() => localStorage.getItem('sehat_auto_read') === 'true');
    const utteranceRef = useRef(null);

    useEffect(() => {
        setIsSupported('speechSynthesis' in window);
        if ('speechSynthesis' in window) {
            const loadVoices = () => setAvailableVoices(window.speechSynthesis.getVoices());
            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    const getBestVoice = useCallback(() => {
        const langCode = currentLanguage.speechCode;
        const shortCode = currentLanguage.code;
        let voice = availableVoices.find(v => v.lang === langCode);
        if (!voice) voice = availableVoices.find(v => v.lang.startsWith(shortCode));
        if (!voice) voice = availableVoices.find(v => v.lang === 'en-IN');
        return voice || null;
    }, [availableVoices, currentLanguage]);

    const speak = useCallback((text) => {
        if (!isSupported || !text) return;
        window.speechSynthesis.cancel();
        const cleanText = text
            .replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
            .replace(/#{1,6}\s/g, '').replace(/```[\s\S]*?```/g, '')
            .replace(/`(.*?)`/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/[•\-]\s/g, ', ').trim();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        const voice = getBestVoice();
        if (voice) utterance.voice = voice;
        utterance.lang = currentLanguage.speechCode;
        utterance.rate = rate;
        utterance.pitch = 1;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => { setIsSpeaking(false); setIsPaused(false); };
        utterance.onerror = () => { setIsSpeaking(false); setIsPaused(false); };
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [isSupported, getBestVoice, currentLanguage, rate]);

    const pause = useCallback(() => { if (isSpeaking) { window.speechSynthesis.pause(); setIsPaused(true); } }, [isSpeaking]);
    const resume = useCallback(() => { if (isPaused) { window.speechSynthesis.resume(); setIsPaused(false); } }, [isPaused]);
    const stop = useCallback(() => { window.speechSynthesis.cancel(); setIsSpeaking(false); setIsPaused(false); }, []);
    const changeRate = useCallback((r) => setRate(r), []);
    const toggleAutoRead = useCallback(() => {
        setAutoRead(prev => { const next = !prev; localStorage.setItem('sehat_auto_read', String(next)); return next; });
    }, []);

    useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

    return { isSpeaking, isPaused, rate, isSupported, autoRead, speak, pause, resume, stop, changeRate, toggleAutoRead };
}
