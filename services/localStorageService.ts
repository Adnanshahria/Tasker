// Local Storage Service - Offline Data Persistence Layer
// Provides local-first data storage with sync timestamps for conflict resolution

import { LocalAssignment, LocalHabit, UserSettings, DEFAULT_SETTINGS_BN } from './dataService';

// Storage Keys
const KEYS = {
    assignments: (userId: string) => `ogrogoti_assignments_${userId}`,
    habits: (userId: string) => `ogrogoti_habits_${userId}`,
    settings: (userId: string) => `ogrogoti_settings_${userId}`,
    pendingOps: 'ogrogoti_pending_ops',
    cachedUser: 'ogrogoti_cached_user',
    lastSync: (userId: string) => `ogrogoti_last_sync_${userId}`,
};

// ==================== GENERIC HELPERS ====================

const getItem = <T>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading ${key} from localStorage:`, error);
        return defaultValue;
    }
};

const setItem = <T>(key: string, value: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing ${key} to localStorage:`, error);
    }
};

// Generate temporary ID for offline-created items
export const generateTempId = (): string => {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const isTempId = (id: string): boolean => {
    return id.startsWith('temp_');
};

// ==================== ASSIGNMENTS ====================

export interface StoredAssignment extends LocalAssignment {
    updatedAt: number;
    syncStatus: 'synced' | 'pending' | 'conflict';
}

export const getLocalAssignments = (userId: string): StoredAssignment[] => {
    return getItem<StoredAssignment[]>(KEYS.assignments(userId), []);
};

export const saveLocalAssignments = (userId: string, assignments: StoredAssignment[]): void => {
    setItem(KEYS.assignments(userId), assignments);
};

export const saveLocalAssignment = (userId: string, assignment: StoredAssignment): void => {
    const assignments = getLocalAssignments(userId);
    const index = assignments.findIndex(a => a.id === assignment.id);

    if (index >= 0) {
        assignments[index] = assignment;
    } else {
        assignments.push(assignment);
    }

    saveLocalAssignments(userId, assignments);
};

export const deleteLocalAssignment = (userId: string, id: string): void => {
    const assignments = getLocalAssignments(userId);
    saveLocalAssignments(userId, assignments.filter(a => a.id !== id));
};

export const updateLocalAssignmentId = (userId: string, tempId: string, realId: string): void => {
    const assignments = getLocalAssignments(userId);
    const index = assignments.findIndex(a => a.id === tempId);

    if (index >= 0) {
        assignments[index] = { ...assignments[index], id: realId, syncStatus: 'synced' };
        saveLocalAssignments(userId, assignments);
    }
};

// ==================== HABITS ====================

export interface StoredHabit extends LocalHabit {
    updatedAt: number;
    syncStatus: 'synced' | 'pending' | 'conflict';
}

export const getLocalHabits = (userId: string): StoredHabit[] => {
    return getItem<StoredHabit[]>(KEYS.habits(userId), []);
};

export const saveLocalHabits = (userId: string, habits: StoredHabit[]): void => {
    setItem(KEYS.habits(userId), habits);
};

export const saveLocalHabit = (userId: string, habit: StoredHabit): void => {
    const habits = getLocalHabits(userId);
    const index = habits.findIndex(h => h.id === habit.id);

    if (index >= 0) {
        habits[index] = habit;
    } else {
        habits.push(habit);
    }

    saveLocalHabits(userId, habits);
};

export const deleteLocalHabit = (userId: string, id: string): void => {
    const habits = getLocalHabits(userId);
    saveLocalHabits(userId, habits.filter(h => h.id !== id));
};

export const updateLocalHabitId = (userId: string, tempId: string, realId: string): void => {
    const habits = getLocalHabits(userId);
    const index = habits.findIndex(h => h.id === tempId);

    if (index >= 0) {
        habits[index] = { ...habits[index], id: realId, syncStatus: 'synced' };
        saveLocalHabits(userId, habits);
    }
};

// ==================== SETTINGS ====================

export interface StoredSettings extends UserSettings {
    updatedAt: number;
    syncStatus: 'synced' | 'pending';
}

export const getLocalSettings = (userId: string): StoredSettings | null => {
    return getItem<StoredSettings | null>(KEYS.settings(userId), null);
};

export const saveLocalSettings = (userId: string, settings: StoredSettings): void => {
    setItem(KEYS.settings(userId), settings);
};

// ==================== CACHED USER (for offline auth) ====================

export interface CachedUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    cachedAt: number;
}

export const getCachedUser = (): CachedUser | null => {
    return getItem<CachedUser | null>(KEYS.cachedUser, null);
};

export const setCachedUser = (user: CachedUser | null): void => {
    if (user) {
        setItem(KEYS.cachedUser, user);
    } else {
        localStorage.removeItem(KEYS.cachedUser);
    }
};

// ==================== PENDING OPERATIONS QUEUE ====================

export type OperationType = 'add' | 'update' | 'delete';
export type CollectionName = 'assignments' | 'habits' | 'settings';

export interface PendingOperation {
    id: string;
    type: OperationType;
    collection: CollectionName;
    docId: string;
    data?: any;
    userId: string;
    createdAt: number;
    retryCount: number;
}

export const getPendingOperations = (): PendingOperation[] => {
    return getItem<PendingOperation[]>(KEYS.pendingOps, []);
};

export const savePendingOperations = (ops: PendingOperation[]): void => {
    setItem(KEYS.pendingOps, ops);
};

export const addPendingOperation = (op: Omit<PendingOperation, 'id' | 'createdAt' | 'retryCount'>): void => {
    const ops = getPendingOperations();

    // For updates/deletes, remove any existing pending ops for same doc
    const filtered = ops.filter(o =>
        !(o.collection === op.collection && o.docId === op.docId)
    );

    filtered.push({
        ...op,
        id: generateTempId(),
        createdAt: Date.now(),
        retryCount: 0,
    });

    savePendingOperations(filtered);
};

export const removePendingOperation = (opId: string): void => {
    const ops = getPendingOperations();
    savePendingOperations(ops.filter(o => o.id !== opId));
};

export const incrementOperationRetry = (opId: string): void => {
    const ops = getPendingOperations();
    const index = ops.findIndex(o => o.id === opId);

    if (index >= 0) {
        ops[index].retryCount++;
        savePendingOperations(ops);
    }
};

// ==================== LAST SYNC TIMESTAMP ====================

export const getLastSyncTime = (userId: string): number => {
    return getItem<number>(KEYS.lastSync(userId), 0);
};

export const setLastSyncTime = (userId: string, timestamp: number): void => {
    setItem(KEYS.lastSync(userId), timestamp);
};

// ==================== MERGE UTILITIES ====================

// Merge local and remote data using last-write-wins strategy
export const mergeAssignments = (
    local: StoredAssignment[],
    remote: LocalAssignment[]
): StoredAssignment[] => {
    const merged = new Map<string, StoredAssignment>();

    // Add all local items
    local.forEach(item => {
        merged.set(item.id, item);
    });

    // Merge remote items (they come with createdAt which we use as updatedAt if not present)
    remote.forEach(item => {
        const localItem = merged.get(item.id);
        const remoteUpdatedAt = (item as any).updatedAt || (item as any).createdAt || 0;

        if (!localItem) {
            // New remote item
            merged.set(item.id, {
                ...item,
                updatedAt: remoteUpdatedAt,
                syncStatus: 'synced',
            });
        } else if (localItem.syncStatus === 'synced') {
            // Local is synced, take remote version
            merged.set(item.id, {
                ...item,
                updatedAt: remoteUpdatedAt,
                syncStatus: 'synced',
            });
        } else if (remoteUpdatedAt > localItem.updatedAt) {
            // Remote is newer, take remote (last-write-wins)
            merged.set(item.id, {
                ...item,
                updatedAt: remoteUpdatedAt,
                syncStatus: 'synced',
            });
        }
        // else: keep local pending changes (they will be synced)
    });

    return Array.from(merged.values());
};

export const mergeHabits = (
    local: StoredHabit[],
    remote: LocalHabit[]
): StoredHabit[] => {
    const merged = new Map<string, StoredHabit>();

    local.forEach(item => {
        merged.set(item.id, item);
    });

    remote.forEach(item => {
        const localItem = merged.get(item.id);
        const remoteUpdatedAt = (item as any).updatedAt || (item as any).createdAt || 0;

        if (!localItem) {
            merged.set(item.id, {
                ...item,
                updatedAt: remoteUpdatedAt,
                syncStatus: 'synced',
            });
        } else if (localItem.syncStatus === 'synced') {
            merged.set(item.id, {
                ...item,
                updatedAt: remoteUpdatedAt,
                syncStatus: 'synced',
            });
        } else if (remoteUpdatedAt > localItem.updatedAt) {
            merged.set(item.id, {
                ...item,
                updatedAt: remoteUpdatedAt,
                syncStatus: 'synced',
            });
        }
    });

    return Array.from(merged.values());
};
