import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import en from '../locales/en.json';
import hi from '../locales/hi.json';

const STORAGE_KEY = 'sehat_saathi_lang';

export const LANGUAGES = [
    {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇬🇧',
        speechCode: 'en-IN',
        geminiInstruction: 'Respond in English.',
    },
    {
        code: 'hi',
        name: 'Hindi',
        nativeName: 'हिंदी',
        flag: '🇮🇳',
        speechCode: 'hi-IN',
        geminiInstruction: 'Respond in Hindi (हिंदी). Use simple conversational Hindi in Devanagari script.',
    },
];

const dictionaries = { en, hi };
const LanguageContext = createContext(null);

function resolvePath(dictionary, key) {
    return key.split('.').reduce((acc, segment) => (acc && typeof acc === 'object' ? acc[segment] : undefined), dictionary);
}

function applyParams(text, params) {
    if (typeof text !== 'string' || !params || typeof params !== 'object') return text;
    return text.replace(/\{\{(\w+)\}\}/g, (_, token) => (params[token] ?? `{{${token}}}`));
}

export function LanguageProvider({ children }) {
    const [currentLanguage, setCurrentLanguage] = useState(() => {
        const savedCode = localStorage.getItem(STORAGE_KEY);
        return LANGUAGES.find((language) => language.code === savedCode) || LANGUAGES[0];
    });
    const [isFirstVisit, setIsFirstVisit] = useState(() => !localStorage.getItem(STORAGE_KEY));

    useEffect(() => {
        document.documentElement.lang = currentLanguage.code;
    }, [currentLanguage.code]);

    const changeLanguage = (langCode) => {
        const nextLanguage = LANGUAGES.find((language) => language.code === langCode);
        if (!nextLanguage) return;
        setCurrentLanguage(nextLanguage);
        localStorage.setItem(STORAGE_KEY, nextLanguage.code);
        setIsFirstVisit(false);
    };

    const completeOnboarding = () => {
        if (!localStorage.getItem(STORAGE_KEY)) {
            localStorage.setItem(STORAGE_KEY, currentLanguage.code);
        }
        setIsFirstVisit(false);
    };

    const t = useMemo(
        () =>
            (key, params = undefined) => {
                if (!key) return '';
                const activeDictionary = dictionaries[currentLanguage.code] || dictionaries.en;
                const value = resolvePath(activeDictionary, key) ?? resolvePath(dictionaries.en, key) ?? key;
                return applyParams(value, params);
            },
        [currentLanguage.code]
    );

    const value = useMemo(
        () => ({
            currentLanguage,
            changeLanguage,
            languages: LANGUAGES,
            isFirstVisit,
            completeOnboarding,
            t,
        }),
        [currentLanguage, isFirstVisit, t]
    );

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useLanguage must be used inside LanguageProvider.');
    return context;
};
