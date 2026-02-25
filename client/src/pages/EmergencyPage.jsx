import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getEmergencyGuidance } from '../services/api';
import toast from 'react-hot-toast';
import { AlertTriangle, Phone, Loader2, Mic, MicOff, Volume2 } from 'lucide-react';

const EMERGENCIES = [
    { type: 'Heart Attack', emoji: '💔', color: 'from-red-500 to-rose-600' },
    { type: 'Choking', emoji: '😰', color: 'from-orange-500 to-amber-600' },
    { type: 'Severe Bleeding', emoji: '🩸', color: 'from-red-600 to-red-700' },
    { type: 'Burns', emoji: '🔥', color: 'from-yellow-500 to-orange-600' },
    { type: 'Seizure', emoji: '⚡', color: 'from-purple-500 to-violet-600' },
    { type: 'Allergic Reaction', emoji: '🤧', color: 'from-pink-500 to-rose-600' },
    { type: 'Fracture', emoji: '🦴', color: 'from-blue-500 to-indigo-600' },
    { type: 'Drowning', emoji: '🌊', color: 'from-cyan-500 to-blue-600' },
];

export default function EmergencyPage() {
    const { currentLanguage } = useLanguage();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedType, setSelectedType] = useState('');
    const [customDesc, setCustomDesc] = useState('');
    const [listening, setListening] = useState(false);

    async function handleEmergency(situation) {
        setLoading(true); setResult(null); setSelectedType(situation);
        try {
            const { data } = await getEmergencyGuidance({ situation, language: currentLanguage.code });
            setResult(data);
            // Auto-read steps
            const steps = data.steps || data.result?.steps || [];
            if (steps.length) {
                const text = steps.join('. ');
                const u = new SpeechSynthesisUtterance(text);
                u.lang = currentLanguage.speechCode || 'en-IN';
                u.rate = 0.9;
                window.speechSynthesis.speak(u);
            }
        } catch { toast.error('Failed to get guidance'); }
        setLoading(false);
    }

    function toggleMic() {
        if (listening) return;
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { toast.error('Speech not supported'); return; }
        const r = new SR();
        r.lang = currentLanguage.speechCode || 'en-IN';
        r.onresult = (e) => { setCustomDesc(e.results[0][0].transcript); setListening(false); };
        r.onerror = () => setListening(false);
        r.onend = () => setListening(false);
        r.start();
        setListening(true);
    }

    const steps = result?.steps || result?.result?.steps || [];
    const doNot = result?.do_not || result?.result?.do_not || [];
    const whileWaiting = result?.while_waiting || result?.result?.while_waiting || [];

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-6 mb-6 animate-fadeInUp border-2 border-red-300 animate-pulse" style={{ animationDuration: '3s' }}>
                <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle size={32} className="text-white" />
                    <h1 className="text-2xl font-bold text-white">Emergency SOS</h1>
                </div>
                <a href="tel:112"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-white text-red-600 font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all animate-pulseGlow">
                    <Phone size={24} /> 📞 Call 112 Now
                </a>
            </div>

            {/* Emergency Types */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {EMERGENCIES.map((em, i) => (
                    <button key={em.type} onClick={() => handleEmergency(em.type)}
                        disabled={loading}
                        className={`p-4 rounded-2xl bg-gradient-to-br ${em.color} text-white font-semibold text-sm text-center hover:scale-105 hover:shadow-lg transition-all animate-fadeInUp delay-${i + 1}`}>
                        <span className="text-3xl block mb-2">{em.emoji}</span>
                        {em.type}
                    </button>
                ))}
            </div>

            {/* Custom Description */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 mb-6 animate-fadeInUp">
                <div className="flex gap-2">
                    <input value={customDesc} onChange={e => setCustomDesc(e.target.value)}
                        placeholder="Or describe the emergency..."
                        className="flex-1 py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 text-sm" />
                    <button onClick={toggleMic}
                        className={`p-2.5 rounded-xl ${listening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {listening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                    <button onClick={() => customDesc && handleEmergency(customDesc)} disabled={!customDesc || loading}
                        className="px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm disabled:opacity-50 flex items-center gap-1">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : 'Get Help'}
                    </button>
                </div>
            </div>

            {/* Results */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 size={32} className="animate-spin text-red-500" />
                    <span className="ml-3 text-gray-600 font-medium">Getting emergency guidance...</span>
                </div>
            )}

            {result && !loading && (
                <div className="space-y-4 animate-slideUp">
                    <h2 className="text-lg font-bold text-gray-900">{selectedType} — First Aid Steps</h2>

                    {steps.length > 0 && (
                        <div className="space-y-2">
                            {steps.map((s, i) => (
                                <div key={i} className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200 animate-fadeInUp" style={{ animationDelay: `${i * 0.1}s` }}>
                                    <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">{i + 1}</span>
                                    <p className="text-sm text-green-900 font-medium">{s}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {doNot.length > 0 && (
                        <div>
                            <h3 className="font-bold text-red-700 mb-2">❌ Do NOT</h3>
                            {doNot.map((d, i) => (
                                <div key={i} className="p-3 bg-red-50 rounded-xl border border-red-200 text-sm text-red-800 mb-2">{d}</div>
                            ))}
                        </div>
                    )}

                    {whileWaiting.length > 0 && (
                        <div>
                            <h3 className="font-bold text-blue-700 mb-2">⏳ While Waiting for Help</h3>
                            {whileWaiting.map((w, i) => (
                                <div key={i} className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-sm text-blue-800 mb-2">{w}</div>
                            ))}
                        </div>
                    )}

                    <button onClick={() => { const text = steps.join('. '); const u = new SpeechSynthesisUtterance(text); u.lang = currentLanguage.speechCode; window.speechSynthesis.speak(u); }}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-all">
                        <Volume2 size={16} /> 🔊 Read Steps Aloud
                    </button>
                </div>
            )}
        </div>
    );
}
