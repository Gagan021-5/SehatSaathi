import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Card from './Card';
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
    MessageCircle,
    Building2,
    MapPin,
    ArrowRight
} from 'lucide-react';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

// --- Premium Custom Icon ---
const medicalIcon = L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="marker-container">
        <div class="marker-ping"></div>
        <div class="marker-core">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

// --- Helper Functions (Logic remains robust as provided) ---
function buildOverpassQuery(bounds) {
    const s = bounds.getSouth(), w = bounds.getWest(), n = bounds.getNorth(), e = bounds.getEast();
    return `[out:json][timeout:20];(node["amenity"~"hospital|pharmacy"](${s},${w},${n},${e});way["amenity"~"hospital|pharmacy"](${s},${w},${n},${e}););out center tags;`;
}

function normalizePlace(element) {
    const tags = element.tags || {};
    const lat = element.lat ?? element.center?.lat;
    const lng = element.lon ?? element.center?.lon;
    if (lat == null || lng == null) return null;
    return {
        id: `${element.type}-${element.id}`,
        lat, lng,
        amenity: tags.amenity || 'hospital',
        name: tags.name || (tags.amenity === 'pharmacy' ? 'Pharmacy' : 'Medical Center'),
        street: tags['addr:street'] || tags['addr:full'] || 'Clinical Address Restricted',
        phone: tags.phone || tags['contact:phone'] || '',
        mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    };
}

function haversineKm(origin, target) {
    const R = 6371;
    const dLat = (target.lat - origin.lat) * Math.PI / 180;
    const dLon = (target.lng - origin.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
              Math.cos(origin.lat * Math.PI / 180) * Math.cos(target.lat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// --- Internal Map Components ---
function MapMoveHandler({ onMoveEnd }) {
    const map = useMapEvents({ moveend: () => onMoveEnd(map.getBounds()) });
    useEffect(() => { onMoveEnd(map.getBounds()); }, [map, onMoveEnd]);
    return null;
}

export default function HospitalsMap() {
    const [center, setCenter] = useState(DEFAULT_CENTER);
    const [userLocation, setUserLocation] = useState(null);
    const [places, setPlaces] = useState([]);
    const [fetching, setFetching] = useState(false);
    const [search, setSearch] = useState('');
    const mapRef = useRef(null);

    const fetchPlaces = useCallback(async (bounds) => {
        setFetching(true);
        try {
            const query = buildOverpassQuery(bounds);
            const res = await fetch(OVERPASS_URL, {
                method: 'POST',
                body: `data=${encodeURIComponent(query)}`,
            });
            const data = await res.json();
            setPlaces((data.elements || []).map(normalizePlace).filter(Boolean));
        } catch (err) {
            toast.error('Network latency detected in Map services.');
        } finally {
            setFetching(false);
        }
    }, []);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition((pos) => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserLocation(loc);
            setCenter(loc);
            mapRef.current?.setView(loc, 14);
        });
    }, []);

    const filteredPlaces = useMemo(() => {
        const origin = userLocation || center;
        return places
            .map(p => ({ ...p, distanceKm: haversineKm(origin, p) }))
            .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => a.distanceKm - b.distanceKm);
    }, [places, search, userLocation, center]);

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 pb-20">
            {/* Header / Search Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Healthcare <span className="text-blue-600">Locator</span></h1>
                    <p className="text-slate-500 mt-1 text-sm">Real-time GPS tracking for verified hospitals and pharmacies.</p>
                </div>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search facility name..."
                        className="w-full h-12 pl-12 pr-4 rounded-2xl border-none bg-white shadow-xl shadow-slate-200/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map Section */}
                <div className="lg:col-span-2 relative h-[500px] md:h-[650px] rounded-[2.5rem] overflow-hidden border border-white shadow-2xl ring-1 ring-slate-200">
                    <MapContainer center={center} zoom={13} zoomControl={false} className="h-full w-full" ref={mapRef}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                        <MapMoveHandler onMoveEnd={fetchPlaces} />
                        
                        {filteredPlaces.map((place) => (
                            <Marker key={place.id} position={[place.lat, place.lng]} icon={medicalIcon}>
                                <Popup className="premium-popup">
                                    <div className="p-1 space-y-2">
                                        <h4 className="font-bold text-slate-900">{place.name}</h4>
                                        <p className="text-[10px] uppercase font-bold text-blue-600 tracking-widest">{place.amenity}</p>
                                        <a href={place.mapsUrl} target="_blank" className="flex items-center justify-center gap-2 w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
                                            <Navigation size={12} /> Start Route
                                        </a>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>

                    {/* Overlay Map UI */}
                    <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-2">
                        <MapControlButton icon={<Plus size={18} />} onClick={() => mapRef.current?.zoomIn()} />
                        <MapControlButton icon={<Minus size={18} />} onClick={() => mapRef.current?.zoomOut()} />
                    </div>

                    <div className="absolute bottom-6 left-6 z-[1000]">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/80 backdrop-blur-xl border border-white shadow-2xl">
                            {fetching ? (
                                <Loader2 size={18} className="animate-spin text-blue-600" />
                            ) : (
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                            <span className="text-xs font-bold text-slate-700">
                                {fetching ? 'Scanning Network...' : `${filteredPlaces.length} Facilities in View`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Results List Area */}
                <div className="lg:col-span-1 space-y-4 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                        {filteredPlaces.map((place, idx) => (
                            <motion.div
                                key={place.id}
                                layout
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Card className="group p-5 border-none shadow-lg hover:shadow-xl transition-all bg-white hover:ring-2 hover:ring-blue-500/20">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${place.amenity === 'pharmacy' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {place.amenity === 'pharmacy' ? <PillIcon size={20} /> : <Building2 size={20} />}
                                        </div>
                                        <span className="text-[10px] font-black px-2 py-1 rounded-full bg-slate-100 text-slate-500 uppercase">
                                            {place.distanceKm.toFixed(1)} km
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{place.name}</h3>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <MapPin size={10} /> {place.street}
                                    </p>

                                    <div className="mt-5 grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => window.open(place.mapsUrl, '_blank')}
                                            className="flex items-center justify-center gap-2 h-10 rounded-xl bg-slate-900 text-white text-[11px] font-bold"
                                        >
                                            <Navigation size={14} /> Navigate
                                        </button>
                                        <button 
                                            disabled={!place.phone}
                                            onClick={() => window.open(`tel:${place.phone}`)}
                                            className="flex items-center justify-center gap-2 h-10 rounded-xl border border-slate-200 text-slate-700 text-[11px] font-bold disabled:opacity-30"
                                        >
                                            <Phone size={14} /> Call
                                        </button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// --- Internal Helper Components ---
function MapControlButton({ icon, onClick }) {
    return (
        <button onClick={onClick} className="h-10 w-10 bg-white shadow-xl rounded-xl flex items-center justify-center text-slate-600 hover:text-blue-600 transition-all active:scale-95">
            {icon}
        </button>
    );
}

function PillIcon({ size }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>
        </svg>
    );
}