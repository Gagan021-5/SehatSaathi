import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { motion } from 'framer-motion';
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
} from 'lucide-react';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

const redCrossIcon = L.divIcon({
    className: 'custom-hospital-icon',
    html: `
      <div style="position:relative;display:grid;place-items:center;width:30px;height:30px;border-radius:999px;background:#ef4444;border:3px solid #ffffff;box-shadow:0 12px 24px rgba(239,68,68,0.42);">
        <span style="position:absolute;font-weight:900;color:#ffffff;font-size:16px;line-height:1;">+</span>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
});

function buildOverpassQuery(bounds) {
    const south = bounds.getSouth();
    const west = bounds.getWest();
    const north = bounds.getNorth();
    const east = bounds.getEast();

    return `
      [out:json][timeout:20];
      (
        node["amenity"="hospital"](${south},${west},${north},${east});
        node["amenity"="pharmacy"](${south},${west},${north},${east});
        way["amenity"="hospital"](${south},${west},${north},${east});
        way["amenity"="pharmacy"](${south},${west},${north},${east});
      );
      out center tags;
    `;
}

function normalizePlace(element) {
    const tags = element.tags || {};
    const lat = element.lat ?? element.center?.lat;
    const lng = element.lon ?? element.center?.lon;
    if (lat == null || lng == null) return null;

    const street = tags['addr:street'] || tags['addr:full'] || 'Address not available';
    const name =
        tags.name ||
        tags['name:en'] ||
        (tags.amenity === 'pharmacy' ? 'Pharmacy' : 'Hospital');

    return {
        id: `${element.type}-${element.id}`,
        lat,
        lng,
        amenity: tags.amenity || 'hospital',
        name,
        street,
        phone: tags.phone || tags['contact:phone'] || tags['contact:mobile'] || '',
        mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    };
}

function toRadians(value) {
    return (value * Math.PI) / 180;
}

function haversineKm(origin, target) {
    const earthRadiusKm = 6371;
    const latDelta = toRadians(target.lat - origin.lat);
    const lngDelta = toRadians(target.lng - origin.lng);
    const a =
        Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
        Math.cos(toRadians(origin.lat)) *
            Math.cos(toRadians(target.lat)) *
            Math.sin(lngDelta / 2) *
            Math.sin(lngDelta / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
}

function formatDistance(distanceKm) {
    if (!Number.isFinite(distanceKm)) return '--';
    if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
    return `${distanceKm.toFixed(1)} km`;
}

function normalizePhone(phone) {
    if (!phone) return '';
    return phone.replace(/[^\d+]/g, '');
}

function MapMoveHandler({ onMoveEnd }) {
    const map = useMapEvents({
        moveend: () => onMoveEnd(map.getBounds()),
    });

    useEffect(() => {
        onMoveEnd(map.getBounds());
    }, [map, onMoveEnd]);

    return null;
}

function ZoomOverlayControls() {
    const map = useMap();
    return (
        <div className="absolute right-4 top-28 z-[500] flex flex-col gap-2">
            <button
                onClick={() => map.zoomIn()}
                className="w-11 h-11 rounded-xl bg-white/95 backdrop-blur-xl border border-zinc-200/70 text-zinc-700 shadow-xl shadow-zinc-200/40 hover:bg-white grid place-items-center transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-95"
                aria-label="Zoom in"
            >
                <Plus size={18} />
            </button>
            <button
                onClick={() => map.zoomOut()}
                className="w-11 h-11 rounded-xl bg-white/95 backdrop-blur-xl border border-zinc-200/70 text-zinc-700 shadow-xl shadow-zinc-200/40 hover:bg-white grid place-items-center transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-95"
                aria-label="Zoom out"
            >
                <Minus size={18} />
            </button>
        </div>
    );
}

export default function HospitalsMap() {
    const [center, setCenter] = useState(DEFAULT_CENTER);
    const [userLocation, setUserLocation] = useState(DEFAULT_CENTER);
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [search, setSearch] = useState('');

    const mapRef = useRef(null);
    const debounceRef = useRef(null);
    const abortRef = useRef(null);
    const lastBBoxRef = useRef('');

    const fetchPlaces = useCallback(async (bounds) => {
        const bboxKey = `${bounds.getSouth().toFixed(4)},${bounds.getWest().toFixed(4)},${bounds.getNorth().toFixed(4)},${bounds.getEast().toFixed(4)}`;
        if (bboxKey === lastBBoxRef.current) return;
        lastBBoxRef.current = bboxKey;

        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const timeoutId = setTimeout(() => controller.abort(), 12000);
        setFetching(true);

        try {
            const query = buildOverpassQuery(bounds);
            const response = await fetch(OVERPASS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                body: `data=${encodeURIComponent(query)}`,
                signal: controller.signal,
            });

            if (!response.ok) throw new Error(`Overpass ${response.status}`);
            const data = await response.json();
            const rows = (data.elements || []).map(normalizePlace).filter(Boolean);

            setPlaces(rows);
            if (rows.length === 0) {
                toast('No hospitals/pharmacies found in this map area.', {
                    icon: 'i',
                    style: { borderRadius: '12px' },
                });
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                toast.error('Map request timed out. Please move less or try again.');
            } else {
                toast.error('Unable to load nearby places right now.');
            }
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
            setFetching(false);
        }
    }, []);

    const scheduleFetch = useCallback(
        (bounds) => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => fetchPlaces(bounds), 500);
        },
        [fetchPlaces]
    );

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setCenter(current);
                setUserLocation(current);
                mapRef.current?.setView(current, 14);
            },
            () => {
                toast('Using default location. Enable location for better results.', { icon: 'i' });
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (abortRef.current) abortRef.current.abort();
        };
    }, []);

    const filteredPlaces = useMemo(() => {
        const origin = userLocation || center;
        const queryText = search.trim().toLowerCase();

        const withDistance = places.map((place) => ({
            ...place,
            distanceKm: haversineKm(origin, { lat: place.lat, lng: place.lng }),
        }));

        const filtered = queryText
            ? withDistance.filter(
                  (place) =>
                      place.name.toLowerCase().includes(queryText) ||
                      place.street.toLowerCase().includes(queryText)
              )
            : withDistance;

        return filtered.sort((a, b) => a.distanceKm - b.distanceKm);
    }, [places, search, userLocation, center]);

    return (
        <div className="w-full space-y-4">
            <div className="relative h-[68vh] min-h-[460px] w-full overflow-hidden rounded-3xl border border-zinc-200 shadow-[0_24px_50px_rgba(15,23,42,0.18)]">
                <MapContainer
                    center={center}
                    zoom={13}
                    minZoom={4}
                    zoomControl={false}
                    className="h-full w-full"
                    ref={mapRef}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapMoveHandler onMoveEnd={scheduleFetch} />
                    <ZoomOverlayControls />

                    {filteredPlaces.map((place) => (
                        <Marker key={place.id} position={[place.lat, place.lng]} icon={redCrossIcon}>
                            <Popup>
                                <div className="min-w-[220px] space-y-2">
                                    <p className="text-sm font-semibold tracking-tight text-zinc-900">{place.name}</p>
                                    <p className="text-xs text-zinc-500">{place.street}</p>
                                    <p className="text-xs font-semibold text-zinc-700">
                                        {formatDistance(place.distanceKm)}
                                    </p>
                                    <a
                                        href={place.mapsUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30"
                                    >
                                        <Navigation size={13} /> Navigate
                                    </a>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] h-24 bg-gradient-to-b from-zinc-900/15 to-transparent" />

                <div className="absolute left-4 right-4 top-4 z-[600]">
                    <div className="mx-auto max-w-3xl rounded-2xl bg-white/90 backdrop-blur-xl border border-zinc-200/60 shadow-xl shadow-zinc-200/40 p-3">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/20 grid place-items-center">
                                <LocateFixed size={18} />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-zinc-500 font-medium">Nearby Healthcare Finder</p>
                                <div className="relative mt-1">
                                    <Search
                                        size={15}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                                    />
                                    <input
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Search by hospital, pharmacy or address..."
                                        className="w-full rounded-xl border border-zinc-200/70 bg-white/90 py-2 pl-9 pr-3 text-sm outline-none transition-all duration-300 ease-out focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="min-w-[120px] text-right">
                                {loading || fetching ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                                        <Loader2 size={13} className="animate-spin" /> Fetching
                                    </span>
                                ) : (
                                    <span className="text-xs font-semibold text-zinc-700">
                                        {filteredPlaces.length} places
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <section className="rounded-2xl border border-zinc-200/60 bg-white/80 backdrop-blur-xl shadow-xl shadow-zinc-200/40 p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base md:text-lg font-semibold tracking-tight text-zinc-900">
                        Nearby Hospitals and Pharmacies
                    </h2>
                    <p className="text-xs md:text-sm text-zinc-500">Sorted by nearest distance from you</p>
                </div>

                {filteredPlaces.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-6 text-center text-sm text-zinc-500">
                        Move the map or adjust search to find nearby healthcare places.
                    </div>
                ) : (
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {filteredPlaces.map((place, index) => {
                            const phoneValue = normalizePhone(place.phone);
                            const callHref = phoneValue ? `tel:${phoneValue}` : '';
                            const smsHref = phoneValue
                                ? `sms:${phoneValue}?body=${encodeURIComponent(
                                      `Hi, I need assistance. I am trying to reach ${place.name}.`
                                  )}`
                                : '';

                            return (
                                <motion.article
                                    key={`card-${place.id}`}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, ease: 'easeOut', delay: index * 0.03 }}
                                    className="rounded-xl border border-zinc-200/60 bg-white/90 p-4 shadow-xl shadow-zinc-200/30 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold tracking-tight text-zinc-900">
                                                {place.name}
                                            </p>
                                            <p className="mt-1 min-h-[2.25rem] text-xs text-zinc-500 overflow-hidden">
                                                {place.street}
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                                            {formatDistance(place.distanceKm)}
                                        </span>
                                    </div>

                                    <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                                        <Building2 size={12} />
                                        {place.amenity}
                                    </div>

                                    <div className="mt-3 grid grid-cols-3 gap-2">
                                        <a
                                            href={place.mapsUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 px-2 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30"
                                        >
                                            <Navigation size={13} /> Navigate
                                        </a>
                                        {callHref ? (
                                            <a
                                                href={callHref}
                                                className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30"
                                            >
                                                <Phone size={13} /> Call
                                            </a>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled
                                                className="inline-flex items-center justify-center gap-1 rounded-lg bg-zinc-100 px-2 py-2 text-xs font-semibold text-zinc-400 cursor-not-allowed"
                                            >
                                                <Phone size={13} /> Call
                                            </button>
                                        )}
                                        {smsHref ? (
                                            <a
                                                href={smsHref}
                                                className="inline-flex items-center justify-center gap-1 rounded-lg bg-amber-500 px-2 py-2 text-xs font-semibold text-white shadow-lg shadow-amber-500/20 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/30"
                                            >
                                                <MessageCircle size={13} /> Message
                                            </a>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled
                                                className="inline-flex items-center justify-center gap-1 rounded-lg bg-zinc-100 px-2 py-2 text-xs font-semibold text-zinc-400 cursor-not-allowed"
                                            >
                                                <MessageCircle size={13} /> Message
                                            </button>
                                        )}
                                    </div>
                                </motion.article>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}



