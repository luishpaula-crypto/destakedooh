
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing! Check .env file or restart server.');
}

// Prevent crash if env vars are not loaded yet
const mockChainable = () => {
    const result = Promise.resolve({ data: [], error: { message: 'Supabase credentials missing! Check .env file.' } });
    result.select = () => result;
    result.eq = () => result;
    result.single = () => result;
    result.order = () => result;
    return result;
};

export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        from: () => ({
            select: mockChainable,
            upsert: mockChainable,
            insert: mockChainable,
            update: mockChainable,
            delete: mockChainable,
        })
    };
