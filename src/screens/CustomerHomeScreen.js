import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import OrderCard from '../components/OrderCard';
import { getCustomerOrders } from '../services/orderService';

const CustomerHomeScreen = ({ route, navigation }) => {
    const customerId = route?.params?.customerId || null;

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await getCustomerOrders(customerId);
            if (fetchError) throw fetchError;
            setOrders(data || []);
        } catch (e) {
            setError('Could not load orders. Check your connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#111111" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchOrders}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Active Orders</Text>

            {orders.length === 0 ? (
                <View style={styles.centered}>
                    <Text style={styles.emptyText}>No active orders right now.</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <OrderCard
                            order={item}
                            buttonText="Track Order"
                            onPress={() =>
                                navigation.navigate('CustomerTrackingScreen', { order: item })
                            }
                        />
                    )}
                />
            )}
        </View>
    );
};

export default CustomerHomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
        padding: 16,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        marginBottom: 20,
        color: '#111111',
    },
    listContent: {
        paddingBottom: 30,
    },
    emptyText: {
        color: '#888888',
        fontSize: 15,
        textAlign: 'center',
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
});
