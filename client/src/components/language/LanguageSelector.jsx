import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

function joinClasses(...classes) {
    return classes.filter(Boolean).join(' ');
}

export default function LanguageSelector({ className = '' }) {
    const { currentLanguage, changeLanguage, languages, t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        window.addEventListener('click', handleOutsideClick);
        return () => window.removeEventListener('click', handleOutsideClick);
    }, []);

    const handleSelectLanguage = (language) => {
        if (language.code === currentLanguage.code) {
            setIsOpen(false);
            return;
        }
        changeLanguage(language.code);
        toast.success(t('language.changed', { language: language.nativeName }));
        setIsOpen(false);
    };

    return (
        <div ref={rootRef} className={joinClasses('relative', className)}>
            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200/85 bg-white/75 px-3 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-xl transition-all hover:border-slate-300 hover:bg-white"
                aria-label={t('language.selectorLabel')}
            >
                <Languages size={16} className="text-slate-500" />
                <span className="hidden sm:inline">{currentLanguage.flag}</span>
                <span>{currentLanguage.nativeName}</span>
                <ChevronDown
                    size={16}
                    className={joinClasses('text-slate-500 transition-transform', isOpen ? 'rotate-180' : '')}
                />
            </button>

            <AnimatePresence>
                {isOpen ? (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 z-[90] mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 p-2 shadow-2xl shadow-slate-900/12 backdrop-blur-2xl"
                    >
                        {languages.map((language) => {
                            const active = language.code === currentLanguage.code;
                            return (
                                <button
                                    type="button"
                                    key={language.code}
                                    onClick={() => handleSelectLanguage(language)}
                                    className={joinClasses(
                                        'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors',
                                        active
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-slate-700 hover:bg-slate-100'
                                    )}
                                >
                                    <span className="flex items-center gap-2">
                                        <span>{language.flag}</span>
                                        <span>{language.nativeName}</span>
                                    </span>
                                    {active ? <Check size={15} /> : null}
                                </button>
                            );
                        })}
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}
