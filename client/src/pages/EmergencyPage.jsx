import { useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    Loader2,
    Mic,
    MicOff,
    Phone,
    Siren,
    Volume2,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getEmergencyGuidance } from '../services/api';
import Card from '../components/common/Card';
import PageTransition from '../components/common/PageTransition';

const emergencies = [
    'Heart Attack',
    'Choking',
    'Severe Bleeding',
    'Burns',
    'Seizure',
    'Allergic Reaction',
    'Fracture',
    'Drowning',
];

export default function EmergencyPage() {
    const { currentLanguage } = useLanguage();

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedType, setSelectedType] = useState('');
    const [customDesc, setCustomDesc] = useState('');
    const [listening, setListening] = useState(false);

    async function handleEmergency(situation) {
        setSelectedType(situation);
        setLoading(true);
        setResult(null);
        try {
            const { data } = await getEmergencyGuidance({ situation, language: currentLanguage.code });
            setResult(data);
        } catch {
            toast.error('Unable to fetch emergency guidance right now.');
        } finally {
            setLoading(false);
        }
    }

    function toggleMic() {
        if (listening) return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error('Speech recognition is not supported in this browser.');
            return;
        }
        const recognizer = new SpeechRecognition();
        recognizer.lang = currentLanguage.speechCode || 'en-IN';
        recognizer.onresult = (event) => {
            setCustomDesc(event.results[0][0].transcript || '');
            setListening(false);
        };
        recognizer.onerror = () => setListening(false);
        recognizer.onend = () => setListening(false);
        recognizer.start();
        setListening(true);
    }

    const steps = result?.steps || result?.result?.steps || [];
    const doNot = result?.do_not || result?.result?.do_not || [];
    const whileWaiting = result?.while_waiting || result?.result?.while_waiting || [];

    return (
        <PageTransition className="mx-auto max-w-5xl space-y-4">
            <Card className="p-6 border-rose-200 bg-gradient-to-r from-rose-50 to-red-50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-lg shadow-rose-500/20 grid place-items-center">
                            <Siren size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Emergency SOS</h1>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                Immediate first-aid guidance while emergency help is on the way.
                            </p>
                        </div>
                    </div>
                    <a
                        href="tel:112"
                        className="rounded-lg bg-gradient-to-r from-rose-600 to-red-500 px-4 py-3 text-sm font-semibold text-white inline-flex items-center gap-2 shadow-lg shadow-rose-500/20 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-500/30 active:translate-y-0 active:scale-95"
                    >
                        <Phone size={16} /> Call 112
                    </a>
                </div>
            </Card>

            <Card className="p-5">
                <h2 className="text-base font-semibold tracking-tight text-zinc-900 mb-3">Emergency Types</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {emergencies.map((item, index) => (
                        <motion.button
                            type="button"
                            key={item}
                            onClick={() => handleEmergency(item)}
                            disabled={loading}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, ease: 'easeOut', delay: index * 0.05 }}
                            className="rounded-lg border border-zinc-200/70 bg-white/90 px-3 py-2 text-sm text-zinc-700 shadow-lg shadow-zinc-200/20 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-blue-500/10 active:translate-y-0 active:scale-95"
                        >
                            {item}
                        </motion.button>
                    ))}
                </div>
            </Card>

            <Card className="p-5">
                <p className="text-sm text-zinc-500 mb-2">Describe the emergency</p>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={customDesc}
                        onChange={(event) => setCustomDesc(event.target.value)}
                        placeholder="Example: child is choking and not breathing well"
                        className="flex-1"
                    />
                    <button
                        type="button"
                        onClick={toggleMic}
                        className={`rounded-lg px-3 py-2 text-sm inline-flex items-center justify-center gap-1 border transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-95 ${
                            listening
                                ? 'border-rose-200 bg-rose-50 text-rose-600 shadow-lg shadow-rose-500/10'
                                : 'border-zinc-200/70 bg-white/90 text-zinc-700 shadow-lg shadow-zinc-200/20 hover:shadow-blue-500/10'
                        }`}
                    >
                        {listening ? <MicOff size={16} /> : <Mic size={16} />}
                        {listening ? 'Listening' : 'Voice'}
                    </button>
                    <button
                        type="button"
                        onClick={() => customDesc && handleEmergency(customDesc)}
                        disabled={!customDesc || loading}
                        className="rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 active:translate-y-0 active:scale-95"
                    >
                        {loading ? (
                            <span className="inline-flex items-center gap-2">
                                <Loader2 size={15} className="animate-spin" /> Loading
                            </span>
                        ) : (
                            'Get Guidance'
                        )}
                    </button>
                </div>
            </Card>

            {result && !loading && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="p-5">
                        <h3 className="text-base font-semibold tracking-tight text-zinc-900 mb-3">
                            {selectedType || 'Emergency'}: Steps
                        </h3>
                        <ol className="space-y-2">
                            {steps.map((step, index) => (
                                <motion.li
                                    key={`${step}-${index}`}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, ease: 'easeOut', delay: index * 0.04 }}
                                    className="rounded-xl bg-zinc-50 border border-zinc-200 p-3 text-sm"
                                >
                                    <span className="font-semibold text-zinc-900 mr-2">{index + 1}.</span>
                                    <span className="text-zinc-700">{step}</span>
                                </motion.li>
                            ))}
                        </ol>
                    </Card>

                    <Card className="p-5 space-y-4">
                        {doNot.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-rose-700 mb-2 flex items-center gap-1 tracking-tight">
                                    <AlertTriangle size={14} /> Do Not
                                </h4>
                                <ul className="space-y-2">
                                    {doNot.map((item, index) => (
                                        <li key={`${item}-${index}`} className="text-sm text-zinc-700">
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {whileWaiting.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-blue-700 mb-2 tracking-tight">While Waiting</h4>
                                <ul className="space-y-2">
                                    {whileWaiting.map((item, index) => (
                                        <li key={`${item}-${index}`} className="text-sm text-zinc-700">
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {!!steps.length && (
                            <button
                                type="button"
                                onClick={() => {
                                    const utterance = new SpeechSynthesisUtterance(steps.join('. '));
                                    utterance.lang = currentLanguage.speechCode || 'en-IN';
                                    window.speechSynthesis.speak(utterance);
                                }}
                                className="rounded-lg border border-zinc-200/70 bg-white/90 px-3 py-2 text-sm text-blue-600 inline-flex items-center gap-1 shadow-lg shadow-zinc-200/20 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10 active:translate-y-0 active:scale-95"
                            >
                                <Volume2 size={15} /> Read aloud
                            </button>
                        )}
                    </Card>
                </div>
            )}
        </PageTransition>
    );
}


