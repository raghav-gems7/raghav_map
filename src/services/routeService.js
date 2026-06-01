import polyline from '@mapbox/polyline';
import { OSRM_BASE_URL } from '../utils/constants';

const FETCH_TIMEOUT_MS = 10000;

export const getRouteCoordinates = async (origin, destination) => {
    try {
        const url =
            `${OSRM_BASE_URL}/${origin.longitude},${origin.latitude};` +
            `${destination.longitude},${destination.latitude}?overview=full&geometries=polyline`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        let response;
        try {
            response = await fetch(url, { signal: controller.signal });
        } finally {
            clearTimeout(timeoutId);
        }

        if (!response.ok) {
            console.log('OSRM HTTP ERROR =>', response.status);
            return [];
        }

        const data = await response.json();

        if (!data.routes?.length) {
            console.log('OSRM: no routes found');
            return [];
        }

        const decodedPoints = polyline.decode(data.routes[0].geometry);
        return decodedPoints.map(point => ({
            latitude: point[0],
            longitude: point[1],
        }));
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('OSRM ROUTE TIMEOUT');
        } else {
            console.log('OSRM ROUTE ERROR =>', error.message);
        }
        return [];
    }
};
