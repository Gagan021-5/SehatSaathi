import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Download, FileText } from 'lucide-react';
import { getHealthRecords, getMedicineReminders, getProfile } from '../services/api';
import Card from '../components/common/Card';
import PageTransition from '../components/common/PageTransition';
import { generateHealthReportPdf } from '../utils/healthReportPdf';

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

export default function Reports() {
    const [data, setData] = useState(mockData);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        let mounted = true;
        async function loadReportContext() {
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
            }
        }
        loadReportContext();
        return () => {
            mounted = false;
        };
    }, []);

    const summary = useMemo(
        () => [
            { label: 'Profile Name', value: data.profile.name },
            { label: 'Recent Vitals', value: `${data.vitals.length} records` },
            { label: 'Active Medications', value: `${data.medications.length} medicines` },
        ],
        [data]
    );

    async function handleDownload() {
        setDownloading(true);
        try {
            generateHealthReportPdf(data);
            toast.success('Health report PDF generated.');
        } catch {
            toast.error('Unable to generate report PDF.');
        } finally {
            setDownloading(false);
        }
    }

    return (
        <PageTransition className="mx-auto max-w-6xl space-y-4">
            <Card className="p-6 md:p-7 bg-gradient-to-r from-zinc-900 via-blue-900 to-teal-700 text-white border-transparent">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-blue-100">Client-Side Health Report PDF Engine</p>
                        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Health Report Builder</h1>
                        <p className="mt-2 max-w-2xl text-sm text-blue-100">
                            Reports are generated in the browser using local and API-fetched data without external AI services.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleDownload}
                        disabled={downloading}
                        className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-blue-700 shadow-lg shadow-slate-950/20 disabled:opacity-60"
                    >
                        <Download size={16} /> {downloading ? 'Preparing PDF...' : '📥 Download Health Report'}
                    </button>
                </div>
            </Card>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {summary.map((item) => (
                    <Card key={item.label} className="p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
                        <p className="mt-2 text-lg font-semibold tracking-tight text-slate-900">{item.value}</p>
                    </Card>
                ))}
            </section>

            <Card className="p-5">
                <div className="flex items-center gap-2">
                    <FileText size={17} className="text-blue-600" />
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">Preview Summary</h2>
                </div>
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4">
                        <h3 className="text-sm font-semibold text-slate-800">Recent Vitals</h3>
                        <div className="mt-3 space-y-2">
                            {data.vitals.slice(0, 4).map((vital, index) => (
                                <div key={`${vital.type}-${index}`} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                                    <span className="font-medium text-slate-800">{vital.type}:</span> {vital.value}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4">
                        <h3 className="text-sm font-semibold text-slate-800">Active Medications</h3>
                        <div className="mt-3 space-y-2">
                            {data.medications.slice(0, 4).map((medicine) => (
                                <div key={`${medicine.medicineName}-${medicine.dosage}`} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                                    <span className="font-medium text-slate-800">{medicine.medicineName}</span> · {medicine.dosage}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-xs text-slate-500"
            >
                Generated securely by SehatSaathi — Not a medical diagnostic document.
            </motion.p>
        </PageTransition>
    );
}
