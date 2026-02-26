import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Download, FileText, Loader2, User, Activity, Pill, ShieldCheck, ChevronRight } from 'lucide-react';
import { getHealthRecords, getMedicineReminders, getProfile } from '../services/api';
import PageTransition from '../components/common/PageTransition';
import { generateHealthReportPdf } from '../utils/healthReportPdf';

// --- Mock Data & Helpers ---
const mockData = {
    profile: {
        name: 'SehatSaathi User',
        age: 34,
        bloodGroup: 'B+',
        email: 'user@sehat-saathi.com',
    },
    vitals: [
        { date: '2026-02-21', type: 'Heart Rate', value: '74 bpm', status: 'Normal' },
        { date: '2026-02-20', type: 'Blood Pressure', value: '118/76 mmHg', status: 'Normal' },
        { date: '2026-02-19', type: 'Blood Sugar', value: '102 mg/dL', status: 'Normal' },
        { date: '2026-02-18', type: 'Body Temperature', value: '98.4 F', status: 'Normal' },
    ],
    medications: [
        { medicineName: 'Metformin', dosage: '500 mg', times: ['08:00', '20:00'], stockRemaining: 12 },
        { medicineName: 'Vitamin D3', dosage: '1000 IU', times: ['09:00'], stockRemaining: 8 },
    ],
};

function mapVitalRecord(record) {
    const value = record?.value !== undefined ? `${record.value} ${record.unit || ''}`.trim() : '--';
    return {
        date: record?.createdAt || new Date().toISOString(),
        type: record?.type || 'Vital',
        value,
        status: Number(record?.value) > 0 ? 'Tracked' : '--',
    };
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

export default function Reports() {
    const [data, setData] = useState(mockData);
    const [downloading, setDownloading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        let mounted = true;
        async function loadReportContext() {
            setLoadingData(true);
            try {
                const [profileRes, vitalsRes, medicinesRes] = await Promise.all([
                    getProfile(),
                    getHealthRecords(),
                    getMedicineReminders(),
                ]);
                if (!mounted) return;

                setData({
                    profile: {
                        name: profileRes?.data?.name || mockData.profile.name,
                        age: profileRes?.data?.dateOfBirth
                            ? Math.max(0, new Date().getFullYear() - new Date(profileRes.data.dateOfBirth).getFullYear())
                            : mockData.profile.age,
                        bloodGroup: profileRes?.data?.bloodGroup || mockData.profile.bloodGroup,
                        email: profileRes?.data?.email || mockData.profile.email,
                    },
                    vitals: Array.isArray(vitalsRes?.data) && vitalsRes.data.length
                        ? vitalsRes.data.slice(0, 8).map(mapVitalRecord)
                        : mockData.vitals,
                    medications: Array.isArray(medicinesRes?.data) && medicinesRes.data.length
                        ? medicinesRes.data.map((item) => ({
                            medicineName: item.medicineName,
                            dosage: item.dosage,
                            times: item.times || [],
                            stockRemaining: item.stockRemaining,
                        }))
                        : mockData.medications,
                });
            } catch {
                if (mounted) setData(mockData);
            } finally {
                if (mounted) setLoadingData(false);
            }
        }
        loadReportContext();
        return () => { mounted = false; };
    }, []);

    const summary = useMemo(() => [
        { label: 'Patient Profile', value: data.profile.name, sub: data.profile.email, icon: User, color: 'indigo' },
        { label: 'Recent Vitals', value: `${data.vitals.length} records`, sub: 'Ready for export', icon: Activity, color: 'rose' },
        { label: 'Active Medications', value: `${data.medications.length} medicines`, sub: 'Current regimen', icon: Pill, color: 'emerald' },
    ], [data]);

    async function handleDownload() {
        setDownloading(true);
        try {
            generateHealthReportPdf(data);
            toast.success('Health report securely generated.');
        } catch {
            toast.error('Unable to generate report PDF.');
        } finally {
            setDownloading(false);
        }
    }

    return (
        <PageTransition className="mx-auto max-w-[1400px] space-y-8 pb-12 px-2">
            
            {/* Premium Hero Header */}
            <header className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-10 text-white shadow-2xl shadow-slate-900/20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_60%)]" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-300 ring-1 ring-inset ring-indigo-500/30 mb-4">
                            <ShieldCheck size={14} /> Encrypted Generation
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-white lg:text-5xl">
                            Clinical <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Dossier</span>
                        </h1>
                        <p className="mt-3 text-slate-400 text-lg">
                            Compile your physical vitals, medical profiles, and medication history into a secure, shareable PDF.
                        </p>
                    </div>
                    
                    <button
                        onClick={handleDownload}
                        disabled={downloading || loadingData}
                        className="group relative flex h-14 items-center justify-center gap-3 rounded-[1.25rem] bg-white px-8 text-sm font-bold text-slate-900 shadow-xl transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-70 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative z-10 flex items-center gap-2">
                            {downloading ? <Loader2 size={18} className="animate-spin text-indigo-600" /> : <Download size={18} className="text-indigo-600" />}
                            {downloading ? 'Compiling Document...' : 'Export Health Report'}
                        </span>
                    </button>
                </div>
            </header>

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
                
                {/* Bento Box Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {summary.map((item, idx) => {
                        const Icon = item.icon;
                        const colorThemes = {
                            indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
                            rose: 'bg-rose-50 text-rose-600 border-rose-100',
                            emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        };

                        return (
                            <motion.div key={item.label} variants={itemVariants} className="group relative overflow-hidden rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/40 border border-slate-100 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner transition-colors ${colorThemes[item.color]}`}>
                                        <Icon size={24} />
                                    </div>
                                    <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-500 transition-colors transform group-hover:translate-x-1" />
                                </div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
                                <p className="text-2xl font-black tracking-tight text-slate-900 truncate">{item.value}</p>
                                <p className="text-sm font-medium text-slate-500 mt-1 truncate">{item.sub}</p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Report Preview Dossier */}
                <motion.div variants={itemVariants} className="rounded-[2.5rem] bg-white p-8 md:p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                    {/* Watermark/Texture */}
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <FileText size={200} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-6 mb-8">
                            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight text-slate-900">Document Preview</h2>
                                <p className="text-sm font-medium text-slate-500">Live snapshot of data to be exported</p>
                            </div>
                        </div>

                        {loadingData ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 size={32} className="animate-spin text-indigo-500 mb-4" />
                                <p className="text-slate-500 font-medium">Syncing health context...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                                
                                {/* Vitals Column */}
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                        <Activity size={16} /> Tracked Vitals
                                    </h3>
                                    {data.vitals.length === 0 ? (
                                        <p className="text-sm text-slate-500 italic p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200">No vitals recorded.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {data.vitals.slice(0, 5).map((vital, index) => (
                                                <div key={index} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-2 w-2 rounded-full bg-rose-500" />
                                                        <span className="font-bold text-slate-800">{vital.type}</span>
                                                    </div>
                                                    <span className="font-mono text-sm font-semibold text-slate-600 bg-slate-200/50 px-3 py-1 rounded-lg">
                                                        {vital.value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Medications Column */}
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                        <Pill size={16} /> Active Regimen
                                    </h3>
                                    {data.medications.length === 0 ? (
                                        <p className="text-sm text-slate-500 italic p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200">No active medications.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {data.medications.slice(0, 5).map((medicine, index) => (
                                                <div key={index} className="flex flex-col justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-bold text-slate-800">{medicine.medicineName}</span>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                                            Active
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-500">
                                                        {medicine.dosage} {medicine.times?.length > 0 ? `• ${medicine.times.length}x daily` : ''}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </div>
                        )}
                    </div>
                </motion.div>
                
                <motion.div variants={itemVariants} className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center justify-center gap-2">
                        <ShieldCheck size={14} /> End-to-End Encrypted Client-Side Generation
                    </p>
                </motion.div>
                
            </motion.div>
        </PageTransition>
    );
}