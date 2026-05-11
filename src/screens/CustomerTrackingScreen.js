import React, {
    useEffect,
    useRef,
    useState,
} from 'react';

import {
    View,
    Text,
    StyleSheet,
} from 'react-native';

import { AnimatedRegion } from 'react-native-maps';

import TrackingMap from '../components/TrackingMap';
import { DEMO_ROUTE } from '../utils/DemoRoute';

import {
    DEFAULT_REGION,
    TEST_ORDER_ID,
    TRACKING_INTERVAL,
} from '../utils/constants';

import { fetchTrackingData } from '../services/trackingService';

const CustomerTrackingScreen = () => {
    const mapRef = useRef(null);

    const pollingRef = useRef(null);

    const animatedCoordinate = useRef(
        new AnimatedRegion({
            latitude: DEFAULT_REGION.latitude,
            longitude: DEFAULT_REGION.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        }),
    ).current;

    const [mapReady, setMapReady] =
        useState(false);

    const [pathCoordinates, setPathCoordinates] =
        useState([]);

    const fetchTracking = async () => {
        try {
            const { data, error } =
                await fetchTrackingData(
                    TEST_ORDER_ID,
                );

            if (error || !data) {
                return;
            }

            const latitude =
                data.current_lat;

            const longitude =
                data.current_lng;

            animatedCoordinate
                .timing({
                    latitude,
                    longitude,
                    duration: 2000,
                    useNativeDriver: false,
                })
                .start();

            setPathCoordinates(
                data.path_json || [],
            );

            if (
                mapReady &&
                mapRef.current
            ) {
                mapRef.current.animateToRegion(
                    {
                        latitude,
                        longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    },
                    1000,
                );
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        fetchTracking();

        pollingRef.current = setInterval(
            () => {
                fetchTracking();
            },
            TRACKING_INTERVAL,
        );

        return () => {
            if (pollingRef.current) {
                clearInterval(
                    pollingRef.current,
                );
            }
        };
    }, []);

    return (
        <View style={{ flex: 1 }}>
            <TrackingMap
                mapRef={mapRef}
                animatedCoordinate={
                    animatedCoordinate
                }
                completedPath={
                    pathCoordinates
                }
                fullRouteCoordinates={
                    DEMO_ROUTE
                }
                destination={
                    DEMO_ROUTE[
                    DEMO_ROUTE.length - 1
                    ]
                }
                mapReady={mapReady}
                setMapReady={setMapReady}
            />

            <View style={styles.bottom}>
                <Text style={styles.title}>
                    Customer Module
                </Text>

                <Text style={styles.subtitle}>
                    Live delivery tracking
                </Text>
            </View>
        </View>
    );
};

export default CustomerTrackingScreen;

const styles = StyleSheet.create({
    bottom: {
        padding: 16,
        backgroundColor: '#fff',
    },

    title: {
        fontSize: 18,
        fontWeight: '700',
    },

    subtitle: {
        marginTop: 4,
        color: '#666',
    },
});