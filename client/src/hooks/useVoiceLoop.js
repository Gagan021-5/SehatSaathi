import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

export function useVoiceLoop({ lang = 'en-US', onSpeechResult }) {
    const [isListening, setIsListening] = useState(false);
    const [isSpeakingState, setIsSpeakingState] = useState(false);
    const [voiceError, setVoiceError] = useState(false);

    const recognitionRef = useRef(null);
    const sessionActiveRef = useRef(false);
    const isSpeakingRef = useRef(false);
    const silenceTimeoutRef = useRef(null);
    const onSpeechResultRef = useRef(onSpeechResult);

    // Keep the callback ref always up-to-date without re-running effects
    useEffect(() => {
        onSpeechResultRef.current = onSpeechResult;
    }, [onSpeechResult]);

    const setIsSpeaking = useCallback((val) => {
        isSpeakingRef.current = val;
        setIsSpeakingState(val);
    }, []);

    const playPing = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) { /* ignore */ }
    };

    const clearSilenceTimer = () => {
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }
    };

    const transcriptRef = useRef('');

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognizer = new SpeechRecognition();
        recognizer.lang = lang;
        recognizer.interimResults = true;
        recognizer.maxAlternatives = 1;

        recognizer.onstart = () => {
            setIsListening(true);
            // Only reset transcript when starting fresh — NOT when restarting mid-deounce
            clearSilenceTimer();
            silenceTimeoutRef.current = setTimeout(() => {
                playPing();
                toast('Voice session paused. Still there?', { icon: '💤' });
                if (recognitionRef.current) recognitionRef.current.stop();
                sessionActiveRef.current = false;
                setIsListening(false);
            }, 10000);
        };

        recognizer.onresult = (event) => {
            clearSilenceTimer();

            let currentFinal = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    currentFinal += event.results[i][0].transcript;
                }
            }

            if (currentFinal) {
                transcriptRef.current += ' ' + currentFinal;
            }

            const completeTranscript = transcriptRef.current.trim();

            if (completeTranscript.length > 2 && sessionActiveRef.current && !isSpeakingRef.current) {
                // 1000ms Silence Debounce for Demo Stability
                silenceTimeoutRef.current = setTimeout(() => {
                    if (sessionActiveRef.current && !isSpeakingRef.current) {
                        const final = transcriptRef.current.trim();
                        transcriptRef.current = ''; // Reset for next turn

                        setIsListening(false);
                        // Step 2 & 3: Immediately stop listener and trigger result (showing Thinking)
                        if (recognitionRef.current) recognitionRef.current.stop();
                        if (onSpeechResultRef.current) onSpeechResultRef.current(final);
                    }
                }, 1000);
            }
        };

        recognizer.onerror = (event) => {
            clearSilenceTimer();
            if (event.error === 'not-allowed') {
                toast.error('Microphone access denied.');
                setVoiceError(true);
                sessionActiveRef.current = false;
                setIsListening(false);
                setIsSpeaking(false);
                if (recognitionRef.current) recognitionRef.current.stop();
            }
            if (event.error === 'no-speech' && sessionActiveRef.current && !isSpeakingRef.current) {
                // Restart listening if no speech was detected and session is active
                try {
                    recognizer.start();
                } catch (e) {
                    // Ignore already started errors
                }
            } else {
                setIsListening(false);
            }
        };

        recognizer.onend = () => {
            setIsListening(false);
            // IMPORTANT: Do NOT clear the silence timer here!
            // If there's a pending transcript in the debounce, killing the timer
            // means the user's speech will never get sent to the AI.
            // Only restart listening if there is NO pending transcript waiting to fire.
            const hasPendingTranscript = transcriptRef.current.trim().length > 0;
            if (sessionActiveRef.current && !isSpeakingRef.current && !hasPendingTranscript) {
                try {
                    transcriptRef.current = ''; // Safe to reset only when truly starting fresh
                    recognizer.start();
                } catch (e) {
                    // Ignore already started errors
                }
            }
        };

        recognitionRef.current = recognizer;

        return () => {
            clearSilenceTimer();
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                recognitionRef.current.stop();
            }
        };
    }, [lang]); // Only depend on lang — onSpeechResult is accessed via stable ref

    // Separate unmount cleanup for speech synthesis
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    const startSession = useCallback(() => {
        setVoiceError(false);
        if (!recognitionRef.current) {
            toast.error('Speech recognition not supported in this browser.');
            setVoiceError(true);
            return;
        }

        sessionActiveRef.current = true;
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        try {
            recognitionRef.current.start();
        } catch (e) {
            // Might already be started
        }
    }, []);

    const stopSession = useCallback(() => {
        clearSilenceTimer();
        sessionActiveRef.current = false;
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        window.speechSynthesis.cancel();
        setIsListening(false);
        setIsSpeaking(false);
    }, []);

    const speakText = useCallback((text) => {
        if (!text) return;
        clearSilenceTimer();

        // Stop listening while speaking
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        setIsListening(false);
        setIsSpeaking(true);

        window.speechSynthesis.cancel(); // Cancel any ongoing speech

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;

        utterance.onend = () => {
            setIsSpeaking(false);
            if (sessionActiveRef.current) {
                // Resume listening after speaking is done
                setTimeout(() => {
                    try {
                        if (sessionActiveRef.current) recognitionRef.current.start();
                    } catch (e) {
                        // ignore
                    }
                }, 300); // slight delay to prevent overlapping audio issues
            }
        };

        utterance.onerror = () => {
            setIsSpeaking(false);
            if (sessionActiveRef.current) {
                try {
                    recognitionRef.current.start();
                } catch (e) {
                    // ignore
                }
            }
        };

        window.speechSynthesis.speak(utterance);
    }, [lang]);

    const resetSession = useCallback(() => {
        stopSession();
        setVoiceError(false);
    }, [stopSession]);

    return {
        isListening,
        isSpeaking: isSpeakingState,
        sessionActive: sessionActiveRef.current,
        voiceError,
        startSession,
        stopSession,
        resetSession,
        speakText
    };
}
