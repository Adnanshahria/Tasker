import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://pfhribgqfxkxhxlicwby.supabase.co";
const supabaseKey = "sb_publishable_czyhL46UQGtDzUjXTsjxoQ_KaUdmP_-";

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Set the redirect URL for email confirmations and password resets
        flowType: 'pkce',
    }
});

export const checkConnection = async () => {
    try {
        // Simple query to test connection. 
        // We query the 'settings' table as it's likely to depend on user ID, 
        // but for a generic connection check we can just check if we get a response or an error that isn't network related.
        // Or simply query the auth session.
        const { data, error } = await supabase.from('settings').select('count', { count: 'exact', head: true });

        if (error && error.code !== 'PGRST116') { // PGRST116 is no rows, which is fine
            console.log('Supabase checkConnection error:', error);
            return false;
        }

        return true;
    } catch (e) {
        console.error('Supabase connection failed:', e);
        return false;
    }
};
