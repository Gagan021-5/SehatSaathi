import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

/**
 * useVoiceLoop — Siri-style continuous voice assistant hook.
 *
 * Flow:
 *  [idle] → startSession() → [listening] → speech detected → [thinking (external)]
 *      → notifyListeningDone() called from ChatPage after audio plays → [listening again]
 *
 * Key design decisions:
 * - Recognition is DESTROYED and RE-CREATED on each listen cycle (avoids "already started" errors)
 * - isSpeakingRef prevents mic from activating while AI audio plays
 * - notifyListeningDone() is a stable callback ChatPage calls after ElevenLabs audio finishes
 */
export function useVoiceLoop({ lang = 'en-US', onSpeechResult }) {
    const [isListening, setIsListening] = useState(false);
    const [isSpeakingState, setIsSpeakingState] = useState(false);
    const [sessionActive, setSessionActive] = useState(false);
    const [voiceError, setVoiceError] = useState(false);

    const sessionActiveRef = useRef(false);
    const isSpeakingRef = useRef(false);
    const transcriptRef = useRef('');
    const debounceRef = useRef(null);
    const recognitionRef = useRef(null);
    const onSpeechResultRef = useRef(onSpeechResult);
    const langRef = useRef(lang);

    // Keep refs always in sync
    useEffect(() => { onSpeechResultRef.current = onSpeechResult; }, [onSpeechResult]);
    useEffect(() => { langRef.current = lang; }, [lang]);

    // ---------- helpers ----------

    const setIsSpeaking = useCallback((val) => {
        isSpeakingRef.current = val;
        setIsSpeakingState(val);
    }, []);

    const clearDebounce = () => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
    };

    const destroyRecognizer = useCallback(() => {
        if (recognitionRef.current) {
            try { recognitionRef.current.onend = null; } catch (_) { }
            try { recognitionRef.current.onresult = null; } catch (_) { }
            try { recognitionRef.current.onerror = null; } catch (_) { }
            try { recognitionRef.current.onstart = null; } catch (_) { }
            try { recognitionRef.current.stop(); } catch (_) { }
            recognitionRef.current = null;
        }
    }, []);

    // ---------- core: create + start a fresh recognizer ----------

    const startListening = useCallback(() => {
        if (!sessionActiveRef.current) return;
        if (isSpeakingRef.current) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error('Speech recognition not supported in this browser.');
            setVoiceError(true);
            return;
        }

        // Always destroy old one before creating new — avoids "already started" errors
        destroyRecognizer();

        transcriptRef.current = '';
        clearDebounce();

        const recognizer = new SpeechRecognition();
        recognizer.lang = langRef.current;
        recognizer.interimResults = true;
        recognizer.continuous = false; // let it end naturally, we restart it
        recognizer.maxAlternatives = 1;
        recognitionRef.current = recognizer;

        recognizer.onstart = () => {
            setIsListening(true);
        };

        recognizer.onresult = (event) => {
            let finalText = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalText += event.results[i][0].transcript;
                }
            }

            if (finalText) {
                transcriptRef.current += ' ' + finalText;
            }

            const accumulated = transcriptRef.current.trim();
            if (accumulated.length > 2 && sessionActiveRef.current && !isSpeakingRef.current) {
                clearDebounce();
                debounceRef.current = setTimeout(() => {
                    if (!sessionActiveRef.current || isSpeakingRef.current) return;
                    const finalTranscript = transcriptRef.current.trim();
                    transcriptRef.current = '';
                    clearDebounce();
                    setIsListening(false);
                    // Stop recognizer before handing off (prevents "onend" restart race)
                    destroyRecognizer();
                    if (onSpeechResultRef.current) onSpeechResultRef.current(finalTranscript);
                }, 1000);
            }
        };

        recognizer.onerror = (event) => {
            clearDebounce();
            if (event.error === 'not-allowed') {
                toast.error('Microphone access denied. Please allow mic access and try again.');
                setVoiceError(true);
                sessionActiveRef.current = false;
                setSessionActive(false);
                setIsListening(false);
                setIsSpeaking(false);
                destroyRecognizer();
                return;
            }
            if (event.error === 'aborted') return; // triggered by our own stop() — ignore
            if (event.error === 'no-speech') {
                // Natural timeout — restart listening if session still active
                setIsListening(false);
                if (sessionActiveRef.current && !isSpeakingRef.current) {
                    setTimeout(() => startListening(), 250);
                }
                return;
            }
            // Other error (network, etc.) — just restart
            setIsListening(false);
            if (sessionActiveRef.current && !isSpeakingRef.current) {
                setTimeout(() => startListening(), 500);
            }
        };

        recognizer.onend = () => {
            setIsListening(false);
            // Only auto-restart if: session still active + not speaking + no pending debounce transcript
            if (sessionActiveRef.current && !isSpeakingRef.current && !debounceRef.current && transcriptRef.current.trim().length === 0) {
                setTimeout(() => startListening(), 250);
            }
        };

        try {
            recognizer.start();
        } catch (e) {
            console.warn('[VoiceLoop] recognizer.start() threw:', e.message);
            setIsListening(false);
            if (sessionActiveRef.current) setTimeout(() => startListening(), 500);
        }
    }, [destroyRecognizer, setIsSpeaking]);

    // ---------- public API ----------

    const startSession = useCallback(() => {
        setVoiceError(false);
        if (sessionActiveRef.current) {
            // Already active — restart listening (toggle behaviour)
            startListening();
            return;
        }
        sessionActiveRef.current = true;
        setSessionActive(true);
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        startListening();
    }, [startListening, setIsSpeaking]);

    const stopSession = useCallback(() => {
        clearDebounce();
        sessionActiveRef.current = false;
        setSessionActive(false);
        destroyRecognizer();
        window.speechSynthesis.cancel();
        setIsListening(false);
        setIsSpeaking(false);
        transcriptRef.current = '';
    }, [destroyRecognizer, setIsSpeaking]);

    /**
     * Called by ChatPage AFTER AI audio (ElevenLabs or SpeechSynthesis) finishes playing.
     * This is the key to the Siri-style loop: audio done → mic auto-restarts.
     */
    const notifyListeningDone = useCallback(() => {
        setIsSpeaking(false);
        if (sessionActiveRef.current) {
            setTimeout(() => startListening(), 400);
        }
    }, [startListening, setIsSpeaking]);

    /**
     * Signals that AI has started speaking — prevents mic from picking up AI's own voice.
     */
    const notifySpeakingStarted = useCallback(() => {
        setIsSpeaking(true);
        // Stop mic while AI speaks
        clearDebounce();
        destroyRecognizer();
        transcriptRef.current = '';
        setIsListening(false);
    }, [destroyRecognizer, setIsSpeaking]);

    // Fallback: speakText via SpeechSynthesis (used when no ElevenLabs audio available)
    const speakText = useCallback((text) => {
        if (!text || !sessionActiveRef.current) return;
        notifySpeakingStarted();
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langRef.current;
        utterance.onend = () => notifyListeningDone();
        utterance.onerror = () => notifyListeningDone();
        window.speechSynthesis.speak(utterance);
    }, [notifySpeakingStarted, notifyListeningDone]);

    const resetSession = useCallback(() => {
        stopSession();
        setVoiceError(false);
    }, [stopSession]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearDebounce();
            destroyRecognizer();
            window.speechSynthesis.cancel();
        };
    }, [destroyRecognizer]);

    return {
        isListening,
        isSpeaking: isSpeakingState,
        sessionActive,
        voiceError,
        startSession,
        stopSession,
        resetSession,
        speakText,
        notifySpeakingStarted,
        notifyListeningDone,
    };
}
