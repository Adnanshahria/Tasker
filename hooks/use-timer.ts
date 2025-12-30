import { useEffect, useRef, useCallback } from 'react';
import { useTimerStore } from '../store/timerStore';

export const useTimer = () => {
    const rafRef = useRef<number | null>(null);
    const lastTickRef = useRef<number>(0);

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
    const tick = useTimerStore((state) => state.tick);
    const completeSession = useTimerStore((state) => state.completeSession);

    // High-precision tick using requestAnimationFrame
    const runTimer = useCallback((timestamp: number) => {
        if (!lastTickRef.current) {
            lastTickRef.current = timestamp;
        }

        const elapsed = timestamp - lastTickRef.current;

        // Tick every second (1000ms)
        if (elapsed >= 1000) {
            const state = useTimerStore.getState();

            if (state.timeLeft <= 1) {
                // Timer completed
                tick();
                completeSession();
                return; // Stop the loop
            }

            tick();
            lastTickRef.current = timestamp - (elapsed % 1000); // Carry over remainder for precision
        }

        // Continue the loop
        rafRef.current = requestAnimationFrame(runTimer);
    }, [tick, completeSession]);

    // Start/stop the timer loop based on isActive
    useEffect(() => {
        if (isActive) {
            lastTickRef.current = 0;
            rafRef.current = requestAnimationFrame(runTimer);
        } else {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        }

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [isActive, runTimer]);

    // Calculate progress percentage
    const progress = sessionDuration > 0
        ? ((sessionDuration - timeLeft) / sessionDuration) * 100
        : 0;

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
        formattedTime: formatTime(timeLeft),

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
