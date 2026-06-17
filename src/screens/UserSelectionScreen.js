import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchAllDeliveryBoys, fetchAllCustomers } from '../services/trackingService';

const ROLES = [
    {
        key: 'delivery',
        label: 'Delivery Boy',
        description: 'Mark deliveries and share live location',
        color: '#111111',
        emoji: '🛵',
    },
    {
        key: 'customer',
        label: 'Customer',
        description: 'Track your order in real time',
        color: '#2563EB',
        emoji: '🏠',
    },
    {
        key: 'owner_monitor',
        label: 'Dairy Owner — Monitor',
        description: 'Watch all riders and customers on the map',
        color: '#7C3AED',
        emoji: '🗺️',
    },
    {
        key: 'owner_delivery',
        label: 'Dairy Owner — Self Delivery',
        description: 'Make deliveries yourself',
        color: '#059669',
        emoji: '🧑‍🌾',
    },
];

const UserSelectionScreen = ({ navigation }) => {
    const [selectedRole, setSelectedRole] = useState(null);
    const [people, setPeople] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleRoleSelect = async role => {
        // Owner Monitor needs no person picker — navigate directly
        if (role.key === 'owner_monitor') {
            navigation.navigate('DairyOwnerMapScreen', {});
            return;
        }

        setSelectedRole(role);
        setError(null);
        setLoading(true);
        setPeople([]);

        try {
            let result;
            if (role.key === 'customer') {
                result = await fetchAllCustomers();
            } else {
                // delivery + owner_delivery both pick from delivery_boys
                result = await fetchAllDeliveryBoys();
            }

            if (result.error) throw result.error;
            if (!result.data.length) {
                setError('No records found. Make sure the database has data.');
            }
            setPeople(result.data);
        } catch (e) {
            setError('Could not load data. Check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handlePersonSelect = person => {
        if (selectedRole.key === 'customer') {
            navigation.navigate('CustomerHomeScreen', {
                customerId: person.id,
                customerName: person.name,
            });
        } else {
            // delivery or owner_delivery
            navigation.navigate('DeliveryHomeScreen', {
                deliveryBoyId: person.id,
                deliveryBoyName: person.name,
            });
        }
    };

    const handleBack = () => {
        setSelectedRole(null);
        setPeople([]);
        setError(null);
    };

    // ── Person picker screen ──────────────────────────────────
    if (selectedRole) {
        return (
            <SafeAreaView style={styles.container}>
                <TouchableOpacity style={styles.backRow} onPress={handleBack}>
                    <Text style={styles.backArrow}>←</Text>
                    <Text style={styles.backLabel}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.title}>
                    {selectedRole.emoji}  {selectedRole.label}
                </Text>
                <Text style={styles.subtitle}>
                    {selectedRole.key === 'customer'
                        ? 'Select your account'
                        : 'Select your delivery account'}
                </Text>

                {loading && (
                    <ActivityIndicator
                        size="large"
                        color={selectedRole.color}
                        style={styles.spinner}
                    />
                )}

                {error && !loading && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={() => handleRoleSelect(selectedRole)}>
                            <Text style={styles.retryText}>Tap to retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {!loading && !error && (
                    <FlatList
                        data={people}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.personCard,
                                    { borderLeftColor: selectedRole.color },
                                ]}
                                onPress={() => handlePersonSelect(item)}
                            >
                                <View style={[styles.avatar, { backgroundColor: selectedRole.color }]}>
                                    <Text style={styles.avatarText}>
                                        {item.name.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.personInfo}>
                                    <Text style={styles.personName}>{item.name}</Text>
                                    {item.phone && (
                                        <Text style={styles.personSub}>{item.phone}</Text>
                                    )}
                                    {item.address && (
                                        <Text style={styles.personSub} numberOfLines={1}>
                                            {item.address}
                                        </Text>
                                    )}
                                </View>
                                <Text style={styles.chevron}>›</Text>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </SafeAreaView>
        );
    }

    // ── Role picker screen ────────────────────────────────────
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Dairy Delivery</Text>
            <Text style={styles.subtitle}>Select your role to continue</Text>

            {ROLES.map(role => (
                <TouchableOpacity
                    key={role.key}
                    style={[styles.roleCard, { backgroundColor: role.color }]}
                    onPress={() => handleRoleSelect(role)}
                >
                    <Text style={styles.roleEmoji}>{role.emoji}</Text>
                    <View style={styles.roleText}>
                        <Text style={styles.roleLabel}>{role.label}</Text>
                        <Text style={styles.roleDescription}>{role.description}</Text>
                    </View>
                    <Text style={styles.roleChevron}>›</Text>
                </TouchableOpacity>
            ))}
        </SafeAreaView>
    );
};

export default UserSelectionScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 24,
    },
    // Role picker
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#111111',
        marginBottom: 8,
        marginTop: 16,
    },
    subtitle: {
        fontSize: 15,
        color: '#888888',
        marginBottom: 32,
    },
    roleCard: {
        borderRadius: 18,
        padding: 20,
        marginBottom: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    roleEmoji: {
        fontSize: 30,
    },
    roleText: {
        flex: 1,
    },
    roleLabel: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
    roleDescription: {
        color: 'rgba(255,255,255,0.75)',
        marginTop: 3,
        fontSize: 13,
    },
    listContent: {
        paddingBottom: 40,
    },
    roleChevron: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 26,
        fontWeight: '300',
    },
    // Person picker
    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 20,
        gap: 6,
    },
    backArrow: {
        fontSize: 20,
        color: '#111111',
    },
    backLabel: {
        fontSize: 15,
        color: '#111111',
        fontWeight: '600',
    },
    spinner: {
        marginTop: 40,
    },
    errorBox: {
        backgroundColor: '#FFEBEE',
        borderRadius: 12,
        padding: 16,
        marginTop: 20,
        alignItems: 'center',
    },
    errorText: {
        color: '#E53935',
        fontSize: 14,
        textAlign: 'center',
    },
    retryText: {
        color: '#E53935',
        fontSize: 13,
        marginTop: 8,
        textDecorationLine: 'underline',
    },
    personCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EEEEEE',
        borderLeftWidth: 4,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        flexShrink: 0,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    personInfo: {
        flex: 1,
    },
    personName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111111',
    },
    personSub: {
        fontSize: 12,
        color: '#888888',
        marginTop: 3,
    },
    chevron: {
        color: '#CCCCCC',
        fontSize: 24,
        marginLeft: 8,
    },
});
