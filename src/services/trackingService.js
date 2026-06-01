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
            .single();

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

export const fetchSessionDeliveries = async deliveryBoyId => {
    try {
        const { data: session } = await supabase
            .from('delivery_sessions')
            .select('id')
            .eq('delivery_boy_id', deliveryBoyId)
            .eq('status', 'active')
            .single();

        if (!session) return { data: [], error: null };

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
