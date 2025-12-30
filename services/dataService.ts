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
    order?: number;
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

// Default Settings - English (default for new users)
export const DEFAULT_SETTINGS: UserSettings = {
    subjects: ['Physics', 'Chemistry', 'Math', 'Biology', 'ICT', 'English', 'Bengali'],
    types: ['Class', 'Assignment', 'Quiz', 'Exam', 'Lab', 'Presentation', 'Project'],
    statuses: ['Not Started', 'In Progress', 'Completed'],
    priorities: ['Low', 'Medium', 'Urgent'],
    language: 'en',
    countdownDate: undefined,
    countdownLabel: 'Exam'
};

// Default Settings - Bangla (for backward compatibility)
export const DEFAULT_SETTINGS_BN: UserSettings = {
    subjects: ['পদার্থবিজ্ঞান', 'রসায়ন', 'গণিত', 'জীববিজ্ঞান', 'ICT', 'ইংরেজি', 'বাংলা'],
    types: ['ক্লাস', 'অ্যাসাইনমেন্ট', 'কুইজ', 'পরীক্ষা', 'ল্যাব', 'প্রেজেন্টেশন', 'প্রজেক্ট'],
    statuses: ['শুরু হয়নি', 'চলমান', 'সম্পন্ন'],
    priorities: ['কম', 'মাঝারি', 'জরুরি'],
    language: 'bn',
    countdownDate: undefined,
    countdownLabel: 'পরীক্ষা'
};

// ==================== ASSIGNMENTS ====================

// Background sync callback for assignments
let assignmentsSyncCallback: ((data: LocalAssignment[]) => void) | null = null;
export const onAssignmentsSync = (callback: (data: LocalAssignment[]) => void) => {
    assignmentsSyncCallback = callback;
};

export const getAssignments = async (userId: string): Promise<LocalAssignment[]> => {
    if (!userId) {
        console.error('getAssignments: No userId provided');
        return [];
    }

    // 1. Get local data immediately (FAST - no network wait)
    const localData = getLocalAssignments(userId);
    console.log('[Data] Returning local assignments immediately:', localData.length);

    // 2. If online, sync with remote in BACKGROUND (non-blocking)
    if (isOnline()) {
        // Fire and forget - don't await
        syncAssignmentsInBackground(userId, localData);
    }

    // Return local data immediately for instant page load
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

// Background sync function for assignments
const syncAssignmentsInBackground = async (userId: string, localData: StoredAssignment[]) => {
    try {
        console.log('[Data] Background sync: Fetching remote assignments...');
        const remoteData = await fetchRemoteAssignments(userId);
        console.log('[Data] Background sync: Remote assignments:', remoteData.length);

        // Merge local and remote data
        const merged = mergeAssignments(localData, remoteData);
        saveLocalAssignments(userId, merged);

        // Notify component if callback is registered
        if (assignmentsSyncCallback && merged.length !== localData.length) {
            assignmentsSyncCallback(merged.map(a => ({
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
            })));
        }

        // Process any pending operations
        processPendingOperations();
    } catch (error) {
        console.warn('[Data] Background sync failed for assignments:', error);
    }
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
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('ogrogoti_assignments_'));
    let userId = '';

    for (const key of allKeys) {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        if (data.some((a: any) => a.id === id)) {
            userId = key.replace('ogrogoti_assignments_', '');
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

// Background sync callback for habits
let habitsSyncCallback: ((data: LocalHabit[]) => void) | null = null;
export const onHabitsSync = (callback: (data: LocalHabit[]) => void) => {
    habitsSyncCallback = callback;
};

export const getHabits = async (userId: string): Promise<LocalHabit[]> => {
    if (!userId) return [];

    // 1. Get local data immediately (FAST - no network wait)
    const localData = getLocalHabits(userId);
    console.log('[Data] Returning local habits immediately:', localData.length);

    // 2. If online, sync with remote in BACKGROUND (non-blocking)
    if (isOnline()) {
        syncHabitsInBackground(userId, localData);
    }

    return localData.map(h => ({
        id: h.id,
        userId: h.userId,
        title: h.title,
        description: h.description,
        completedDates: h.completedDates,
        streak: h.streak,
        order: h.order,
        createdAt: h.createdAt,
    })).sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
};

// Reorder habits - updates order field for all habits
export const reorderHabits = async (userId: string, orderedIds: string[]): Promise<void> => {
    if (!userId) return;

    const localData = getLocalHabits(userId);
    const now = Date.now();

    // Update order for each habit
    const updatedHabits = localData.map(habit => {
        const newOrder = orderedIds.indexOf(habit.id);
        return {
            ...habit,
            order: newOrder >= 0 ? newOrder : 9999,
            updatedAt: now,
            syncStatus: 'pending' as const,
        };
    });

    // Save all updated habits
    saveLocalHabits(userId, updatedHabits);
    console.log('[Data] Habits reordered locally');

    // Queue each habit update for sync
    updatedHabits.forEach(habit => {
        addPendingOperation({
            type: 'update',
            collection: 'habits',
            docId: habit.id,
            data: habit,
            userId,
        });
    });

    // Try immediate sync if online
    if (isOnline()) {
        processPendingOperations();
    }
};


// Background sync function for habits
const syncHabitsInBackground = async (userId: string, localData: StoredHabit[]) => {
    try {
        console.log('[Data] Background sync: Fetching remote habits...');
        const remoteData = await fetchRemoteHabits(userId);
        console.log('[Data] Background sync: Remote habits:', remoteData.length);

        const merged = mergeHabits(localData, remoteData);
        saveLocalHabits(userId, merged);

        if (habitsSyncCallback && merged.length !== localData.length) {
            habitsSyncCallback(merged.map(h => ({
                id: h.id,
                userId: h.userId,
                title: h.title,
                description: h.description,
                completedDates: h.completedDates,
                streak: h.streak,
                createdAt: h.createdAt,
            })));
        }

        processPendingOperations();
    } catch (error) {
        console.warn('[Data] Background sync failed for habits:', error);
    }
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
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('ogrogoti_habits_'));
    let userId = '';

    for (const key of allKeys) {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        if (data.some((h: any) => h.id === id)) {
            userId = key.replace('ogrogoti_habits_', '');
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
    if (!userId) return DEFAULT_SETTINGS;

    // 1. Get local data immediately (FAST - no network wait)
    const localSettings = getLocalSettings(userId);

    if (localSettings) {
        console.log('[Data] Returning local settings immediately');

        // 2. Sync in background (non-blocking)
        if (isOnline()) {
            syncSettingsInBackground(userId, localSettings);
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

    // 3. No local settings - return defaults immediately, fetch in background
    console.log('[Data] No local settings, using defaults');

    if (isOnline()) {
        // Fetch settings in background for next page load
        fetchRemoteSettings(userId).then(remoteSettings => {
            if (remoteSettings) {
                saveLocalSettings(userId, {
                    ...remoteSettings,
                    updatedAt: (remoteSettings as any).updatedAt || Date.now(),
                    syncStatus: 'synced',
                });
            }
        }).catch(err => console.warn('[Data] Failed to fetch settings:', err));
    }

    return DEFAULT_SETTINGS;
};

// Background sync for settings
const syncSettingsInBackground = async (userId: string, localSettings: StoredSettings) => {
    try {
        const remoteSettings = await fetchRemoteSettings(userId);
        if (remoteSettings && localSettings.syncStatus === 'synced') {
            const remoteUpdatedAt = (remoteSettings as any).updatedAt || 0;
            if (remoteUpdatedAt > localSettings.updatedAt) {
                saveLocalSettings(userId, {
                    ...remoteSettings,
                    updatedAt: remoteUpdatedAt,
                    syncStatus: 'synced',
                });
            }
        }
    } catch (error) {
        console.warn('[Data] Background settings sync failed:', error);
    }
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
