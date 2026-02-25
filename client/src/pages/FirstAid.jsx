import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Fuse from 'fuse.js';
import { AlertTriangle, ChevronDown, Phone, Search, ShieldAlert } from 'lucide-react';
import firstAidGuides from '../data/firstAid.json';
import Card from '../components/common/Card';
import PageTransition from '../components/common/PageTransition';

const severityStyles = {
    critical: 'bg-rose-100 text-rose-700 border-rose-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    moderate: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
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
                threshold: 0.32,
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
        <PageTransition className="mx-auto max-w-6xl space-y-4">
            <Card className="p-6 md:p-7 bg-gradient-to-r from-blue-900 via-sky-900 to-cyan-700 text-white border-transparent">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-blue-100">Offline-First Emergency Module</p>
                        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Emergency First Aid Guide</h1>
                        <p className="mt-2 max-w-2xl text-sm text-blue-100">
                            Search instantly, even without internet. Steps are educational first aid support and not a replacement for professionals.
                        </p>
                    </div>
                    <a
                        href="tel:112"
                        className="inline-flex items-center gap-2 rounded-xl bg-rose-600/90 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-900/30 ring-1 ring-rose-300/35"
                    >
                        <Phone size={16} /> Emergency 112
                    </a>
                </div>
            </Card>

            <div className="sticky top-[5.4rem] z-20 space-y-3">
                <Card className="p-3 md:p-4">
                    <label className="relative block">
                        <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search emergencies, actions, or warnings..."
                            className="w-full pl-11 pr-4 py-3"
                        />
                    </label>
                </Card>

                <div className="flex gap-2 overflow-x-auto pb-1">
                    {categories.map((category) => (
                        <button
                            key={category}
                            type="button"
                            onClick={() => setActiveCategory(category)}
                            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ring-1 transition-all ${
                                activeCategory === category
                                    ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white ring-blue-400/60 shadow-lg shadow-blue-500/25'
                                    : 'bg-white/85 text-slate-600 ring-slate-200/80 hover:bg-white'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                {visibleGuides.map((item, index) => {
                    const isOpen = openId === item.id;
                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, ease: 'easeOut', delay: index * 0.03 }}
                        >
                            <Card className="overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setOpenId((prev) => (prev === item.id ? null : item.id))}
                                    className="w-full px-5 py-4 md:px-6 md:py-5 text-left"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                                    {item.category}
                                                </span>
                                                <span
                                                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                                        severityStyles[item.severity] || severityStyles.low
                                                    }`}
                                                >
                                                    {item.severity.toUpperCase()}
                                                </span>
                                            </div>
                                            <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">{item.title}</h2>
                                        </div>
                                        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.22 }}>
                                            <ChevronDown size={19} className="text-slate-400" />
                                        </motion.div>
                                    </div>
                                </button>

                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.28, ease: 'easeOut' }}
                                            className="overflow-hidden border-t border-slate-200/80"
                                        >
                                            <div className="space-y-4 p-5 md:p-6">
                                                <div className="space-y-2.5">
                                                    {item.steps.map((step, stepIndex) => (
                                                        <div key={`${item.id}-step-${stepIndex}`} className="rounded-xl border border-slate-200/80 bg-white/85 p-3.5">
                                                            <p className="text-sm text-slate-700">
                                                                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                                                                    {stepIndex + 1}
                                                                </span>
                                                                {step.action}
                                                            </p>
                                                            {step.warning ? (
                                                                <p className="mt-2 text-xs font-medium text-amber-700">
                                                                    Caution: {step.warning}
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    ))}
                                                </div>

                                                {item.doNot?.length ? (
                                                    <div className="rounded-xl border border-rose-200 bg-rose-50/95 p-4">
                                                        <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-rose-700">
                                                            <AlertTriangle size={14} /> Do NOT
                                                        </p>
                                                        <ul className="space-y-1.5">
                                                            {item.doNot.map((warning) => (
                                                                <li key={warning} className="text-sm text-rose-700">
                                                                    {warning}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ) : null}

                                                {item.callEmergency ? (
                                                    <a
                                                        href="tel:112"
                                                        className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30"
                                                    >
                                                        <ShieldAlert size={16} /> Call 112 Now
                                                    </a>
                                                ) : null}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {!visibleGuides.length && (
                <Card className="p-8 text-center">
                    <p className="text-sm text-slate-500">No matching emergency guides found. Try a different keyword.</p>
                </Card>
            )}
        </PageTransition>
    );
}
