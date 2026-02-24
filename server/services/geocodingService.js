import axios from 'axios';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

export async function geocode(address) {
    if (!address || !address.trim()) throw new Error('Address is required');

    const response = await axios.get(`${NOMINATIM_URL}/search`, {
        params: { q: address, format: 'json', limit: 1, addressdetails: 1 },
        headers: {
            'User-Agent': 'SehatSaathi/1.0 (healthcare-app; contact@sehatsaathi.in)',
            Accept: 'application/json',
        },
        timeout: 10000,
    });

    const results = response.data;
    if (!results || results.length === 0) throw new Error('No results found');

    const first = results[0];
    return { lat: parseFloat(first.lat), lng: parseFloat(first.lon), display_name: first.display_name };
}

export async function reverseGeocode(lat, lng) {
    const response = await axios.get(`${NOMINATIM_URL}/reverse`, {
        params: { lat, lon: lng, format: 'json', addressdetails: 1 },
        headers: {
            'User-Agent': 'SehatSaathi/1.0 (healthcare-app; contact@sehatsaathi.in)',
            Accept: 'application/json',
        },
        timeout: 10000,
    });

    const data = response.data;
    if (!data || data.error) throw new Error(data?.error || 'Reverse geocoding failed');

    return { lat: parseFloat(data.lat), lng: parseFloat(data.lon), display_name: data.display_name };
}
