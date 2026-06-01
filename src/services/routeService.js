import polyline from '@mapbox/polyline';
import { OSRM_BASE_URL } from '../utils/constants';

export const getRouteCoordinates = async (origin, destination) => {
    try {
        const url =
            `${OSRM_BASE_URL}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=polyline`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.routes || data.routes.length === 0) {
            return [];
        }

        const points = data.routes[0].geometry;
        const decodedPoints = polyline.decode(points);

        return decodedPoints.map(point => ({
            latitude: point[0],
            longitude: point[1],
        }));
    } catch (error) {
        console.log('OSRM ROUTE ERROR =>', error);
        return [];
    }
};
