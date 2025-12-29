// Local Storage Data Service
// Replaces Firebase Firestore with localStorage for fully offline operation

const ASSIGNMENTS_KEY = 'zenith_assignments';
const HABITS_KEY = 'zenith_habits';

export interface LocalAssignment {
    id: string;
    userId: string;
    title: string;
    description?: string; // Optional description
    subject: string;
    dueDate: number; // Unix timestamp (milliseconds)
    startTime?: string; // HH:mm format (24-hour)
    endTime?: string; // HH:mm format (24-hour)
    status: string;
    priority: string;
    type: string;
    weight?: number;
    score?: number;
    totalPoints?: number;
}

export interface LocalHabit {
    id: string;
    userId: string;
    title: string;
    description?: string; // Optional description
    completedDates: string[];
    streak?: number;
    createdAt?: number;
}

const generateId = () => 'id_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

// --- Assignments ---
export const getAssignments = (userId: string): LocalAssignment[] => {
    const data = localStorage.getItem(ASSIGNMENTS_KEY);
    const all: LocalAssignment[] = data ? JSON.parse(data) : [];
    return all.filter(a => a.userId === userId).sort((a, b) => a.dueDate - b.dueDate);
};

export const saveAssignment = (assignment: Omit<LocalAssignment, 'id'>): LocalAssignment => {
    const data = localStorage.getItem(ASSIGNMENTS_KEY);
    const all: LocalAssignment[] = data ? JSON.parse(data) : [];
    const newAssignment = { ...assignment, id: generateId() };
    all.push(newAssignment);
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(all));
    return newAssignment;
};

export const updateAssignment = (id: string, updates: Partial<LocalAssignment>): void => {
    const data = localStorage.getItem(ASSIGNMENTS_KEY);
    const all: LocalAssignment[] = data ? JSON.parse(data) : [];
    const index = all.findIndex(a => a.id === id);
    if (index !== -1) {
        all[index] = { ...all[index], ...updates };
        localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(all));
    }
};

export const deleteAssignment = (id: string): void => {
    const data = localStorage.getItem(ASSIGNMENTS_KEY);
    let all: LocalAssignment[] = data ? JSON.parse(data) : [];
    all = all.filter(a => a.id !== id);
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(all));
};

// --- Habits ---
export const getHabits = (userId: string): LocalHabit[] => {
    const data = localStorage.getItem(HABITS_KEY);
    const all: LocalHabit[] = data ? JSON.parse(data) : [];
    return all.filter(h => h.userId === userId);
};

export const saveHabit = (habit: Omit<LocalHabit, 'id'>): LocalHabit => {
    const data = localStorage.getItem(HABITS_KEY);
    const all: LocalHabit[] = data ? JSON.parse(data) : [];
    const newHabit = { ...habit, id: generateId() };
    all.push(newHabit);
    localStorage.setItem(HABITS_KEY, JSON.stringify(all));
    return newHabit;
};

export const updateHabit = (id: string, updates: Partial<LocalHabit>): void => {
    const data = localStorage.getItem(HABITS_KEY);
    const all: LocalHabit[] = data ? JSON.parse(data) : [];
    const index = all.findIndex(h => h.id === id);
    if (index !== -1) {
        all[index] = { ...all[index], ...updates };
        localStorage.setItem(HABITS_KEY, JSON.stringify(all));
    }
};

export const deleteHabit = (id: string): void => {
    const data = localStorage.getItem(HABITS_KEY);
    let all: LocalHabit[] = data ? JSON.parse(data) : [];
    all = all.filter(h => h.id !== id);
    localStorage.setItem(HABITS_KEY, JSON.stringify(all));
};
