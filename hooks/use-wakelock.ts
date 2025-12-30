import { useState, useEffect, useCallback, useRef } from 'react';

export const useWakelock = () => {
    const [isSupported, setIsSupported] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    // Check if Wake Lock API is supported
    useEffect(() => {
        setIsSupported('wakeLock' in navigator);
    }, []);

    // Request wake lock
    const requestWakeLock = useCallback(async () => {
        if (!isSupported) return false;

        try {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
            setIsActive(true);

            // Re-acquire on visibility change (when tab becomes visible again)
            wakeLockRef.current.addEventListener('release', () => {
                setIsActive(false);
            });

            return true;
        } catch (error) {
            console.warn('Wake Lock request failed:', error);
            setIsActive(false);
            return false;
        }
    }, [isSupported]);

    // Release wake lock
    const releaseWakeLock = useCallback(async () => {
        if (wakeLockRef.current) {
            try {
                await wakeLockRef.current.release();
                wakeLockRef.current = null;
                setIsActive(false);
            } catch (error) {
                console.warn('Wake Lock release failed:', error);
            }
        }
    }, []);

    // Re-acquire wake lock when page becomes visible
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && isActive && !wakeLockRef.current) {
                await requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isActive, requestWakeLock]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (wakeLockRef.current) {
                wakeLockRef.current.release().catch(() => { });
            }
        };
    }, []);

    return {
        isSupported,
        isActive,
        requestWakeLock,
        releaseWakeLock,
    };
};
