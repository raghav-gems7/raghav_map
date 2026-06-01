import { calculateDistance } from '../utils/distance';
import { AVG_DELIVERY_SPEED_KMH } from '../utils/constants';

export const calculateETA = (
    riderLat,
    riderLng,
    destLat,
    destLng,
) => {
    const distanceMeters = calculateDistance(
        riderLat,
        riderLng,
        destLat,
        destLng,
    );

    const distanceKm = distanceMeters / 1000;
    const timeHours = distanceKm / AVG_DELIVERY_SPEED_KMH;
    const timeMinutes = Math.round(timeHours * 60);

    return {
        distanceMeters: Math.round(distanceMeters),
        distanceKm: distanceKm.toFixed(1),
        minutes: timeMinutes,
        label: formatETA(timeMinutes),
    };
};

const formatETA = minutes => {
    if (minutes <= 0) return 'Arriving now';
    if (minutes === 1) return '~1 min away';
    if (minutes < 60) return `~${minutes} min away`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `~${hours}h ${mins}m away` : `~${hours}h away`;
};
