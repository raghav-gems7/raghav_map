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
import {
    fetchRiderIdForOrder,
    fetchDeliveryBoyLocation,
} from '../services/trackingService';

const CustomerTrackingScreen = ({ route }) => {
    const { order } = route.params;

    const mapRef = useRef(null);
    const pollingRef = useRef(null);
    const mapReadyRef = useRef(false);
    // Cache the resolved rider ID so we don't re-query the FK chain on every poll
    const riderIdRef = useRef(null);

    const animatedCoordinate = useRef(
        new AnimatedRegion({
            latitude: DEFAULT_REGION.latitude,
            longitude: DEFAULT_REGION.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        }),
    ).current;

    const [currentCoords, setCurrentCoords] = useState(null);
    const [isStale, setIsStale] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [error, setError] = useState(null);
    const [riderOffline, setRiderOffline] = useState(false);

    // Resolve rider ID once from the order FK chain, then poll location directly
    const resolveRiderAndFetch = async () => {
        try {
            if (!riderIdRef.current) {
                const { data: riderId, error: resolveError } =
                    await fetchRiderIdForOrder(order.id);
                if (resolveError) throw resolveError;
                if (!riderId) {
                    setError('No delivery boy assigned to this order yet.');
                    return;
                }
                riderIdRef.current = riderId;
            }
            await fetchLocation();
        } catch (e) {
            console.log('CUSTOMER RESOLVE ERROR =>', e);
            setError('Could not load tracking data.');
        }
    };

    // Runs every 5 seconds. Checks the database for the delivery boy's newest
    // location, then smoothly slides the bike icon over to that spot.
    const fetchLocation = async () => {
        try {
            const { data, error: fetchError } =
                await fetchDeliveryBoyLocation(riderIdRef.current);
            if (fetchError) throw fetchError;
            if (!data) return;

            const { current_lat: latitude, current_lng: longitude, last_seen_at, is_online } = data;

            if (!latitude || !longitude) {
                setRiderOffline(true);
                return;
            }

            const updatedAt = new Date(last_seen_at);
            setLastUpdated(updatedAt);
            setIsStale(Date.now() - updatedAt.getTime() > STALE_LOCATION_THRESHOLD_MS);
            setRiderOffline(!is_online);
            setCurrentCoords({ latitude, longitude });
            setError(null);

            animatedCoordinate
                .timing({ latitude, longitude, duration: 4000, useNativeDriver: false })
                .start();

            if (mapReadyRef.current && mapRef.current) {
                mapRef.current.animateToRegion(
                    { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
                    1000,
                );
            }
        } catch (e) {
            console.log('CUSTOMER FETCH ERROR =>', e);
            setError('Could not fetch rider location.');
        }
    };

    useEffect(() => {
        resolveRiderAndFetch();
        pollingRef.current = setInterval(fetchLocation, TRACKING_INTERVAL);
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

    const statusText = () => {
        if (riderOffline) return 'Delivery boy is offline';
        if (isStale) return 'Locating delivery boy...';
        return 'Rider is on the way';
    };

    return (
        <View style={styles.container}>
            <TrackingMap
                mapRef={mapRef}
                animatedCoordinate={animatedCoordinate}
                // Road-path line feature isn't turned on yet — see MAP_FEATURE_FLOW.md
                completedPath={[]}
                fullRouteCoordinates={[]}
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
                        <Text style={styles.subtitle}>{statusText()}</Text>
                    </View>
                    {isStale && !riderOffline && (
                        <ActivityIndicator size="small" color="#FF8C00" />
                    )}
                </View>

                {error ? (
                    <View style={styles.alertBadge}>
                        <Text style={styles.alertText}>{error}</Text>
                        <TouchableOpacity onPress={resolveRiderAndFetch}>
                            <Text style={styles.retryText}>Tap to retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : riderOffline ? (
                    <View style={styles.alertBadge}>
                        <Text style={styles.alertText}>
                            Rider is offline — location unavailable
                        </Text>
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
    alertBadge: {
        backgroundColor: '#FFEBEE',
        borderRadius: 10,
        padding: 10,
        marginTop: 12,
    },
    alertText: {
        color: '#E53935',
        fontSize: 13,
        fontWeight: '500',
    },
    retryText: {
        color: '#E53935',
        fontSize: 12,
        marginTop: 4,
        textDecorationLine: 'underline',
    },
    lastUpdated: {
        marginTop: 10,
        color: '#AAAAAA',
        fontSize: 12,
    },
});
