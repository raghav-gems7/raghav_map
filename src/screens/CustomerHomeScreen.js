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

import { getCustomerOrders } from '../services/orderService';

const CustomerHomeScreen = ({ navigation }) => {
    const [orders, setOrders] =
        useState([]);

    const fetchOrders = async () => {
        const { data } =
            await getCustomerOrders();

        setOrders(data || []);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                Active Orders
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
                        buttonText="Track Order"
                        onPress={() =>
                            navigation.navigate(
                                'CustomerTrackingScreen',
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

export default CustomerHomeScreen;

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