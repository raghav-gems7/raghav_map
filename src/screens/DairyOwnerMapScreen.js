import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { DEFAULT_REGION, TRACKING_INTERVAL, STALE_LOCATION_THRESHOLD_MS } from '../utils/constants';
import { fetchAllActiveRiders, fetchAllCustomersForOwner, fetchSessionDeliveries } from '../services/trackingService';
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

    const ridersRef = useRef([]);

    const loadData = async () => {
        try {
            const [ridersResult, customersResult] = await Promise.all([
                fetchAllActiveRiders(),
                fetchAllCustomersForOwner(),
            ]);

            const activeRiders = ridersResult.data || [];
            ridersRef.current = activeRiders;
            setRiders(activeRiders);

            // Merge delivery status into customers
            const customerData = customersResult.data || [];
            const allDeliveries = await Promise.all(
                activeRiders.map(r => fetchSessionDeliveries(r.id)),
            );

            const deliveryStatusMap = {};
            allDeliveries.forEach(result => {
                (result.data || []).forEach(d => {
                    if (d.dairy_customers?.id) {
                        deliveryStatusMap[d.dairy_customers.id] = d.status;
                    }
                });
            });

            const enriched = customerData.map(c => ({
                ...c,
                deliveryStatus: deliveryStatusMap[c.id] || 'pending',
            }));

            setCustomers(enriched);
            setLoading(false);
        } catch (error) {
            console.log('OWNER MAP LOAD ERROR =>', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        pollingRef.current = setInterval(loadData, TRACKING_INTERVAL);
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    const handleCustomerPress = customer => {
        setSelectedCustomer(customer);
        setSheetVisible(true);
    };

    const handleRiderPress = rider => {
        if (mapRef.current) {
            mapRef.current.animateToRegion(
                {
                    latitude: rider.current_lat,
                    longitude: rider.current_lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                },
                800,
            );
        }
    };

    const activeRiderForCustomer = customer => {
        if (!customer.delivery_boy_id) return null;
        return ridersRef.current.find(r => r.id === customer.delivery_boy_id);
    };

    const delivered = customers.filter(c => c.deliveryStatus === 'delivered').length;
    const pending = customers.filter(c => c.deliveryStatus === 'pending').length;

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#111111" />
                <Text style={styles.loaderText}>Loading Map...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={DEFAULT_REGION}
            >
                {/* Customer address pins */}
                {customers.map(customer => (
                    <CustomerMarker
                        key={customer.id}
                        customer={customer}
                        onPress={handleCustomerPress}
                    />
                ))}

                {/* Active delivery boy markers */}
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
                    <View style={[styles.statDot, { backgroundColor: '#1DB954' }]} />
                    <Text style={styles.statText}>{delivered} Delivered</Text>
                </View>
                <View style={styles.statItem}>
                    <View style={[styles.statDot, { backgroundColor: '#111111' }]} />
                    <Text style={styles.statText}>{pending} Pending</Text>
                </View>
                <View style={styles.statItem}>
                    <View style={[styles.statDot, { backgroundColor: '#2563EB' }]} />
                    <Text style={styles.statText}>{riders.length} Riders</Text>
                </View>
            </View>

            {/* Refresh button */}
            <TouchableOpacity style={styles.refreshBtn} onPress={loadData}>
                <Text style={styles.refreshText}>↻ Refresh</Text>
            </TouchableOpacity>

            {/* Customer info bottom sheet */}
            <CustomerInfoSheet
                customer={selectedCustomer}
                riderLocation={
                    selectedCustomer
                        ? (() => {
                              const rider = activeRiderForCustomer(selectedCustomer);
                              return rider
                                  ? { lat: rider.current_lat, lng: rider.current_lng }
                                  : null;
                          })()
                        : null
                }
                visible={sheetVisible}
                onClose={() => setSheetVisible(false)}
            />
        </View>
    );
};

export default DairyOwnerMapScreen;

const styles = StyleSheet.create({
    map: {
        flex: 1,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 16,
        fontSize: 15,
        fontWeight: '600',
        color: '#333333',
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
