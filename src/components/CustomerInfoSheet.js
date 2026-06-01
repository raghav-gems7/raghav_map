import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Pressable,
} from 'react-native';
import ETABadge from './ETABadge';

const STATUS_LABEL = {
    delivered: 'Delivered',
    pending: 'Pending',
    skipped: 'Skipped',
};

const STATUS_COLOR = {
    delivered: '#1DB954',
    pending: '#FF8C00',
    skipped: '#E53935',
};

const CustomerInfoSheet = ({
    customer,
    riderLocation,
    visible,
    onClose,
}) => {
    if (!customer) return null;

    const status = customer.deliveryStatus || 'pending';
    const statusColor = STATUS_COLOR[status] || STATUS_COLOR.pending;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose} />
            <View style={styles.sheet}>
                <View style={styles.handle} />

                <View style={styles.row}>
                    <View>
                        <Text style={styles.customerName}>{customer.name}</Text>
                        <Text style={styles.customerId}>ID: {customer.id?.slice(0, 8)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.statusText}>
                            {STATUS_LABEL[status] || status}
                        </Text>
                    </View>
                </View>

                <Text style={styles.address}>{customer.address}</Text>

                {riderLocation && status === 'pending' && (
                    <ETABadge
                        riderLat={riderLocation.lat}
                        riderLng={riderLocation.lng}
                        destLat={customer.lat}
                        destLng={customer.lng}
                    />
                )}

                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                    <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

export default CustomerInfoSheet;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    sheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#DDDDDD',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    customerName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111111',
    },
    customerId: {
        marginTop: 4,
        fontSize: 12,
        color: '#999999',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 50,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    address: {
        marginTop: 14,
        color: '#555555',
        lineHeight: 22,
        fontSize: 14,
    },
    closeBtn: {
        marginTop: 24,
        backgroundColor: '#111111',
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    closeBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
    },
});
