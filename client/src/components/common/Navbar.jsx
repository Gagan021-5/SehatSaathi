import { useLanguage } from '../../context/LanguageContext';
import LanguageSelector from './LanguageSelector';
import './Navbar.css';

export default function Navbar({ onMenuClick }) {
    const { t } = useLanguage();

    return (
        <header className="navbar">
            <div className="navbar-left">
                <button className="navbar-menu-btn" onClick={onMenuClick}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                </button>
                <span className="navbar-title-mobile">{t('app.name')}</span>
            </div>

            <div className="navbar-right">
                <LanguageSelector />
                <button className="navbar-icon-btn" title="Notifications">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                </button>
                <div className="navbar-avatar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </div>
            </div>
        </header>
    );
}
