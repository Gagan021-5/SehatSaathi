import { useState, useRef, useCallback, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function useVoiceInput() {
    const { currentLanguage } = useLanguage();
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState(null);
    const [isSupported, setIsSupported] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        setIsSupported(!!SpeechRecognition);
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;

            recognition.onresult = (event) => {
                let interim = '';
                let final = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (result.isFinal) {
                        final += result[0].transcript + ' ';
                    } else {
                        interim += result[0].transcript;
                    }
                }
                if (final) setTranscript(prev => prev + final);
                setInterimTranscript(interim);
            };

            recognition.onerror = (event) => {
                if (event.error === 'not-allowed') setError('Microphone access denied.');
                else if (event.error === 'no-speech') setError('No speech detected.');
                else setError(`Speech error: ${event.error}`);
                setIsListening(false);
            };

            recognition.onend = () => { setIsListening(false); setInterimTranscript(''); };
            recognitionRef.current = recognition;
        }
        return () => { if (recognitionRef.current) recognitionRef.current.abort(); };
    }, []);

    useEffect(() => {
        if (recognitionRef.current) recognitionRef.current.lang = currentLanguage.speechCode;
    }, [currentLanguage]);

    const startListening = useCallback(() => {
        if (!recognitionRef.current) return;
        setError(null); setTranscript(''); setInterimTranscript('');
        recognitionRef.current.lang = currentLanguage.speechCode;
        try { recognitionRef.current.start(); setIsListening(true); }
        catch { recognitionRef.current.stop(); setTimeout(() => { recognitionRef.current.start(); setIsListening(true); }, 100); }
    }, [currentLanguage]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) { recognitionRef.current.stop(); setIsListening(false); }
    }, []);

    const resetTranscript = useCallback(() => { setTranscript(''); setInterimTranscript(''); }, []);

    return { isListening, transcript, interimTranscript, error, isSupported, startListening, stopListening, resetTranscript };
}
