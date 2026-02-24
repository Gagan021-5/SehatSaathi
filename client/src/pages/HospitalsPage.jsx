import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import useVoiceOutput from '../hooks/useVoiceOutput';
import HospitalMap from '../components/hospitals/HospitalMap';
import { searchHospitals, searchPHC } from '../services/api';
import './HospitalsPage.css';

export default function HospitalsPage() {
    const { t, currentLanguage } = useLanguage();
    const { speak } = useVoiceOutput();
    const [tab, setTab] = useState('all');
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [selectedHospital, setSelectedHospital] = useState(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => setError('Location access denied. Please enable location services.')
            );
        }
    }, []);

    useEffect(() => {
        if (location) fetchHospitals();
    }, [location, tab]);

    const fetchHospitals = async () => {
        if (!location) return;
        setLoading(true);
        setSelectedHospital(null);
        try {
            const fetcher = tab === 'phc' ? searchPHC : searchHospitals;
            const res = await fetcher({ lat: location.lat, lng: location.lng });
            const results = res.data?.results || res.data || [];
            setHospitals(results);
            if (results.length > 0) {
                const nearest = results[0];
                speak(`${nearest.name} is the nearest facility, ${nearest.distanceLabel || nearest.distance} away`);
            }
        } catch {
            setHospitals([]);
        }
        setLoading(false);
    };

    const handleSelectHospital = (hospital) => {
        setSelectedHospital(hospital);
    };

    return (
        <div className="hosp-page">
            <h1 className="hosp-title">🏥 {t('hospitals.title')}</h1>

            <div className="hosp-tabs">
                <button className={`hosp-tab ${tab === 'all' ? 'hosp-tab-active' : ''}`} onClick={() => setTab('all')}>
                    {t('hospitals.allHospitals')}
                </button>
                <button className={`hosp-tab ${tab === 'phc' ? 'hosp-tab-active' : ''}`} onClick={() => setTab('phc')}>
                    🏛️ {t('hospitals.govPHC')}
                </button>
            </div>

            {error && <div className="hosp-error">{error}</div>}

            {/* Leaflet Map */}
            <HospitalMap
                userLocation={location}
                hospitals={hospitals}
                selectedHospital={selectedHospital}
                onSelectHospital={handleSelectHospital}
            />

            {loading && <div className="hosp-loading"><div className="hosp-spin" /> {t('common.loading')}</div>}

            <div className="hosp-list">
                {hospitals.map((h, i) => (
                    <div
                        key={h.id || i}
                        className={`hosp-card ${i === 0 ? 'hosp-card-nearest' : ''} ${selectedHospital?.id === h.id ? 'hosp-card-selected' : ''}`}
                        onClick={() => handleSelectHospital(h)}
                    >
                        {i === 0 && <span className="hosp-nearest-badge">⭐ {t('hospitals.nearest')}</span>}
                        <h3 className="hosp-name">{h.name}</h3>
                        {h.address && <p className="hosp-address">{h.address}</p>}
                        <div className="hosp-meta">
                            {(h.distanceLabel || h.distance) && <span className="hosp-distance">📍 {h.distanceLabel || h.distance}</span>}
                            {h.type && <span className="hosp-type-badge">{h.type}</span>}
                        </div>
                        <div className="hosp-actions">
                            {h.phone && (
                                <a href={`tel:${h.phone}`} className="hosp-call-btn" onClick={(e) => e.stopPropagation()}>
                                    📞 {t('hospitals.call')}
                                </a>
                            )}
                            {h.lat && h.lng && (
                                <a
                                    href={`https://www.openstreetmap.org/directions?from=${location?.lat},${location?.lng}&to=${h.lat},${h.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hosp-dir-btn"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    🧭 {t('hospitals.directions')}
                                </a>
                            )}
                        </div>
                    </div>
                ))}

                {!loading && hospitals.length === 0 && location && (
                    <div className="hosp-empty">
                        <span className="hosp-empty-icon">🏥</span>
                        <p>No hospitals found nearby. Try enabling location or searching in a different area.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
