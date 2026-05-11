import { supabase } from './supabase';

export const uploadTrackingData =
    async payload => {
        try {
            const { data, error } =
                await supabase
                    .from('tracking')
                    .upsert(payload, {
                        onConflict: 'order_id',
                    })
                    .select();

            return {
                data,
                error,
            };
        } catch (error) {
            return {
                data: null,
                error,
            };
        }
    };

export const fetchTrackingData =
    async orderId => {
        try {
            const { data, error } =
                await supabase
                    .from('tracking')
                    .select('*')
                    .eq('order_id', orderId)
                    .single();

            return {
                data,
                error,
            };
        } catch (error) {
            return {
                data: null,
                error,
            };
        }
    };