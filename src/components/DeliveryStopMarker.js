import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';

const STATUS_BG = {
    pending: '#111111',
    delivered: '#1DB954',
    skipped: '#E53935',
};

const DeliveryStopMarker = ({ delivery, onPress }) => {
    const customer = delivery.dairy_customers;
    const status = delivery.status || 'pending';
    const bgColor = STATUS_BG[status] || STATUS_BG.pending;
    const isDelivered = status === 'delivered';

    return (
        <Marker
            coordinate={{
                latitude: customer.lat,
                longitude: customer.lng,
            }}
            anchor={{ x: 0.5, y: 1 }}
            onPress={() => onPress && onPress(delivery)}
        >
            <View style={[styles.wrapper, isDelivered && styles.wrapperFaded]}>
                {/* Number badge — sequence priority */}
                <View style={[styles.badge, { backgroundColor: bgColor }]}>
                    <Text style={styles.badgeText}>{delivery.sequence_number}</Text>
                </View>

                {/* Home icon below the badge */}
                <Image
                    source={require('../assets/home.png')}
                    style={[styles.homeIcon, isDelivered && styles.iconFaded]}
                />

                {/* Pointer triangle */}
                <View style={[styles.triangle, { borderTopColor: bgColor }]} />
            </View>
        </Marker>
    );
};

export default DeliveryStopMarker;

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
    },
    wrapperFaded: {
        opacity: 0.45,
    },
    badge: {
        minWidth: 24,
        height: 24,
        borderRadius: 12,
        paddingHorizontal: 6,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        marginBottom: 2,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    homeIcon: {
        width: 32,
        height: 32,
        resizeMode: 'contain',
    },
    iconFaded: {
        opacity: 0.5,
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
