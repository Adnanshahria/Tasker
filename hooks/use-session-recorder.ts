import { useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTimerStore } from '../store/timerStore';
import { TimerMode } from '../types';
import {
    saveFocusSession,
    getTodayFocusStats,
    getFocusRecordsForRange,
    getAllTimeFocusStats,
    syncAllFocusRecords,
} from '../services/focusDataService';

export const useSessionRecorder = () => {
    const { currentUser } = useAuth();
    const sessionStartRef = useRef<number | null>(null);
    const modeRef = useRef<TimerMode>('pomodoro');

    const isActive = useTimerStore((state) => state.isActive);
    const mode = useTimerStore((state) => state.mode);
    const sessionStartTime = useTimerStore((state) => state.sessionStartTime);

    // Sync with Firestore on mount if online
    useEffect(() => {
        if (currentUser?.uid) {
            syncAllFocusRecords(currentUser.uid);
        }
    }, [currentUser?.uid]);

    // Track session start
    useEffect(() => {
        if (isActive && sessionStartTime) {
            sessionStartRef.current = sessionStartTime;
            modeRef.current = mode;
        }
    }, [isActive, sessionStartTime, mode]);

    // Record a completed session
    const recordSession = useCallback((completed: boolean = true) => {
        if (!sessionStartRef.current || !currentUser?.uid) return;

        const endTime = Date.now();
        const startTime = sessionStartRef.current;
        const durationMs = endTime - startTime;
        const durationMinutes = durationMs / 1000 / 60;

        // Save session using the data service (handles localStorage + Firestore)
        saveFocusSession(currentUser.uid, {
            startTime,
            endTime,
            duration: Math.round(durationMinutes * 10) / 10, // Round to 1 decimal
            type: modeRef.current,
            completed,
        });

        sessionStartRef.current = null;
    }, [currentUser?.uid]);

    // Get today's stats (from localStorage, synced with Firestore)
    const getTodayStats = useCallback(() => {
        if (!currentUser?.uid) {
            return { totalFocusMinutes: 0, totalPomos: 0, sessions: [] };
        }
        return getTodayFocusStats(currentUser.uid);
    }, [currentUser?.uid]);

    // Get records for date range
    const getRecordsForRange = useCallback((startDate: string, endDate: string) => {
        if (!currentUser?.uid) return [];
        return getFocusRecordsForRange(currentUser.uid, startDate, endDate);
    }, [currentUser?.uid]);

    // Get all-time stats
    const getAllTimeStats = useCallback(() => {
        if (!currentUser?.uid) {
            return { totalFocusMinutes: 0, totalPomos: 0, totalDays: 0 };
        }
        return getAllTimeFocusStats(currentUser.uid);
    }, [currentUser?.uid]);

    return {
        recordSession,
        getTodayStats,
        getRecordsForRange,
        getAllTimeStats,
    };
};
