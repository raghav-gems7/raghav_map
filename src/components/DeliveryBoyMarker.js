import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { STALE_LOCATION_THRESHOLD_MS } from '../utils/constants';

// The delivery boy's icon on the owner's map. Unlike the customer's screen,
// this icon jumps straight to the new spot instead of gliding smoothly —
// just a small visual difference, not a functional one.
const DeliveryBoyMarker = ({ rider, animatedCoordinate, onPress }) => {
    const isStale =
        rider.last_seen_at &&
        Date.now() - new Date(rider.last_seen_at).getTime() >
            STALE_LOCATION_THRESHOLD_MS;

    const coordinate = animatedCoordinate || {
        latitude: rider.current_lat,
        longitude: rider.current_lng,
    };

    return (
        <Marker
            coordinate={coordinate}
            anchor={{ x: 0.5, y: 0.5 }}
            onPress={() => onPress && onPress(rider)}
        >
            <View style={styles.wrapper}>
                <View style={[styles.iconContainer, isStale && styles.staleContainer]}>
                    <Image
                        source={require('../assets/bike.png')}
                        style={[styles.bikeIcon, isStale && styles.staleIcon]}
                    />
                </View>
                <View style={styles.labelContainer}>
                    <Text style={styles.label} numberOfLines={1}>
                        {rider.name}
                    </Text>
                    {isStale && (
                        <Text style={styles.staleText}>Offline</Text>
                    )}
                </View>
            </View>
        </Marker>
    );
};

export default DeliveryBoyMarker;

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
    },
    iconContainer: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#111111',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
    },
    staleContainer: {
        backgroundColor: '#999999',
    },
    bikeIcon: {
        width: 28,
        height: 28,
        resizeMode: 'contain',
    },
    staleIcon: {
        opacity: 0.5,
    },
    labelContainer: {
        marginTop: 4,
        backgroundColor: '#111111',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    label: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
        maxWidth: 80,
    },
    staleText: {
        color: '#FFCC00',
        fontSize: 9,
        textAlign: 'center',
    },
});
