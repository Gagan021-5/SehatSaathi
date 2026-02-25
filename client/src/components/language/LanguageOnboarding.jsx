import { Languages, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import Card from '../common/Card';

export default function LanguageOnboarding() {
    const { languages, changeLanguage, completeOnboarding, isFirstVisit } = useLanguage();
    if (!isFirstVisit) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="fixed inset-0 z-[100] bg-slate-950/45 backdrop-blur-md p-4 grid place-items-center"
        >
            <Card className="w-full max-w-3xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/25 grid place-items-center">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">SehatSaathi</h1>
                        <p className="text-sm text-slate-500 leading-relaxed">Choose your preferred language</p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {languages.map((language) => (
                        <button
                            type="button"
                            key={language.code}
                            onClick={() => {
                                changeLanguage(language.code);
                                completeOnboarding();
                            }}
                            className="rounded-2xl border border-slate-200/70 bg-white/90 px-3 py-4 text-left shadow-lg shadow-slate-200/20 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-blue-50/70 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 active:translate-y-0 active:scale-95"
                        >
                            <p className="text-xl">{language.flag}</p>
                            <p className="mt-2 text-sm font-medium text-slate-900">{language.nativeName}</p>
                            <p className="text-xs text-slate-500">{language.name}</p>
                        </button>
                    ))}
                </div>

                <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
                    <Languages size={14} />
                    Language can be changed anytime from the top navigation menu.
                </div>
            </Card>
        </motion.div>
    );
}

