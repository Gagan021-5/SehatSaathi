import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FileText, Loader2, Pill, Upload, Volume2, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { uploadPrescription } from '../services/api';
import Card from '../components/common/Card';
import PageTransition from '../components/common/PageTransition';

export default function PrescriptionPage() {
    const { currentLanguage } = useLanguage();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    function handleFile(nextFile) {
        if (!nextFile) return;
        setFile(nextFile);
        const reader = new FileReader();
        reader.onload = (event) => setPreview(event.target?.result || null);
        reader.readAsDataURL(nextFile);
    }

    async function handleAnalyze() {
        if (!file) {
            toast.error('Upload a prescription image first.');
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('language', currentLanguage.code);
            const { data } = await uploadPrescription(formData);
            setResult(data);
        } catch {
            toast.error('Unable to analyze this prescription right now.');
        } finally {
            setLoading(false);
        }
    }

    function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ''));
        utterance.lang = currentLanguage.speechCode || 'en-IN';
        window.speechSynthesis.speak(utterance);
    }

    const medicines = result?.medicines || result?.result?.medicines || [];

    return (
        <PageTransition className="mx-auto max-w-6xl space-y-4">
            <Card className="p-6">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/20 grid place-items-center">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Prescription Scanner</h1>
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            Upload a prescription image to extract medicine details.
                        </p>
                    </div>
                </div>
            </Card>

            <Card className="p-5">
                {!preview ? (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-10 text-center shadow-lg shadow-zinc-200/20 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-blue-500/10 active:translate-y-0 active:scale-95"
                    >
                        <Upload size={34} className="mx-auto text-zinc-500" />
                        <p className="mt-3 text-sm font-medium text-zinc-700">Click to upload prescription image</p>
                        <p className="text-xs text-zinc-500">Supported: JPG, PNG</p>
                    </button>
                ) : (
                    <div className="relative">
                        <img
                            src={preview}
                            alt="Prescription preview"
                            className="w-full max-h-96 object-contain rounded-2xl border border-zinc-200 bg-zinc-50"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setFile(null);
                                setPreview(null);
                                setResult(null);
                            }}
                            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white text-zinc-500 grid place-items-center ring-1 ring-zinc-200 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-95"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleFile(event.target.files?.[0])}
                />

                <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={!file || loading}
                    className="mt-4 w-full rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 py-3 text-white font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-50 inline-flex justify-center items-center gap-2 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 active:translate-y-0 active:scale-95"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                    {loading ? 'Analyzing...' : 'Analyze Prescription'}
                </button>
            </Card>

            {medicines.length > 0 && (
                <Card className="p-5">
                    <h2 className="text-base font-semibold tracking-tight text-zinc-900 mb-3">Extracted Medicines</h2>
                    <div className="space-y-3">
                        {medicines.map((medicine, index) => (
                            <motion.div
                                key={`${medicine.name}-${index}`}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, ease: 'easeOut', delay: index * 0.05 }}
                                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 flex items-start justify-between gap-3"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-white text-blue-600 grid place-items-center ring-1 ring-zinc-200">
                                        <Pill size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-900">{medicine.name}</p>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            {[medicine.dosage, medicine.frequency, medicine.duration]
                                                .filter(Boolean)
                                                .join(' | ') || 'Dosage information unavailable'}
                                        </p>
                                        {medicine.instructions && (
                                            <p className="text-xs text-zinc-500 mt-1">{medicine.instructions}</p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        speak(
                                            `${medicine.name}. ${medicine.dosage || ''}. ${medicine.frequency || ''}. ${
                                                medicine.instructions || ''
                                            }`
                                        )
                                    }
                                    className="rounded-lg border border-zinc-200/70 bg-white px-3 py-2 text-xs text-blue-600 inline-flex items-center gap-1 shadow-lg shadow-zinc-200/20 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10 active:translate-y-0 active:scale-95"
                                >
                                    <Volume2 size={13} /> Explain
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </Card>
            )}
        </PageTransition>
    );
}


