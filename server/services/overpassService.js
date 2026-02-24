import axios from 'axios';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const toRad = (v) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export async function searchNearbyFacilities(lat, lng, radius = 5000) {
    const query = `
    [out:json][timeout:15];
    (
      node["amenity"="hospital"](around:${radius},${lat},${lng});
      node["amenity"="clinic"](around:${radius},${lat},${lng});
      node["amenity"="health_post"](around:${radius},${lat},${lng});
      node["amenity"="doctors"](around:${radius},${lat},${lng});
      way["amenity"="hospital"](around:${radius},${lat},${lng});
      way["amenity"="clinic"](around:${radius},${lat},${lng});
    );
    out center body;
  `;

    const response = await axios.post(
        OVERPASS_URL,
        `data=${encodeURIComponent(query)}`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    );

    const elements = response.data?.elements || [];

    return elements
        .map((el) => {
            const elLat = el.lat ?? el.center?.lat;
            const elLng = el.lon ?? el.center?.lon;
            if (elLat == null || elLng == null) return null;
            const dist = haversine(lat, lng, elLat, elLng);
            const tags = el.tags || {};
            return {
                id: el.id,
                name: tags.name || tags['name:en'] || 'Unnamed Facility',
                address: [tags['addr:street'], tags['addr:city'], tags['addr:postcode']].filter(Boolean).join(', ') || tags['addr:full'] || '',
                lat: elLat, lng: elLng,
                type: tags.amenity || 'hospital',
                phone: tags.phone || tags['contact:phone'] || '',
                distance: parseFloat(dist.toFixed(2)),
                distanceLabel: dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`,
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.distance - b.distance);
}

export async function searchPHCFacilities(lat, lng, radius = 10000) {
    const query = `
    [out:json][timeout:15];
    (
      node["amenity"="hospital"](around:${radius},${lat},${lng});
      node["amenity"="clinic"](around:${radius},${lat},${lng});
      node["amenity"="health_post"](around:${radius},${lat},${lng});
      node["healthcare"="centre"](around:${radius},${lat},${lng});
      way["amenity"="hospital"](around:${radius},${lat},${lng});
    );
    out center body;
  `;

    const response = await axios.post(
        OVERPASS_URL,
        `data=${encodeURIComponent(query)}`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    );

    const elements = response.data?.elements || [];
    const seen = new Set();

    return elements
        .map((el) => {
            const elLat = el.lat ?? el.center?.lat;
            const elLng = el.lon ?? el.center?.lon;
            if (elLat == null || elLng == null || seen.has(el.id)) return null;
            seen.add(el.id);
            const dist = haversine(lat, lng, elLat, elLng);
            const tags = el.tags || {};
            return {
                id: el.id,
                name: tags.name || tags['name:en'] || 'Health Center',
                address: [tags['addr:street'], tags['addr:city'], tags['addr:postcode']].filter(Boolean).join(', ') || tags['addr:full'] || '',
                lat: elLat, lng: elLng,
                type: tags['operator:type'] === 'government' ? 'PHC' : tags.amenity || 'hospital',
                phone: tags.phone || tags['contact:phone'] || '',
                distance: parseFloat(dist.toFixed(2)),
                distanceLabel: dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`,
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.distance - b.distance);
}

export { haversine };
