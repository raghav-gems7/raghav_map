import BackgroundActions from 'react-native-background-actions';
import Geolocation from '@react-native-community/geolocation';
import { supabase } from './supabase';
import { BG_TRACKING_INTERVAL, MIN_DISTANCE_METERS } from '../utils/constants';
import { calculateDistance } from '../utils/distance';

let lastUploadedLat = null;
let lastUploadedLng = null;

const getCurrentPosition = () =>
    new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
            position => resolve(position),
            error => reject(error),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
        );
    });

const uploadLocation = async (deliveryBoyId, lat, lng) => {
    try {
        await supabase
            .from('delivery_boys')
            .update({
                current_lat: lat,
                current_lng: lng,
                last_seen_at: new Date().toISOString(),
                is_online: true,
            })
            .eq('id', deliveryBoyId);
    } catch (error) {
        console.log('BG UPLOAD ERROR =>', error);
    }
};

// The task function must be an infinite loop that exits only when
// BackgroundActions.stop() is called (the library resolves the outer promise)
const locationTask = async taskData => {
    const { deliveryBoyId } = taskData;

    while (BackgroundActions.isRunning()) {
        try {
            const position = await getCurrentPosition();
            const { latitude, longitude } = position.coords;

            const shouldUpload =
                lastUploadedLat === null ||
                calculateDistance(
                    lastUploadedLat,
                    lastUploadedLng,
                    latitude,
                    longitude,
                ) >= MIN_DISTANCE_METERS;

            if (shouldUpload) {
                lastUploadedLat = latitude;
                lastUploadedLng = longitude;
                await uploadLocation(deliveryBoyId, latitude, longitude);
            }
        } catch (error) {
            console.log('BG GPS ERROR =>', error);
        }

        // Wait before next poll
        await new Promise(r => setTimeout(r, BG_TRACKING_INTERVAL));
    }
};

const bgOptions = {
    taskName: 'DairyDeliveryTracking',
    taskTitle: 'Delivery Active',
    taskDesc: 'Sharing your location with customers',
    taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
    },
    color: '#111111',
    linkingURI: 'dairyapp://home',
    foregroundServiceType: ['location'],
};

export const startBackgroundTracking = async deliveryBoyId => {
    lastUploadedLat = null;
    lastUploadedLng = null;

    await BackgroundActions.start(locationTask, {
        ...bgOptions,
        parameters: { deliveryBoyId },
    });
};

export const stopBackgroundTracking = async deliveryBoyId => {
    await BackgroundActions.stop();

    lastUploadedLat = null;
    lastUploadedLng = null;

    try {
        await supabase
            .from('delivery_boys')
            .update({ is_online: false })
            .eq('id', deliveryBoyId);
    } catch (error) {
        console.log('STOP TRACKING ERROR =>', error);
    }
};

export const isBackgroundTrackingRunning = () =>
    BackgroundActions.isRunning();
