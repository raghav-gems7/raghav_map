import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const ROLES = [
    {
        name: 'Rahul Sharma',
        role: 'Delivery Boy',
        screen: 'DeliveryHomeScreen',
        params: { deliveryUserId: 'delivery-boy-1' },
        color: '#111111',
        emoji: '🛵',
    },
    {
        name: 'Amit Patel',
        role: 'Customer',
        screen: 'CustomerHomeScreen',
        params: { customerName: 'Amit Patel' },
        color: '#2563EB',
        emoji: '🏠',
    },
    {
        name: 'Operations Admin',
        role: 'Dairy Owner',
        screen: 'DairyOwnerMapScreen',
        params: {},
        color: '#7C3AED',
        emoji: '🗺️',
    },
];

const UserSelectionScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Dairy Delivery</Text>
            <Text style={styles.subtitle}>Select your role to continue</Text>

            {ROLES.map(item => (
                <TouchableOpacity
                    key={item.name}
                    style={[styles.card, { backgroundColor: item.color }]}
                    onPress={() =>
                        navigation.navigate(item.screen, item.params)
                    }
                >
                    <Text style={styles.emoji}>{item.emoji}</Text>
                    <View>
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        <Text style={styles.cardSubTitle}>{item.role}</Text>
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    );
};

export default UserSelectionScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 24,
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#111111',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#888888',
        marginBottom: 40,
    },
    card: {
        borderRadius: 18,
        padding: 20,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    emoji: {
        fontSize: 32,
    },
    cardTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    cardSubTitle: {
        color: 'rgba(255,255,255,0.75)',
        marginTop: 4,
        fontSize: 14,
    },
});
