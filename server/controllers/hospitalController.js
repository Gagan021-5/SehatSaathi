import { searchNearbyFacilities, searchPHCFacilities } from '../services/overpassService.js';
import { getRoute } from '../services/routingService.js';
import { geocode } from '../services/geocodingService.js';

export async function searchNearby(req, res) {
    try {
        const { lat, lng, radius } = req.query;
        if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' });
        const results = await searchNearbyFacilities(parseFloat(lat), parseFloat(lng), parseInt(radius) || 5000);
        res.json({ results });
    } catch (err) {
        console.error('Hospital search error:', err.message);
        res.status(500).json({ error: 'Failed to search for nearby hospitals', details: err.message });
    }
}

export async function searchPHC(req, res) {
    try {
        const { lat, lng, radius } = req.query;
        if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' });
        const results = await searchPHCFacilities(parseFloat(lat), parseFloat(lng), parseInt(radius) || 10000);
        res.json({ results });
    } catch (err) {
        console.error('PHC search error:', err.message);
        res.status(500).json({ error: 'Failed to search for PHCs', details: err.message });
    }
}

export async function getRouteHandler(req, res) {
    try {
        const { startLat, startLng, endLat, endLng } = req.query;
        if (!startLat || !startLng || !endLat || !endLng) {
            return res.status(400).json({ error: 'startLat, startLng, endLat, endLng are all required' });
        }
        const route = await getRoute(parseFloat(startLat), parseFloat(startLng), parseFloat(endLat), parseFloat(endLng));
        res.json(route);
    } catch (err) {
        console.error('Route error:', err.message);
        res.status(500).json({ error: 'Failed to get route', details: err.message });
    }
}

export async function geocodeHandler(req, res) {
    try {
        const { address } = req.query;
        if (!address) return res.status(400).json({ error: 'address query param is required' });
        const result = await geocode(address);
        res.json(result);
    } catch (err) {
        console.error('Geocode error:', err.message);
        res.status(500).json({ error: 'Geocoding failed', details: err.message });
    }
}
