import React, {
    useEffect,
    useState,
} from 'react';

import {
    View,
    Text,
    StyleSheet,
    FlatList,
} from 'react-native';

import OrderCard from '../components/OrderCard';

import { getDeliveryOrders } from '../services/orderService';

const AdminHomeScreen = ({ navigation }) => {
    const [orders, setOrders] =
        useState([]);

    const fetchOrders = async () => {
        const { data } =
            await getDeliveryOrders();

        setOrders(data || []);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                Live Deliveries
            </Text>

            <FlatList
                data={orders}
                keyExtractor={item => item.id}
                contentContainerStyle={{
                    paddingBottom: 30,
                }}
                renderItem={({ item }) => (
                    <OrderCard
                        order={item}
                        buttonText="Track Rider"
                        onPress={() =>
                            navigation.navigate(
                                'AdminTrackingScreen',
                                {
                                    order: item,
                                },
                            )
                        }
                    />
                )}
            />
        </View>
    );
};

export default AdminHomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
        padding: 16,
    },

    title: {
        fontSize: 26,
        fontWeight: '700',
        marginBottom: 20,
        color: '#111111',
    },
});