import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { AnimatedRegion } from 'react-native-maps';
import TrackingMap from '../components/TrackingMap';
import ETABadge from '../components/ETABadge';
import {
    TRACKING_INTERVAL,
    DEFAULT_REGION,
    STALE_LOCATION_THRESHOLD_MS,
} from '../utils/constants';
import { fetchTrackingData } from '../services/trackingService';

const CustomerTrackingScreen = ({ route }) => {
    const { order } = route.params;
    const isV2 = order.is_v2 === true;

    const mapRef = useRef(null);
    const pollingRef = useRef(null);
    // Use ref for mapReady so the polling closure always reads the latest value
    const mapReadyRef = useRef(false);

    const animatedCoordinate = useRef(
        new AnimatedRegion({
            latitude: DEFAULT_REGION.latitude,
            longitude: DEFAULT_REGION.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        }),
    ).current;

    const [completedPath, setCompletedPath] = useState([]);
    const [fullRoute, setFullRoute] = useState([]);
    const [currentCoords, setCurrentCoords] = useState(null);
    const [isStale, setIsStale] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [error, setError] = useState(null);

    const fetchTracking = async () => {
        try {
            const { data, error: fetchError } = await fetchTrackingData(order.id);
            if (fetchError) throw fetchError;
            if (!data) return;

            const { current_lat: latitude, current_lng: longitude, updated_at } = data;
            const updatedAt = new Date(updated_at);

            setLastUpdated(updatedAt);
            setIsStale(Date.now() - updatedAt.getTime() > STALE_LOCATION_THRESHOLD_MS);
            setCurrentCoords({ latitude, longitude });
            setCompletedPath(data.completed_path || []);
            setFullRoute(isV2 ? (data.full_route || []) : []);
            setError(null);

            animatedCoordinate
                .timing({ latitude, longitude, duration: 4000, useNativeDriver: false })
                .start();

            // Use ref — not state — so closure always has the current value
            if (mapReadyRef.current && mapRef.current) {
                mapRef.current.animateToRegion(
                    { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
                    1000,
                );
            }
        } catch (e) {
            console.log('CUSTOMER FETCH ERROR =>', e);
            setError('Could not fetch tracking data.');
        }
    };

    useEffect(() => {
        fetchTracking();
        pollingRef.current = setInterval(fetchTracking, TRACKING_INTERVAL);
        return () => clearInterval(pollingRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleMapReady = () => {
        mapReadyRef.current = true;
    };

    const formatLastUpdated = () => {
        if (!lastUpdated) return '';
        const seconds = Math.round((Date.now() - lastUpdated.getTime()) / 1000);
        if (seconds < 60) return `Updated ${seconds}s ago`;
        return `Updated ${Math.round(seconds / 60)}m ago`;
    };

    return (
        <View style={styles.container}>
            <TrackingMap
                mapRef={mapRef}
                animatedCoordinate={animatedCoordinate}
                completedPath={completedPath}
                fullRouteCoordinates={isV2 ? fullRoute : []}
                destination={{
                    latitude: order.destination_lat,
                    longitude: order.destination_lng,
                }}
                mapReady={mapReadyRef.current}
                setMapReady={handleMapReady}
            />

            <View style={styles.bottom}>
                <View style={styles.row}>
                    <View>
                        <Text style={styles.title}>Live Delivery Tracking</Text>
                        <Text style={styles.subtitle}>
                            {isStale ? 'Locating delivery boy...' : 'Rider is on the way'}
                        </Text>
                    </View>
                    {isStale && <ActivityIndicator size="small" color="#FF8C00" />}
                </View>

                {error ? (
                    <View style={styles.staleBadge}>
                        <Text style={styles.staleText}>{error}</Text>
                        <TouchableOpacity onPress={fetchTracking}>
                            <Text style={styles.retryText}>Tap to retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : isStale ? (
                    <View style={styles.staleBadge}>
                        <Text style={styles.staleText}>
                            Location unavailable — {formatLastUpdated()}
                        </Text>
                    </View>
                ) : (
                    <ETABadge
                        riderLat={currentCoords?.latitude}
                        riderLng={currentCoords?.longitude}
                        destLat={order.destination_lat}
                        destLng={order.destination_lng}
                    />
                )}

                <Text style={styles.lastUpdated}>{formatLastUpdated()}</Text>

                {isV2 && (
                    <View style={styles.v2Badge}>
                        <Text style={styles.v2Text}>Route Preview On</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

export default CustomerTrackingScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bottom: {
        padding: 20,
        backgroundColor: '#FFFFFF',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111111',
    },
    subtitle: {
        marginTop: 4,
        color: '#666666',
        fontSize: 14,
    },
    staleBadge: {
        backgroundColor: '#FFF3E0',
        borderRadius: 10,
        padding: 10,
        marginTop: 12,
    },
    staleText: {
        color: '#FF8C00',
        fontSize: 13,
        fontWeight: '500',
    },
    retryText: {
        color: '#FF8C00',
        fontSize: 12,
        marginTop: 4,
        textDecorationLine: 'underline',
    },
    lastUpdated: {
        marginTop: 10,
        color: '#AAAAAA',
        fontSize: 12,
    },
    v2Badge: {
        marginTop: 10,
        backgroundColor: '#EEF2FF',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
        alignSelf: 'flex-start',
    },
    v2Text: {
        color: '#4F46E5',
        fontSize: 12,
        fontWeight: '600',
    },
});
