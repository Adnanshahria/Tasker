import { useEffect, useRef, useCallback } from 'react';
import { useTimerStore } from '../store/timerStore';

export const useTimer = () => {
    // Timer logic is now handled by TimerController.tsx

    // Selectors
    const isActive = useTimerStore((state) => state.isActive);
    const timeLeft = useTimerStore((state) => state.timeLeft);
    const mode = useTimerStore((state) => state.mode);
    const pomodorosCompleted = useTimerStore((state) => state.pomodorosCompleted);
    const durations = useTimerStore((state) => state.durations);
    const sessionDuration = useTimerStore((state) => state.sessionDuration);

    const start = useTimerStore((state) => state.start);
    const pause = useTimerStore((state) => state.pause);
    const reset = useTimerStore((state) => state.reset);
    const setMode = useTimerStore((state) => state.setMode);
    const addTime = useTimerStore((state) => state.addTime);
    const subtractTime = useTimerStore((state) => state.subtractTime);

    // Calculate progress percentage
    const progress = sessionDuration > 0
        ? ((sessionDuration - timeLeft) / sessionDuration) * 100
        : 0;

    // Calculate elapsed time in seconds
    const elapsedTime = sessionDuration - timeLeft;

    // Format time as MM:SS
    const formatTime = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    return {
        // State
        isActive,
        timeLeft,
        mode,
        pomodorosCompleted,
        durations,
        progress,
        elapsedTime,
        formattedTime: formatTime(timeLeft),
        formattedElapsedTime: formatTime(elapsedTime),

        // Actions
        start,
        pause,
        reset,
        setMode,
        addTime: () => addTime(180), // Add 3 minutes
        subtractTime: () => subtractTime(180), // Subtract 3 minutes
        toggle: () => isActive ? pause() : start(),
    };
};
