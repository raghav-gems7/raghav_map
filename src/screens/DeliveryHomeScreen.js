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

const DeliveryHomeScreen = ({ route }) => {
    const deliveryBoyId = route?.params?.deliveryBoyId || 'delivery-boy-1';
    const deliveryBoyName = route?.params?.deliveryBoyName || 'Rahul Sharma';

    const [isOnline, setIsOnline] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [deliveries, setDeliveries] = useState([]);
    const [markingId, setMarkingId] = useState(null);
    const [error, setError] = useState(null);

    const sessionIdRef = useRef(null);

    useEffect(() => {
        setIsOnline(isBackgroundTrackingRunning());
        loadDeliveries();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadDeliveries = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, sessionId: sid, error: fetchError } =
                await fetchSessionDeliveries(deliveryBoyId);
            if (fetchError) throw fetchError;
            setDeliveries(data || []);
            if (sid) sessionIdRef.current = sid;
        } catch (e) {
            setError('Could not load deliveries. Check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const requestLocationPermission = async () => {
        if (Platform.OS !== 'android') return true;
        const fine = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (fine !== PermissionsAndroid.RESULTS.GRANTED) return false;
        // ACCESS_BACKGROUND_LOCATION must be requested separately after fine location
        const bg = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        );
        return bg === PermissionsAndroid.RESULTS.GRANTED;
    };

    const goOnline = async () => {
        const granted = await requestLocationPermission();
        if (!granted) {
            Alert.alert(
                'Permission Required',
                'Please allow "Allow all the time" location access in Settings so your location can be shared with customers while delivering.',
                [{ text: 'OK' }],
            );
            return;
        }

        // Reuse existing active session; create one only if none exists
        if (!sessionIdRef.current) {
            const { data: session, error: sessionError } =
                await startDeliverySession(deliveryBoyId);
            if (sessionError || !session) {
                Alert.alert('Error', 'Could not start delivery session. Try again.');
                return;
            }
            sessionIdRef.current = session.id;
        }

        await startBackgroundTracking(deliveryBoyId);
        setIsOnline(true);
        await loadDeliveries();
    };

    const goOffline = async () => {
        await stopBackgroundTracking(deliveryBoyId);
        if (sessionIdRef.current) {
            await endDeliverySession(sessionIdRef.current);
            sessionIdRef.current = null;
        }
        setIsOnline(false);
    };

    const handleToggle = async value => {
        if (toggling) return;
        setToggling(true);
        try {
            if (value) {
                await goOnline();
            } else {
                Alert.alert(
                    'Go Offline',
                    'Stop sharing your location? Customers will no longer see you.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Go Offline',
                            style: 'destructive',
                            onPress: async () => {
                                setToggling(true);
                                await goOffline();
                                setToggling(false);
                            },
                        },
                    ],
                );
                // return early — toggling is reset in onPress callbacks above
                setToggling(false);
                return;
            }
        } catch (e) {
            console.log('TOGGLE ERROR =>', e);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        }
        setToggling(false);
    };

    const handleMarkDelivered = async item => {
        setMarkingId(item.id);
        try {
            const { error: markError } = await markDelivered(item.id);
            if (markError) throw markError;
            await loadDeliveries();
        } catch (e) {
            Alert.alert('Error', 'Could not mark as delivered. Try again.');
        } finally {
            setMarkingId(null);
        }
    };

    const delivered = deliveries.filter(d => d.status === 'delivered').length;
    const total = deliveries.length;

    const renderItem = ({ item }) => {
        const customer = item.dairy_customers;
        const isDone = item.status === 'delivered';
        const isMarking = markingId === item.id;

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
                            style={[styles.deliverBtn, isMarking && styles.deliverBtnDisabled]}
                            onPress={() => handleMarkDelivered(item)}
                            disabled={isMarking}
                        >
                            {isMarking ? (
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
                    <Text style={styles.name}>{deliveryBoyName}</Text>
                    <Text style={styles.role}>Delivery Boy</Text>
                </View>
                <View style={styles.toggleRow}>
                    {toggling && (
                        <ActivityIndicator size="small" color="#111" style={styles.toggleSpinner} />
                    )}
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
                <Text style={styles.progressText}>Today's Deliveries</Text>
                <Text style={styles.progressCount}>{delivered} / {total}</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#111" style={{ marginTop: 40 }} />
            ) : error ? (
                <View style={styles.emptyState}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={loadDeliveries}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
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
    toggleSpinner: {
        marginRight: 8,
    },
    onlineLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#999999',
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
        opacity: 0.55,
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
    deliverBtnDisabled: {
        backgroundColor: '#888888',
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
    errorText: {
        textAlign: 'center',
        color: '#E53935',
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 16,
    },
    retryBtn: {
        backgroundColor: '#111111',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
});
