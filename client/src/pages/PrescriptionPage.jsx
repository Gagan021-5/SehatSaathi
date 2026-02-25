import { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { uploadPrescription, getPrescriptions } from '../services/api';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { FileText, Upload, Loader2, Volume2, Pill, AlertTriangle, Leaf, X, Image } from 'lucide-react';

export default function PrescriptionPage() {
    const { currentLanguage } = useLanguage();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pastRx, setPastRx] = useState([]);
    const inputRef = useRef(null);

    function handleFile(f) {
        if (!f) return;
        setFile(f);
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(f);
    }

    async function handleAnalyze() {
        if (!file) { toast.error('Please upload an image first'); return; }
        setLoading(true); setResult(null);
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('language', currentLanguage.code);
            const { data } = await uploadPrescription(formData);
            setResult(data);
            toast.success('Prescription analyzed!');
        } catch { toast.error('Analysis failed. Try again.'); }
        setLoading(false);
    }

    function speak(text) {
        const u = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ''));
        u.lang = currentLanguage.speechCode || 'en-IN';
        window.speechSynthesis.speak(u);
    }

    const meds = result?.medicines || result?.result?.medicines || [];
    const interactions = result?.interactions || result?.result?.interactions || [];
    const alternatives = result?.generic_alternatives || result?.result?.generic_alternatives || [];
    const dietary = result?.dietary_advice || result?.result?.dietary_advice || [];

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6 animate-fadeInUp">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white">
                    <FileText size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Prescription Scanner</h1>
                    <p className="text-sm text-gray-500">Upload & analyze your prescriptions with AI</p>
                </div>
            </div>

            {/* Upload */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 mb-6 animate-fadeInUp delay-1">
                {!preview ? (
                    <div
                        onClick={() => inputRef.current?.click()}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                        className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all"
                    >
                        <Upload size={40} className="mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-600 font-semibold">Drop prescription image here</p>
                        <p className="text-xs text-gray-400 mt-1">or click to browse (JPG, PNG)</p>
                        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
                    </div>
                ) : (
                    <div className="relative">
                        <img src={preview} alt="Prescription" className="w-full max-h-80 object-contain rounded-xl border border-gray-200" />
                        <button onClick={() => { setFile(null); setPreview(null); setResult(null); }}
                            className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-red-50 text-gray-500 hover:text-red-500">
                            <X size={16} />
                        </button>
                    </div>
                )}

                <button onClick={handleAnalyze} disabled={!file || loading}
                    className="mt-4 w-full py-3 rounded-xl text-white font-bold bg-gradient-to-r from-orange-500 to-amber-600 shadow-lg shadow-orange-500/20 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all">
                    {loading ? <><Loader2 size={20} className="animate-spin" /> Analyzing...</> : <><FileText size={20} /> 📋 Analyze Prescription</>}
                </button>
            </div>

            {/* Results */}
            {meds.length > 0 && (
                <div className="space-y-4 animate-slideUp">
                    <h3 className="text-lg font-bold text-gray-900">💊 Extracted Medicines</h3>
                    <div className="grid gap-3">
                        {meds.map((m, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0"><Pill size={20} /></div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900">{m.name}</h4>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                                        {m.dosage && <span>💊 {m.dosage}</span>}
                                        {m.frequency && <span>🕐 {m.frequency}</span>}
                                        {m.duration && <span>📅 {m.duration}</span>}
                                    </div>
                                    {m.instructions && <p className="text-xs text-gray-600 mt-1.5">{m.instructions}</p>}
                                </div>
                                <button onClick={() => speak(`${m.name}. Dosage: ${m.dosage || 'as directed'}. ${m.frequency || ''}. ${m.instructions || ''}`)}
                                    className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-100 flex items-center gap-1 flex-shrink-0">
                                    <Volume2 size={12} /> Explain
                                </button>
                            </div>
                        ))}
                    </div>

                    {interactions.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3">⚠️ Drug Interactions</h3>
                            {interactions.map((inter, i) => (
                                <div key={i} className="p-3 bg-orange-50 rounded-xl border border-orange-200 text-sm text-orange-800 mb-2">
                                    <AlertTriangle size={14} className="inline mr-1" /> {inter.drug1} + {inter.drug2}: {inter.warning}
                                </div>
                            ))}
                        </div>
                    )}

                    {alternatives.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3">💰 Generic Alternatives</h3>
                            {alternatives.map((alt, i) => (
                                <div key={i} className="p-3 bg-green-50 rounded-xl border border-green-200 text-sm text-green-800 mb-2">
                                    <strong>{alt.brand}</strong> → <strong>{alt.generic}</strong> {alt.savings && `(Save ${alt.savings})`}
                                </div>
                            ))}
                        </div>
                    )}

                    {dietary.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3">🥗 Dietary Advice</h3>
                            {dietary.map((d, i) => (
                                <div key={i} className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-sm text-emerald-800 mb-2 flex items-start gap-2">
                                    <Leaf size={14} className="mt-0.5" /> {d}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
