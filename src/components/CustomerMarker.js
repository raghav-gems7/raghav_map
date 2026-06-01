import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';

const STATUS_COLORS = {
    delivered: '#1DB954',
    pending: '#111111',
    skipped: '#E53935',
};

const CustomerMarker = ({ customer, onPress }) => {
    const color = STATUS_COLORS[customer.deliveryStatus] || STATUS_COLORS.pending;

    return (
        <Marker
            coordinate={{
                latitude: customer.lat,
                longitude: customer.lng,
            }}
            onPress={() => onPress(customer)}
            anchor={{ x: 0.5, y: 1 }}
        >
            <View style={styles.wrapper}>
                <View style={[styles.pin, { backgroundColor: color }]}>
                    <Text style={styles.initial}>
                        {customer.name.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View style={[styles.triangle, { borderTopColor: color }]} />
            </View>
        </Marker>
    );
};

export default CustomerMarker;

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
    },
    pin: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    initial: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    triangle: {
        width: 0,
        height: 0,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
    },
});
