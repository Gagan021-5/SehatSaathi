import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import './LanguageOnboarding.css';

const welcomeTexts = [
    'Welcome', 'स्वागत है', 'স্বাগতম', 'வரவேற்கிறோம்',
    'స్వాగతం', 'स्वागत', 'સ્વાગત છે', 'ಸ್ವಾಗತ'
];

export default function LanguageOnboarding() {
    const { languages, changeLanguage, completeOnboarding, isFirstVisit, t } = useLanguage();
    const [selectedCode, setSelectedCode] = useState(null);
    const [welcomeIdx, setWelcomeIdx] = useState(0);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        if (!isFirstVisit) return;
        const interval = setInterval(() => setWelcomeIdx(i => (i + 1) % welcomeTexts.length), 2000);
        return () => clearInterval(interval);
    }, [isFirstVisit]);

    if (!isFirstVisit) return null;

    const handleContinue = () => {
        if (!selectedCode) return;
        changeLanguage(selectedCode);
        setClosing(true);
        setTimeout(() => completeOnboarding(), 400);
    };

    return (
        <div className={`onboarding-overlay ${closing ? 'onboarding-exit' : ''}`}>
            <div className="onboarding-content">
                <div className="onboarding-logo">🏥</div>
                <h1 className="onboarding-title">SehatSaathi</h1>

                <div className="onboarding-welcome">
                    <span key={welcomeIdx} className="welcome-text-anim">{welcomeTexts[welcomeIdx]}</span>
                </div>

                <p className="onboarding-subtitle">
                    Choose your preferred language<br />
                    <span style={{ fontSize: 13, opacity: 0.7 }}>अपनी भाषा चुनें · আপনার ভাষা বেছে নিন · உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்</span>
                </p>

                <div className="onboarding-grid">
                    {languages.map(lang => (
                        <button key={lang.code} className={`ob-card ${selectedCode === lang.code ? 'ob-card-active' : ''}`} onClick={() => setSelectedCode(lang.code)}>
                            <span className="ob-flag">{lang.flag}</span>
                            <span className="ob-native">{lang.nativeName}</span>
                            <span className="ob-en">{lang.name}</span>
                            {selectedCode === lang.code && (
                                <svg className="ob-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                            )}
                        </button>
                    ))}
                </div>

                {selectedCode && (
                    <button className="ob-continue" onClick={handleContinue}>
                        {languages.find(l => l.code === selectedCode)?.code === 'en' ? 'Continue' :
                            languages.find(l => l.code === selectedCode)?.code === 'hi' ? 'आगे बढ़ें' :
                                languages.find(l => l.code === selectedCode)?.code === 'bn' ? 'এগিয়ে যান' :
                                    languages.find(l => l.code === selectedCode)?.code === 'ta' ? 'தொடரவும்' :
                                        languages.find(l => l.code === selectedCode)?.code === 'te' ? 'కొనసాగించు' :
                                            languages.find(l => l.code === selectedCode)?.code === 'mr' ? 'पुढे जा' :
                                                languages.find(l => l.code === selectedCode)?.code === 'gu' ? 'આગળ વધો' :
                                                    'ಮುಂದುವರಿಸಿ'
                        }
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </button>
                )}
            </div>
        </div>
    );
}
