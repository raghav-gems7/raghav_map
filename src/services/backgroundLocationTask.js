// Keeps sending the delivery boy's location to the online database while he's
// on a delivery, even if he switches apps or locks his phone. Everyone else
// (customer app, owner app) reads his location from that same database record.
import BackgroundActions from 'react-native-background-actions';
import Geolocation from '@react-native-community/geolocation';
import { supabase } from './supabase';
import { BG_TRACKING_INTERVAL, MIN_DISTANCE_METERS } from '../utils/constants';
import { calculateDistance } from '../utils/distance';

let lastUploadedLat = null;
let lastUploadedLng = null;

const sleep = ms => new Promise(r => setTimeout(r, ms));

const getCurrentPosition = () =>
    new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
            pos => resolve(pos),
            err => reject(err),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
        );
    });

const LOG_TAG = '[LOC][BG]';

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

// The task runs as a while-loop. BackgroundActions.stop() sets isRunning() to false,
// which causes the loop to exit naturally after the current sleep completes.
const locationTask = async taskData => {
    const { deliveryBoyId } = taskData;
    const startedAt = Date.now();
    console.log(`${LOG_TAG} task started at=${new Date(startedAt).toISOString()} deliveryBoyId=${deliveryBoyId}`);

    let tickCount = 0;

    while (BackgroundActions.isRunning()) {
        tickCount += 1;
        const tickStart = Date.now();
        const elapsedSec = Math.round((tickStart - startedAt) / 1000);
        try {
            const position = await getCurrentPosition();
            const { latitude, longitude } = position.coords;

            console.log(
                `${LOG_TAG} fetch OK tick=${tickCount} at=${new Date(tickStart).toISOString()} ` +
                `elapsedSinceStart=${elapsedSec}s lat=${latitude} lng=${longitude}`,
            );

            // Only send an update if he's moved at least 10 meters since the last
            // one — no need to update the map if he's standing still.
            const moved =
                lastUploadedLat === null ||
                calculateDistance(lastUploadedLat, lastUploadedLng, latitude, longitude) >=
                    MIN_DISTANCE_METERS;

            if (moved) {
                lastUploadedLat = latitude;
                lastUploadedLng = longitude;
                await uploadLocation(deliveryBoyId, latitude, longitude);
                console.log(`${LOG_TAG} uploaded tick=${tickCount} at=${new Date().toISOString()}`);
            }
        } catch (err) {
            // GPS error — log and continue; don't crash the task
            console.log(
                `${LOG_TAG} fetch FAILED tick=${tickCount} at=${new Date(tickStart).toISOString()} ` +
                `elapsedSinceStart=${elapsedSec}s error=${err?.message || err}`,
            );
        }

        // Sleep between polls. If stop() was called during GPS fetch,
        // isRunning() is already false here and the loop exits without sleeping.
        if (BackgroundActions.isRunning()) {
            await sleep(BG_TRACKING_INTERVAL);
        } else {
            console.log(
                `${LOG_TAG} task stopping at=${new Date().toISOString()} ` +
                `totalTicks=${tickCount} totalRuntime=${Math.round((Date.now() - startedAt) / 1000)}s`,
            );
        }
    }
};

const bgOptions = {
    taskName: 'DairyDeliveryTracking',
    taskTitle: 'Delivery Active',
    taskDesc: 'Sharing your location with customers',
    taskIcon: { name: 'ic_launcher', type: 'mipmap' },
    color: '#111111',
    linkingURI: 'dairyapp://home',
    foregroundServiceType: ['location'],
};

export const startBackgroundTracking = async deliveryBoyId => {
    console.log(`${LOG_TAG} startBackgroundTracking called at=${new Date().toISOString()}`);
    // Reset distance filter state on each new session
    lastUploadedLat = null;
    lastUploadedLng = null;
    await BackgroundActions.start(locationTask, {
        ...bgOptions,
        parameters: { deliveryBoyId },
    });
};

export const stopBackgroundTracking = async deliveryBoyId => {
    console.log(`${LOG_TAG} stopBackgroundTracking called at=${new Date().toISOString()}`);
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

export const isBackgroundTrackingRunning = () => BackgroundActions.isRunning();

export const getLastKnownLocation = () => ({
    lat: lastUploadedLat,
    lng: lastUploadedLng,
});
