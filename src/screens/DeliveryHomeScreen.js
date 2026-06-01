import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Switch,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    PermissionsAndroid,
    Alert,
} from 'react-native';
import {
    fetchSessionDeliveries,
    markDelivered,
    startDeliverySession,
    endDeliverySession,
} from '../services/trackingService';
import {
    startBackgroundTracking,
    stopBackgroundTracking,
    isBackgroundTrackingRunning,
} from '../services/backgroundLocationTask';

// Hardcoded for demo — replace with auth session in production
const DEMO_DELIVERY_BOY_ID = 'delivery-boy-1';
const DEMO_DELIVERY_BOY_NAME = 'Rahul Sharma';

const DeliveryHomeScreen = () => {
    const [isOnline, setIsOnline] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [deliveries, setDeliveries] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [markingId, setMarkingId] = useState(null);

    const sessionIdRef = useRef(null);

    useEffect(() => {
        checkRunningState();
        loadDeliveries();
    }, []);

    const checkRunningState = async () => {
        const running = isBackgroundTrackingRunning();
        setIsOnline(running);
    };

    const loadDeliveries = async () => {
        setLoading(true);
        const { data, sessionId: sid } =
            await fetchSessionDeliveries(DEMO_DELIVERY_BOY_ID);
        setDeliveries(data);
        if (sid) {
            setSessionId(sid);
            sessionIdRef.current = sid;
        }
        setLoading(false);
    };

    const requestLocationPermission = async () => {
        if (Platform.OS === 'android') {
            const fine = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            );
            const bg = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
            );
            return (
                fine === PermissionsAndroid.RESULTS.GRANTED &&
                bg === PermissionsAndroid.RESULTS.GRANTED
            );
        }
        return true;
    };

    const handleToggle = async value => {
        if (toggling) return;
        setToggling(true);

        try {
            if (value) {
                const granted = await requestLocationPermission();
                if (!granted) {
                    Alert.alert(
                        'Permission Required',
                        'Background location permission is needed to share your live location.',
                    );
                    setToggling(false);
                    return;
                }

                const { data: session } = await startDeliverySession(
                    DEMO_DELIVERY_BOY_ID,
                );
                if (session) {
                    setSessionId(session.id);
                    sessionIdRef.current = session.id;
                }

                await startBackgroundTracking(DEMO_DELIVERY_BOY_ID);
                setIsOnline(true);
                await loadDeliveries();
            } else {
                Alert.alert(
                    'Go Offline',
                    'Stop sharing your location? Customers will no longer see you.',
                    [
                        { text: 'Cancel', style: 'cancel', onPress: () => setToggling(false) },
                        {
                            text: 'Go Offline',
                            style: 'destructive',
                            onPress: async () => {
                                await stopBackgroundTracking(DEMO_DELIVERY_BOY_ID);
                                if (sessionIdRef.current) {
                                    await endDeliverySession(sessionIdRef.current);
                                    setSessionId(null);
                                    sessionIdRef.current = null;
                                }
                                setIsOnline(false);
                                setToggling(false);
                            },
                        },
                    ],
                );
                return;
            }
        } catch (error) {
            console.log('TOGGLE ERROR =>', error);
        }

        setToggling(false);
    };

    const handleMarkDelivered = async item => {
        setMarkingId(item.id);
        await markDelivered(item.id);
        await loadDeliveries();
        setMarkingId(null);
    };

    const delivered = deliveries.filter(d => d.status === 'delivered').length;
    const total = deliveries.length;

    const renderItem = ({ item }) => {
        const customer = item.dairy_customers;
        const isDone = item.status === 'delivered';

        return (
            <View style={[styles.card, isDone && styles.cardDone]}>
                <View style={styles.cardRow}>
                    <View style={styles.seqBadge}>
                        <Text style={styles.seqText}>{item.sequence_number}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                        <Text style={styles.cardName}>{customer?.name}</Text>
                        <Text style={styles.cardAddress} numberOfLines={2}>
                            {customer?.address}
                        </Text>
                    </View>
                    {isDone ? (
                        <View style={styles.doneBadge}>
                            <Text style={styles.doneText}>Done</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.deliverBtn}
                            onPress={() => handleMarkDelivered(item)}
                            disabled={markingId === item.id}
                        >
                            {markingId === item.id ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.deliverBtnText}>Delivered</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.name}>{DEMO_DELIVERY_BOY_NAME}</Text>
                    <Text style={styles.role}>Delivery Boy</Text>
                </View>
                <View style={styles.toggleRow}>
                    {toggling ? (
                        <ActivityIndicator size="small" color="#111" style={{ marginRight: 10 }} />
                    ) : null}
                    <Text style={[styles.onlineLabel, isOnline && styles.onlineLabelActive]}>
                        {isOnline ? 'Online' : 'Offline'}
                    </Text>
                    <Switch
                        value={isOnline}
                        onValueChange={handleToggle}
                        trackColor={{ false: '#CCCCCC', true: '#1DB954' }}
                        thumbColor="#FFFFFF"
                        disabled={toggling}
                    />
                </View>
            </View>

            {/* Status bar */}
            {isOnline && (
                <View style={styles.statusBar}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusBarText}>
                        Location sharing is active
                    </Text>
                </View>
            )}

            {/* Progress */}
            <View style={styles.progressRow}>
                <Text style={styles.progressText}>
                    Today's Deliveries
                </Text>
                <Text style={styles.progressCount}>
                    {delivered} / {total}
                </Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#111" style={{ marginTop: 40 }} />
            ) : total === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>
                        {isOnline
                            ? 'No deliveries assigned for today.'
                            : 'Go online to start your delivery session.'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={deliveries}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 40 }}
                />
            )}
        </View>
    );
};

export default DeliveryHomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    name: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111111',
    },
    role: {
        fontSize: 13,
        color: '#888888',
        marginTop: 2,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    onlineLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#999999',
        marginRight: 4,
    },
    onlineLabelActive: {
        color: '#1DB954',
    },
    statusBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        padding: 10,
        borderRadius: 10,
        marginBottom: 16,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#1DB954',
        marginRight: 8,
    },
    statusBarText: {
        color: '#1DB954',
        fontWeight: '600',
        fontSize: 13,
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    progressText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
    },
    progressCount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111111',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    cardDone: {
        opacity: 0.6,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    seqBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#111111',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    seqText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    cardInfo: {
        flex: 1,
    },
    cardName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111111',
    },
    cardAddress: {
        fontSize: 12,
        color: '#888888',
        marginTop: 3,
        lineHeight: 17,
    },
    deliverBtn: {
        backgroundColor: '#111111',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        minWidth: 80,
        alignItems: 'center',
    },
    deliverBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    doneBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    doneText: {
        color: '#1DB954',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        textAlign: 'center',
        color: '#888888',
        fontSize: 15,
        lineHeight: 22,
    },
});
