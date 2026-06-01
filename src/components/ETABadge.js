import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { calculateETA } from '../services/etaService';

const ETABadge = ({
    riderLat,
    riderLng,
    destLat,
    destLng,
}) => {
    if (!riderLat || !riderLng || !destLat || !destLng) {
        return null;
    }

    const eta = calculateETA(riderLat, riderLng, destLat, destLng);

    return (
        <View style={styles.container}>
            <Text style={styles.etaText}>{eta.label}</Text>
            <Text style={styles.distanceText}>{eta.distanceKm} km away</Text>
        </View>
    );
};

export default ETABadge;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#111111',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    etaText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    distanceText: {
        color: '#AAAAAA',
        fontSize: 12,
        marginTop: 2,
    },
});
