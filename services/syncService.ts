// Sync Service - Network Detection and Background Sync
// Handles online/offline detection, pending operations queue, and Firestore sync

import { db } from '../firebase';
import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    setDoc,
} from 'firebase/firestore';
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
    } else {
        setSyncState('synced');
    }
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
            // Create in Firestore and update local ID
            const { id, syncStatus, ...data } = op.data;
            const docRef = await addDoc(collection(db, 'assignments'), {
                ...data,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            // Update local storage with real ID
            if (isTempId(op.docId)) {
                updateLocalAssignmentId(op.userId, op.docId, docRef.id);
            }
            break;
        }
        case 'update': {
            if (isTempId(op.docId)) {
                // This shouldn't happen, but handle gracefully
                console.warn('[Sync] Trying to update a temp ID, converting to add');
                const { id, syncStatus, ...data } = op.data;
                const docRef = await addDoc(collection(db, 'assignments'), {
                    ...data,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                updateLocalAssignmentId(op.userId, op.docId, docRef.id);
            } else {
                await updateDoc(doc(db, 'assignments', op.docId), {
                    ...op.data,
                    updatedAt: Date.now(),
                });
            }
            break;
        }
        case 'delete': {
            if (!isTempId(op.docId)) {
                await deleteDoc(doc(db, 'assignments', op.docId));
            }
            // If it's a temp ID, it was never synced, so nothing to delete remotely
            break;
        }
    }
};

const processHabitOperation = async (op: PendingOperation): Promise<void> => {
    switch (op.type) {
        case 'add': {
            const { id, syncStatus, ...data } = op.data;
            const docRef = await addDoc(collection(db, 'habits'), {
                ...data,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            if (isTempId(op.docId)) {
                updateLocalHabitId(op.userId, op.docId, docRef.id);
            }
            break;
        }
        case 'update': {
            if (isTempId(op.docId)) {
                const { id, syncStatus, ...data } = op.data;
                const docRef = await addDoc(collection(db, 'habits'), {
                    ...data,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                updateLocalHabitId(op.userId, op.docId, docRef.id);
            } else {
                await updateDoc(doc(db, 'habits', op.docId), {
                    ...op.data,
                    updatedAt: Date.now(),
                });
            }
            break;
        }
        case 'delete': {
            if (!isTempId(op.docId)) {
                await deleteDoc(doc(db, 'habits', op.docId));
            }
            break;
        }
    }
};

const processSettingsOperation = async (op: PendingOperation): Promise<void> => {
    // Settings use user ID as doc ID
    const { syncStatus, updatedAt, ...settings } = op.data;
    await setDoc(doc(db, 'settings', op.userId), {
        ...settings,
        updatedAt: Date.now(),
    });
};

// ==================== REMOTE DATA FETCHING ====================

export const fetchRemoteAssignments = async (userId: string): Promise<any[]> => {
    const q = query(collection(db, 'assignments'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const fetchRemoteHabits = async (userId: string): Promise<any[]> => {
    const q = query(collection(db, 'habits'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const fetchRemoteSettings = async (userId: string): Promise<any | null> => {
    const { getDoc } = await import('firebase/firestore');
    const docRef = doc(db, 'settings', userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
};

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
