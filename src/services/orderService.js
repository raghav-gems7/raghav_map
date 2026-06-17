import { supabase } from './supabase';

export const getDeliveryOrders = async () => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .in('status', ['accepted', 'picked_up', 'out_for_delivery'])
            .order('created_at', { ascending: false });

        return { data, error };
    } catch (error) {
        return { data: [], error };
    }
};

export const getCustomerOrders = async customerId => {
    try {
        let query = supabase
            .from('orders')
            .select('*')
            .eq('status', 'out_for_delivery')
            .order('created_at', { ascending: false });

        if (customerId) {
            query = query.eq('dairy_customer_id', customerId);
        }

        const { data, error } = await query;
        return { data, error };
    } catch (error) {
        return { data: [], error };
    }
};

// Returns the single active order for a customer, including isV2 flag
export const getCustomerActiveOrder = async customerId => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('dairy_customer_id', customerId)
            .eq('status', 'out_for_delivery')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
};
