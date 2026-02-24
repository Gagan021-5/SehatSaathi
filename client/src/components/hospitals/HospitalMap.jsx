import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getHospitalRoute } from '../../services/api';
import './HospitalMap.css';

/* ── Fix Leaflet default marker icon paths for Vite ── */
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

/* ── Custom icons ── */
const userIcon = L.divIcon({
    className: 'hmap-user-marker',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <circle cx="14" cy="14" r="12" fill="#3b82f6" stroke="#fff" stroke-width="3"/>
    <circle cx="14" cy="14" r="5" fill="#fff"/>
  </svg>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
});

const hospitalIcon = L.divIcon({
    className: 'hmap-hosp-marker',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
    <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z" fill="#ef4444"/>
    <circle cx="16" cy="15" r="9" fill="#fff"/>
    <rect x="13" y="10" width="6" height="10" rx="1" fill="#ef4444"/>
    <rect x="11" y="13" width="10" height="4" rx="1" fill="#ef4444"/>
  </svg>`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -44],
});

export default function HospitalMap({ userLocation, hospitals, selectedHospital, onSelectHospital }) {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    const routeLayerRef = useRef(null);
    const userMarkerRef = useRef(null);
    const [routeInfo, setRouteInfo] = useState(null);

    /* ── Initialize map ── */
    useEffect(() => {
        if (mapRef.current || !mapContainerRef.current) return;

        const center = userLocation ? [userLocation.lat, userLocation.lng] : [20.5937, 78.9629];

        const map = L.map(mapContainerRef.current, {
            center,
            zoom: 13,
            scrollWheelZoom: true,
            zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
        }).addTo(map);

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    /* ── User location marker ── */
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !userLocation) return;

        if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
        } else {
            userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
                .addTo(map)
                .bindPopup('<strong>📍 Your Location</strong>');
        }

        map.setView([userLocation.lat, userLocation.lng], 13);
    }, [userLocation]);

    /* ── Hospital markers ── */
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        // Remove old markers
        markersRef.current.forEach((m) => map.removeLayer(m));
        markersRef.current = [];

        if (hospitals.length === 0) return;

        const bounds = [];
        if (userLocation) bounds.push([userLocation.lat, userLocation.lng]);

        hospitals.forEach((h) => {
            if (!h.lat || !h.lng) return;
            const marker = L.marker([h.lat, h.lng], { icon: hospitalIcon })
                .addTo(map)
                .bindPopup(`
          <div class="hmap-popup">
            <strong>${h.name}</strong>
            ${h.address ? `<p class="hmap-popup-addr">${h.address}</p>` : ''}
            <span class="hmap-popup-dist">📍 ${h.distanceLabel || h.distance || ''}</span>
          </div>
        `);

            marker.on('click', () => onSelectHospital?.(h));
            markersRef.current.push(marker);
            bounds.push([h.lat, h.lng]);
        });

        if (bounds.length > 0) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        }
    }, [hospitals, userLocation, onSelectHospital]);

    /* ── Route drawing ── */
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        if (routeLayerRef.current) {
            map.removeLayer(routeLayerRef.current);
            routeLayerRef.current = null;
        }
        setRouteInfo(null);

        if (!selectedHospital || !userLocation) return;

        let cancelled = false;

        (async () => {
            try {
                const res = await getHospitalRoute({
                    startLat: userLocation.lat,
                    startLng: userLocation.lng,
                    endLat: selectedHospital.lat,
                    endLng: selectedHospital.lng,
                });
                if (cancelled) return;

                const geo = res.data?.geojson_route?.geometry;
                const isEstimate = res.data?.geojson_route?.properties?.is_estimate;

                if (geo?.coordinates?.length > 1) {
                    const latlngs = geo.coordinates.map(([lng, lat]) => [lat, lng]);
                    const polyline = L.polyline(latlngs, {
                        color: '#6366f1',
                        weight: 5,
                        opacity: 0.8,
                        dashArray: isEstimate ? '10 8' : undefined,
                    }).addTo(map);
                    routeLayerRef.current = polyline;
                    map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
                }

                setRouteInfo({
                    distance_km: res.data?.distance_km,
                    duration_minutes: res.data?.duration_minutes,
                    is_estimate: isEstimate,
                });
            } catch {
                setRouteInfo(null);
            }
        })();

        return () => { cancelled = true; };
    }, [selectedHospital, userLocation]);

    return (
        <div className="hmap-wrapper">
            <div ref={mapContainerRef} className="hmap-container" />

            {routeInfo && (
                <div className="hmap-route-info">
                    <span>🛣️ {routeInfo.distance_km} km</span>
                    <span className="hmap-route-sep">·</span>
                    <span>⏱️ ~{Math.round(routeInfo.duration_minutes)} min</span>
                    {routeInfo.is_estimate && <span className="hmap-est-badge">estimate</span>}
                </div>
            )}
        </div>
    );
}
