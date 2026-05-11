import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
    'https://hidbpiziktshvqntjrft.supabase.co';

const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpZGJwaXppa3RzaHZxbnRqcmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzkxMDIsImV4cCI6MjA5MzgxNTEwMn0.e0mnU1a5DHys83As8QgEwU-YDoqzKO3GmMpFvOy9h_0';

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    },
);