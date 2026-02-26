import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Fuse from 'fuse.js';
import { 
    AlertTriangle, ChevronDown, Phone, Search, ShieldAlert, 
    HeartPulse, Activity, XOctagon, Info 
} from 'lucide-react';
import firstAidGuides from '../data/firstAid.json';
import PageTransition from '../components/common/PageTransition';

// --- Premium Style Maps ---
const severityStyles = {
    critical: { wrapper: 'bg-rose-50 border-rose-200', text: 'text-rose-700', badge: 'bg-rose-600 text-white shadow-rose-500/30' },
    high: { wrapper: 'bg-orange-50 border-orange-200', text: 'text-orange-700', badge: 'bg-orange-500 text-white shadow-orange-500/30' },
    moderate: { wrapper: 'bg-amber-50 border-amber-200', text: 'text-amber-700', badge: 'bg-amber-500 text-white shadow-amber-500/30' },
    low: { wrapper: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-500 text-white shadow-emerald-500/30' },
};

// --- Animation Variants ---
const listVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function FirstAid() {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [openId, setOpenId] = useState(null);

    const categories = useMemo(() => ['All', ...new Set(firstAidGuides.map((item) => item.category))], []);

    const categoryFiltered = useMemo(
        () => (activeCategory === 'All' ? firstAidGuides : firstAidGuides.filter((item) => item.category === activeCategory)),
        [activeCategory]
    );

    const fuse = useMemo(
        () =>
            new Fuse(categoryFiltered, {
                keys: ['title', 'category', 'steps.action', 'steps.warning', 'doNot'],
                threshold: 0.3,
                includeScore: true,
                ignoreLocation: true,
            }),
        [categoryFiltered]
    );

    const visibleGuides = useMemo(() => {
        const query = search.trim();
        if (!query) return categoryFiltered;
        return fuse.search(query).map((result) => result.item);
    }, [categoryFiltered, fuse, search]);

    return (
        <PageTransition className="mx-auto max-w-[1000px] space-y-6 pb-12 px-2 md:px-4">
            
            {/* Premium Hero Section */}
            <header className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-6 py-10 md:px-10 md:py-12 text-white shadow-2xl shadow-slate-900/20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(225,29,72,0.25),transparent_60%)]" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-300 ring-1 ring-inset ring-rose-500/30 mb-4">
                            <HeartPulse size={14} className="animate-pulse" /> Offline Protocol Ready
                        </div>
                        <h1 className="text-4xl text-white font-black tracking-tight lg:text-5xl">
                            Emergency <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">Response</span>
                        </h1>
                        <p className="mt-3 text-slate-400 text-base leading-relaxed">
                            Immediate, step-by-step first aid instructions available without an internet connection. 
                            <strong className="text-slate-300"> Always seek professional medical help for severe emergencies.</strong>
                        </p>
                    </div>
                    
                    <a
                        href="tel:112"
                        className="group relative flex h-16 w-full md:w-auto items-center justify-center gap-3 rounded-[1.5rem] bg-rose-600 px-8 text-base font-bold text-white shadow-xl shadow-rose-600/30 transition-all hover:bg-rose-500 active:scale-95 overflow-hidden shrink-0"
                    >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_2s_infinite]" />
                        <Phone size={20} className="relative z-10" />
                        <span className="relative z-10 tracking-wide">Call 112 SOS</span>
                    </a>
                </div>
            </header>

            {/* Sticky Control Bar */}
            <div className="sticky top-[4.5rem] md:top-[5.5rem] z-30 pt-2 pb-4">
                <div className="flex flex-col md:flex-row gap-4 rounded-[2rem] bg-white/80 backdrop-blur-2xl border border-white p-2 shadow-xl shadow-slate-200/50">
                    <div className="relative flex-1 group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search symptoms, actions, or emergencies..."
                            className="w-full h-12 pl-11 pr-4 rounded-[1.5rem] border-none bg-slate-50/50 text-sm font-medium text-slate-900 outline-none ring-2 ring-transparent focus:bg-white focus:ring-blue-500/20 transition-all"
                        />
                    </div>
                    
                    {/* Apple-style Segmented Control for Categories */}
                    <div className="flex p-1 space-x-1 bg-slate-100/80 rounded-[1.5rem] overflow-x-auto custom-scrollbar">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`relative px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors duration-300 shrink-0 ${
                                    activeCategory === category ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {activeCategory === category && (
                                    <motion.div
                                        layoutId="categoryTabIndicator"
                                        className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10">{category}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Protocols List */}
            <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {visibleGuides.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col items-center justify-center py-20 rounded-[2.5rem] border border-dashed border-slate-300 bg-white/50 text-center"
                        >
                            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-6 text-slate-400 shadow-inner">
                                <Search size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">No protocols found</h3>
                            <p className="mt-2 text-sm text-slate-500 max-w-sm">Try adjusting your search terms or select a different category.</p>
                        </motion.div>
                    ) : (
                        visibleGuides.map((item) => {
                            const isOpen = openId === item.id;
                            const style = severityStyles[item.severity] || severityStyles.low;

                            return (
                                <motion.div key={item.id} layout variants={itemVariants} className={`overflow-hidden rounded-[2rem] border transition-all duration-300 ${isOpen ? 'bg-white shadow-2xl shadow-slate-200/60 border-slate-200' : 'bg-white shadow-sm border-slate-100 hover:border-slate-300 hover:shadow-md'}`}>
                                    
                                    {/* Accordion Header */}
                                    <button
                                        type="button"
                                        onClick={() => setOpenId(isOpen ? null : item.id)}
                                        className="w-full flex items-center justify-between gap-4 p-5 md:p-6 text-left outline-none"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`shrink-0 flex items-center justify-center h-12 w-12 rounded-2xl ${style.wrapper}`}>
                                                <Activity size={24} className={style.text} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                                        {item.category}
                                                    </span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${style.badge}`}>
                                                        {item.severity}
                                                    </span>
                                                </div>
                                                <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">{item.title}</h2>
                                            </div>
                                        </div>
                                        <motion.div 
                                            animate={{ rotate: isOpen ? 180 : 0 }} 
                                            className="shrink-0 h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"
                                        >
                                            <ChevronDown size={20} />
                                        </motion.div>
                                    </button>

                                    {/* Accordion Content */}
                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                            >
                                                <div className="px-5 pb-5 md:px-6 md:pb-6 pt-2 border-t border-slate-100">
                                                    
                                                    {/* Step-by-Step Timeline */}
                                                    <div className="space-y-6 mt-4">
                                                        {item.steps.map((step, stepIndex) => (
                                                            <div key={`${item.id}-step-${stepIndex}`} className="relative flex gap-4">
                                                                {/* Timeline Line */}
                                                                {stepIndex !== item.steps.length - 1 && (
                                                                    <div className="absolute left-4 top-10 bottom-[-1.5rem] w-[2px] bg-slate-100" />
                                                                )}
                                                                
                                                                <div className="relative z-10 shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-md shadow-blue-500/30 ring-4 ring-white">
                                                                    {stepIndex + 1}
                                                                </div>
                                                                
                                                                <div className="flex-1 pt-1 pb-2">
                                                                    <p className="text-base font-semibold text-slate-800 leading-relaxed">
                                                                        {step.action}
                                                                    </p>
                                                                    {step.warning && (
                                                                        <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200/60 p-3">
                                                                            <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                                                            <p className="text-sm font-medium text-amber-800 leading-relaxed">
                                                                                <span className="font-bold">Caution:</span> {step.warning}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Do NOT Section */}
                                                    {item.doNot?.length > 0 && (
                                                        <div className="mt-8 rounded-2xl bg-rose-50 border border-rose-200 p-5">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className="h-8 w-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                                                                    <XOctagon size={16} />
                                                                </div>
                                                                <h3 className="text-sm font-black uppercase tracking-widest text-rose-700">Crucial: Do Not Do</h3>
                                                            </div>
                                                            <ul className="space-y-2">
                                                                {item.doNot.map((warning, wIdx) => (
                                                                    <li key={wIdx} className="flex items-start gap-3 text-sm font-medium text-rose-900">
                                                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                                                                        <span className="leading-relaxed">{warning}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {/* Emergency Action */}
                                                    {item.callEmergency && (
                                                        <a
                                                            href="tel:112"
                                                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 text-sm font-bold text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-95"
                                                        >
                                                            <ShieldAlert size={18} className="text-rose-500" /> 
                                                            Request Emergency Ambulance (112)
                                                        </a>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </motion.div>
        </PageTransition>
    );
}