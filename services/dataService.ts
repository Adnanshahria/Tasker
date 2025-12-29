// Firestore-based Data Service
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
}

// Default Settings
export const DEFAULT_SETTINGS_BN: UserSettings = {
    subjects: ['পদার্থবিজ্ঞান', 'রসায়ন', 'গণিত', 'জীববিজ্ঞান', 'ICT', 'ইংরেজি', 'বাংলা'],
    types: ['প্রজেক্ট', 'অ্যাসাইনমেন্ট', 'কুইজ', 'পরীক্ষা', 'Lab', 'প্রেজেন্টেশন'],
    statuses: ['Not Started', 'চলছে', 'Completed'],
    priorities: ['Low', 'Medium', 'Urgent', 'জরুরি'],
    language: 'bn'
};

// ==================== ASSIGNMENTS ====================
export const getAssignments = async (userId: string): Promise<LocalAssignment[]> => {
    if (!userId) {
        console.error('getAssignments: No userId provided');
        return [];
    }
    try {
        console.log('Fetching assignments for userId:', userId);
        const q = query(
            collection(db, 'assignments'),
            where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);
        console.log('Found', snapshot.docs.length, 'assignments');
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LocalAssignment));
        return data.sort((a, b) => a.dueDate - b.dueDate);
    } catch (error) {
        console.error('Error fetching assignments:', error);
        return [];
    }
};

export const saveAssignment = async (data: Omit<LocalAssignment, 'id'>): Promise<string> => {
    if (!data.userId) {
        throw new Error('userId is required');
    }
    try {
        console.log('Saving assignment for userId:', data.userId);
        const docRef = await addDoc(collection(db, 'assignments'), {
            ...data,
            createdAt: Date.now()
        });
        console.log('Assignment saved with id:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error saving assignment:', error);
        throw error;
    }
};

export const updateAssignment = async (id: string, data: Partial<LocalAssignment>): Promise<void> => {
    try {
        await updateDoc(doc(db, 'assignments', id), data);
    } catch (error) {
        console.error('Error updating assignment:', error);
        throw error;
    }
};

export const deleteAssignment = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, 'assignments', id));
    } catch (error) {
        console.error('Error deleting assignment:', error);
        throw error;
    }
};

// ==================== HABITS ====================
export const getHabits = async (userId: string): Promise<LocalHabit[]> => {
    if (!userId) return [];
    try {
        const q = query(
            collection(db, 'habits'),
            where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LocalHabit));
    } catch (error) {
        console.error('Error fetching habits:', error);
        return [];
    }
};

export const saveHabit = async (data: Omit<LocalHabit, 'id'>): Promise<string> => {
    if (!data.userId) throw new Error('userId is required');
    try {
        const docRef = await addDoc(collection(db, 'habits'), {
            ...data,
            createdAt: Date.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving habit:', error);
        throw error;
    }
};

export const updateHabit = async (id: string, data: Partial<LocalHabit>): Promise<void> => {
    try {
        await updateDoc(doc(db, 'habits', id), data);
    } catch (error) {
        console.error('Error updating habit:', error);
        throw error;
    }
};

export const deleteHabit = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, 'habits', id));
    } catch (error) {
        console.error('Error deleting habit:', error);
        throw error;
    }
};

// ==================== SETTINGS ====================
export const getSettings = async (userId: string): Promise<UserSettings> => {
    if (!userId) return DEFAULT_SETTINGS_BN;
    try {
        const docRef = doc(db, 'settings', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as UserSettings;
        }
        return DEFAULT_SETTINGS_BN;
    } catch (error) {
        console.error('Error fetching settings:', error);
        return DEFAULT_SETTINGS_BN;
    }
};

export const saveSettings = async (userId: string, settings: UserSettings): Promise<void> => {
    if (!userId) throw new Error('userId is required');
    try {
        await setDoc(doc(db, 'settings', userId), settings);
    } catch (error) {
        console.error('Error saving settings:', error);
        throw error;
    }
};
