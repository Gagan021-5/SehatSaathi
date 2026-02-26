import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { 
    AlertCircle, ChevronLeft, ChevronRight, FileText, Loader2, Pill, 
    UploadCloud, Volume2, X, Sparkles, ShieldCheck, Utensils, Zap, ScanText, Activity 
} from 'lucide-react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useLanguage } from '../context/LanguageContext';
import { createMedicineReminder, getMedicineReminders, uploadPrescription } from '../services/api';
import PageTransition from '../components/common/PageTransition';

GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_RENDER_DIMENSION = 1800;

// --- Helper Functions ---
function buildMedicineKey(medicine) {
    return [
        medicine?.name || '',
        medicine?.dosage || '',
        medicine?.frequency || '',
        medicine?.duration || '',
        medicine?.instructions || '',
    ].join('|').toLowerCase();
}

function isProtectedPdfError(error) {
    const name = String(error?.name || '');
    const message = String(error?.message || '').toLowerCase();
    return name === 'PasswordException' || message.includes('password');
}

function isCorruptPdfError(error) {
    const name = String(error?.name || '');
    const message = String(error?.message || '').toLowerCase();
    return (
        name === 'InvalidPDFException' || name === 'MissingPDFException' ||
        name === 'FormatError' || message.includes('invalid pdf') ||
        message.includes('corrupt') || message.includes('failed to parse')
    );
}

function getScaledDimensions(width, height) {
    const maxSide = Math.max(width, height);
    if (maxSide <= MAX_RENDER_DIMENSION) return { width, height };
    const scale = MAX_RENDER_DIMENSION / maxSide;
    return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function normalizeReminderKey({ medicineName, dosage }) {
    return `${(medicineName || '').trim().toLowerCase()}|${(dosage || '').trim().toLowerCase()}`;
}

function deriveTimesFromText(frequency = '', instructions = '') {
    const source = `${frequency} ${instructions}`.toLowerCase();
    if (!source.trim()) return ['08:00'];
    if (source.includes('every 6')) return ['00:00', '06:00', '12:00', '18:00'];
    if (source.includes('every 8')) return ['06:00', '14:00', '22:00'];
    if (source.includes('every 12')) return ['08:00', '20:00'];
    if (source.includes('thrice') || source.includes('three times') || source.includes('3 times')) {
        return ['08:00', '14:00', '20:00'];
    }
    if (source.includes('twice') || source.includes('two times') || source.includes('2 times') || source.includes('bid')) {
        return ['08:00', '20:00'];
    }
    if (source.includes('night') || source.includes('bedtime')) return ['22:00'];
    if (source.includes('evening')) return ['19:00'];
    if (source.includes('afternoon') || source.includes('noon')) return ['14:00'];
    if (source.includes('morning')) return ['08:00'];
    return ['08:00'];
}

function inferWithFood(instructions = '') {
    return /with food|after food|after meal|post meal|after meals/i.test(instructions || '');
}

// --- Animation Variants ---
const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function PrescriptionPage() {
    const { currentLanguage } = useLanguage();
    const [file, setFile] = useState(null);
    const [fileType, setFileType] = useState('');
    const [preview, setPreview] = useState(null);
    const [currentImageBase64, setCurrentImageBase64] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingLabel, setLoadingLabel] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [pageRendering, setPageRendering] = useState(false);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [pdfPageCount, setPdfPageCount] = useState(0);
    const [selectedPage, setSelectedPage] = useState(1);
    const [pdfPageCache, setPdfPageCache] = useState({});
    const [syncingMeds, setSyncingMeds] = useState(false);

    const fileInputRef = useRef(null);
    const hiddenCanvasRef = useRef(null);

    function clearSelection() {
        setFile(null); setFileType(''); setPreview(null); setCurrentImageBase64('');
        setResult(null); setPdfDoc(null); setPdfPageCount(0); setSelectedPage(1);
        setPdfPageCache({}); setLoadingLabel(''); setPageRendering(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    async function readFileAsDataUrl(nextFile) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result || '');
            reader.onerror = () => reject(new Error('Failed to read file.'));
            reader.readAsDataURL(nextFile);
        });
    }

    async function loadImageFromUrl(dataUrl) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error('Invalid image.'));
            image.src = dataUrl;
        });
    }

    function drawImageToCanvasAsJpeg(source, targetCanvas) {
        const { width, height } = getScaledDimensions(source.width, source.height);
        targetCanvas.width = width; targetCanvas.height = height;
        const ctx = targetCanvas.getContext('2d', { alpha: false });
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height);
        ctx.drawImage(source, 0, 0, width, height);
        return targetCanvas.toDataURL('image/jpeg', 0.8);
    }

    async function convertImageFileToJpeg(nextFile) {
        const dataUrl = await readFileAsDataUrl(nextFile);
        const image = await loadImageFromUrl(dataUrl);
        const canvas = hiddenCanvasRef.current;
        if (!canvas) throw new Error('Canvas is unavailable.');
        return drawImageToCanvasAsJpeg(image, canvas);
    }

    async function renderPdfPageToJpeg(documentInstance, pageNumber) {
        const page = await documentInstance.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1.8 });
        const { width } = getScaledDimensions(baseViewport.width, baseViewport.height);
        const renderScale = width / baseViewport.width;
        const viewport = page.getViewport({ scale: 1.8 * renderScale });

        const canvas = hiddenCanvasRef.current;
        if (!canvas) throw new Error('Canvas is unavailable.');
        canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport }).promise;
        return canvas.toDataURL('image/jpeg', 0.8);
    }

    async function getPdfPageImage(pageNumber) {
        if (!pdfDoc) return '';
        if (pdfPageCache[pageNumber]) return pdfPageCache[pageNumber];

        setPageRendering(true);
        try {
            const jpegDataUrl = await renderPdfPageToJpeg(pdfDoc, pageNumber);
            setPdfPageCache((prev) => ({ ...prev, [pageNumber]: jpegDataUrl }));
            return jpegDataUrl;
        } finally {
            setPageRendering(false);
        }
    }

    async function setPdfPage(pageNumber) {
        if (!pdfDoc || pageNumber < 1 || pageNumber > pdfPageCount) return;
        setSelectedPage(pageNumber);
        try {
            const imageData = await getPdfPageImage(pageNumber);
            setPreview(imageData); setCurrentImageBase64(imageData);
        } catch (error) {
            if (isProtectedPdfError(error)) {
                toast.error('This PDF is protected, please upload an unprotected version or take a photo.');
            } else {
                toast.error('Cannot read this PDF, try a screenshot instead');
            }
        }
    }

    async function loadPdfFile(nextFile) {
        try {
            const loadingTask = getDocument({ data: await nextFile.arrayBuffer() });
            const documentInstance = await loadingTask.promise;
            const firstPageImage = await renderPdfPageToJpeg(documentInstance, 1);

            setPdfDoc(documentInstance); setPdfPageCount(documentInstance.numPages || 1);
            setSelectedPage(1); setPdfPageCache({ 1: firstPageImage });
            setPreview(firstPageImage); setCurrentImageBase64(firstPageImage);
            setResult(null);
        } catch (error) {
            clearSelection();
            if (isProtectedPdfError(error)) {
                toast.error('This PDF is protected, please upload an unprotected version or take a photo.'); return;
            }
            if (isCorruptPdfError(error)) {
                toast.error('Cannot read this PDF, try a screenshot instead'); return;
            }
            toast.error('Cannot read this PDF, try a screenshot instead');
        }
    }

    async function loadImageFile(nextFile) {
        try {
            const jpegDataUrl = await convertImageFileToJpeg(nextFile);
            setPreview(jpegDataUrl); setCurrentImageBase64(jpegDataUrl); setResult(null);
            setPdfDoc(null); setPdfPageCount(0); setSelectedPage(1); setPdfPageCache({});
        } catch {
            clearSelection();
            toast.error('Unable to read this image. Try another file.');
        }
    }

    async function handleFile(nextFile) {
        if (!nextFile) return;
        const isPdf = nextFile.type === 'application/pdf' || nextFile.name.toLowerCase().endsWith('.pdf');
        const isImage = SUPPORTED_IMAGE_TYPES.includes(nextFile.type);

        if (!isPdf && !isImage) {
            toast.error('Unsupported file type. Please upload JPG, PNG, or PDF.'); return;
        }

        setFile(nextFile); setFileType(isPdf ? 'pdf' : 'image'); setLoadingLabel('');

        if (isPdf) { await loadPdfFile(nextFile); return; }
        await loadImageFile(nextFile);
    }

    function extractMedicines(responseData) {
        return responseData?.medicines || responseData?.result?.medicines || [];
    }

    async function analyzeBase64Image(base64Image) {
        const payload = { image: base64Image, language: currentLanguage.code };
        const { data } = await uploadPrescription(payload);
        return data;
    }

    async function handleAnalyze() {
        if (!file || !currentImageBase64) { toast.error('Upload a prescription file first.'); return; }

        setLoading(true); setLoadingLabel('Scanning Document...'); setResult(null);
        try {
            const data = await analyzeBase64Image(currentImageBase64);
            setResult(data);
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Unable to analyze this prescription right now.');
        } finally {
            setLoading(false); setLoadingLabel('');
        }
    }

    async function handleAnalyzeAllPages() {
        if (fileType !== 'pdf' || !pdfDoc) { toast.error('Upload a PDF to analyze all pages.'); return; }

        setLoading(true); setResult(null);
        const mergedMedicines = []; const seen = new Set(); const pageResults = [];

        try {
            for (let page = 1; page <= pdfPageCount; page += 1) {
                setLoadingLabel(`Analyzing page ${page}/${pdfPageCount}...`);
                const pageImage = await getPdfPageImage(page);
                const pageData = await analyzeBase64Image(pageImage);
                pageResults.push({ page, data: pageData });

                extractMedicines(pageData).forEach((medicine) => {
                    const key = buildMedicineKey(medicine);
                    if (seen.has(key)) return;
                    seen.add(key); mergedMedicines.push(medicine);
                });
            }

            const first = pageResults[0]?.data || {};
            setResult({
                medicines: mergedMedicines,
                summary: first.summary || first.result?.summary || '',
                notes: first.notes || first.result?.notes || '',
                interactions: first.interactions || first.result?.interactions || [],
                dietary_advice: first.dietary_advice || first.result?.dietary_advice || [],
                pageResults, combined: true,
            });
            toast.success(`Analyzed ${pdfPageCount} pages successfully.`);
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Unable to analyze all PDF pages right now.');
        } finally {
            setLoading(false); setLoadingLabel('');
        }
    }

    async function handleAgenticSync() {
        if (syncingMeds) return;

        const extractedMedicines = medicines;
        if (!extractedMedicines.length) {
            toast.error('No medicines available for Agentic Sync.');
            return;
        }

        setSyncingMeds(true);
        try {
            const existingResponse = await getMedicineReminders().catch(() => ({ data: [] }));
            const existingReminders = Array.isArray(existingResponse?.data) ? existingResponse.data : [];
            const existingKeys = new Set(
                existingReminders.map((item) => normalizeReminderKey(item))
            );

            let synced = 0;
            let skipped = 0;
            let failed = 0;

            for (const medicine of extractedMedicines) {
                const payload = {
                    medicineName: `${medicine?.name || ''}`.trim() || 'Unlabeled Medicine',
                    dosage: `${medicine?.dosage || medicine?.strength || ''}`.trim() || 'As prescribed',
                    times: deriveTimesFromText(medicine?.frequency, medicine?.instructions),
                    stockRemaining: 10,
                    withFood: inferWithFood(medicine?.instructions),
                };

                const key = normalizeReminderKey(payload);
                if (existingKeys.has(key)) {
                    skipped += 1;
                    continue;
                }

                try {
                    await createMedicineReminder(payload);
                    existingKeys.add(key);
                    synced += 1;
                } catch {
                    failed += 1;
                }
            }

            if (synced > 0) {
                toast.success(`Agentic Sync complete: ${synced} medicines added to Pill Reminder.`);
            } else if (skipped > 0 && failed === 0) {
                toast('All extracted medicines are already synchronized.', { icon: 'ℹ️' });
            }

            if (failed > 0) {
                toast.error(`Agentic Sync partial: ${failed} medicine entries failed.`);
            }
        } finally {
            setSyncingMeds(false);
        }
    }

    function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ''));
        utterance.lang = currentLanguage.speechCode || 'en-IN';
        window.speechSynthesis.speak(utterance);
    }

    const medicines = result?.medicines || result?.result?.medicines || [];
    const summary = result?.summary || result?.result?.summary || '';
    const notes = result?.notes || result?.result?.notes || '';
    const ocrText = result?.text || result?.result?.text || '';
    const dietaryAdvice = result?.dietary_advice || result?.result?.dietary_advice || [];
    const interactions = result?.interactions || result?.result?.interactions || [];

    return (
        <PageTransition className="mx-auto max-w-[1400px] space-y-8 pb-12 px-2">
            
            {/* Premium Header */}
            <header className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-10 text-white shadow-2xl shadow-slate-900/20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.25),transparent_60%)]" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-300 ring-1 ring-inset ring-purple-500/30 mb-4">
                            <ScanText size={14} /> AI Vision Processing
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight lg:text-5xl">
                            Prescription <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Scanner</span>
                        </h1>
                        <p className="mt-3 text-slate-400 text-lg">
                            Instantly extract medications, verify dosages, and detect potential drug interactions from any clinical document.
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column: Upload & Preview Area */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="rounded-[2.5rem] bg-white p-6 md:p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                                <UploadCloud size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-slate-900">Document Input</h2>
                                <p className="text-xs font-medium text-slate-500">Upload physical or digital records</p>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {!preview ? (
                                <motion.button
                                    key="upload"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                    onDragLeave={() => setDragActive(false)}
                                    onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files?.[0]); }}
                                    className={`relative w-full overflow-hidden rounded-[2rem] border-2 border-dashed p-12 text-center transition-all duration-300 ease-out hover:scale-[1.02] ${
                                        dragActive ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-purple-300'
                                    }`}
                                >
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
                                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${dragActive ? 'bg-purple-100 text-purple-600' : 'bg-white text-slate-400 shadow-sm'}`}>
                                        <FileText size={28} />
                                    </div>
                                    <h4 className="text-base font-bold text-slate-800">Drop prescription here</h4>
                                    <p className="mt-2 text-sm text-slate-500">or click to browse your device</p>
                                    <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">PDF, JPG, PNG supported</p>
                                </motion.button>
                            ) : (
                                <motion.div
                                    key="preview"
                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                    className="relative rounded-[2rem] bg-slate-100 p-2 shadow-inner border border-slate-200"
                                >
                                    <div className="absolute left-4 top-4 z-10 rounded-full bg-slate-900/80 backdrop-blur-md px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white">
                                        {fileType === 'pdf' ? 'PDF Document' : 'Image Scan'}
                                    </div>
                                    <button
                                        type="button" onClick={clearSelection}
                                        className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-slate-900/80 backdrop-blur-md text-white flex items-center justify-center transition-all hover:bg-rose-500 active:scale-95"
                                    >
                                        <X size={16} />
                                    </button>
                                    <div className="overflow-hidden rounded-[1.5rem] bg-white">
                                        <img src={preview} alt="Prescription preview" className="w-full h-auto max-h-[400px] object-contain" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* PDF Pagination Controls */}
                        {fileType === 'pdf' && pdfPageCount > 0 && (
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-2 bg-white rounded-xl shadow-sm p-1">
                                    <button
                                        type="button" onClick={() => setPdfPage(selectedPage - 1)} disabled={selectedPage <= 1 || pageRendering || loading}
                                        className="h-8 w-8 rounded-lg bg-slate-50 text-slate-700 flex items-center justify-center hover:bg-slate-100 disabled:opacity-50"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="text-xs font-bold text-slate-700 min-w-[70px] text-center">
                                        Pg {selectedPage} of {pdfPageCount}
                                    </span>
                                    <button
                                        type="button" onClick={() => setPdfPage(selectedPage + 1)} disabled={selectedPage >= pdfPageCount || pageRendering || loading}
                                        className="h-8 w-8 rounded-lg bg-slate-50 text-slate-700 flex items-center justify-center hover:bg-slate-100 disabled:opacity-50"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                                {pdfPageCount > 1 && (
                                    <button
                                        type="button" onClick={handleAnalyzeAllPages} disabled={loading || pageRendering}
                                        className="rounded-xl bg-purple-50 text-purple-700 px-4 py-2 text-xs font-bold hover:bg-purple-100 transition-colors disabled:opacity-50"
                                    >
                                        Analyze All Pages
                                    </button>
                                )}
                            </div>
                        )}

                        <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />

                        {/* Primary Analyze Action */}
                        <button
                            type="button" onClick={handleAnalyze} disabled={!file || !currentImageBase64 || loading || pageRendering}
                            className="mt-6 w-full relative group overflow-hidden rounded-2xl bg-slate-900 h-14 text-white font-bold shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            {loading ? <Loader2 size={20} className="animate-spin text-purple-400" /> : <Sparkles size={18} className="text-purple-400" />}
                            <span className="relative z-10">{loadingLabel || 'Run Clinical Analysis'}</span>
                        </button>
                        <canvas ref={hiddenCanvasRef} className="hidden" />
                    </div>
                </div>

                {/* Right Column: AI Insights Dashboard */}
                <div className="lg:col-span-7">
                    {!result ? (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 rounded-[2.5rem] border border-dashed border-slate-300 bg-white/50">
                            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-6 text-slate-300 shadow-inner">
                                <Activity size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Awaiting Document</h3>
                            <p className="mt-2 text-sm text-slate-500 max-w-sm">
                                Upload a prescription to instantly extract medications, verify safety, and receive structured dietary advice.
                            </p>
                        </div>
                    ) : (
                        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                            
                            {/* Summary Card */}
                            <motion.div variants={itemVariants} className="rounded-[2rem] bg-white p-6 md:p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
                                <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 mb-2">AI Assessment Summary</h2>
                                        <p className="text-sm text-slate-600 leading-relaxed">{summary || 'Analysis completed successfully.'}</p>
                                        {notes && <p className="mt-3 text-sm text-slate-600 leading-relaxed border-l-2 border-blue-200 pl-3 italic">{notes}</p>}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Warnings Grid */}
                            {(dietaryAdvice.length > 0 || interactions.length > 0) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {dietaryAdvice.length > 0 && (
                                        <motion.div variants={itemVariants} className="rounded-[2rem] bg-emerald-50 border border-emerald-100 p-6">
                                            <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-800 flex items-center gap-2 mb-4">
                                                <Utensils size={16} /> Dietary Protocol
                                            </h3>
                                            <ul className="space-y-3">
                                                {dietaryAdvice.map((item, idx) => (
                                                    <li key={idx} className="text-sm text-emerald-900 font-medium flex items-start gap-2">
                                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                                        <span className="leading-relaxed">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </motion.div>
                                    )}

                                    {interactions.length > 0 && (
                                        <motion.div variants={itemVariants} className="rounded-[2rem] bg-rose-50 border border-rose-100 p-6">
                                            <h3 className="text-sm font-bold uppercase tracking-widest text-rose-800 flex items-center gap-2 mb-4">
                                                <Zap size={16} /> Interaction Warnings
                                            </h3>
                                            <ul className="space-y-3">
                                                {interactions.map((item, idx) => (
                                                    <li key={idx} className="text-sm text-rose-900 font-medium flex items-start gap-2">
                                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                                                        <span className="leading-relaxed">
                                                            <strong>{item.drug1} + {item.drug2}</strong>: {item.warning}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {/* Extracted Medicines List */}
                            <motion.div variants={itemVariants} className="rounded-[2rem] bg-white p-6 md:p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-slate-100 pb-4">
                                    <h3 className="text-lg font-bold text-slate-900">
                                        Identified Medications
                                        {result?.combined && <span className="ml-2 inline-block px-2 py-1 rounded-full bg-slate-100 text-[10px] uppercase tracking-widest text-slate-500">Multi-page Combined</span>}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleAgenticSync}
                                            disabled={syncingMeds || medicines.length === 0}
                                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-indigo-500/20 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {syncingMeds ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                            Sync to Pill Reminder
                                        </button>
                                        <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-xs">
                                            {medicines.length}
                                        </div>
                                    </div>
                                </div>

                                {medicines.length === 0 ? (
                                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 flex items-start gap-3">
                                        <AlertCircle size={20} className="shrink-0" />
                                        <span>No clear medication data could be extracted. Please ensure the image is well-lit and legible.</span>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {medicines.map((medicine, index) => (
                                            <div key={index} className="group rounded-2xl border border-slate-100 bg-slate-50 p-5 hover:bg-white hover:shadow-lg transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="h-12 w-12 shrink-0 rounded-2xl bg-white text-indigo-600 flex items-center justify-center shadow-sm border border-slate-100">
                                                        <Pill size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-bold text-slate-900">{medicine.name}</p>
                                                        <div className="mt-1 flex flex-wrap gap-2">
                                                            {[medicine.dosage, medicine.frequency, medicine.duration].filter(Boolean).map((tag, i) => (
                                                                <span key={i} className="inline-flex rounded-lg bg-white px-2 py-1 text-xs font-semibold text-slate-600 border border-slate-200 shadow-sm">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        {medicine.instructions && (
                                                            <p className="text-sm font-medium text-slate-500 mt-3 leading-relaxed">{medicine.instructions}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => speak(`${medicine.name}. ${medicine.dosage || ''}. ${medicine.frequency || ''}. ${medicine.instructions || ''}`)}
                                                    className="shrink-0 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all active:scale-95"
                                                >
                                                    <Volume2 size={14} /> Dictate
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>

                            {/* Raw OCR Accordion */}
                            {ocrText && (
                                <motion.details variants={itemVariants} className="group rounded-[1.5rem] border border-slate-200 bg-white p-4 cursor-pointer [&_summary::-webkit-details-marker]:hidden">
                                    <summary className="flex items-center justify-between text-sm font-bold text-slate-700 outline-none">
                                        <span className="flex items-center gap-2"><ScanText size={16} className="text-slate-400" /> View Raw OCR Scan</span>
                                        <ChevronRight size={16} className="text-slate-400 transition-transform group-open:rotate-90" />
                                    </summary>
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <p className="text-xs text-slate-500 font-mono whitespace-pre-wrap leading-relaxed">{ocrText}</p>
                                    </div>
                                </motion.details>
                            )}

                        </motion.div>
                    )}
                </div>
            </div>
        </PageTransition>
    );
}
