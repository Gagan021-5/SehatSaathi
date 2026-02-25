import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { AlertCircle, ChevronLeft, ChevronRight, FileText, Loader2, Pill, Upload, Volume2, X } from 'lucide-react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useLanguage } from '../context/LanguageContext';
import { uploadPrescription } from '../services/api';
import Card from '../components/common/Card';
import PageTransition from '../components/common/PageTransition';

GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_RENDER_DIMENSION = 1800;

function buildMedicineKey(medicine) {
    return [
        medicine?.name || '',
        medicine?.dosage || '',
        medicine?.frequency || '',
        medicine?.duration || '',
        medicine?.instructions || '',
    ]
        .join('|')
        .toLowerCase();
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
        name === 'InvalidPDFException' ||
        name === 'MissingPDFException' ||
        name === 'FormatError' ||
        message.includes('invalid pdf') ||
        message.includes('corrupt') ||
        message.includes('failed to parse')
    );
}

function getScaledDimensions(width, height) {
    const maxSide = Math.max(width, height);
    if (maxSide <= MAX_RENDER_DIMENSION) return { width, height };
    const scale = MAX_RENDER_DIMENSION / maxSide;
    return {
        width: Math.max(1, Math.round(width * scale)),
        height: Math.max(1, Math.round(height * scale)),
    };
}

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

    const fileInputRef = useRef(null);
    const hiddenCanvasRef = useRef(null);

    function clearSelection() {
        setFile(null);
        setFileType('');
        setPreview(null);
        setCurrentImageBase64('');
        setResult(null);
        setPdfDoc(null);
        setPdfPageCount(0);
        setSelectedPage(1);
        setPdfPageCache({});
        setLoadingLabel('');
        setPageRendering(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    async function readFileAsDataUrl(nextFile) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result || '');
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
        targetCanvas.width = width;
        targetCanvas.height = height;
        const ctx = targetCanvas.getContext('2d', { alpha: false });
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
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
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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
            setPreview(imageData);
            setCurrentImageBase64(imageData);
        } catch (error) {
            if (isProtectedPdfError(error)) {
                toast.error('This PDF is protected, please upload an unprotected version or take a photo of the prescription');
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

            setPdfDoc(documentInstance);
            setPdfPageCount(documentInstance.numPages || 1);
            setSelectedPage(1);
            setPdfPageCache({ 1: firstPageImage });
            setPreview(firstPageImage);
            setCurrentImageBase64(firstPageImage);
            setResult(null);
        } catch (error) {
            clearSelection();
            if (isProtectedPdfError(error)) {
                toast.error('This PDF is protected, please upload an unprotected version or take a photo of the prescription');
                return;
            }
            if (isCorruptPdfError(error)) {
                toast.error('Cannot read this PDF, try a screenshot instead');
                return;
            }
            toast.error('Cannot read this PDF, try a screenshot instead');
        }
    }

    async function loadImageFile(nextFile) {
        try {
            const jpegDataUrl = await convertImageFileToJpeg(nextFile);
            setPreview(jpegDataUrl);
            setCurrentImageBase64(jpegDataUrl);
            setResult(null);
            setPdfDoc(null);
            setPdfPageCount(0);
            setSelectedPage(1);
            setPdfPageCache({});
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
            toast.error('Unsupported file type. Please upload JPG, JPEG, PNG, or PDF.');
            return;
        }

        setFile(nextFile);
        setFileType(isPdf ? 'pdf' : 'image');
        setLoadingLabel('');

        if (isPdf) {
            await loadPdfFile(nextFile);
            return;
        }

        await loadImageFile(nextFile);
    }

    function extractMedicines(responseData) {
        return responseData?.medicines || responseData?.result?.medicines || [];
    }

    async function analyzeBase64Image(base64Image) {
        const payload = {
            image: base64Image,
            language: currentLanguage.code,
        };
        const { data } = await uploadPrescription(payload);
        return data;
    }

    async function handleAnalyze() {
        if (!file || !currentImageBase64) {
            toast.error('Upload a prescription file first.');
            return;
        }

        setLoading(true);
        setLoadingLabel('Analyzing...');
        setResult(null);
        try {
            const data = await analyzeBase64Image(currentImageBase64);
            setResult(data);
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Unable to analyze this prescription right now.');
        } finally {
            setLoading(false);
            setLoadingLabel('');
        }
    }

    async function handleAnalyzeAllPages() {
        if (fileType !== 'pdf' || !pdfDoc) {
            toast.error('Upload a PDF to analyze all pages.');
            return;
        }

        setLoading(true);
        setResult(null);
        const mergedMedicines = [];
        const seen = new Set();
        const pageResults = [];

        try {
            for (let page = 1; page <= pdfPageCount; page += 1) {
                setLoadingLabel(`Analyzing page ${page}/${pdfPageCount}...`);
                const pageImage = await getPdfPageImage(page);
                const pageData = await analyzeBase64Image(pageImage);
                pageResults.push({ page, data: pageData });

                extractMedicines(pageData).forEach((medicine) => {
                    const key = buildMedicineKey(medicine);
                    if (seen.has(key)) return;
                    seen.add(key);
                    mergedMedicines.push(medicine);
                });
            }

            const first = pageResults[0]?.data || {};
            setResult({
                medicines: mergedMedicines,
                summary: first.summary || first.result?.summary || '',
                notes: first.notes || first.result?.notes || '',
                interactions: first.interactions || first.result?.interactions || [],
                dietary_advice: first.dietary_advice || first.result?.dietary_advice || [],
                pageResults,
                combined: true,
            });
            toast.success(`Analyzed ${pdfPageCount} pages successfully.`);
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Unable to analyze all PDF pages right now.');
        } finally {
            setLoading(false);
            setLoadingLabel('');
        }
    }

    function onDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        setDragActive(true);
    }

    function onDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        setDragActive(false);
    }

    async function onDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        setDragActive(false);
        const droppedFile = event.dataTransfer.files?.[0];
        await handleFile(droppedFile);
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
        <PageTransition className="mx-auto max-w-6xl space-y-4">
            <Card className="p-6">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/20 grid place-items-center">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Prescription Scanner</h1>
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            Upload a prescription image or PDF to extract medicine details and AI insights.
                        </p>
                    </div>
                </div>
            </Card>

            <Card className="p-5">
                {!preview ? (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={onDragOver}
                        onDragEnter={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        className={`w-full rounded-xl border-2 border-dashed p-10 text-center shadow-lg shadow-zinc-200/20 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-blue-500/10 active:translate-y-0 active:scale-95 ${
                            dragActive ? 'border-blue-400 bg-blue-50/40' : 'border-zinc-300 bg-zinc-50'
                        }`}
                    >
                        <Upload size={34} className="mx-auto text-zinc-500" />
                        <p className="mt-3 text-sm font-medium text-zinc-700">Click or drag-drop your prescription file</p>
                        <p className="text-xs text-zinc-500">Supported: JPG, JPEG, PNG, PDF</p>
                    </button>
                ) : (
                    <div className="relative">
                        <span className="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200">
                            {fileType === 'pdf' ? 'PDF' : 'Image'}
                        </span>
                        <img
                            src={preview}
                            alt="Prescription preview"
                            className="w-full max-h-96 object-contain rounded-2xl border border-zinc-200 bg-zinc-50"
                        />
                        <button
                            type="button"
                            onClick={clearSelection}
                            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white text-zinc-500 grid place-items-center ring-1 ring-zinc-200 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-95"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                {fileType === 'pdf' && pdfPageCount > 0 && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-2 py-1">
                            <button
                                type="button"
                                onClick={() => setPdfPage(selectedPage - 1)}
                                disabled={selectedPage <= 1 || pageRendering || loading}
                                className="h-8 w-8 rounded-lg border border-zinc-200 bg-white text-zinc-700 grid place-items-center disabled:opacity-50"
                                aria-label="Previous page"
                            >
                                <ChevronLeft size={15} />
                            </button>
                            <span className="text-sm font-medium text-zinc-700 min-w-[90px] text-center">
                                Page {selectedPage}/{pdfPageCount}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPdfPage(selectedPage + 1)}
                                disabled={selectedPage >= pdfPageCount || pageRendering || loading}
                                className="h-8 w-8 rounded-lg border border-zinc-200 bg-white text-zinc-700 grid place-items-center disabled:opacity-50"
                                aria-label="Next page"
                            >
                                <ChevronRight size={15} />
                            </button>
                        </div>

                        {pdfPageCount > 1 && (
                            <button
                                type="button"
                                onClick={handleAnalyzeAllPages}
                                disabled={loading || pageRendering}
                                className="rounded-lg border border-zinc-200/70 bg-white/90 px-4 py-2 text-sm font-semibold text-blue-600 inline-flex justify-center items-center gap-2 shadow-lg shadow-zinc-200/20 disabled:opacity-50 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10"
                            >
                                {loading ? <Loader2 size={15} className="animate-spin" /> : null}
                                Analyze All Pages
                            </button>
                        )}
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="hidden"
                    onChange={(event) => handleFile(event.target.files?.[0])}
                />

                <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={!file || !currentImageBase64 || loading || pageRendering}
                    className="mt-4 w-full rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 py-3 text-white font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-50 inline-flex justify-center items-center gap-2 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 active:translate-y-0 active:scale-95"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                    {loadingLabel || 'Analyze Prescription'}
                </button>

                <canvas ref={hiddenCanvasRef} className="hidden" />
            </Card>

            {result && (
                <Card className="p-5 space-y-4">
                    <div>
                        <h2 className="text-base font-semibold tracking-tight text-zinc-900">AI Prescription Insights</h2>
                        <p className="mt-1 text-sm text-zinc-600">
                            {summary || 'AI analysis completed. Review extracted details below.'}
                        </p>
                        {notes ? <p className="mt-2 text-sm text-zinc-600">{notes}</p> : null}
                    </div>

                    {dietaryAdvice.length > 0 && (
                        <div>
                            <p className="text-sm font-semibold text-zinc-900 mb-1.5">Dietary Advice</p>
                            <ul className="space-y-1">
                                {dietaryAdvice.map((item, index) => (
                                    <li key={`${item}-${index}`} className="text-sm text-zinc-700">
                                        - {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {interactions.length > 0 && (
                        <div>
                            <p className="text-sm font-semibold text-zinc-900 mb-1.5">Potential Interactions</p>
                            <ul className="space-y-1">
                                {interactions.map((item, index) => (
                                    <li key={`${item.drug1 || 'd1'}-${item.drug2 || index}`} className="text-sm text-zinc-700">
                                        - {item.drug1 || 'Drug 1'} + {item.drug2 || 'Drug 2'}: {item.warning || 'Review with doctor'}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div>
                        <h3 className="text-base font-semibold tracking-tight text-zinc-900 mb-3">
                            Extracted Medicines
                            {result?.combined ? <span className="ml-2 text-xs text-zinc-500">(Combined from all pages)</span> : null}
                        </h3>
                        {medicines.length === 0 ? (
                            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-600 inline-flex items-start gap-2.5">
                                <AlertCircle size={16} className="mt-0.5 shrink-0 text-zinc-500" />
                                <span>No medicines were confidently extracted from this file. Try another page or a clearer photo.</span>
                            </div>
                        ) : (
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
                        )}
                    </div>

                    {ocrText ? (
                        <details className="rounded-xl border border-zinc-200 bg-white p-3">
                            <summary className="cursor-pointer text-sm font-semibold text-zinc-900">View OCR Text</summary>
                            <p className="mt-2 text-sm text-zinc-600 whitespace-pre-wrap">{ocrText}</p>
                        </details>
                    ) : null}
                </Card>
            )}
        </PageTransition>
    );
}
