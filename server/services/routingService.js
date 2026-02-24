import axios from 'axios';

const ORS_BASE = 'https://api.openrouteservice.org/v2/directions/driving-car';

function getStraightLineEstimate(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const toRad = (v) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    const roadDist = parseFloat((dist * 1.4).toFixed(2));
    const eta = parseFloat(((roadDist / 30) * 60).toFixed(1));

    return {
        distance_km: roadDist,
        duration_minutes: eta,
        geojson_route: {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [[lng1, lat1], [lng2, lat2]] },
            properties: { distance_km: roadDist, duration_minutes: eta, is_estimate: true },
        },
    };
}

function decodePolyline(encoded) {
    const coords = [];
    let index = 0, lat = 0, lng = 0;
    while (index < encoded.length) {
        let b, shift, result;
        shift = 0; result = 0;
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        lat += result & 1 ? ~(result >> 1) : result >> 1;
        shift = 0; result = 0;
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        lng += result & 1 ? ~(result >> 1) : result >> 1;
        coords.push([lng / 1e5, lat / 1e5]);
    }
    return coords;
}

export async function getRoute(startLat, startLng, endLat, endLng) {
    const apiKey = process.env.ORS_API_KEY;
    if (!apiKey) return getStraightLineEstimate(startLat, startLng, endLat, endLng);

    try {
        const response = await axios.post(ORS_BASE,
            { coordinates: [[startLng, startLat], [endLng, endLat]] },
            { headers: { Authorization: apiKey, 'Content-Type': 'application/json' }, timeout: 10000 }
        );
        const route = response.data?.routes?.[0];
        if (!route) return getStraightLineEstimate(startLat, startLng, endLat, endLng);
        const distanceKm = parseFloat((route.summary.distance / 1000).toFixed(2));
        const durationMin = parseFloat((route.summary.duration / 60).toFixed(1));
        const coords = decodePolyline(route.geometry);
        return {
            distance_km: distanceKm, duration_minutes: durationMin,
            geojson_route: {
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: coords },
                properties: { distance_km: distanceKm, duration_minutes: durationMin },
            },
        };
    } catch (err) {
        console.error('OpenRouteService error:', err.message);
        return getStraightLineEstimate(startLat, startLng, endLat, endLng);
    }
}
