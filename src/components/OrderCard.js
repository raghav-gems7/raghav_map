import React from 'react';

import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';

const OrderCard = ({
    order,
    buttonText,
    onPress,
}) => {
    return (
        <View style={styles.card}>
            <View style={styles.topRow}>
                <Text style={styles.orderId}>
                    #{order.order_number}
                </Text>

                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                        {order.status}
                    </Text>
                </View>
            </View>

            <Text style={styles.customerName}>
                {order.customer_name}
            </Text>

            <Text style={styles.address}>
                {order.customer_address}
            </Text>

            <Text style={styles.amount}>
                ₹ {order.total_amount}
            </Text>

            <TouchableOpacity
                style={styles.button}
                onPress={onPress}>
                <Text style={styles.buttonText}>
                    {buttonText}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default OrderCard;

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },

    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    orderId: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111111',
    },

    statusBadge: {
        backgroundColor: '#111111',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 50,
    },

    statusText: {
        color: '#FFFFFF',
        fontSize: 12,
        textTransform: 'capitalize',
    },

    customerName: {
        marginTop: 16,
        fontSize: 17,
        fontWeight: '600',
        color: '#111111',
    },

    address: {
        marginTop: 8,
        color: '#666666',
        lineHeight: 20,
    },

    amount: {
        marginTop: 14,
        fontSize: 16,
        fontWeight: '700',
        color: '#111111',
    },

    button: {
        marginTop: 18,
        backgroundColor: '#111111',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },

    buttonText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
});