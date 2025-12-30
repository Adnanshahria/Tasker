// Focus Timer Data Service - Offline-First with Firebase Sync
// Follows the same pattern as dataService.ts for assignments/habits

import { db } from '../firebase';
import {
    collection,
    doc,
    getDocs,
    setDoc,
    query,
    where,
    Timestamp,
} from 'firebase/firestore';
import { FocusSession, FocusRecord } from '../types';
import { isOnline } from './syncService';

const STORAGE_KEY = 'ogrogoti-focus-records';
const MIN_SESSION_DURATION = 0.1; // Minimum 0.1 minutes (6 seconds) to record

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

const getTodayKey = () => new Date().toISOString().split('T')[0]; // YYYY-MM-DD

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

    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
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
        const docRef = doc(db, 'focusRecords', `${userId}_${date}`);
        await setDoc(docRef, {
            ...record,
            updatedAt: Timestamp.now(),
        }, { merge: true });
        console.log('[Focus] Record synced to Firestore:', date);
    } catch (error) {
        console.warn('[Focus] Failed to sync to Firestore:', error);
        // Will retry on next session save or when coming online
    }
};

/**
 * Fetch focus records from Firestore for a user
 */
export const fetchRemoteFocusRecords = async (userId: string): Promise<FocusRecord[]> => {
    if (!userId || !isOnline()) return [];

    try {
        const q = query(
            collection(db, 'focusRecords'),
            where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                date: data.date,
                userId: data.userId,
                totalFocusMinutes: data.totalFocusMinutes || 0,
                totalPomos: data.totalPomos || 0,
                sessions: data.sessions || [],
            };
        });
    } catch (error) {
        console.warn('[Focus] Failed to fetch from Firestore:', error);
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
            } else if (remote.sessions.length > local.sessions.length) {
                // Remote has more sessions - merge
                merged[remote.date] = {
                    ...remote,
                    sessions: [...new Map([
                        ...local.sessions.map(s => [s.id, s] as [string, FocusSession]),
                        ...remote.sessions.map(s => [s.id, s] as [string, FocusSession]),
                    ]).values()],
                };
                // Recalculate aggregates
                merged[remote.date].totalFocusMinutes = merged[remote.date].sessions
                    .filter(s => s.type === 'pomodoro')
                    .reduce((sum, s) => sum + s.duration, 0);
                merged[remote.date].totalPomos = merged[remote.date].sessions
                    .filter(s => s.type === 'pomodoro' && s.completed)
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
