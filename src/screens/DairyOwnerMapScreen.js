import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import MapView from 'react-native-maps';
import {
    DEFAULT_REGION,
    TRACKING_INTERVAL,
} from '../utils/constants';
import {
    fetchAllActiveRiders,
    fetchAllCustomersForOwner,
    fetchAllSessionDeliveryStatuses,
} from '../services/trackingService';
import CustomerMarker from '../components/CustomerMarker';
import DeliveryBoyMarker from '../components/DeliveryBoyMarker';
import CustomerInfoSheet from '../components/CustomerInfoSheet';

const DairyOwnerMapScreen = () => {
    const mapRef = useRef(null);
    const pollingRef = useRef(null);

    const [riders, setRiders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [sheetVisible, setSheetVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Keep latest riders in a ref so info sheet can read fresh data without re-render
    const ridersRef = useRef([]);

    const loadData = async () => {
        try {
            // Single parallel fetch — no N+1
            const [ridersResult, customersResult, statusesResult] = await Promise.all([
                fetchAllActiveRiders(),
                fetchAllCustomersForOwner(),
                fetchAllSessionDeliveryStatuses(),
            ]);

            const activeRiders = ridersResult.data || [];
            ridersRef.current = activeRiders;
            setRiders(activeRiders);

            // statusesResult.data is a map: { customer_id -> status }
            const statusMap = statusesResult.data || {};
            const enriched = (customersResult.data || []).map(c => ({
                ...c,
                deliveryStatus: statusMap[c.id] || 'pending',
            }));

            setCustomers(enriched);
            setError(null);
        } catch (e) {
            console.log('OWNER MAP LOAD ERROR =>', e);
            setError('Could not load map data. Check your connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        pollingRef.current = setInterval(loadData, TRACKING_INTERVAL);
        return () => clearInterval(pollingRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCustomerPress = customer => {
        setSelectedCustomer(customer);
        setSheetVisible(true);
    };

    const handleRiderPress = rider => {
        if (!rider.current_lat || !mapRef.current) return;
        mapRef.current.animateToRegion(
            {
                latitude: rider.current_lat,
                longitude: rider.current_lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            },
            800,
        );
    };

    const riderLocationForCustomer = customer => {
        if (!customer?.delivery_boy_id) return null;
        const rider = ridersRef.current.find(r => r.id === customer.delivery_boy_id);
        if (!rider?.current_lat) return null;
        return { lat: rider.current_lat, lng: rider.current_lng };
    };

    const delivered = customers.filter(c => c.deliveryStatus === 'delivered').length;
    const pending = customers.filter(c => c.deliveryStatus === 'pending').length;

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#111111" />
                <Text style={styles.loaderText}>Loading Map...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={DEFAULT_REGION}
            >
                {customers.map(customer => (
                    <CustomerMarker
                        key={customer.id}
                        customer={customer}
                        onPress={handleCustomerPress}
                    />
                ))}

                {riders.map(rider => (
                    <DeliveryBoyMarker
                        key={rider.id}
                        rider={rider}
                        onPress={handleRiderPress}
                    />
                ))}
            </MapView>

            {/* Stats overlay */}
            <View style={styles.statsOverlay}>
                <View style={styles.statItem}>
                    <View style={[styles.statDot, styles.dotGreen]} />
                    <Text style={styles.statText}>{delivered} Delivered</Text>
                </View>
                <View style={styles.statItem}>
                    <View style={[styles.statDot, styles.dotBlack]} />
                    <Text style={styles.statText}>{pending} Pending</Text>
                </View>
                <View style={styles.statItem}>
                    <View style={[styles.statDot, styles.dotBlue]} />
                    <Text style={styles.statText}>{riders.length} Riders</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.refreshBtn} onPress={loadData}>
                <Text style={styles.refreshText}>↻ Refresh</Text>
            </TouchableOpacity>

            <CustomerInfoSheet
                customer={selectedCustomer}
                riderLocation={riderLocationForCustomer(selectedCustomer)}
                visible={sheetVisible}
                onClose={() => setSheetVisible(false)}
            />
        </View>
    );
};

export default DairyOwnerMapScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loaderText: {
        marginTop: 16,
        fontSize: 15,
        fontWeight: '600',
        color: '#333333',
    },
    errorText: {
        fontSize: 15,
        color: '#E53935',
        textAlign: 'center',
        marginBottom: 16,
    },
    retryBtn: {
        backgroundColor: '#111111',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    statsOverlay: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
    },
    dotGreen: { backgroundColor: '#1DB954' },
    dotBlack: { backgroundColor: '#111111' },
    dotBlue:  { backgroundColor: '#2563EB' },
    statText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111111',
    },
    refreshBtn: {
        position: 'absolute',
        bottom: 30,
        right: 16,
        backgroundColor: '#111111',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    refreshText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
});
