import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './Home.css';

const featureCards = [
    { icon: '🎤', titleKey: 'home.voiceDoc', descKey: 'home.voiceDocDesc', path: '/chat', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
    { icon: '🌐', titleKey: 'home.multiLang', descKey: 'home.multiLangDesc', path: '/chat', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
    { icon: '🏥', titleKey: 'home.phcFind', descKey: 'home.phcFindDesc', path: '/hospitals', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
    { icon: '🔬', titleKey: 'home.mlPredict', descKey: 'home.mlPredictDesc', path: '/predict', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
];

export default function Home() {
    const { t } = useLanguage();
    const navigate = useNavigate();

    return (
        <div className="home-page">
            <section className="home-hero">
                <div className="home-hero-content">
                    <div className="home-hero-badge">🏥 SehatSaathi</div>
                    <h1 className="home-hero-title">{t('home.hero')}</h1>
                    <p className="home-hero-sub">{t('home.heroSub')}</p>
                    <div className="home-hero-actions">
                        <button className="home-cta-primary" onClick={() => navigate('/chat')}>
                            🎤 {t('nav.chat')}
                        </button>
                        <button className="home-cta-secondary" onClick={() => navigate('/predict')}>
                            🔬 {t('nav.predict')}
                        </button>
                    </div>
                </div>
                <div className="home-hero-visual">
                    <div className="home-hero-circle">
                        <div className="home-hero-inner-circle">
                            <span className="home-hero-emoji">👨‍⚕️</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="home-stats">
                {[
                    { icon: '🌐', label: t('home.stats.languages') },
                    { icon: '⏰', label: t('home.stats.patients') },
                    { icon: '🤖', label: t('home.stats.accuracy') },
                    { icon: '📱', label: t('home.stats.offline') },
                ].map((stat, i) => (
                    <div key={i} className="home-stat-card">
                        <span className="home-stat-icon">{stat.icon}</span>
                        <span className="home-stat-label">{stat.label}</span>
                    </div>
                ))}
            </section>

            <section className="home-features">
                <h2 className="home-section-title">{t('home.features')}</h2>
                <div className="home-features-grid">
                    {featureCards.map((card, i) => (
                        <div key={i} className="home-feature-card" onClick={() => navigate(card.path)} style={{ '--card-gradient': card.gradient }}>
                            <div className="hfc-icon-wrap" style={{ background: card.gradient }}>
                                <span className="hfc-icon">{card.icon}</span>
                            </div>
                            <h3 className="hfc-title">{t(card.titleKey)}</h3>
                            <p className="hfc-desc">{t(card.descKey)}</p>
                            <svg className="hfc-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </div>
                    ))}
                </div>
            </section>

            <section className="home-cta-section">
                <div className="home-cta-card">
                    <h2 className="home-cta-title">🚨 {t('emergency.title')}</h2>
                    <p className="home-cta-desc">{t('emergency.firstAid')}</p>
                    <div className="home-cta-row">
                        <button className="home-emergency-btn" onClick={() => navigate('/emergency')}>
                            {t('emergency.title')}
                        </button>
                        <a href="tel:112" className="home-call-btn">📞 {t('emergency.call')} — 112</a>
                    </div>
                </div>
            </section>
        </div>
    );
}
