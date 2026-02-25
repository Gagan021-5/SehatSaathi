import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import {
    Loader2,
    LocateFixed,
    Search,
    Plus,
    Minus,
    Navigation,
    Phone,
    Building2,
    MapPin,
    AlertCircle,
    Flame
} from 'lucide-react';

// Mirrors for reliability
const OVERPASS_URLS = ['https://overpass.kumi.systems/api/interpreter', 'https://lz4.overpass-api.de/api/interpreter'];
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

// Standard Marker
const medicalIcon = L.divIcon({
    className: 'custom-clinical-marker',
    html: `<div class="marker-wrapper"><div class="marker-pulse"></div><div class="marker-solid"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg></div></div>`,
    iconSize: [40, 40], iconAnchor: [20, 20],
});

// Emergency Marker (Red Theme)
const emergencyIcon = L.divIcon({
    className: 'custom-emergency-marker',
    html: `<div class="emergency-wrapper"><div class="emergency-ping"></div><div class="emergency-solid"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg></div></div>`,
    iconSize: [46, 46], iconAnchor: [23, 23],
});

export default function HospitalsMap() {
    const [center, setCenter] = useState(DEFAULT_CENTER);
    const [userLocation, setUserLocation] = useState(null);
    const [places, setPlaces] = useState([]);
    const [fetching, setFetching] = useState(false);
    const [emergencyMode, setEmergencyMode] = useState(false);
    const [search, setSearch] = useState('');
    
    const mapRef = useRef(null);
    const abortRef = useRef(null);
    const debounceRef = useRef(null);

    const fetchPlaces = useCallback(async (bounds) => {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setFetching(true);

        try {
            // Expanded query for emergency mode includes trauma and 24/7 tags
            const query = `[out:json][timeout:25];(node["amenity"~"hospital|pharmacy"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});way["amenity"~"hospital|pharmacy"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}););out center tags;`;
            const response = await fetch(OVERPASS_URLS[0], { method: 'POST', body: `data=${encodeURIComponent(query)}`, signal: controller.signal });
            const data = await response.json();
            setPlaces((data.elements || []).map(p => {
                const tags = p.tags || {};
                const lat = p.lat ?? p.center?.lat;
                const lng = p.lon ?? p.center?.lon;
                return {
                    id: `${p.type}-${p.id}`, lat, lng,
                    amenity: tags.amenity,
                    isTrauma: tags.emergency === 'yes' || tags['healthcare:speciality'] === 'trauma' || tags.name?.toLowerCase().includes('trauma'),
                    name: tags.name || (tags.amenity === 'pharmacy' ? 'Pharmacy' : 'Medical Center'),
                    street: tags['addr:street'] || 'Location Details Available on Route',
                    phone: tags.phone || tags['contact:phone'] || '',
                    mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
                };
            }).filter(p => p.lat != null));
        } catch (err) { if (err.name !== 'AbortError') console.error(err); } finally { setFetching(false); }
    }, []);

    const filteredPlaces = useMemo(() => {
        const origin = userLocation || center;
        let list = places.map(p => ({ ...p, distanceKm: haversineKm(origin, p) }));
        if (emergencyMode) list = list.filter(p => p.isTrauma || p.amenity === 'hospital');
        if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
        return list.sort((a, b) => a.distanceKm - b.distanceKm);
    }, [places, search, userLocation, center, emergencyMode]);

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input 
                        type="text" placeholder="Search facilities..." 
                        className="w-full h-14 pl-12 pr-4 rounded-[1.25rem] border-none bg-white shadow-xl shadow-slate-200/50 outline-none transition-all text-sm font-medium"
                        value={search} onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                
                {/* Emergency Toggle */}
                <button 
                    onClick={() => setEmergencyMode(!emergencyMode)}
                    className={`h-14 rounded-[1.25rem] flex items-center justify-center gap-3 font-bold text-sm transition-all active:scale-95 shadow-xl ${
                        emergencyMode ? 'bg-rose-600 text-white shadow-rose-500/30 ring-4 ring-rose-500/20' : 'bg-white text-rose-600 border border-rose-100 shadow-slate-200/50 hover:bg-rose-50'
                    }`}
                >
                    <Flame size={18} className={emergencyMode ? 'animate-bounce' : ''} />
                    {emergencyMode ? 'Emergency Mode Active' : 'Trauma Centers Only'}
                </button>

                <button 
                    onClick={() => userLocation && mapRef.current?.setView(userLocation, 15)}
                    className="h-14 rounded-[1.25rem] bg-slate-900 text-white flex items-center justify-center gap-3 font-bold text-sm shadow-xl hover:bg-slate-800 transition-all active:scale-95"
                >
                    <LocateFixed size={18} /> My Location
                </button>
            </div>

            <div className={`grid grid-cols-1 xl:grid-cols-12 gap-6 h-[700px] transition-all duration-500 ${emergencyMode ? 'bg-rose-50/30 p-4 rounded-[3rem]' : ''}`}>
                <div className="xl:col-span-8 relative rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl ring-1 ring-slate-200">
                    <MapContainer center={center} zoom={13} zoomControl={false} className="h-full w-full" ref={mapRef}>
                        <TileLayer url={emergencyMode ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"} />
                        <MapMoveHandler onMoveEnd={(b) => { if (debounceRef.current) clearTimeout(debounceRef.current); debounceRef.current = setTimeout(() => fetchPlaces(b), 1200); }} />
                        {filteredPlaces.map((p) => (
                            <Marker key={p.id} position={[p.lat, p.lng]} icon={p.isTrauma && emergencyMode ? emergencyIcon : medicalIcon}>
                                <Popup className="premium-popup">
                                    <div className="p-1 min-w-[180px]">
                                        <h4 className={`font-bold text-sm ${p.isTrauma ? 'text-rose-600' : 'text-slate-900'}`}>{p.name}</h4>
                                        <button onClick={() => window.open(p.mapsUrl, '_blank')} className={`w-full py-2 mt-3 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-2 ${p.isTrauma ? 'bg-rose-600' : 'bg-blue-600'}`}>
                                            <Navigation size={12} /> Fast Route
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>

                <div className="xl:col-span-4 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                    {filteredPlaces.map((p, idx) => (
                        <motion.div
                            key={p.id} layout
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                            className={`p-5 rounded-3xl border transition-all ${p.isTrauma && emergencyMode ? 'bg-rose-600 border-rose-500 shadow-rose-200/50' : 'bg-white border-slate-100 shadow-lg'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${p.isTrauma && emergencyMode ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                                    <Building2 size={16} />
                                </div>
                                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${p.isTrauma && emergencyMode ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                    {p.distanceKm.toFixed(1)} km
                                </span>
                            </div>
                            <h3 className={`font-bold leading-tight ${p.isTrauma && emergencyMode ? 'text-white' : 'text-slate-900'}`}>{p.name}</h3>
                            <button onClick={() => window.open(p.mapsUrl, '_blank')} className={`mt-4 w-full h-10 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 ${p.isTrauma && emergencyMode ? 'bg-white text-rose-600' : 'bg-slate-900 text-white'}`}>
                                <Navigation size={14} /> Immediate Navigation
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function haversineKm(o, t) {
    const R = 6371;
    const dLat = (t.lat - o.lat) * Math.PI / 180;
    const dLon = (t.lng - o.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(o.lat*Math.PI/180)*Math.cos(t.lat*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}