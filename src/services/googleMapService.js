import polyline from '@mapbox/polyline';

const GOOGLE_MAPS_API_KEY =
    'AIzaSyBrn_C_3hwbKWumZnWY3Bkh--xNgydqN-Q';

export const getRouteCoordinates = async (
    origin,
    destination,
) => {
    try {
        console.log(
            'FETCHING GOOGLE ROUTE...',
        );

        const url =
            `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}`;

        const response = await fetch(url);

        const data = await response.json();

        if (
            !data.routes ||
            data.routes.length === 0
        ) {
            console.log('NO ROUTES FOUND');

            return [];
        }

        const points =
            data.routes[0].overview_polyline
                .points;

        const decodedPoints =
            polyline.decode(points);

        const coordinates =
            decodedPoints.map(point => ({
                latitude: point[0],
                longitude: point[1],
            }));

        console.log(
            'ROUTE COORDINATES => ',
            coordinates.length,
        );

        return coordinates;
    } catch (error) {
        console.log(
            'GOOGLE ROUTE ERROR => ',
            error,
        );

        return [];
    }
};