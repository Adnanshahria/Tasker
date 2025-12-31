// Sync Service - Network Detection and Background Sync
// Handles online/offline detection, pending operations queue, and Supabase sync

import { supabase } from './supabaseClient';
import {
    getPendingOperations,
    removePendingOperation,
    incrementOperationRetry,
    PendingOperation,
    updateLocalAssignmentId,
    updateLocalHabitId,
    isTempId,
} from './localStorageService';

// ==================== NETWORK STATUS ====================

let isOnlineStatus = navigator.onLine;
const networkListeners: ((online: boolean) => void)[] = [];

// Initialize network listeners
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        isOnlineStatus = true;
        notifyListeners(true);
        // Auto-sync when coming back online
        processPendingOperations();
    });

    window.addEventListener('offline', () => {
        isOnlineStatus = false;
        notifyListeners(false);
    });
}

const notifyListeners = (online: boolean) => {
    networkListeners.forEach(listener => listener(online));
};

export const isOnline = (): boolean => {
    return isOnlineStatus && navigator.onLine;
};

export const addNetworkListener = (callback: (online: boolean) => void): (() => void) => {
    networkListeners.push(callback);
    // Return cleanup function
    return () => {
        const index = networkListeners.indexOf(callback);
        if (index > -1) {
            networkListeners.splice(index, 1);
        }
    };
};

// ==================== SYNC STATE ====================

export type SyncState = 'synced' | 'syncing' | 'pending' | 'offline' | 'error';

let currentSyncState: SyncState = isOnlineStatus ? 'synced' : 'offline';
const syncStateListeners: ((state: SyncState) => void)[] = [];

const setSyncState = (state: SyncState) => {
    currentSyncState = state;
    syncStateListeners.forEach(listener => listener(state));
};

export const getSyncState = (): SyncState => currentSyncState;

export const addSyncStateListener = (callback: (state: SyncState) => void): (() => void) => {
    syncStateListeners.push(callback);
    return () => {
        const index = syncStateListeners.indexOf(callback);
        if (index > -1) {
            syncStateListeners.splice(index, 1);
        }
    };
};

// ==================== PROCESS PENDING OPERATIONS ====================

let isSyncing = false;
const MAX_RETRIES = 3;

export const processPendingOperations = async (): Promise<void> => {
    if (!isOnline() || isSyncing) {
        return;
    }

    const pendingOps = getPendingOperations();
    if (pendingOps.length === 0) {
        setSyncState('synced');
        return;
    }

    isSyncing = true;
    setSyncState('syncing');

    console.log(`[Sync] Processing ${pendingOps.length} pending operations...`);

    for (const op of pendingOps) {
        // Double-check if this op is still valid (wasn't removed/replaced by a newer update while we were starting)
        const currentOps = getPendingOperations();
        if (!currentOps.find(o => o.id === op.id)) {
            console.log(`[Sync] Skipping superseded operation:`, op.id);
            continue;
        }

        if (op.retryCount >= MAX_RETRIES) {
            console.error(`[Sync] Max retries reached for operation:`, op);
            removePendingOperation(op.id);
            continue;
        }

        try {
            await processOperation(op);
            removePendingOperation(op.id);
            console.log(`[Sync] Successfully processed:`, op.type, op.collection, op.docId);
        } catch (error) {
            console.error(`[Sync] Failed to process operation:`, op, error);
            incrementOperationRetry(op.id);
        }
    }

    isSyncing = false;

    // Check if there are still pending ops
    const remainingOps = getPendingOperations();
    if (remainingOps.length > 0) {
        setSyncState('pending');
        // If we still have pending ops and are online, try again immediately
        if (isOnline()) {
            // Use setTimeout to avoid stack overflow in extreme cases and let UI breathe
            setTimeout(() => processPendingOperations(), 1000);
        }
    } else {
        setSyncState('synced');
    }
};

// Debounce timer for sync trigger
let syncDebounceTimer: NodeJS.Timeout | null = null;

export const triggerSync = () => {
    if (syncDebounceTimer) {
        clearTimeout(syncDebounceTimer);
    }
    syncDebounceTimer = setTimeout(() => {
        processPendingOperations();
        syncDebounceTimer = null;
    }, 1000); // Wait 1s (was 2s) before syncing to coalesce rapid edits
};

const processOperation = async (op: PendingOperation): Promise<void> => {
    switch (op.collection) {
        case 'assignments':
            await processAssignmentOperation(op);
            break;
        case 'habits':
            await processHabitOperation(op);
            break;
        case 'settings':
            await processSettingsOperation(op);
            break;
    }
};

const processAssignmentOperation = async (op: PendingOperation): Promise<void> => {
    switch (op.type) {
        case 'add': {
            // Create in Supabase and update local ID
            // Supabase assignments table uses camelCase column names
            // Generate a proper UUID for the database (schema requires id as PRIMARY KEY)
            const { id: tempId, syncStatus, ...data } = op.data;
            const newId = crypto.randomUUID();

            const { data: newDoc, error } = await supabase.from('assignments').insert({
                id: newId,
                ...data,
                userId: op.userId,
                createdAt: Date.now(),
            }).select().single();

            if (error) throw error;

            // Update local storage with real ID
            if (isTempId(op.docId) && newDoc) {
                updateLocalAssignmentId(op.userId, op.docId, newDoc.id);
            }
            break;
        }
        case 'update': {
            if (isTempId(op.docId)) {
                // Converting update to add if it's still temp
                const { id: tempId, syncStatus, ...data } = op.data;
                const newId = crypto.randomUUID();

                const { data: newDoc, error } = await supabase.from('assignments').insert({
                    id: newId,
                    ...data,
                    userId: op.userId,
                    createdAt: Date.now(),
                }).select().single();
                if (error) throw error;
                if (newDoc) updateLocalAssignmentId(op.userId, op.docId, newDoc.id);
            } else {
                // Remove id/syncStatus/createdAt from update payload (keep userId for reference)
                const { id, syncStatus, createdAt, ...cleanData } = op.data;

                await supabase.from('assignments').update({
                    ...cleanData,
                    updatedAt: Date.now(),
                }).eq('id', op.docId);
            }
            break;
        }
        case 'delete': {
            if (!isTempId(op.docId)) {
                await supabase.from('assignments').delete().eq('id', op.docId);
            }
            break;
        }
    }
};

const processHabitOperation = async (op: PendingOperation): Promise<void> => {
    switch (op.type) {
        case 'add': {
            // Supabase habits table uses camelCase column names
            // Generate a proper UUID for the database (schema requires id as PRIMARY KEY)
            const { id: tempId, syncStatus, ...data } = op.data;
            const newId = crypto.randomUUID();

            const { data: newDoc, error } = await supabase.from('habits').insert({
                id: newId,
                ...data,
                userId: op.userId,
                createdAt: Date.now(),
            }).select().single();
            if (error) throw error;

            if (isTempId(op.docId) && newDoc) {
                updateLocalHabitId(op.userId, op.docId, newDoc.id);
            }
            break;
        }
        case 'update': {
            if (isTempId(op.docId)) {
                // Handling update on temp ID -> Treat as Insert
                const { id: tempId, syncStatus, createdAt, ...data } = op.data;
                const newId = crypto.randomUUID();

                const { data: newDoc, error } = await supabase.from('habits').insert({
                    id: newId,
                    ...data,
                    userId: op.userId,
                    createdAt: Date.now(),
                }).select().single();
                if (error) throw error;
                if (newDoc) updateLocalHabitId(op.userId, op.docId, newDoc.id);
            } else {
                // Remove id/syncStatus/createdAt from update payload
                const { id, syncStatus, createdAt, ...cleanData } = op.data;

                await supabase.from('habits').update({
                    ...cleanData,
                    updatedAt: Date.now(),
                }).eq('id', op.docId);
            }
            break;
        }
        case 'delete': {
            if (!isTempId(op.docId)) {
                await supabase.from('habits').delete().eq('id', op.docId);
            }
            break;
        }
    }
};

const processSettingsOperation = async (op: PendingOperation): Promise<void> => {
    // Settings use user ID as unique key
    const { syncStatus, updatedAt, ...settings } = op.data;
    const { error } = await supabase.from('settings').upsert({
        user_id: op.userId, // Assuming schema uses user_id
        ...settings,
        updated_at: new Date().toISOString()
    });
    if (error) throw error;
};

// ==================== REMOTE DATA FETCHING ====================

export const fetchRemoteAssignments = async (userId: string): Promise<any[]> => {
    // Supabase schema uses quoted camelCase: "userId"
    const { data, error } = await supabase.from('assignments').select('*').eq('userId', userId);

    if (error) {
        console.error('[Sync] Error fetching assignments:', error);
        return [];
    }

    console.log('[Sync] Fetched', (data || []).length, 'assignments from Supabase');

    // Data already uses camelCase from Supabase
    return (data || []).map(item => ({
        id: item.id,
        userId: item.userId,
        title: item.title,
        description: item.description,
        subject: item.subject,
        dueDate: item.dueDate,
        startTime: item.startTime,
        endTime: item.endTime,
        status: item.status,
        priority: item.priority,
        type: item.type,
        weight: item.weight,
        score: item.score,
        totalPoints: item.totalPoints,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
    }));
};

export const fetchRemoteHabits = async (userId: string): Promise<any[]> => {
    // Supabase schema uses quoted camelCase: "userId"
    const { data, error } = await supabase.from('habits').select('*').eq('userId', userId);

    if (error) {
        console.error('[Sync] Error fetching habits:', error);
        return [];
    }

    console.log('[Sync] Fetched', (data || []).length, 'habits from Supabase');

    // Data already uses camelCase from Supabase
    return (data || []).map(item => ({
        id: item.id,
        userId: item.userId,
        title: item.title,
        description: item.description,
        completedDates: item.completedDates || [],
        streak: item.streak,
        order: item.order,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
    }));
};

export const fetchRemoteSettings = async (userId: string): Promise<any | null> => {
    // Use 'user_id' (snake_case) to match Supabase schema
    const { data, error } = await supabase.from('settings').select('*').eq('user_id', userId).maybeSingle();

    if (error) {
        console.warn('[Sync] Settings fetch error:', error.message);
        return null; // Settings might not exist yet, which is fine
    }

    if (data) {
        console.log('[Sync] Fetched settings from Supabase');
    }

    return data;
};


// ==================== AUTO-SYNC INTERVAL ====================

const SYNC_INTERVAL_MS = 45000; // 45 seconds

// Start auto-sync interval
if (typeof window !== 'undefined') {
    setInterval(() => {
        if (isOnline() && !isSyncing) {
            console.log('[Sync] Auto-sync triggered');
            processPendingOperations();
        }
    }, SYNC_INTERVAL_MS);
}

// ==================== INITIALIZATION ====================

export const initializeSyncService = (): void => {
    // Check for pending operations on startup
    const pendingOps = getPendingOperations();
    if (pendingOps.length > 0) {
        if (isOnline()) {
            setSyncState('pending');
            // Process after a short delay to let the app initialize
            setTimeout(() => processPendingOperations(), 2000);
        } else {
            setSyncState('offline');
        }
    } else {
        setSyncState(isOnline() ? 'synced' : 'offline');
    }

    console.log('[Sync] Service initialized, state:', getSyncState());
};

// Auto-initialize
initializeSyncService();

