import BackgroundActions from 'react-native-background-actions';
import Geolocation from '@react-native-community/geolocation';
import { supabase } from './supabase';
import {
    BG_TRACKING_INTERVAL,
    MIN_DISTANCE_METERS,
} from '../utils/constants';
import { calculateDistance } from '../utils/distance';

let lastUploadedLat = null;
let lastUploadedLng = null;

const uploadDeliveryBoyLocation = async (deliveryBoyId, lat, lng) => {
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
        console.log('BG LOCATION UPLOAD ERROR =>', error);
    }
};

const locationTask = async (taskData) => {
    const { deliveryBoyId } = taskData;

    await new Promise(async resolve => {
        const intervalId = setInterval(() => {
            Geolocation.getCurrentPosition(
                async position => {
                    const { latitude, longitude } =
                        position.coords;

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
                        await uploadDeliveryBoyLocation(
                            deliveryBoyId,
                            latitude,
                            longitude,
                        );
                    }
                },
                error => {
                    console.log('BG GEOLOCATION ERROR =>', error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 5000,
                },
            );
        }, BG_TRACKING_INTERVAL);

        BackgroundActions.on('expiration', () => {
            clearInterval(intervalId);
            resolve();
        });
    });
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
    parameters: {},
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
