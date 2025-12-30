import React, { useEffect, useRef, useCallback } from 'react';
import { useTimerStore } from '../../store/timerStore';

const TimerController: React.FC = () => {
    const rafRef = useRef<number | null>(null);
    const lastTickRef = useRef<number>(0);

    const isActive = useTimerStore((state) => state.isActive);
    const timeLeft = useTimerStore((state) => state.timeLeft);
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
            // Carry over remainder for precision, but prevent "catch up" spirals by capping
            // If tab was inactive for long time, elapsed could be huge.
            // Just sync to next second.
            lastTickRef.current = timestamp - (elapsed % 1000);
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

    return null; // This component handles logic only
};

export default TimerController;
