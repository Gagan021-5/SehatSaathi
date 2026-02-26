import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    Activity,
    Mic,
    Plus,
    Save,
    Users,
    Wifi,
    WifiOff,
    X,
} from 'lucide-react';
import PageTransition from '../components/common/PageTransition';
import { useLanguage } from '../context/LanguageContext';

const STORAGE_KEY = 'sehat_saathi_offline_roster';
const STATUS_NEEDS_REVIEW = 'needsReview';
const STATUS_CLEARED = 'cleared';

const EMPTY_PATIENT = {
    name: '',
    age: '',
    gender: 'female',
    village: '',
    complaint: '',
};

const EMPTY_VITALS = {
    bloodPressure: '',
    sugar: '',
    temp: '',
};

const listVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.08 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 14, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.28 } },
};

function normalizeStatus(status) {
    const raw = String(status || '').toLowerCase();
    if (raw === STATUS_CLEARED || raw === 'cleared') return STATUS_CLEARED;
    return STATUS_NEEDS_REVIEW;
}

function normalizeGender(gender) {
    const raw = String(gender || '').toLowerCase();
    if (raw === 'male' || raw === 'm') return 'male';
    if (raw === 'other' || raw === 'o') return 'other';
    return 'female';
}

function normalizePatient(patient) {
    if (!patient || typeof patient !== 'object') return null;
    return {
        id: patient.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: String(patient.name || '').trim(),
        age: Number(patient.age) || '',
        gender: normalizeGender(patient.gender),
        village: String(patient.village || '').trim(),
        complaint: String(patient.complaint || '').trim(),
        status: normalizeStatus(patient.status),
        vitals: patient.vitals || null,
        voiceNotes: Array.isArray(patient.voiceNotes) ? patient.voiceNotes : [],
        createdAt: patient.createdAt || new Date().toISOString(),
        updatedAt: patient.updatedAt || new Date().toISOString(),
    };
}

export default function RuralOutreach() {
    const { t } = useLanguage();
    const [villageRoster, setVillageRoster] = useState([]);
    const [syncStatus, setSyncStatus] = useState(navigator.onLine ? 'online' : 'offline');

    const [showAddModal, setShowAddModal] = useState(false);
    const [showVitalsModal, setShowVitalsModal] = useState(false);
    const [patientForm, setPatientForm] = useState(EMPTY_PATIENT);
    const [vitalsForm, setVitalsForm] = useState(EMPTY_VITALS);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [activeVoicePatientId, setActiveVoicePatientId] = useState('');

    const recorderRef = useRef(null);
    const chunksRef = useRef([]);
    const streamRef = useRef(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return;
            const normalized = parsed.map(normalizePatient).filter(Boolean);
            setVillageRoster(normalized);
        } catch (error) {
            console.error('Failed to load offline roster:', error.message);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(villageRoster));
        } catch (error) {
            console.error('Failed to persist offline roster:', error.message);
        }
    }, [villageRoster]);

    useEffect(() => {
        const onOnline = () => setSyncStatus('online');
        const onOffline = () => setSyncStatus('offline');

        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);

        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }, []);

    useEffect(() => {
        return () => {
            try {
                recorderRef.current?.stop();
            } catch {
                // Ignore shutdown recorder errors.
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const selectedPatient = useMemo(
        () => villageRoster.find((patient) => patient.id === selectedPatientId) || null,
        [villageRoster, selectedPatientId]
    );

    const stats = useMemo(() => {
        const needsReview = villageRoster.filter((patient) => patient.status === STATUS_NEEDS_REVIEW).length;
        const cleared = villageRoster.filter((patient) => patient.status === STATUS_CLEARED).length;
        return { total: villageRoster.length, needsReview, cleared };
    }, [villageRoster]);

    function closeAddModal() {
        setShowAddModal(false);
        setPatientForm(EMPTY_PATIENT);
    }

    function closeVitalsModal() {
        setShowVitalsModal(false);
        setVitalsForm(EMPTY_VITALS);
        setSelectedPatientId('');
    }

    function handleAddPatient(event) {
        event.preventDefault();

        const next = {
            name: patientForm.name.trim(),
            age: Number(patientForm.age),
            gender: patientForm.gender,
            village: patientForm.village.trim(),
            complaint: patientForm.complaint.trim(),
        };

        if (!next.name || !next.village || !next.complaint || !Number.isFinite(next.age) || next.age <= 0) {
            toast.error(t('ruralOutreach.toasts.invalidPatient'));
            return;
        }

        const patient = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            ...next,
            status: STATUS_NEEDS_REVIEW,
            vitals: null,
            voiceNotes: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        setVillageRoster((prev) => [patient, ...prev]);
        toast.success(t('ruralOutreach.toasts.patientAdded'));
        closeAddModal();
    }

    function openVitalsModal(patientId) {
        const patient = villageRoster.find((item) => item.id === patientId);
        if (!patient) return;

        setSelectedPatientId(patientId);
        setVitalsForm({
            bloodPressure: patient.vitals?.bloodPressure || '',
            sugar: patient.vitals?.sugar || '',
            temp: patient.vitals?.temp || '',
        });
        setShowVitalsModal(true);
    }

    function handleSaveVitals(event) {
        event.preventDefault();
        if (!selectedPatient) return;

        const payload = {
            bloodPressure: vitalsForm.bloodPressure.trim(),
            sugar: vitalsForm.sugar.trim(),
            temp: vitalsForm.temp.trim(),
            updatedAt: new Date().toISOString(),
        };

        if (!payload.bloodPressure || !payload.sugar || !payload.temp) {
            toast.error(t('ruralOutreach.toasts.invalidVitals'));
            return;
        }

        setVillageRoster((prev) =>
            prev.map((patient) =>
                patient.id === selectedPatient.id
                    ? {
                          ...patient,
                          vitals: payload,
                          status: STATUS_CLEARED,
                          updatedAt: new Date().toISOString(),
                      }
                    : patient
            )
        );

        toast.success(t('ruralOutreach.toasts.vitalsSaved'));
        closeVitalsModal();
    }

    async function toggleVoiceTriage(patientId) {
        if (activeVoicePatientId && activeVoicePatientId === patientId) {
            recorderRef.current?.stop();
            return;
        }

        if (activeVoicePatientId && activeVoicePatientId !== patientId) {
            toast.error(t('ruralOutreach.toasts.finishRecordingFirst'));
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            toast.error(t('ruralOutreach.toasts.audioNotSupported'));
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            streamRef.current = stream;
            recorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) chunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const note = {
                    capturedAt: new Date().toISOString(),
                    sizeKb:
                        Math.round(
                            (chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0) / 1024) * 10
                        ) / 10,
                };

                setVillageRoster((prev) =>
                    prev.map((patient) =>
                        patient.id === patientId
                            ? {
                                  ...patient,
                                  voiceNotes: [note, ...(patient.voiceNotes || [])],
                                  updatedAt: new Date().toISOString(),
                              }
                            : patient
                    )
                );

                stream.getTracks().forEach((track) => track.stop());
                recorderRef.current = null;
                streamRef.current = null;
                chunksRef.current = [];
                setActiveVoicePatientId('');
                toast.success(t('ruralOutreach.toasts.voiceCaptured'));
            };

            mediaRecorder.start();
            setActiveVoicePatientId(patientId);
            toast.success(t('ruralOutreach.toasts.recordingStarted'));
        } catch (error) {
            console.error('Voice triage capture failed:', error.message);
            toast.error(t('ruralOutreach.toasts.microphoneError'));
        }
    }

    return (
        <PageTransition className="mx-auto max-w-7xl space-y-6 px-2 pb-12">
            <section className="relative overflow-hidden rounded-[2.6rem] bg-slate-900 p-7 text-white shadow-2xl shadow-slate-900/40 md:p-9">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.26),transparent_58%)]" />
                <div className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px]" />

                <div className="relative z-10 flex flex-wrap items-start justify-between gap-5">
                    <div className="max-w-2xl">
                        <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200">
                            <Users size={13} /> {t('ruralOutreach.campMode')}
                        </p>
                        <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">{t('ruralOutreach.title')}</h1>
                        <p className="mt-3 text-sm text-slate-200/90 md:text-base">{t('ruralOutreach.subtitle')}</p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <SyncBadge status={syncStatus} t={t} />
                        <button
                            type="button"
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex h-12 items-center gap-2 rounded-2xl bg-emerald-400 px-5 text-sm font-black text-slate-900 shadow-lg shadow-emerald-400/35 transition-all hover:bg-emerald-300 active:scale-[0.98]"
                        >
                            <Plus size={18} /> {t('ruralOutreach.buttons.addPatient')}
                        </button>
                    </div>
                </div>

                <div className="relative z-10 mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <MetricCard icon={<Users size={16} />} label={t('ruralOutreach.metrics.villagersRegistered')} value={stats.total} />
                    <MetricCard icon={<Activity size={16} />} label={t('ruralOutreach.metrics.needsReview')} value={stats.needsReview} />
                    <MetricCard icon={<Activity size={16} />} label={t('ruralOutreach.metrics.cleared')} value={stats.cleared} />
                </div>
            </section>

            {villageRoster.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 p-10 text-center shadow-lg backdrop-blur-xl">
                    <p className="text-lg font-bold text-slate-800">{t('ruralOutreach.empty.title')}</p>
                    <p className="mt-2 text-sm text-slate-500">{t('ruralOutreach.empty.description')}</p>
                </div>
            ) : (
                <motion.section
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
                >
                    {villageRoster.map((patient) => (
                        <motion.article
                            key={patient.id}
                            variants={cardVariants}
                            className="rounded-[1.8rem] border border-white/70 bg-white/75 p-5 shadow-xl shadow-slate-200/55 backdrop-blur-xl"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">{patient.name}</h3>
                                    <p className="mt-1 text-sm font-semibold text-slate-600">
                                        {patient.age} {t('common.yrs')} | {t(`ruralOutreach.gender.${patient.gender}`)}
                                    </p>
                                    <p className="text-sm font-semibold text-slate-500">
                                        {t('ruralOutreach.card.village')}: {patient.village}
                                    </p>
                                </div>
                                <StatusBadge status={patient.status} t={t} />
                            </div>

                            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600 ring-1 ring-slate-200/80">
                                {t('ruralOutreach.card.chiefComplaint')}:{' '}
                                <span className="font-semibold text-slate-800">{patient.complaint}</span>
                            </p>

                            <div className="mt-4 grid grid-cols-1 gap-3">
                                <button
                                    type="button"
                                    onClick={() => openVitalsModal(patient.id)}
                                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.99]"
                                >
                                    <Activity size={17} /> {t('ruralOutreach.card.logVitals')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => toggleVoiceTriage(patient.id)}
                                    className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition-all active:scale-[0.99] ${
                                        activeVoicePatientId === patient.id
                                            ? 'border-rose-300 bg-rose-50 text-rose-700'
                                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <Mic size={17} />{' '}
                                    {activeVoicePatientId === patient.id
                                        ? t('ruralOutreach.card.stopRecording')
                                        : t('ruralOutreach.card.voiceTriage')}
                                </button>
                            </div>

                            {patient.vitals ? (
                                <div className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                                    {t('ruralOutreach.card.lastVitals')}: {t('ruralOutreach.card.bloodPressureShort')} {patient.vitals.bloodPressure} |{' '}
                                    {t('ruralOutreach.card.sugarShort')} {patient.vitals.sugar} | {t('ruralOutreach.card.tempShort')} {patient.vitals.temp}
                                </div>
                            ) : null}
                        </motion.article>
                    ))}
                </motion.section>
            )}

            <CampModal open={showAddModal} onClose={closeAddModal} title={t('ruralOutreach.modals.registerTitle')} closeLabel={t('common.close')}>
                <form onSubmit={handleAddPatient} className="space-y-3">
                    <Field
                        label={t('ruralOutreach.fields.name')}
                        value={patientForm.name}
                        onChange={(value) => setPatientForm((prev) => ({ ...prev, name: value }))}
                        placeholder={t('ruralOutreach.placeholders.name')}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Field
                            label={t('ruralOutreach.fields.age')}
                            value={patientForm.age}
                            onChange={(value) =>
                                setPatientForm((prev) => ({ ...prev, age: value.replace(/\D/g, '').slice(0, 3) }))
                            }
                            inputMode="numeric"
                            placeholder={t('ruralOutreach.placeholders.age')}
                        />
                        <label className="block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                            {t('ruralOutreach.fields.gender')}
                            <select
                                value={patientForm.gender}
                                onChange={(event) => setPatientForm((prev) => ({ ...prev, gender: event.target.value }))}
                                className="mt-1 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
                            >
                                <option value="female">{t('ruralOutreach.gender.female')}</option>
                                <option value="male">{t('ruralOutreach.gender.male')}</option>
                                <option value="other">{t('ruralOutreach.gender.other')}</option>
                            </select>
                        </label>
                    </div>
                    <Field
                        label={t('ruralOutreach.fields.village')}
                        value={patientForm.village}
                        onChange={(value) => setPatientForm((prev) => ({ ...prev, village: value }))}
                        placeholder={t('ruralOutreach.placeholders.village')}
                    />
                    <label className="block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                        {t('ruralOutreach.fields.chiefComplaint')}
                        <textarea
                            value={patientForm.complaint}
                            onChange={(event) => setPatientForm((prev) => ({ ...prev, complaint: event.target.value }))}
                            rows={3}
                            placeholder={t('ruralOutreach.placeholders.chiefComplaint')}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                        />
                    </label>
                    <button
                        type="submit"
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-black text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-600 active:scale-[0.99]"
                    >
                        <Save size={16} /> {t('ruralOutreach.buttons.saveToRoster')}
                    </button>
                </form>
            </CampModal>

            <CampModal
                open={showVitalsModal}
                onClose={closeVitalsModal}
                title={
                    selectedPatient
                        ? t('ruralOutreach.modals.logVitalsFor', { name: selectedPatient.name })
                        : t('ruralOutreach.modals.logVitalsTitle')
                }
                closeLabel={t('common.close')}
            >
                <form onSubmit={handleSaveVitals} className="space-y-3">
                    <Field
                        label={t('ruralOutreach.fields.bloodPressure')}
                        value={vitalsForm.bloodPressure}
                        onChange={(value) => setVitalsForm((prev) => ({ ...prev, bloodPressure: value }))}
                        placeholder={t('ruralOutreach.placeholders.bloodPressure')}
                    />
                    <Field
                        label={t('ruralOutreach.fields.sugar')}
                        value={vitalsForm.sugar}
                        onChange={(value) => setVitalsForm((prev) => ({ ...prev, sugar: value }))}
                        placeholder={t('ruralOutreach.placeholders.sugar')}
                    />
                    <Field
                        label={t('ruralOutreach.fields.temperature')}
                        value={vitalsForm.temp}
                        onChange={(value) => setVitalsForm((prev) => ({ ...prev, temp: value }))}
                        placeholder={t('ruralOutreach.placeholders.temperature')}
                    />
                    <button
                        type="submit"
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-black text-white transition-all hover:bg-slate-800 active:scale-[0.99]"
                    >
                        <Save size={16} /> {t('ruralOutreach.buttons.saveVitals')}
                    </button>
                </form>
            </CampModal>
        </PageTransition>
    );
}

function SyncBadge({ status, t }) {
    const isOnline = status === 'online';
    return (
        <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${
                isOnline
                    ? 'border-emerald-300/40 bg-emerald-400/20 text-emerald-100'
                    : 'border-amber-300/40 bg-amber-400/20 text-amber-100'
            }`}
        >
            {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            {t('ruralOutreach.syncStatusLabel')}: {t(`ruralOutreach.sync.${status}`)}
        </div>
    );
}

function StatusBadge({ status, t }) {
    const isCleared = status === STATUS_CLEARED;
    return (
        <span
            className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
                isCleared ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}
        >
            {t(`ruralOutreach.status.${status}`)}
        </span>
    );
}

function MetricCard({ icon, label, value }) {
    return (
        <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-md">
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-200">
                {icon} {label}
            </p>
            <p className="mt-1 text-2xl font-black text-white">{value}</p>
        </div>
    );
}

function Field({ label, value, onChange, inputMode, placeholder }) {
    return (
        <label className="block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            {label}
            <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                inputMode={inputMode}
                placeholder={placeholder}
                className="mt-1 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
            />
        </label>
    );
}

function CampModal({ open, onClose, title, children, closeLabel }) {
    return (
        <AnimatePresence>
            {open ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[120] grid place-items-center bg-slate-900/55 px-4 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.96 }}
                        className="w-full max-w-md rounded-[1.8rem] border border-white/70 bg-white p-6 shadow-2xl"
                    >
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h3 className="text-lg font-black text-slate-900">{title}</h3>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label={closeLabel}
                                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        {children}
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
