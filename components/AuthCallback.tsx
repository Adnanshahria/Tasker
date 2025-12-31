import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

const AuthCallback: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // HashRouter often sees Supabase's '#access_token=...' as a route it doesn't know.
        // We check the raw hash to see if it contains auth tokens.
        const hash = window.location.hash;

        if (hash.includes('access_token') || hash.includes('type=recovery') || hash.includes('error=')) {
            // This is likely an Auth redirect.
            // We let Supabase's onAuthStateChange listener (in AuthContext) handle the session update.
            // However, we explicitly handle the navigation to ensure we don't just "fall through" to home.

            if (hash.includes('type=recovery')) {
                // Force redirect to update password page
                // We use a small timeout to allow the session to be established by the AuthContext listener
                setTimeout(() => navigate('/update-password'), 500);
            } else if (hash.includes('error=')) {
                // If there's an error, redirect to auth to show it (Auth.tsx logic will pick it up from URL)
                // We need to construct the error URL properly for HashRouter if it's not already
                navigate('/auth');
            } else {
                // Standard login (magic link or OAuth)
                // Redirect to home/dashboard
                setTimeout(() => navigate('/'), 500);
            }
        } else {
            // Genuine 404 or unknown route -> Redirect to Home (standard fallback behavior)
            navigate('/');
        }
    }, [navigate]);

    // Show a loader while we determine where to go
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                <p className="text-slate-400 text-sm">Verifying session...</p>
            </div>
        </div>
    );
};

export default AuthCallback;
