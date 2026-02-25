import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Activity,
    ArrowRight,
    Bot,
    Brain,
    Building2,
    FileText,
    HeartPulse,
    ShieldCheck,
    Stethoscope,
} from 'lucide-react';
import { getModelInfo, mlApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import PageTransition from '../components/common/PageTransition';
import ServiceOfflineBanner from '../components/common/ServiceOfflineBanner';

const quickActions = [
    { path: '/diabetes', title: 'Diabetes Assessment', subtitle: 'ML screening + AI explanation', icon: Stethoscope },
    { path: '/chat', title: 'AI Doctor Chat', subtitle: 'Multilingual clinical guidance', icon: Bot },
    { path: '/predict', title: 'Symptom Checker', subtitle: 'Top possible conditions ranked', icon: Brain },
    { path: '/prescription', title: 'Prescription Scan', subtitle: 'Extract medicines and interactions', icon: FileText },
    { path: '/health', title: 'Health Records', subtitle: 'Track trends over time', icon: Activity },
    { path: '/hospitals', title: 'Nearby Hospitals', subtitle: 'Map + distance + contact actions', icon: Building2 },
];

export default function Home() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [models, setModels] = useState(null);
    const [serverError, setServerError] = useState('');

    useEffect(() => {
        let mounted = true;
        async function loadDashboardData() {
            try {
                const [modelResponse, mlHealth] = await Promise.all([
                    getModelInfo(),
                    mlApi.get('/health'),
                ]);
                if (!mounted) return;
                setModels(modelResponse.data);
                if (mlHealth.data?.status !== 'ok') {
                    setServerError('Some model services are not fully healthy right now. Results may be delayed.');
                }
            } catch {
                if (mounted) {
                    setServerError('Service Offline: unable to load dashboard model data right now.');
                }
            }
        }
        loadDashboardData();
        return () => {
            mounted = false;
        };
    }, []);

    const firstName = useMemo(() => user?.name?.split(' ')[0] || 'there', [user?.name]);
    const listTransition = { duration: 0.4, ease: 'easeOut' };

    return (
        <PageTransition className="mx-auto max-w-7xl space-y-5">
            {serverError && <ServiceOfflineBanner message={serverError} />}

            <Card className="p-6 md:p-8 bg-gradient-to-br from-zinc-900 via-blue-900 to-teal-700 text-white border-transparent shadow-xl shadow-blue-500/20">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm text-blue-100">Welcome back, {firstName}</p>
                        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
                            Medical Premium 2025 Dashboard
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm text-blue-100 leading-relaxed">
                            AI-powered diagnostics, emergency support, records tracking, and hospital discovery in one
                            integrated workspace.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/diabetes')}
                        className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-blue-700 shadow-lg shadow-zinc-900/20 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-95"
                    >
                        <Stethoscope size={16} /> Start Assessment <ArrowRight size={16} />
                    </button>
                </div>
            </Card>

            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {quickActions.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <motion.div
                            key={item.path}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...listTransition, delay: index * 0.05 }}
                        >
                            <Card
                                as="button"
                                type="button"
                                onClick={() => navigate(item.path)}
                                className="p-5 text-left"
                            >
                                <div className="h-11 w-11 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/20 grid place-items-center">
                                    <Icon size={18} />
                                </div>
                                <h2 className="mt-4 text-base font-semibold tracking-tight text-zinc-900">{item.title}</h2>
                                <p className="mt-1 text-sm text-zinc-500 leading-relaxed">{item.subtitle}</p>
                            </Card>
                        </motion.div>
                    );
                })}
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-5">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 grid place-items-center">
                        <ShieldCheck size={18} />
                    </div>
                    <h3 className="mt-3 text-base font-semibold tracking-tight text-zinc-900">Clinical Reliability</h3>
                    <p className="mt-1 text-sm text-zinc-500 leading-relaxed">
                        Model outputs are explained before recommendation delivery.
                    </p>
                </Card>
                <Card className="p-5">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 grid place-items-center">
                        <HeartPulse size={18} />
                    </div>
                    <h3 className="mt-3 text-base font-semibold tracking-tight text-zinc-900">Patient-Centric</h3>
                    <p className="mt-1 text-sm text-zinc-500 leading-relaxed">
                        Designed for quick actions and clear language in urgent and routine care.
                    </p>
                </Card>
                <Card className="p-5">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 grid place-items-center">
                        <Activity size={18} />
                    </div>
                    <h3 className="mt-3 text-base font-semibold tracking-tight text-zinc-900">Connected Stack</h3>
                    <p className="mt-1 text-sm text-zinc-500 leading-relaxed">
                        React frontend, Node API, ML microservice, and Gemini assistant in one flow.
                    </p>
                </Card>
            </section>

            {models && (
                <section>
                    <h2 className="text-lg font-semibold tracking-tight text-zinc-900 mb-3">Model Transparency</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(models).map(([name, info], index) => (
                            <motion.div
                                key={name}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ ...listTransition, delay: index * 0.05 }}
                            >
                                <Card className="p-5">
                                    <h3 className="text-base font-semibold tracking-tight text-zinc-900 capitalize">{name}</h3>
                                    <p className="mt-2 text-sm text-zinc-500">Accuracy: {((info?.accuracy || 0) * 100).toFixed(1)}%</p>
                                    <p className="text-sm text-zinc-500">F1 Score: {((info?.f1_score || 0) * 100).toFixed(1)}%</p>
                                {info?.dataset_size && (
                                    <p className="text-sm text-zinc-500">Dataset Size: {info.dataset_size.toLocaleString()}</p>
                                )}
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}
        </PageTransition>
    );
}

