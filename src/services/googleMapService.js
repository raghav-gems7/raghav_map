import polyline from '@mapbox/polyline';
import Config from 'react-native-config';

const FETCH_TIMEOUT_MS = 10000;

export const getRouteCoordinates = async (origin, destination) => {
    try {
        const url =
            `https://maps.googleapis.com/maps/api/directions/json` +
            `?origin=${origin.latitude},${origin.longitude}` +
            `&destination=${destination.latitude},${destination.longitude}` +
            `&key=${Config.GOOGLE_MAPS_API_KEY}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        let response;
        try {
            response = await fetch(url, { signal: controller.signal });
        } finally {
            clearTimeout(timeoutId);
        }

        if (!response.ok) {
            console.log('GOOGLE DIRECTIONS HTTP ERROR =>', response.status);
            return [];
        }

        const data = await response.json();

        if (!data.routes?.length) {
            console.log('GOOGLE DIRECTIONS: no routes found');
            return [];
        }

        const decodedPoints = polyline.decode(
            data.routes[0].overview_polyline.points,
        );
        return decodedPoints.map(point => ({
            latitude: point[0],
            longitude: point[1],
        }));
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('GOOGLE DIRECTIONS TIMEOUT');
        } else {
            console.log('GOOGLE DIRECTIONS ERROR =>', error.message);
        }
        return [];
    }
};
