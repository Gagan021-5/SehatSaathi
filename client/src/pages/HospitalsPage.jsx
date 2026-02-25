import { useState, useEffect } from 'react';
import { searchHospitals } from '../services/api';
import toast from 'react-hot-toast';
import { Building2, MapPin, Phone, Navigation, Loader2, Star, Clock } from 'lucide-react';

export default function HospitalsPage() {
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!navigator.geolocation) { setError('Geolocation not supported'); setLoading(false); return; }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setLocation(loc);
                fetchHospitals(loc);
            },
            () => { setError('Location access denied. Please enable location permissions.'); setLoading(false); }
        );
    }, []);

    async function fetchHospitals(loc) {
        try {
            const { data } = await searchHospitals({ lat: loc.lat, lng: loc.lng });
            const list = data.hospitals || data.results || (Array.isArray(data) ? data : []);
            setHospitals(list);
            if (!list.length) setError('No hospitals found nearby');
        } catch {
            setError('Failed to fetch hospitals');
        }
        setLoading(false);
    }

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6 animate-fadeInUp">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center text-white"><Building2 size={24} /></div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Find Hospitals</h1>
                    <p className="text-sm text-gray-500">Nearby healthcare centers</p>
                </div>
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-blue-500 mb-3" />
                    <p className="text-gray-500">Detecting your location...</p>
                </div>
            )}

            {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                    <p className="text-red-700 font-semibold mb-3">{error}</p>
                    <button onClick={() => { setLoading(true); setError(''); navigator.geolocation.getCurrentPosition((p) => { const l = { lat: p.coords.latitude, lng: p.coords.longitude }; setLocation(l); fetchHospitals(l); }, () => { setError('Location denied'); setLoading(false); }); }}
                        className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700">Retry</button>
                </div>
            )}

            {!loading && hospitals.length > 0 && (
                <div className="grid gap-4">
                    {hospitals.map((h, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all animate-fadeInUp" style={{ animationDelay: `${i * 0.05}s` }}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-900 truncate">{h.name || 'Hospital'}</h3>
                                        {h.isOpen !== undefined && (
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${h.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {h.isOpen ? 'OPEN' : 'CLOSED'}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                                        <MapPin size={14} /> {h.address || h.vicinity || 'Address unavailable'}
                                    </p>
                                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                        {h.rating && <span className="flex items-center gap-1"><Star size={12} className="text-yellow-500" /> {h.rating}</span>}
                                        {h.distance && <span className="flex items-center gap-1"><Navigation size={12} /> {h.distance}</span>}
                                        {h.phone && <span className="flex items-center gap-1"><Phone size={12} /> {h.phone}</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    {h.phone && (
                                        <a href={`tel:${h.phone}`} className="p-2.5 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors"><Phone size={18} /></a>
                                    )}
                                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat || h.geometry?.location?.lat},${h.lng || h.geometry?.location?.lng}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"><Navigation size={18} /></a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
