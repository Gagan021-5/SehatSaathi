import { useState, useEffect } from 'react';
import useOffline from '../../hooks/useOffline';
import { useLanguage } from '../../context/LanguageContext';
import './OfflineIndicator.css';

export default function OfflineIndicator() {
    const isOffline = useOffline();
    const { t } = useLanguage();
    const [showOnline, setShowOnline] = useState(false);
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        if (isOffline) { setWasOffline(true); }
        else if (wasOffline) {
            setShowOnline(true);
            const timer = setTimeout(() => { setShowOnline(false); setWasOffline(false); }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isOffline, wasOffline]);

    if (!isOffline && !showOnline) return null;

    return (
        <div className={`offline-bar ${isOffline ? 'offline-bar-warn' : 'offline-bar-success'}`}>
            {isOffline ? (
                <><span>📡</span> {t('common.offline')} — some features may be limited</>
            ) : (
                <><span>✓</span> Back online!</>
            )}
        </div>
    );
}
