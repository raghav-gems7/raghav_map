import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Linking,
    Modal,
    Pressable,
    ActivityIndicator,
    Platform,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { useFocusEffect } from '@react-navigation/native';
import DeliveryStopMarker from '../components/DeliveryStopMarker';
import { fetchSessionDeliveries, markDelivered } from '../services/trackingService';
import { DEFAULT_REGION } from '../utils/constants';

// Compute a region that fits all coordinates with padding
const fitRegion = coords => {
    if (!coords.length) return DEFAULT_REGION;
    const lats = coords.map(c => c.latitude);
    const lngs = coords.map(c => c.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latDelta = Math.max((maxLat - minLat) * 1.4, 0.02);
    const lngDelta = Math.max((maxLng - minLng) * 1.4, 0.02);
    return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
    };
};

const openGoogleMaps = (lat, lng) => {
    const googleMapsUrl = Platform.select({
        ios: `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`,
        android: `google.navigation:q=${lat},${lng}&mode=d`,
    });
    const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

    Linking.canOpenURL(googleMapsUrl)
        .then(supported => Linking.openURL(supported ? googleMapsUrl : fallbackUrl))
        .catch(() => Linking.openURL(fallbackUrl));
};

const DeliveryMapScreen = ({ route }) => {
    const { deliveryBoyId } = route.params;

    const mapRef = useRef(null);
    const hasFitMap = useRef(false);
    const [deliveries, setDeliveries] = useState([]);
    const [riderCoord, setRiderCoord] = useState(null);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [sheetVisible, setSheetVisible] = useState(false);
    const [markingId, setMarkingId] = useState(null);

    // Reload fresh data from Supabase every time this screen comes into focus.
    // This covers: initial mount, return from Google Maps, return from background.
    useFocusEffect(
        useCallback(() => {
            fetchSessionDeliveries(deliveryBoyId).then(({ data }) => {
                setDeliveries(data || []);
            });
        }, [deliveryBoyId]),
    );

    // Get rider's current position once on mount to show the blue dot
    useEffect(() => {
        const requestedAt = Date.now();
        console.log(`[LOC][FG] getCurrentPosition requested at=${new Date(requestedAt).toISOString()}`);
        Geolocation.getCurrentPosition(
            pos => {
                console.log(
                    `[LOC][FG] getCurrentPosition OK at=${new Date().toISOString()} ` +
                    `latency=${Date.now() - requestedAt}ms lat=${pos.coords.latitude} lng=${pos.coords.longitude}`,
                );
                setRiderCoord({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                });
            },
            err => {
                console.log(
                    `[LOC][FG] getCurrentPosition FAILED at=${new Date().toISOString()} ` +
                    `latency=${Date.now() - requestedAt}ms error=${err?.message || err}`,
                );
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
        );
    }, []);

    // Fit map to all customer coordinates once after first data load
    useEffect(() => {
        if (hasFitMap.current || !deliveries.length || !mapRef.current) return;
        const coords = deliveries
            .filter(d => d.dairy_customers?.lat && d.dairy_customers?.lng)
            .map(d => ({
                latitude: d.dairy_customers.lat,
                longitude: d.dairy_customers.lng,
            }));
        if (!coords.length) return;
        const timer = setTimeout(() => {
            mapRef.current?.animateToRegion(fitRegion(coords), 600);
            hasFitMap.current = true;
        }, 400);
        return () => clearTimeout(timer);
    }, [deliveries]);

    const handleMarkerPress = delivery => {
        setSelectedDelivery(delivery);
        setSheetVisible(true);
    };

    const handleGetDirections = () => {
        if (!selectedDelivery) return;
        const { lat, lng } = selectedDelivery.dairy_customers;
        openGoogleMaps(lat, lng);
    };

    const handleMarkDelivered = async () => {
        if (!selectedDelivery || markingId) return;
        setMarkingId(selectedDelivery.id);
        try {
            const { error } = await markDelivered(selectedDelivery.id);
            if (!error) {
                // Update local list so marker goes grey immediately
                setDeliveries(prev =>
                    prev.map(d =>
                        d.id === selectedDelivery.id ? { ...d, status: 'delivered' } : d,
                    ),
                );
                setSheetVisible(false);
                setSelectedDelivery(null);
            }
        } finally {
            setMarkingId(null);
        }
    };

    const pending = deliveries.filter(d => d.status === 'pending').length;
    const total = deliveries.length;

    const allCoords = deliveries
        .filter(d => d.dairy_customers?.lat)
        .map(d => ({
            latitude: d.dairy_customers.lat,
            longitude: d.dairy_customers.lng,
        }));

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={fitRegion(allCoords)}
            >
                {/* Rider's current position */}
                {riderCoord && (
                    <Marker
                        coordinate={riderCoord}
                        anchor={{ x: 0.5, y: 0.5 }}
                        title="You"
                    >
                        <View style={styles.riderDot} />
                    </Marker>
                )}

                {/* All delivery stops */}
                {deliveries.map(delivery =>
                    delivery.dairy_customers?.lat ? (
                        <DeliveryStopMarker
                            key={delivery.id}
                            delivery={delivery}
                            onPress={handleMarkerPress}
                        />
                    ) : null,
                )}
            </MapView>

            {/* Stats overlay */}
            <View style={styles.statsOverlay}>
                <Text style={styles.statsText}>
                    {pending} pending · {total - pending} done
                </Text>
            </View>

            {/* Bottom sheet for selected stop */}
            <Modal
                visible={sheetVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setSheetVisible(false)}
            >
                <Pressable style={styles.overlay} onPress={() => setSheetVisible(false)} />
                <View style={styles.sheet}>
                    <View style={styles.handle} />

                    {selectedDelivery && (
                        <>
                            <View style={styles.sheetRow}>
                                <View style={styles.seqBadge}>
                                    <Text style={styles.seqText}>
                                        {selectedDelivery.sequence_number}
                                    </Text>
                                </View>
                                <View style={styles.sheetInfo}>
                                    <Text style={styles.sheetName}>
                                        {selectedDelivery.dairy_customers?.name}
                                    </Text>
                                    <Text style={styles.sheetAddress} numberOfLines={2}>
                                        {selectedDelivery.dairy_customers?.address}
                                    </Text>
                                </View>
                            </View>

                            {selectedDelivery.status === 'pending' ? (
                                <>
                                    <TouchableOpacity
                                        style={styles.directionsBtn}
                                        onPress={handleGetDirections}
                                    >
                                        <Text style={styles.directionsBtnText}>
                                            Get Directions
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.deliveredBtn,
                                            markingId && styles.btnDisabled,
                                        ]}
                                        onPress={handleMarkDelivered}
                                        disabled={!!markingId}
                                    >
                                        {markingId ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.deliveredBtnText}>
                                                Mark as Delivered
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <View style={styles.doneBadge}>
                                    <Text style={styles.doneText}>
                                        {selectedDelivery.status === 'delivered'
                                            ? 'Already delivered'
                                            : 'Skipped'}
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={styles.closeBtn}
                                onPress={() => setSheetVisible(false)}
                            >
                                <Text style={styles.closeBtnText}>Close</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </Modal>
        </View>
    );
};

export default DeliveryMapScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    riderDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#2563EB',
        borderWidth: 3,
        borderColor: '#FFFFFF',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 3,
    },
    statsOverlay: {
        position: 'absolute',
        top: 16,
        alignSelf: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 18,
        paddingVertical: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    statsText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111111',
    },
    // Bottom sheet
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    sheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#DDDDDD',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    sheetRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    seqBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#111111',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        flexShrink: 0,
    },
    seqText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
    },
    sheetInfo: {
        flex: 1,
    },
    sheetName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111111',
    },
    sheetAddress: {
        marginTop: 4,
        fontSize: 13,
        color: '#666666',
        lineHeight: 18,
    },
    directionsBtn: {
        backgroundColor: '#2563EB',
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 10,
    },
    directionsBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
    },
    deliveredBtn: {
        backgroundColor: '#1DB954',
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 10,
    },
    btnDisabled: {
        backgroundColor: '#888888',
    },
    deliveredBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
    },
    doneBadge: {
        backgroundColor: '#F0FFF4',
        padding: 14,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 10,
    },
    doneText: {
        color: '#1DB954',
        fontWeight: '600',
        fontSize: 14,
    },
    closeBtn: {
        backgroundColor: '#F3F4F6',
        padding: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    closeBtnText: {
        color: '#111111',
        fontWeight: '600',
        fontSize: 14,
    },
});
