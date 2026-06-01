import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Config from 'react-native-config';

if (!Config.SUPABASE_URL || !Config.SUPABASE_ANON_KEY) {
    throw new Error(
        'Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env — copy .env.example to .env and fill in your credentials.',
    );
}

export const supabase = createClient(
    Config.SUPABASE_URL,
    Config.SUPABASE_ANON_KEY,
    {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    },
);
