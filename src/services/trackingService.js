import { supabase } from './supabase';

export const uploadTrackingData =
    async payload => {
        try {
            console.log(
                'UPLOADING PAYLOAD => ',
                payload,
            );

            const { data, error } =
                await supabase
                    .from('tracking')
                    .upsert(payload, {
                        onConflict: 'order_id',
                    })
                    .select();

            console.log(
                'UPLOAD RESPONSE => ',
                data,
            );

            console.log(
                'UPLOAD ERROR => ',
                error,
            );

            return {
                data,
                error,
            };
        } catch (error) {
            console.log(
                'UPLOAD SERVICE ERROR => ',
                error,
            );

            return {
                data: null,
                error,
            };
        }
    };

export const fetchTrackingData =
    async orderId => {
        try {
            console.log(
                'FETCHING TRACKING FOR => ',
                orderId,
            );

            const { data, error } =
                await supabase
                    .from('tracking')
                    .select('*')
                    .eq('order_id', orderId)
                    .single();

            console.log(
                'FETCH RESPONSE => ',
                data,
            );

            console.log(
                'FETCH ERROR => ',
                error,
            );

            return {
                data,
                error,
            };
        } catch (error) {
            console.log(
                'FETCH SERVICE ERROR => ',
                error,
            );

            return {
                data: null,
                error,
            };
        }
    };