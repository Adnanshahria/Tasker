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
            // Strip userId, user_id, syncStatus from payload to avoid schema errors
            const { id, syncStatus, userId, user_id, ...data } = op.data;
            const { data: newDoc, error } = await supabase.from('assignments').insert({
                ...data,
                created_at: new Date(Date.now()).toISOString(),
                user_id: op.userId, // Map userId to user_id explicitly
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
                const { id, syncStatus, userId, user_id, ...data } = op.data;
                const { data: newDoc, error } = await supabase.from('assignments').insert({
                    ...data,
                    user_id: op.userId, // Map userId
                }).select().single();
                if (error) throw error;
                if (newDoc) updateLocalAssignmentId(op.userId, op.docId, newDoc.id);
            } else {
                // Remove userId/user_id/id/createdAt from update payload
                const { userId, user_id, id, syncStatus, createdAt, created_at, ...cleanData } = op.data;

                await supabase.from('assignments').update({
                    ...cleanData,
                    updated_at: new Date(Date.now()).toISOString(),
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
            const { id, syncStatus, userId, user_id, ...data } = op.data;
            const { data: newDoc, error } = await supabase.from('habits').insert({
                ...data,
                user_id: op.userId,
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
                const { id, syncStatus, userId, user_id, createdAt, created_at, ...data } = op.data;
                const { data: newDoc, error } = await supabase.from('habits').insert({
                    ...data,
                    user_id: op.userId,
                    created_at: new Date(Date.now()).toISOString(), // ensure created_at is set if missing
                }).select().single();
                if (error) throw error;
                if (newDoc) updateLocalHabitId(op.userId, op.docId, newDoc.id);
            } else {
                // ... (existing update logic)
                // Remove userId/user_id/id from update payload
                // The error "Could not find the 'user_id' column" usually happens when trying to update a column that isn't expected or allowed
                const { userId, user_id, id, syncStatus, createdAt, created_at, ...cleanData } = op.data;

                await supabase.from('habits').update(cleanData).eq('id', op.docId);
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
    // The error "column assignments.user_id does not exist" suggests the column is actually named "userId"
    // or we should rely on "userId" based on the error hint.
    // Trying 'userId' first, falling back to 'user_id' if needed isn't easy in one query, 
    // so we'll switch to 'userId' based on the strong hint.
    let { data, error } = await supabase.from('assignments').select('*').eq('userId', userId);

    if (error) {
        // Fallback: try user_id if userId failed (just in case)
        if (error.code === '42703') { // Undefined column
            const retry = await supabase.from('assignments').select('*').eq('user_id', userId);
            data = retry.data;
            error = retry.error;
        }
    }

    if (error) {
        console.error('Error fetching assignments:', error);
        return [];
    }
    // Map remote data to local format safely
    return (data || []).map(item => ({
        ...item,
        userId: item.userId || item.user_id, // ensure we have the property expected locally
    }));
};

export const fetchRemoteHabits = async (userId: string): Promise<any[]> => {
    let { data, error } = await supabase.from('habits').select('*').eq('userId', userId);

    if (error && error.code === '42703') {
        const retry = await supabase.from('habits').select('*').eq('user_id', userId);
        data = retry.data;
        error = retry.error;
    }

    if (error) {
        console.error('Error fetching habits:', error);
        return [];
    }
    return (data || []).map(item => ({
        ...item,
        userId: item.userId || item.user_id,
    }));
};

export const fetchRemoteSettings = async (userId: string): Promise<any | null> => {
    // Settings usually link via id or user_id/userId
    let { data, error } = await supabase.from('settings').select('*').eq('userId', userId).maybeSingle();

    if (error && error.code === '42703') {
        const retry = await supabase.from('settings').select('*').eq('user_id', userId).maybeSingle();
        data = retry.data;
        error = retry.error;
    }

    if (error) {
        console.warn('[Sync] Settings fetch error:', error.message);
        return null;
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

