// Offline-First Data Service
// Reads from localStorage first, syncs with Firestore in background

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
    getDoc
} from 'firebase/firestore';
import {
    getLocalAssignments,
    saveLocalAssignment,
    saveLocalAssignments,
    deleteLocalAssignment,
    getLocalHabits,
    saveLocalHabit,
    saveLocalHabits,
    deleteLocalHabit,
    getLocalSettings,
    saveLocalSettings,
    generateTempId,
    addPendingOperation,
    mergeAssignments,
    mergeHabits,
    StoredAssignment,
    StoredHabit,
    StoredSettings,
} from './localStorageService';
import {
    isOnline,
    processPendingOperations,
    fetchRemoteAssignments,
    fetchRemoteHabits,
    fetchRemoteSettings,
} from './syncService';

// Types
export interface LocalAssignment {
    id: string;
    userId: string;
    title: string;
    description?: string;
    subject: string;
    dueDate: number;
    startTime?: string;
    endTime?: string;
    status: string;
    priority: string;
    type: string;
    weight?: number;
    score?: number;
    totalPoints?: number;
    createdAt?: number;
}

export interface LocalHabit {
    id: string;
    userId: string;
    title: string;
    description?: string;
    completedDates: string[];
    streak?: number;
    createdAt?: number;
}

export interface UserSettings {
    subjects: string[];
    types: string[];
    statuses: string[];
    priorities: string[];
    language: 'en' | 'bn';
    countdownDate?: number;
    countdownLabel?: string;
}

// Default Settings
export const DEFAULT_SETTINGS_BN: UserSettings = {
    subjects: ['পদার্থবিজ্ঞান', 'রসায়ন', 'গণিত', 'জীববিজ্ঞান', 'ICT', 'ইংরেজি', 'বাংলা'],
    types: ['Project', 'Assignment', 'Quiz', 'Exam', 'Lab', 'Presentation'],
    statuses: ['Not Started', 'In Progress', 'Completed'],
    priorities: ['Low', 'Medium', 'Urgent'],
    language: 'bn',
    countdownDate: undefined,
    countdownLabel: 'পরীক্ষা'
};

// ==================== ASSIGNMENTS ====================

export const getAssignments = async (userId: string): Promise<LocalAssignment[]> => {
    if (!userId) {
        console.error('getAssignments: No userId provided');
        return [];
    }

    // 1. Get local data immediately
    let localData = getLocalAssignments(userId);
    console.log('[Data] Local assignments:', localData.length);

    // 2. If online, try to sync with remote
    if (isOnline()) {
        try {
            console.log('[Data] Fetching remote assignments...');
            const remoteData = await fetchRemoteAssignments(userId);
            console.log('[Data] Remote assignments:', remoteData.length);

            // Merge local and remote data
            const merged = mergeAssignments(localData, remoteData);
            saveLocalAssignments(userId, merged);

            // Process any pending operations
            processPendingOperations();

            return merged.map(a => ({
                id: a.id,
                userId: a.userId,
                title: a.title,
                description: a.description,
                subject: a.subject,
                dueDate: a.dueDate,
                startTime: a.startTime,
                endTime: a.endTime,
                status: a.status,
                priority: a.priority,
                type: a.type,
                weight: a.weight,
                score: a.score,
                totalPoints: a.totalPoints,
                createdAt: a.createdAt,
            }));
        } catch (error) {
            console.warn('[Data] Failed to sync assignments, using local data:', error);
        }
    }

    // Return local data
    return localData.map(a => ({
        id: a.id,
        userId: a.userId,
        title: a.title,
        description: a.description,
        subject: a.subject,
        dueDate: a.dueDate,
        startTime: a.startTime,
        endTime: a.endTime,
        status: a.status,
        priority: a.priority,
        type: a.type,
        weight: a.weight,
        score: a.score,
        totalPoints: a.totalPoints,
        createdAt: a.createdAt,
    })).sort((a, b) => a.dueDate - b.dueDate);
};

export const saveAssignment = async (data: Omit<LocalAssignment, 'id'>): Promise<string> => {
    if (!data.userId) {
        throw new Error('userId is required');
    }

    const id = generateTempId();
    const now = Date.now();

    const assignment: StoredAssignment = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'pending',
    };

    // 1. Save to local storage immediately
    saveLocalAssignment(data.userId, assignment);
    console.log('[Data] Assignment saved locally:', id);

    // 2. Queue for remote sync
    addPendingOperation({
        type: 'add',
        collection: 'assignments',
        docId: id,
        data: assignment,
        userId: data.userId,
    });

    // 3. Try immediate sync if online
    if (isOnline()) {
        processPendingOperations();
    }

    return id;
};

export const updateAssignment = async (id: string, data: Partial<LocalAssignment>): Promise<void> => {
    const userId = data.userId || '';

    // 1. Update local storage immediately
    const localData = getLocalAssignments(userId);
    const existing = localData.find(a => a.id === id);

    if (existing) {
        const updated: StoredAssignment = {
            ...existing,
            ...data,
            updatedAt: Date.now(),
            syncStatus: 'pending',
        };
        saveLocalAssignment(userId, updated);
        console.log('[Data] Assignment updated locally:', id);

        // 2. Queue for remote sync
        addPendingOperation({
            type: 'update',
            collection: 'assignments',
            docId: id,
            data: updated,
            userId,
        });

        // 3. Try immediate sync if online
        if (isOnline()) {
            processPendingOperations();
        }
    } else {
        // Fallback to direct Firestore update
        if (isOnline()) {
            await updateDoc(doc(db, 'assignments', id), data);
        }
    }
};

export const deleteAssignment = async (id: string): Promise<void> => {
    // Find which user this belongs to
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('agrogoti_assignments_'));
    let userId = '';

    for (const key of allKeys) {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        if (data.some((a: any) => a.id === id)) {
            userId = key.replace('agrogoti_assignments_', '');
            break;
        }
    }

    // 1. Delete from local storage immediately
    if (userId) {
        deleteLocalAssignment(userId, id);
        console.log('[Data] Assignment deleted locally:', id);

        // 2. Queue for remote sync
        addPendingOperation({
            type: 'delete',
            collection: 'assignments',
            docId: id,
            userId,
        });
    }

    // 3. Try immediate sync if online
    if (isOnline()) {
        processPendingOperations();
    }
};

// ==================== HABITS ====================

export const getHabits = async (userId: string): Promise<LocalHabit[]> => {
    if (!userId) return [];

    // 1. Get local data immediately
    let localData = getLocalHabits(userId);
    console.log('[Data] Local habits:', localData.length);

    // 2. If online, try to sync with remote
    if (isOnline()) {
        try {
            console.log('[Data] Fetching remote habits...');
            const remoteData = await fetchRemoteHabits(userId);
            console.log('[Data] Remote habits:', remoteData.length);

            // Merge local and remote data
            const merged = mergeHabits(localData, remoteData);
            saveLocalHabits(userId, merged);

            // Process any pending operations
            processPendingOperations();

            return merged.map(h => ({
                id: h.id,
                userId: h.userId,
                title: h.title,
                description: h.description,
                completedDates: h.completedDates,
                streak: h.streak,
                createdAt: h.createdAt,
            }));
        } catch (error) {
            console.warn('[Data] Failed to sync habits, using local data:', error);
        }
    }

    return localData.map(h => ({
        id: h.id,
        userId: h.userId,
        title: h.title,
        description: h.description,
        completedDates: h.completedDates,
        streak: h.streak,
        createdAt: h.createdAt,
    }));
};

export const saveHabit = async (data: Omit<LocalHabit, 'id'>): Promise<string> => {
    if (!data.userId) throw new Error('userId is required');

    const id = generateTempId();
    const now = Date.now();

    const habit: StoredHabit = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'pending',
    };

    // 1. Save to local storage immediately
    saveLocalHabit(data.userId, habit);
    console.log('[Data] Habit saved locally:', id);

    // 2. Queue for remote sync
    addPendingOperation({
        type: 'add',
        collection: 'habits',
        docId: id,
        data: habit,
        userId: data.userId,
    });

    // 3. Try immediate sync if online
    if (isOnline()) {
        processPendingOperations();
    }

    return id;
};

export const updateHabit = async (id: string, data: Partial<LocalHabit>): Promise<void> => {
    const userId = data.userId || '';

    // 1. Update local storage immediately
    const localData = getLocalHabits(userId);
    const existing = localData.find(h => h.id === id);

    if (existing) {
        const updated: StoredHabit = {
            ...existing,
            ...data,
            updatedAt: Date.now(),
            syncStatus: 'pending',
        };
        saveLocalHabit(userId, updated);
        console.log('[Data] Habit updated locally:', id);

        // 2. Queue for remote sync
        addPendingOperation({
            type: 'update',
            collection: 'habits',
            docId: id,
            data: updated,
            userId,
        });

        // 3. Try immediate sync if online
        if (isOnline()) {
            processPendingOperations();
        }
    } else {
        // Fallback to direct Firestore update
        if (isOnline()) {
            await updateDoc(doc(db, 'habits', id), data);
        }
    }
};

export const deleteHabit = async (id: string): Promise<void> => {
    // Find which user this belongs to
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('agrogoti_habits_'));
    let userId = '';

    for (const key of allKeys) {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        if (data.some((h: any) => h.id === id)) {
            userId = key.replace('agrogoti_habits_', '');
            break;
        }
    }

    // 1. Delete from local storage immediately
    if (userId) {
        deleteLocalHabit(userId, id);
        console.log('[Data] Habit deleted locally:', id);

        // 2. Queue for remote sync
        addPendingOperation({
            type: 'delete',
            collection: 'habits',
            docId: id,
            userId,
        });
    }

    // 3. Try immediate sync if online
    if (isOnline()) {
        processPendingOperations();
    }
};

// ==================== SETTINGS ====================

export const getSettings = async (userId: string): Promise<UserSettings> => {
    if (!userId) return DEFAULT_SETTINGS_BN;

    // 1. Get local data immediately
    const localSettings = getLocalSettings(userId);

    if (localSettings) {
        console.log('[Data] Using local settings');

        // 2. If online, try to sync with remote in background
        if (isOnline()) {
            fetchRemoteSettings(userId).then(remoteSettings => {
                if (remoteSettings && localSettings.syncStatus === 'synced') {
                    // Remote is newer, update local
                    const remoteUpdatedAt = (remoteSettings as any).updatedAt || 0;
                    if (remoteUpdatedAt > localSettings.updatedAt) {
                        saveLocalSettings(userId, {
                            ...remoteSettings,
                            updatedAt: remoteUpdatedAt,
                            syncStatus: 'synced',
                        });
                    }
                }
            }).catch(err => {
                console.warn('[Data] Failed to sync settings:', err);
            });
        }

        return {
            subjects: localSettings.subjects,
            types: localSettings.types,
            statuses: localSettings.statuses,
            priorities: localSettings.priorities,
            language: localSettings.language,
            countdownDate: localSettings.countdownDate,
            countdownLabel: localSettings.countdownLabel,
        };
    }

    // 3. If no local data and online, fetch from remote
    if (isOnline()) {
        try {
            const remoteSettings = await fetchRemoteSettings(userId);
            if (remoteSettings) {
                saveLocalSettings(userId, {
                    ...remoteSettings,
                    updatedAt: (remoteSettings as any).updatedAt || Date.now(),
                    syncStatus: 'synced',
                });
                return remoteSettings as UserSettings;
            }
        } catch (error) {
            console.error('[Data] Error fetching settings:', error);
        }
    }

    return DEFAULT_SETTINGS_BN;
};

export const saveSettings = async (userId: string, settings: UserSettings): Promise<void> => {
    if (!userId) throw new Error('userId is required');

    const storedSettings: StoredSettings = {
        ...settings,
        updatedAt: Date.now(),
        syncStatus: 'pending',
    };

    // 1. Save to local storage immediately
    saveLocalSettings(userId, storedSettings);
    console.log('[Data] Settings saved locally');

    // 2. Queue for remote sync
    addPendingOperation({
        type: 'update',
        collection: 'settings',
        docId: userId,
        data: storedSettings,
        userId,
    });

    // 3. Try immediate sync if online
    if (isOnline()) {
        processPendingOperations();
    }
};
