import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import './Sidebar.css';

const navItems = [
    { path: '/', icon: '🏠', key: 'nav.dashboard' },
    { path: '/chat', icon: '🤖', key: 'nav.chat' },
    { path: '/predict', icon: '🔬', key: 'nav.predict' },
    { path: '/prescription', icon: '💊', key: 'nav.prescription' },
    { path: '/hospitals', icon: '🏥', key: 'nav.hospitals' },
    { path: '/emergency', icon: '🚨', key: 'nav.emergency' },
];

export default function Sidebar({ isOpen, onClose }) {
    const { t, currentLanguage } = useLanguage();
    const location = useLocation();

    return (
        <>
            {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
            <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <span className="sidebar-logo-icon">🏥</span>
                        <div>
                            <h2 className="sidebar-brand">{t('app.name')}</h2>
                            <p className="sidebar-tagline">{t('app.tagline')}</p>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                            onClick={onClose}
                            end={item.path === '/'}
                        >
                            <span className="sidebar-link-icon">{item.icon}</span>
                            <span>{t(item.key)}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-lang-badge">
                        <span>{currentLanguage.flag}</span>
                        <span>{currentLanguage.nativeName}</span>
                    </div>
                    <p className="sidebar-version">v1.0 — SehatSaathi</p>
                </div>
            </aside>
        </>
    );
}
