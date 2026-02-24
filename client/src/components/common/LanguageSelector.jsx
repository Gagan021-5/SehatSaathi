import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import './LanguageSelector.css';

export default function LanguageSelector() {
    const { currentLanguage, changeLanguage, languages } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (langCode) => {
        if (langCode === currentLanguage.code) { setIsOpen(false); return; }
        changeLanguage(langCode);
        const lang = languages.find(l => l.code === langCode);
        setToast(`✓ ${lang.nativeName}`);
        setTimeout(() => setToast(null), 2000);
        setIsOpen(false);
        window.speechSynthesis?.cancel();
    };

    return (
        <div className="lang-selector" ref={dropdownRef}>
            <button className="lang-trigger" onClick={() => setIsOpen(!isOpen)}>
                <span className="lang-flag">{currentLanguage.flag}</span>
                <span className="lang-name">{currentLanguage.nativeName}</span>
                <svg className={`lang-chevron ${isOpen ? 'open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            </button>

            {isOpen && (
                <div className="lang-dropdown">
                    <div className="lang-grid">
                        {languages.map(lang => (
                            <button key={lang.code} className={`lang-card ${currentLanguage.code === lang.code ? 'lang-card-active' : ''}`} onClick={() => handleSelect(lang.code)}>
                                <span className="lang-card-flag">{lang.flag}</span>
                                <div className="lang-card-text">
                                    <span className="lang-card-native">{lang.nativeName}</span>
                                    <span className="lang-card-en">{lang.name}</span>
                                </div>
                                {currentLanguage.code === lang.code && (
                                    <svg className="lang-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {toast && <div className="lang-toast">{toast}</div>}
        </div>
    );
}
