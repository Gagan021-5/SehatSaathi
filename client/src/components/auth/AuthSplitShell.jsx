import { motion } from 'framer-motion';
import { Bot, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react';
import PageTransition from '../common/PageTransition';
import ServiceOfflineBanner from '../common/ServiceOfflineBanner';

const defaultHighlights = [
    { icon: Stethoscope, text: 'AI-powered diabetes risk assessment' },
    { icon: Bot, text: 'Chat with AI doctor in your language' },
    { icon: ShieldCheck, text: 'ML-backed disease prediction' },
];

export default function AuthSplitShell({
    heroTitle,
    heroSubtitle,
    highlights = defaultHighlights,
    cardTitle,
    cardSubtitle,
    serverError = '',
    footer,
    children,
}) {
    return (
        <PageTransition className="min-h-screen bg-slate-100 overflow-hidden selection:bg-blue-100 selection:text-blue-900">
            <div className="grid min-h-screen lg:grid-cols-2">
                <motion.aside
                    initial={{ opacity: 0, x: -28 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    className="relative hidden lg:flex"
                >
                    <div className="absolute inset-0 bg-[linear-gradient(155deg,#2458f6_0%,#1f4de3_42%,#0f9fa3_100%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_8%,rgba(255,255,255,0.2),transparent_36%),radial-gradient(circle_at_84%_88%,rgba(45,212,191,0.24),transparent_38%)]" />
                    <div className="relative z-10 flex h-full w-full flex-col p-8 xl:p-12 text-white">
                        <div className="inline-flex items-center gap-3">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/14 ring-1 ring-white/30 backdrop-blur-md">
                                <Sparkles size={20} />
                            </div>
                            <p className="text-[2rem] leading-none font-bold tracking-tight">SehatSaathi</p>
                        </div>

                        <div className="mt-16 max-w-[31rem]">
                            <h1 className="text-[2.8rem] leading-[1.1] font-extrabold tracking-tight !text-white">
                                {heroTitle}
                            </h1>
                            <p className="mt-5 text-xl text-blue-50/95 leading-relaxed">{heroSubtitle}</p>
                        </div>

                        <div className="mt-12 space-y-4 max-w-[31rem]">
                            {highlights.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.text}
                                        className="flex items-center gap-3 rounded-2xl bg-white/10 ring-1 ring-white/18 backdrop-blur-md px-4 py-3"
                                    >
                                        <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/12 ring-1 ring-white/20">
                                            <Icon size={18} />
                                        </span>
                                        <p className="text-base text-white/95">{item.text}</p>
                                    </div>
                                );
                            })}
                        </div>

                        <p className="mt-auto text-sm text-blue-100/85">© 2026 SehatSaathi — AI Health Companion</p>
                    </div>
                </motion.aside>

                <motion.main
                    initial={{ opacity: 0, x: 26 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
                    className="relative flex items-center justify-center px-4 py-6 sm:px-8 sm:py-10 lg:px-10 xl:px-14"
                >
                    <div className="pointer-events-none absolute -top-16 -right-14 h-64 w-64 rounded-full bg-blue-400/18 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-teal-400/12 blur-3xl" />

                    <div className="relative z-10 w-full max-w-[460px]">
                        <div className="mb-7 inline-flex items-center gap-2.5 rounded-2xl bg-white/78 px-3.5 py-2 shadow-lg shadow-slate-200/60 ring-1 ring-slate-200/85 lg:hidden">
                            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/25">
                                <Sparkles size={16} />
                            </div>
                            <p className="text-lg leading-none font-bold tracking-tight text-slate-900">SehatSaathi</p>
                        </div>

                        {serverError && (
                            <div className="mb-4">
                                <ServiceOfflineBanner message={serverError} />
                            </div>
                        )}

                        <section className="rounded-[1.8rem] border border-slate-200/88 bg-white/85 backdrop-blur-2xl shadow-[0_24px_56px_rgba(15,23,42,0.11)] p-6 sm:p-8">
                            <header className="mb-6">
                                <h2 className="text-[2rem] leading-tight font-bold tracking-tight text-slate-900">
                                    {cardTitle}
                                </h2>
                                <p className="mt-2 text-base text-slate-500">{cardSubtitle}</p>
                            </header>

                            {children}
                        </section>

                        {footer}
                    </div>
                </motion.main>
            </div>
        </PageTransition>
    );
}
