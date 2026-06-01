import { supabase } from './supabase';

export const uploadTrackingData = async payload => {
    try {
        const { data, error } = await supabase
            .from('tracking')
            .upsert(payload, { onConflict: 'order_id' })
            .select();
        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
};

export const fetchTrackingData = async orderId => {
    try {
        const { data, error } = await supabase
            .from('tracking')
            .select('*')
            .eq('order_id', orderId)
            .maybeSingle(); // maybeSingle returns null (not error) when no row found
        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
};

export const fetchAllActiveRiders = async () => {
    try {
        const { data, error } = await supabase
            .from('delivery_boys')
            .select('id, name, current_lat, current_lng, last_seen_at, is_online')
            .eq('is_online', true);
        return { data: data || [], error };
    } catch (error) {
        return { data: [], error };
    }
};

export const fetchAllCustomersForOwner = async () => {
    try {
        const { data, error } = await supabase
            .from('dairy_customers')
            .select('id, name, address, lat, lng, delivery_boy_id');
        return { data: data || [], error };
    } catch (error) {
        return { data: [], error };
    }
};

// Single query that returns { customer_id -> delivery status } for ALL active sessions.
// Replaces the old N+1 pattern (one query per rider).
export const fetchAllSessionDeliveryStatuses = async () => {
    try {
        // Get all active session IDs in one shot
        const { data: sessions, error: sessionError } = await supabase
            .from('delivery_sessions')
            .select('id')
            .eq('status', 'active');

        if (sessionError || !sessions?.length) return { data: {}, error: sessionError };

        const sessionIds = sessions.map(s => s.id);

        const { data: deliveries, error: deliveryError } = await supabase
            .from('session_deliveries')
            .select('customer_id, status')
            .in('session_id', sessionIds);

        if (deliveryError) return { data: {}, error: deliveryError };

        // Build map: customer_id -> status
        const statusMap = {};
        (deliveries || []).forEach(d => {
            statusMap[d.customer_id] = d.status;
        });

        return { data: statusMap, error: null };
    } catch (error) {
        return { data: {}, error };
    }
};

export const fetchSessionDeliveries = async deliveryBoyId => {
    try {
        // maybeSingle: no throw when session doesn't exist yet
        const { data: session, error: sessionError } = await supabase
            .from('delivery_sessions')
            .select('id')
            .eq('delivery_boy_id', deliveryBoyId)
            .eq('status', 'active')
            .maybeSingle();

        if (sessionError) return { data: [], error: sessionError };
        if (!session) return { data: [], error: null, sessionId: null };

        const { data, error } = await supabase
            .from('session_deliveries')
            .select('*, dairy_customers(id, name, address, lat, lng)')
            .eq('session_id', session.id)
            .order('sequence_number', { ascending: true });

        return { data: data || [], error, sessionId: session.id };
    } catch (error) {
        return { data: [], error };
    }
};

export const markDelivered = async deliveryId => {
    try {
        const { data, error } = await supabase
            .from('session_deliveries')
            .update({
                status: 'delivered',
                delivered_at: new Date().toISOString(),
            })
            .eq('id', deliveryId)
            .select();
        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
};

export const startDeliverySession = async deliveryBoyId => {
    try {
        const { data, error } = await supabase
            .from('delivery_sessions')
            .insert({
                delivery_boy_id: deliveryBoyId,
                status: 'active',
                started_at: new Date().toISOString(),
            })
            .select()
            .single();
        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
};

export const endDeliverySession = async sessionId => {
    try {
        const { data, error } = await supabase
            .from('delivery_sessions')
            .update({
                status: 'completed',
                ended_at: new Date().toISOString(),
            })
            .eq('id', sessionId)
            .select();
        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
};
