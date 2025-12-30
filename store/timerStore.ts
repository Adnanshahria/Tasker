import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TimerMode } from '../types';

// Default durations in seconds
const DEFAULT_DURATIONS = {
    pomodoro: 25 * 60,      // 25 minutes
    shortBreak: 5 * 60,     // 5 minutes
    longBreak: 15 * 60,     // 15 minutes
};

interface TimerState {
    // Timer state
    mode: TimerMode;
    timeLeft: number;
    isActive: boolean;
    pomodorosCompleted: number;
    sessionStartTime: number | null;
    sessionDuration: number;

    // Settings
    durations: {
        pomodoro: number;
        shortBreak: number;
        longBreak: number;
    };

    // DeepFocus settings
    antiBurnIn: boolean;
    dailyGoal: number; // in minutes
    borderColor: 'blue' | 'red' | 'white' | 'none' | 'yellow' | 'cyan' | 'purple' | 'green' | 'orange' | 'pink';

    // Actions
    start: () => void;
    pause: () => void;
    reset: () => void;
    setMode: (mode: TimerMode) => void;
    addTime: (seconds: number) => void;
    subtractTime: (seconds: number) => void;
    tick: () => void;
    completeSession: () => void;
    setDurations: (durations: Partial<TimerState['durations']>) => void;
    setAntiBurnIn: (enabled: boolean) => void;
    setDailyGoal: (minutes: number) => void;
    setBorderColor: (color: TimerState['borderColor']) => void;
}

export const useTimerStore = create<TimerState>()(
    persist(
        (set, get) => ({
            // Initial state
            mode: 'pomodoro',
            timeLeft: DEFAULT_DURATIONS.pomodoro,
            isActive: false,
            pomodorosCompleted: 0,
            sessionStartTime: null,
            sessionDuration: DEFAULT_DURATIONS.pomodoro,
            durations: { ...DEFAULT_DURATIONS },

            // DeepFocus settings
            antiBurnIn: true,
            dailyGoal: 120, // 2 hours default
            borderColor: 'white',

            // Actions
            start: () => {
                const state = get();
                set({
                    isActive: true,
                    sessionStartTime: state.sessionStartTime ?? Date.now(),
                });
            },

            pause: () => {
                set({ isActive: false });
            },

            reset: () => {
                const state = get();
                set({
                    timeLeft: state.durations[state.mode],
                    isActive: false,
                    sessionStartTime: null,
                    sessionDuration: state.durations[state.mode],
                });
            },

            setMode: (mode: TimerMode) => {
                const state = get();
                set({
                    mode,
                    timeLeft: state.durations[mode],
                    isActive: false,
                    sessionStartTime: null,
                    sessionDuration: state.durations[mode],
                });
            },

            addTime: (seconds: number) => {
                set((state) => ({
                    timeLeft: state.timeLeft + seconds,
                    sessionDuration: state.sessionDuration + seconds,
                }));
            },

            subtractTime: (seconds: number) => {
                set((state) => ({
                    timeLeft: Math.max(0, state.timeLeft - seconds),
                    sessionDuration: Math.max(0, state.sessionDuration - seconds),
                }));
            },

            tick: () => {
                const state = get();
                if (state.timeLeft > 0 && state.isActive) {
                    set({ timeLeft: state.timeLeft - 1 });
                }
            },

            completeSession: () => {
                const state = get();

                if (state.mode === 'pomodoro') {
                    const newPomosCompleted = state.pomodorosCompleted + 1;
                    // After 4 pomodoros, take a long break
                    const nextMode: TimerMode = newPomosCompleted % 4 === 0 ? 'longBreak' : 'shortBreak';

                    set({
                        pomodorosCompleted: newPomosCompleted,
                        mode: nextMode,
                        timeLeft: state.durations[nextMode],
                        isActive: false,
                        sessionStartTime: null,
                        sessionDuration: state.durations[nextMode],
                    });
                } else {
                    // After break, go back to pomodoro
                    set({
                        mode: 'pomodoro',
                        timeLeft: state.durations.pomodoro,
                        isActive: false,
                        sessionStartTime: null,
                        sessionDuration: state.durations.pomodoro,
                    });
                }
            },

            setDurations: (newDurations) => {
                const state = get();
                const updated = { ...state.durations, ...newDurations };
                set({
                    durations: updated,
                    timeLeft: updated[state.mode],
                    sessionDuration: updated[state.mode],
                });
            },

            setAntiBurnIn: (enabled: boolean) => {
                set({ antiBurnIn: enabled });
            },

            setDailyGoal: (minutes: number) => {
                set({ dailyGoal: Math.max(1, minutes) });
            },

            setBorderColor: (color) => {
                set({ borderColor: color });
            },
        }),
        {
            name: 'ogrogoti-timer-storage',
            partialize: (state) => ({
                mode: state.mode,
                pomodorosCompleted: state.pomodorosCompleted,
                durations: state.durations,
                antiBurnIn: state.antiBurnIn,
                dailyGoal: state.dailyGoal,
                borderColor: state.borderColor,
                // Don't persist isActive, timeLeft, sessionStartTime for clean restart
            }),
        }
    )
);
