import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Activity,
    Bot,
    FileText,
    HeartPulse,
    Pill,
    ShieldCheck,
    Stethoscope,
    Zap,
    ChevronRight
} from 'lucide-react';
import { getModelInfo, mlApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Card from '../components/common/Card';
import PageTransition from '../components/common/PageTransition';
import ServiceOfflineBanner from '../components/common/ServiceOfflineBanner';

export default function Home() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useLanguage();
    const [models, setModels] = useState(null);
    const [serverError, setServerError] = useState('');

    // Quick actions use t() at render time (not as static array)
    const quickActions = useMemo(() => [
        { path: '/diabetes', titleKey: 'home.quickActions.diabetesScreening', subtitleKey: 'home.quickActions.diabetesScreeningSubtitle', icon: Stethoscope, color: 'from-blue-600 to-indigo-600' },
        { path: '/chat', titleKey: 'home.quickActions.aiClinicalAssistant', subtitleKey: 'home.quickActions.aiClinicalAssistantSubtitle', icon: Bot, color: 'from-teal-500 to-emerald-600' },
        { path: '/prescription', titleKey: 'home.quickActions.smartScan', subtitleKey: 'home.quickActions.smartScanSubtitle', icon: FileText, color: 'from-violet-500 to-purple-600' },
        { path: '/first-aid', titleKey: 'home.quickActions.emergencyProtocol', subtitleKey: 'home.quickActions.emergencyProtocolSubtitle', icon: HeartPulse, color: 'from-rose-500 to-red-600' },
        { path: '/medicines', titleKey: 'home.quickActions.pharmacyManager', subtitleKey: 'home.quickActions.pharmacyManagerSubtitle', icon: Pill, color: 'from-amber-500 to-orange-600' },
        { path: '/family-vault', titleKey: 'home.quickActions.secureVault', subtitleKey: 'home.quickActions.secureVaultSubtitle', icon: ShieldCheck, color: 'from-blue-500 to-cyan-600' },
    ], []);

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
                    setServerError('Intermittent latency detected in clinical modules.');
                }
            } catch {
                if (mounted) setServerError('System maintenance in progress. Data sync may be offline.');
            }
        }
        loadDashboardData();
        return () => { mounted = false; };
    }, []);

    const firstName = useMemo(() => user?.name?.split(' ')[0] || t('common.user'), [user?.name, t]);

    return (
        <PageTransition className="mx-auto max-w-6xl px-4 py-8 space-y-12">
            {serverError && <ServiceOfflineBanner message={serverError} />}

            {/* Hero Section */}
            <header className="relative overflow-hidden rounded-[2rem] bg-zinc-900 px-8 py-12 text-white shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.2),transparent)]" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-400 ring-1 ring-inset ring-blue-500/20">
                            <Zap size={12} /> {t('home.systemOperational')}
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                            {t('home.greeting', { name: firstName }).split(firstName)[0]}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">{firstName}</span>
                            {t('home.greeting', { name: firstName }).split(firstName)[1]}
                        </h1>
                        <p className="max-w-xl text-lg text-zinc-400">
                            {t('home.subtitle')}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/diabetes')}
                        className="group flex items-center gap-3 rounded-2xl bg-white px-6 py-4 text-sm font-bold text-zinc-900 transition-all hover:bg-blue-50 active:scale-95"
                    >
                        {t('home.newAssessment')} <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </button>
                </div>
            </header>

            {/* Core Modules Grid */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-zinc-900">{t('home.clinicalModules')}</h2>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{t('home.version')}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                    {quickActions.map((item, index) => (
                        <motion.div
                            key={item.path}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <button
                                onClick={() => navigate(item.path)}
                                className="group w-full text-left p-1 rounded-[2rem] transition-all hover:scale-[1.02]"
                            >
                                <Card className="h-full p-6 border-zinc-100 bg-white shadow-sm transition-shadow group-hover:shadow-xl">
                                    <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg flex items-center justify-center transition-transform group-hover:rotate-6`}>
                                        <item.icon size={22} />
                                    </div>
                                    <h3 className="mt-6 text-lg font-bold text-zinc-900">{t(item.titleKey)}</h3>
                                    <p className="mt-2 text-sm text-zinc-500 leading-relaxed">{t(item.subtitleKey)}</p>
                                </Card>
                            </button>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Model Intelligence Board */}
            {models && (
                <section className="rounded-[2.5rem] bg-zinc-50 p-8 border border-zinc-200/50">
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-zinc-900">{t('home.neuralNetworkStatus')}</h2>
                        <p className="text-sm text-zinc-500">{t('home.neuralNetworkSubtitle')}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Object.entries(models).map(([name, info]) => (
                            <div key={name} className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">{name}</span>
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-end justify-between mb-1">
                                            <span className="text-2xl font-bold text-zinc-900">{((info?.accuracy || 0) * 100).toFixed(1)}%</span>
                                            <span className="text-[10px] font-bold text-zinc-400 italic">{t('home.accuracy')}</span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-zinc-100">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(info?.accuracy || 0) * 100}%` }}
                                                className="h-full rounded-full bg-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-xs font-medium border-t border-zinc-50 pt-4">
                                        <span className="text-zinc-500">{t('home.dataset')}</span>
                                        <span className="text-zinc-900">{info.dataset_size?.toLocaleString() || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Trust Footer */}
            <footer className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-t border-zinc-100">
                <div className="flex gap-4 items-start">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><ShieldCheck size={20} /></div>
                    <div>
                        <h4 className="text-sm font-bold text-zinc-900">{t('home.trust.encryptedVault')}</h4>
                        <p className="text-xs text-zinc-500 mt-1">{t('home.trust.encryptedVaultDesc')}</p>
                    </div>
                </div>
                <div className="flex gap-4 items-start">
                    <div className="p-2 rounded-lg bg-teal-50 text-teal-600"><Activity size={20} /></div>
                    <div>
                        <h4 className="text-sm font-bold text-zinc-900">{t('home.trust.realTimeSync')}</h4>
                        <p className="text-xs text-zinc-500 mt-1">{t('home.trust.realTimeSyncDesc')}</p>
                    </div>
                </div>
                <div className="flex gap-4 items-start">
                    <div className="p-2 rounded-lg bg-purple-50 text-purple-600"><Stethoscope size={20} /></div>
                    <div>
                        <h4 className="text-sm font-bold text-zinc-900">{t('home.trust.expertVerified')}</h4>
                        <p className="text-xs text-zinc-500 mt-1">{t('home.trust.expertVerifiedDesc')}</p>
                    </div>
                </div>
            </footer>
        </PageTransition>
    );
}