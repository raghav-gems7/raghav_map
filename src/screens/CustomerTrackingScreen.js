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
            latitude: DEMO_ROUTE[0].latitude,
            longitude:
                DEMO_ROUTE[0].longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        }),
    ).current;

    const [mapReady, setMapReady] =
        useState(false);

    const [completedPath, setCompletedPath] =
        useState([]);

    const [lastUpdatedTime, setLastUpdatedTime] =
        useState('');

    const [currentCoords, setCurrentCoords] =
        useState(null);

    const fetchTracking = async () => {
        try {
            console.log(
                'CUSTOMER POLLING STARTED',
            );

            const { data, error } =
                await fetchTrackingData(
                    TEST_ORDER_ID,
                );

            if (error) {
                console.log(
                    'CUSTOMER FETCH ERROR => ',
                    error,
                );

                return;
            }

            if (!data) {
                console.log(
                    'NO TRACKING DATA FOUND',
                );

                return;
            }

            console.log(
                'CUSTOMER TRACKING DATA => ',
                data,
            );

            const latitude =
                data.current_lat;

            const longitude =
                data.current_lng;

            setCurrentCoords({
                latitude,
                longitude,
            });

            setLastUpdatedTime(
                new Date().toLocaleTimeString(),
            );

            animatedCoordinate
                .timing({
                    latitude,
                    longitude,
                    duration: 4000,
                    useNativeDriver: false,
                })
                .start();

            const fetchedPath =
                data.path_json || [];

            setCompletedPath(
                fetchedPath,
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
            console.log(
                'CUSTOMER SCREEN ERROR => ',
                error,
            );
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
                    completedPath
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

                <View style={styles.debugBox}>
                    <Text style={styles.debugText}>
                        Last Update:
                        {' '}
                        {lastUpdatedTime ||
                            'Waiting...'}
                    </Text>

                    <Text style={styles.debugText}>
                        Latitude:
                        {' '}
                        {currentCoords?.latitude ||
                            '---'}
                    </Text>

                    <Text style={styles.debugText}>
                        Longitude:
                        {' '}
                        {currentCoords?.longitude ||
                            '---'}
                    </Text>

                    <Text style={styles.debugText}>
                        Completed Route Points:
                        {' '}
                        {completedPath.length}
                    </Text>
                </View>
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
        marginBottom: 10,
    },

    debugBox: {
        backgroundColor: '#F5F5F5',
        padding: 10,
        borderRadius: 8,
    },

    debugText: {
        fontSize: 13,
        marginBottom: 4,
        color: '#000',
    },
});