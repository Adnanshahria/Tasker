// Focus Timer Data Service - Offline-First with Supabase Sync
// Follows the same pattern as dataService.ts for assignments/habits

import { supabase } from './supabaseClient';
import { FocusSession, FocusRecord } from '../types';
import { isOnline } from './syncService';
import { triggerFocusDataRefresh } from '../utils/focusRefresh';

const STORAGE_KEY = 'ogrogoti-focus-records';
const MIN_SESSION_DURATION = 0.5; // Minimum 0.5 minutes (30 seconds) to record

// ==================== LOCAL STORAGE ====================

const getLocalFocusRecords = (userId: string): Record<string, FocusRecord> => {
    try {
        const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
};

const saveLocalFocusRecords = (userId: string, records: Record<string, FocusRecord>) => {
    try {
        localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(records));
    } catch (error) {
        console.warn('[Focus] Failed to save focus records:', error);
    }
};

// Get date key in local timezone (YYYY-MM-DD)
const getDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getTodayKey = () => getDateKey(new Date());

// ==================== PUBLIC API ====================

/**
 * Save a focus session (called when timer completes or stops)
 */
export const saveFocusSession = async (
    userId: string,
    session: Omit<FocusSession, 'id' | 'userId'>
): Promise<void> => {
    if (!userId) return;

    // Skip very short sessions
    if (session.duration < MIN_SESSION_DURATION) {
        console.log('[Focus] Skipping short session:', session.duration, 'min');
        return;
    }

    const todayKey = getTodayKey();
    const records = getLocalFocusRecords(userId);

    // Create session with ID
    const fullSession: FocusSession = {
        ...session,
        id: `${session.startTime}-${session.endTime}`,
        userId,
    };

    // Initialize today's record if not exists
    if (!records[todayKey]) {
        records[todayKey] = {
            id: `${userId}_${todayKey}`,
            date: todayKey,
            userId,
            totalFocusMinutes: 0,
            totalPomos: 0,
            sessions: [],
        };
    }

    // Add session
    records[todayKey].sessions.push(fullSession);

    // Update aggregates (only count pomodoro sessions)
    if (session.type === 'pomodoro') {
        records[todayKey].totalFocusMinutes += session.duration;
        if (session.completed) {
            records[todayKey].totalPomos += 1;
        }
    }

    // 1. Save locally immediately
    saveLocalFocusRecords(userId, records);
    console.log('[Focus] Session saved locally:', fullSession.id);

    // 2. Trigger UI refresh
    triggerFocusDataRefresh();

    // 2. Sync to Firestore in background if online
    if (isOnline()) {
        syncFocusRecordToFirestore(userId, todayKey, records[todayKey]);
    }
};

/**
 * Get today's focus stats
 */
export const getTodayFocusStats = (userId: string): {
    totalFocusMinutes: number;
    totalPomos: number;
    sessions: FocusSession[];
} => {
    if (!userId) return { totalFocusMinutes: 0, totalPomos: 0, sessions: [] };

    const todayKey = getTodayKey();
    const records = getLocalFocusRecords(userId);
    const todayRecord = records[todayKey];

    return {
        totalFocusMinutes: todayRecord?.totalFocusMinutes || 0,
        totalPomos: todayRecord?.totalPomos || 0,
        sessions: todayRecord?.sessions || [],
    };
};

/**
 * Log a manual focus session (from AddFocusRecordDialog)
 * Supports logging sessions on past dates
 */
export const logManualSession = async (
    userId: string,
    date: Date,
    durationMinutes: number
): Promise<void> => {
    if (!userId) return;
    if (durationMinutes < 1) return;

    const dateKey = getDateKey(date); // Use local date, not UTC
    const records = getLocalFocusRecords(userId);
    const startTime = date.getTime();
    const endTime = startTime + durationMinutes * 60 * 1000;

    // Create session with 'manual' type
    const session: FocusSession = {
        id: `manual-${startTime}-${endTime}`,
        userId,
        startTime,
        endTime,
        duration: durationMinutes,
        type: 'manual',
        completed: true,
    };

    // Initialize record if not exists
    if (!records[dateKey]) {
        records[dateKey] = {
            id: `${userId}_${dateKey}`,
            date: dateKey,
            userId,
            totalFocusMinutes: 0,
            totalPomos: 0,
            sessions: [],
        };
    }

    // Add session and update totals
    records[dateKey].sessions.push(session);
    records[dateKey].totalFocusMinutes += durationMinutes;
    // Manual sessions count as pomos if >= 25 minutes
    if (durationMinutes >= 25) {
        records[dateKey].totalPomos += 1;
    }

    // Save locally
    saveLocalFocusRecords(userId, records);
    console.log('[Focus] Manual session logged:', session.id);

    // Trigger UI refresh
    triggerFocusDataRefresh();

    // Sync to Firestore if online
    if (isOnline()) {
        syncFocusRecordToFirestore(userId, dateKey, records[dateKey]);
    }
};

/**
 * Get focus records for a date range
 */
export const getFocusRecordsForRange = (
    userId: string,
    startDate: string,
    endDate: string
): FocusRecord[] => {
    if (!userId) return [];

    const records = getLocalFocusRecords(userId);
    const result: FocusRecord[] = [];

    Object.entries(records).forEach(([date, record]) => {
        if (date >= startDate && date <= endDate) {
            result.push(record);
        }
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Get all-time focus stats
 */
export const getAllTimeFocusStats = (userId: string): {
    totalFocusMinutes: number;
    totalPomos: number;
    totalDays: number;
} => {
    if (!userId) return { totalFocusMinutes: 0, totalPomos: 0, totalDays: 0 };

    const records = getLocalFocusRecords(userId);
    let totalFocusMinutes = 0;
    let totalPomos = 0;

    Object.values(records).forEach(record => {
        totalFocusMinutes += record.totalFocusMinutes;
        totalPomos += record.totalPomos;
    });

    return {
        totalFocusMinutes,
        totalPomos,
        totalDays: Object.keys(records).length,
    };
};

// ==================== FIRESTORE SYNC ====================

/**
 * Sync a single day's record to Firestore (non-blocking)
 */
const syncFocusRecordToFirestore = async (
    userId: string,
    date: string,
    record: FocusRecord
) => {
    try {
        const { error } = await supabase.from('focus_records').upsert({
            id: `${userId}_${date}`, // ID construction
            user_id: userId,
            date: date,
            total_focus_minutes: record.totalFocusMinutes,
            total_pomos: record.totalPomos,
            sessions: record.sessions,
            updated_at: new Date().toISOString()
        });

        if (error) throw error;
        console.log('[Focus] Record synced to Supabase:', date);
    } catch (error) {
        console.warn('[Focus] Failed to sync to Supabase:', error);
        // Will retry on next session save or when coming online
    }
};

/**
 * Fetch focus records from Firestore for a user
 */
export const fetchRemoteFocusRecords = async (userId: string): Promise<FocusRecord[]> => {
    if (!userId || !isOnline()) return [];

    try {
        const { data, error } = await supabase.from('focus_records').select('*').eq('user_id', userId);

        if (error) throw error;

        return (data || []).map(row => ({
            id: row.id,
            date: row.date,
            userId: row.user_id,
            totalFocusMinutes: row.total_focus_minutes || 0,
            totalPomos: row.total_pomos || 0,
            sessions: row.sessions || [],
        }));
    } catch (error) {
        console.warn('[Focus] Failed to fetch from Supabase:', error);
        return [];
    }
};

/**
 * Sync all local records with Firestore (background operation)
 */
export const syncAllFocusRecords = async (userId: string): Promise<void> => {
    if (!userId || !isOnline()) return;

    try {
        const localRecords = getLocalFocusRecords(userId);
        const remoteRecords = await fetchRemoteFocusRecords(userId);

        // Create a map of remote records by date
        const remoteMap = new Map<string, FocusRecord>();
        remoteRecords.forEach(r => remoteMap.set(r.date, r));

        // Merge: prefer local data if it has more sessions
        const merged: Record<string, FocusRecord> = { ...localRecords };

        remoteRecords.forEach(remote => {
            const local = merged[remote.date];
            if (!local) {
                // Remote only - add to local
                merged[remote.date] = remote;
                merged[remote.date] = {
                    ...remote,
                    sessions: [...new Map([
                        ...local.sessions.map(s => [s.id, s] as [string, FocusSession]),
                        ...remote.sessions.map(s => [s.id, s] as [string, FocusSession]),
                    ]).values()],
                };
            }

            // ALWAYS Recalculate aggregates to ensure consistency and fix any past corruptions
            if (merged[remote.date]) {
                merged[remote.date].totalFocusMinutes = merged[remote.date].sessions
                    .filter(s => s.type === 'pomodoro' || s.type === 'manual')
                    .reduce((sum, s) => sum + s.duration, 0);
                merged[remote.date].totalPomos = merged[remote.date].sessions
                    .filter(s => (s.type === 'pomodoro' && s.completed) || (s.type === 'manual' && s.duration >= 25))
                    .length;
            }
        });

        // Save merged data locally
        saveLocalFocusRecords(userId, merged);
        console.log('[Focus] Synced', Object.keys(merged).length, 'records');
    } catch (error) {
        console.warn('[Focus] Full sync failed:', error);
    }
};
