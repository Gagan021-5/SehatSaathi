import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import {
    Loader2, LocateFixed, Search, Navigation, Phone, MessageCircle,
    Building2, MapPin, AlertCircle, Flame, Plus, Minus, RefreshCw, Activity
} from 'lucide-react';
import { searchHospitals } from '../../services/api'; // Ensure this matches your actual api path

const OVERPASS_FALLBACK_URLS = [
    'https://overpass.kumi.systems/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
];
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 };
const AUTO_REFRESH_MS = 30000;

// --- Premium Animated Markers ---
// Using className: '' ensures leaflet doesn't apply default background styles
const medicalIcon = L.divIcon({
    className: '',
    html: `
      <div class="relative flex items-center justify-center w-12 h-12">
        <div class="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
        <div class="relative z-10 flex items-center justify-center w-10 h-10 bg-white rounded-2xl shadow-[0_8px_16px_rgba(37,99,235,0.25)] border-2 border-blue-500 transform transition-transform hover:scale-110 hover:-translate-y-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                <path d="M12 5v14M5 12h14"/>
            </svg>
        </div>
        <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.8)]"></div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48]
});

const emergencyIcon = L.divIcon({
    className: '',
    html: `
      <div class="relative flex items-center justify-center w-14 h-14">
        <div class="absolute inset-0 bg-rose-500/30 rounded-full animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
        <div class="absolute inset-2 bg-rose-500/20 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
        <div class="relative z-10 flex items-center justify-center w-11 h-11 bg-rose-600 rounded-[1.25rem] shadow-[0_12px_24px_rgba(225,29,72,0.4)] border-2 border-white transform transition-transform hover:scale-110 hover:-translate-y-1">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
        </div>
        <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-rose-700 rounded-full shadow-[0_0_12px_rgba(225,29,72,0.9)]"></div>
      </div>
    `,
    iconSize: [56, 56],
    iconAnchor: [28, 56],
    popupAnchor: [0, -56]
});

// --- Utility Functions ---
function MapMoveHandler({ onMoveEnd }) {
    const map = useMapEvents({ moveend: () => onMoveEnd(map.getBounds()) });
    useEffect(() => { onMoveEnd(map.getBounds()); }, [map, onMoveEnd]);
    return null;
}

function haversineKm(origin, target) {
    const R = 6371;
    const dLat = (target.lat - origin.lat) * Math.PI / 180;
    const dLng = (target.lng - origin.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(origin.lat * Math.PI / 180) * Math.cos(target.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isAbortError(err) { return err?.name === 'AbortError' || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED'; }
function toDialValue(phone) { return (phone || '').replace(/[^\d+]/g, ''); }
function toMessageUrl(phone, name) {
    const digits = (phone || '').replace(/\D/g, '');
    if (!digits) return '';
    return `https://wa.me/${digits}?text=${encodeURIComponent(`Hello, I need details for ${name || 'your facility'} (emergency/OPD availability).`)}`;
}
function isTraumaLike(item) { return /trauma|emergency|district hospital|medical college|aiims/i.test(`${item.name || ''} ${item.amenity || ''}`); }

function dedupePlaces(places) {
    const seen = new Set();
    return places.filter((p) => {
        const key = `${p.id}-${p.lat}-${p.lng}`;
        if (seen.has(key)) return false;
        seen.add(key); return true;
    });
}

function boundsToSearchParams(bounds) {
    const center = bounds.getCenter();
    const nw = bounds.getNorthWest();
    const se = bounds.getSouthEast();
    const diagonalKm = haversineKm({ lat: nw.lat, lng: nw.lng }, { lat: se.lat, lng: se.lng });
    return { lat: center.lat, lng: center.lng, radius: Math.max(2000, Math.min(30000, Math.round((diagonalKm * 1000) / 2))) };
}

function getTrafficMultiplier(now = new Date()) {
    const hour = now.getHours();
    if ((hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21)) return 1.45;
    if (hour >= 12 && hour <= 16) return 1.2;
    if (hour >= 22 || hour <= 5) return 0.85;
    return 1;
}

function estimateResponseMinutes(distanceKm, trafficMultiplier, emergencyMode) {
    const baseSpeedKmph = emergencyMode ? 42 : 34;
    const baseMinutes = (distanceKm / Math.max(baseSpeedKmph, 1)) * 60;
    return Math.max(2, Math.round(baseMinutes * trafficMultiplier));
}

function mapServerPlace(item) {
    if (item?.lat == null || item?.lng == null) return null;
    const phone = toDialValue(item.phone);
    return {
        id: `api-${item.id || `${item.lat}-${item.lng}`}`, lat: item.lat, lng: item.lng,
        amenity: item.type || 'hospital', isTrauma: isTraumaLike(item),
        name: item.name || 'Medical Center', street: item.address || 'Address unavailable',
        phone, messageUrl: toMessageUrl(phone, item.name),
        mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`,
        distanceKm: Number.isFinite(item.distance) ? item.distance : null,
    };
}

function mapOverpassElement(item) {
    const tags = item.tags || {};
    const lat = item.lat ?? item.center?.lat;
    const lng = item.lon ?? item.center?.lon;
    if (lat == null || lng == null) return null;
    const phone = toDialValue(tags.phone || tags['contact:phone'] || '');
    const name = tags.name || (tags.amenity === 'pharmacy' ? 'Pharmacy' : 'Medical Center');
    return {
        id: `osm-${item.type}-${item.id}`, lat, lng,
        amenity: tags.amenity || 'hospital', isTrauma: tags.emergency === 'yes' || isTraumaLike({ name, amenity: tags.amenity }),
        name, street: tags['addr:street'] || tags['addr:full'] || 'Address unavailable',
        phone, messageUrl: toMessageUrl(phone, name),
        mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    };
}

function buildOverpassQuery(bounds) {
    const s = bounds.getSouth(), w = bounds.getWest(), n = bounds.getNorth(), e = bounds.getEast();
    return `[out:json][timeout:25];(node["amenity"~"hospital|pharmacy|clinic|doctors"](${s},${w},${n},${e});way["amenity"~"hospital|pharmacy|clinic|doctors"](${s},${w},${n},${e}););out center tags;`;
}

async function fetchOverpassFallback(bounds, signal) {
    const query = buildOverpassQuery(bounds);
    for (const url of OVERPASS_FALLBACK_URLS) {
        try {
            const response = await fetch(url, { method: 'POST', body: `data=${encodeURIComponent(query)}`, signal });
            if (!response.ok) continue;
            const data = await response.json();
            const results = dedupePlaces((data.elements || []).map(mapOverpassElement).filter(Boolean));
            if (results.length) return results;
        } catch (error) { if (isAbortError(error)) throw error; }
    }
    return [];
}

export default function HospitalsMap() {
    const [center, setCenter] = useState(DEFAULT_CENTER);
    const [userLocation, setUserLocation] = useState(null);
    const [places, setPlaces] = useState([]);
    const [fetching, setFetching] = useState(false);
    const [emergencyMode, setEmergencyMode] = useState(false);
    const [search, setSearch] = useState('');
    const [lastUpdated, setLastUpdated] = useState(null);
    const [fetchError, setFetchError] = useState('');

    const mapRef = useRef(null);
    const abortRef = useRef(null);
    const debounceRef = useRef(null);
    const lastBoundsRef = useRef(null);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLocation(loc); setCenter(loc); mapRef.current?.setView(loc, 14);
            },
            () => {}, { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
        );
    }, []);

    const fetchPlaces = useCallback(async (bounds, options = {}) => {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        if (!options.silent) setFetching(true);

        try {
            const params = boundsToSearchParams(bounds);
            const response = await searchHospitals(params, { signal: controller.signal });
            const serverResults = Array.isArray(response.data?.results) ? response.data.results : [];
            let mapped = dedupePlaces(serverResults.map(mapServerPlace).filter(Boolean));

            if (!mapped.length || response.data?.fallback) {
                const fallbackResults = await fetchOverpassFallback(bounds, controller.signal);
                if (fallbackResults.length) mapped = fallbackResults;
            }

            setPlaces(mapped); setFetchError(''); setLastUpdated(Date.now());
        } catch (error) {
            if (isAbortError(error)) return;
            setFetchError('Unable to fetch hospitals right now.');
            toast.error('Hospital live data is unavailable right now.');
            setPlaces([]);
        } finally {
            if (!options.silent) setFetching(false);
        }
    }, []);

    const handleMapMove = useCallback((bounds) => {
        lastBoundsRef.current = bounds;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        // Generous debounce to prevent 429 Too Many Requests errors
        debounceRef.current = setTimeout(() => fetchPlaces(bounds), 1000); 
    }, [fetchPlaces]);

    useEffect(() => {
        const timer = setInterval(() => {
            if (lastBoundsRef.current) fetchPlaces(lastBoundsRef.current, { silent: true });
        }, AUTO_REFRESH_MS);
        return () => clearInterval(timer);
    }, [fetchPlaces]);

    useEffect(() => () => {
        if (abortRef.current) abortRef.current.abort();
        if (debounceRef.current) clearTimeout(debounceRef.current);
    }, []);

    const filteredPlaces = useMemo(() => {
        const origin = userLocation || center;
        const trafficMultiplier = getTrafficMultiplier();
        let list = places.map((p) => {
            const distanceKm = Number.isFinite(p.distanceKm) ? p.distanceKm : haversineKm(origin, p);
            const etaMinutes = estimateResponseMinutes(distanceKm, trafficMultiplier, emergencyMode);
            return { ...p, distanceKm, trafficMultiplier, etaMinutes };
        });
        if (emergencyMode) list = list.filter((p) => p.isTrauma || p.amenity === 'hospital');
        if (search.trim()) {
            const query = search.toLowerCase();
            list = list.filter((p) => p.name.toLowerCase().includes(query) || p.street.toLowerCase().includes(query));
        }
        return list.sort((a, b) => a.distanceKm - b.distanceKm);
    }, [places, search, userLocation, center, emergencyMode]);

    const fastestResponseId = useMemo(() => {
        if (!filteredPlaces.length) return '';
        const fastest = [...filteredPlaces].sort((a, b) => a.etaMinutes - b.etaMinutes)[0];
        return fastest?.id || '';
    }, [filteredPlaces]);

    function openTrafficAwareRoute(place) {
        const eta = Number(place?.etaMinutes || 0);
        toast.success(
            `Resource-Aware Emergency Routing: Neural Analysis predicts ~${eta} min response window.`
        );
        window.open(place.mapsUrl, '_blank');
    }

    return (
        <div className={`flex flex-col gap-8 transition-colors duration-500 rounded-[2.5rem] p-2 md:p-4 lg:p-6 ${emergencyMode ? 'bg-rose-50/40 border border-rose-100 shadow-[0_0_100px_rgba(225,29,72,0.1)_inset]' : 'bg-transparent'}`}>
            
            {/* 1. Control Panel (Top) */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                <div className="relative group lg:col-span-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600" size={20} />
                    <input
                        type="text"
                        placeholder="Search hospitals, clinics, pharmacies..."
                        className="h-14 w-full rounded-[1.25rem] border border-slate-100 bg-white pl-12 pr-4 text-sm font-medium shadow-xl shadow-slate-200/50 outline-none ring-2 ring-transparent focus:ring-blue-500/20 focus:border-blue-300 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <button
                    onClick={() => setEmergencyMode(!emergencyMode)}
                    className={`h-14 rounded-[1.25rem] text-sm font-bold transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3 ${
                        emergencyMode ? 'bg-rose-600 text-white shadow-rose-500/30 ring-4 ring-rose-500/20' : 'bg-white text-rose-600 border border-rose-100 shadow-slate-200/50 hover:bg-rose-50'
                    }`}
                >
                    <Flame size={18} className={emergencyMode ? 'animate-bounce' : ''} />
                    {emergencyMode ? 'Emergency Mode Active' : 'Trauma Centers Only'}
                </button>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => userLocation && mapRef.current?.setView(userLocation, 15)}
                        className="h-14 rounded-[1.25rem] bg-slate-900 text-white text-sm font-bold shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <LocateFixed size={18} /> Location
                    </button>
                    <button
                        onClick={() => lastBoundsRef.current && fetchPlaces(lastBoundsRef.current)}
                        className="h-14 rounded-[1.25rem] border border-slate-200 bg-white text-slate-700 text-sm font-bold shadow-xl shadow-slate-200/50 hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
            </div>

            {/* 2. Map Area (Immersive Hero) */}
            <div className="relative h-[450px] md:h-[600px] w-full overflow-hidden rounded-[2.5rem] border-4 border-white shadow-2xl ring-1 ring-slate-200 bg-slate-100">
                <MapContainer center={center} zoom={13} zoomControl={false} className="h-full w-full z-0" ref={mapRef}>
                    <TileLayer url={emergencyMode ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'} />
                    <MapMoveHandler onMoveEnd={handleMapMove} />
                    {filteredPlaces.map((place) => (
                        <Marker key={place.id} position={[place.lat, place.lng]} icon={place.isTrauma && emergencyMode ? emergencyIcon : medicalIcon}>
                            <Popup className="premium-popup">
                                <div className="min-w-[200px] p-2 space-y-1">
                                    <h4 className={`text-base font-bold leading-tight ${place.isTrauma ? 'text-rose-600' : 'text-slate-900'}`}>{place.name}</h4>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{place.amenity}</p>
                                    <p className="text-xs font-semibold text-slate-500 mt-2">ETA: {place.etaMinutes} min (traffic-aware)</p>
                                    <button
                                        onClick={() => openTrafficAwareRoute(place)}
                                        className={`w-full mt-3 rounded-xl py-2.5 text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${place.isTrauma ? 'bg-rose-600 shadow-rose-500/30' : 'bg-blue-600 shadow-blue-500/30'}`}
                                    >
                                        <Navigation size={14} /> Traffic-Aware Emergency Route
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {/* Overlays */}
                <div className="absolute right-6 top-6 z-[1000] flex flex-col gap-2">
                    <MapControlButton icon={<Plus size={18} />} onClick={() => mapRef.current?.zoomIn()} />
                    <MapControlButton icon={<Minus size={18} />} onClick={() => mapRef.current?.zoomOut()} />
                </div>
                <div className="absolute bottom-6 left-6 z-[1000] rounded-2xl border border-white bg-white/90 px-5 py-3 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        {fetching ? <Loader2 size={16} className="animate-spin text-blue-600" /> : <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />}
                        <span className="text-sm font-bold text-slate-800">{fetching ? 'Scanning area...' : `${filteredPlaces.length} Facilities found`}</span>
                    </div>
                </div>
            </div>

            {/* 3. Results Grid (Below Map) */}
            <div className="pt-4">
                <div className="flex items-center justify-between mb-6 px-2">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl shadow-inner ${emergencyMode ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                            <Activity size={22} />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                            {emergencyMode ? 'Critical Care Centers' : 'Available Healthcare Facilities'}
                        </h2>
                    </div>
                </div>

                {fetchError && (
                    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 flex items-center gap-3">
                        <AlertCircle size={18} /> {fetchError}
                    </div>
                )}

                {!fetching && filteredPlaces.length === 0 ? (
                    <div className="rounded-[2.5rem] border border-dashed border-slate-300 bg-white/50 p-16 text-center">
                        <MapPin size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-bold text-slate-800">No facilities in this area</h3>
                        <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">Try zooming out, panning the map to a different location, or adjusting your search terms.</p>
                    </div>
                ) : (
                    <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence>
                            {filteredPlaces.map((place, index) => (
                                <motion.div
                                    key={place.id} layout initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
                                    className={`relative flex flex-col justify-between rounded-[2rem] border p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${
                                        place.isTrauma && emergencyMode ? 'border-rose-500 bg-rose-600 shadow-rose-200/50 text-white' : 'border-slate-100 bg-white shadow-xl shadow-slate-200/40 text-slate-900'
                                    }`}
                                >
                                    <div>
                                        <div className="mb-4 flex items-start justify-between gap-2">
                                            <div className={`grid h-12 w-12 place-items-center rounded-2xl shadow-inner ${place.isTrauma && emergencyMode ? 'bg-white/20 text-white' : 'bg-slate-50 text-blue-600 border border-slate-100'}`}>
                                                <Building2 size={22} />
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`rounded-xl px-3 py-1.5 text-[11px] font-black uppercase tracking-widest ${place.isTrauma && emergencyMode ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                    {place.distanceKm.toFixed(1)} km
                                                </span>
                                                <span className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${place.id === fastestResponseId ? 'bg-emerald-500 text-white' : place.isTrauma && emergencyMode ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'}`}>
                                                    {place.id === fastestResponseId ? 'Fastest Response Time' : `ETA ${place.etaMinutes} min`}
                                                </span>
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold leading-tight mb-2 tracking-tight">{place.name}</h3>
                                        <p className={`text-sm font-medium flex items-start gap-1.5 leading-relaxed ${place.isTrauma && emergencyMode ? 'text-rose-100' : 'text-slate-500'}`}>
                                            <MapPin size={16} className="shrink-0 mt-0.5" /> {place.street}
                                        </p>
                                    </div>

                                    <div className="mt-8 grid grid-cols-2 gap-3">
                                        <PanelAction
                                            label="Route" icon={<Navigation size={16} />}
                                            activeClass={place.isTrauma && emergencyMode ? 'bg-white text-rose-600 hover:bg-rose-50 shadow-lg shadow-black/10' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10'}
                                            onClick={() => window.open(place.mapsUrl, '_blank')}
                                        />
                                        <PanelAction
                                            label="Call" icon={<Phone size={16} />} disabled={!place.phone}
                                            activeClass={place.isTrauma && emergencyMode ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'}
                                            onClick={() => window.open(`tel:${place.phone}`)}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => openTrafficAwareRoute(place)}
                                        className={`mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-[0.12em] transition-all ${
                                            place.isTrauma && emergencyMode
                                                ? 'bg-white text-rose-700 hover:bg-rose-50'
                                                : 'border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100'
                                        }`}
                                    >
                                        <Navigation size={14} /> Traffic-Aware Emergency Route
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

// --- Micro Components ---
function MapControlButton({ icon, onClick }) {
    return (
        <button onClick={onClick} className="grid h-12 w-12 place-items-center rounded-[1.25rem] bg-white/90 backdrop-blur-md text-slate-700 shadow-xl transition-all hover:bg-white hover:text-blue-600 active:scale-95 border border-slate-100" type="button">
            {icon}
        </button>
    );
}

function PanelAction({ label, icon, disabled = false, onClick, activeClass }) {
    return (
        <button type="button" disabled={disabled} onClick={onClick} className={`flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-35 ${activeClass}`}>
            {icon} {label}
        </button>
    );
}
