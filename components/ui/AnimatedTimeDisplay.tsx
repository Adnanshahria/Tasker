import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedTimeDisplayProps {
    time: string; // Format: "HH:MM" (24h)
    onTimeChange?: (time: string) => void;
    isAutoCalculated?: boolean;
}

// Helper to format time to 12h
const formatTime12h = (timeStr: string): { hour: string; minute: string; ampm: string } => {
    if (!timeStr) return { hour: '--', minute: '--', ampm: '' };
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return {
        hour: hour12.toString().padStart(2, '0'),
        minute: m.toString().padStart(2, '0'),
        ampm
    };
};

// Single animated digit
const AnimatedDigit: React.FC<{ value: string; delay?: number }> = ({ value, delay = 0 }) => {
    return (
        <motion.span
            key={value}
            initial={{ y: -30, opacity: 0, scale: 0.5 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.5 }}
            transition={{
                type: 'spring',
                stiffness: 400,
                damping: 20,
                delay,
            }}
            className="inline-block"
        >
            {value}
        </motion.span>
    );
};

// Animated counting effect for time
const AnimatedTimeDisplay: React.FC<AnimatedTimeDisplayProps> = ({
    time,
    isAutoCalculated = false,
}) => {
    const [displayTime, setDisplayTime] = useState(time);
    const [isAnimating, setIsAnimating] = useState(false);
    const prevTimeRef = useRef(time);

    useEffect(() => {
        if (time !== prevTimeRef.current && isAutoCalculated && time && prevTimeRef.current) {
            // Animate the counting effect
            setIsAnimating(true);

            const startTime = prevTimeRef.current;
            const endTime = time;

            const [startH, startM] = startTime.split(':').map(Number);
            const [endH, endM] = endTime.split(':').map(Number);

            const startMins = startH * 60 + startM;
            const endMins = endH * 60 + endM;

            const diff = endMins - startMins;
            const steps = Math.min(Math.abs(diff), 20); // Max 20 steps for animation
            const stepDuration = 50; // ms per step

            if (steps > 0) {
                let currentStep = 0;
                const interval = setInterval(() => {
                    currentStep++;
                    const progress = currentStep / steps;
                    const currentMins = Math.round(startMins + (diff * progress));

                    let normalizedMins = currentMins;
                    if (normalizedMins < 0) normalizedMins += 24 * 60;
                    if (normalizedMins >= 24 * 60) normalizedMins -= 24 * 60;

                    const h = Math.floor(normalizedMins / 60);
                    const m = normalizedMins % 60;
                    setDisplayTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);

                    if (currentStep >= steps) {
                        clearInterval(interval);
                        setDisplayTime(time);
                        setIsAnimating(false);
                    }
                }, stepDuration);

                return () => clearInterval(interval);
            } else {
                setDisplayTime(time);
                setIsAnimating(false);
            }
        } else {
            setDisplayTime(time);
        }

        prevTimeRef.current = time;
    }, [time, isAutoCalculated]);

    const { hour, minute, ampm } = formatTime12h(displayTime);

    return (
        <div className="relative">
            <motion.div
                className="font-mono text-sm flex items-center gap-0.5"
                animate={isAnimating ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.3 }}
            >
                <AnimatePresence mode="popLayout">
                    <AnimatedDigit key={`h1-${hour[0]}`} value={hour[0]} delay={0} />
                    <AnimatedDigit key={`h2-${hour[1]}`} value={hour[1]} delay={0.02} />
                </AnimatePresence>
                <motion.span
                    animate={isAnimating ? { opacity: [1, 0.3, 1] } : {}}
                    transition={{ repeat: isAnimating ? Infinity : 0, duration: 0.3 }}
                >
                    :
                </motion.span>
                <AnimatePresence mode="popLayout">
                    <AnimatedDigit key={`m1-${minute[0]}`} value={minute[0]} delay={0.04} />
                    <AnimatedDigit key={`m2-${minute[1]}`} value={minute[1]} delay={0.06} />
                </AnimatePresence>
                {ampm && (
                    <motion.span
                        key={ampm}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="ml-1 text-xs text-slate-400"
                    >
                        {ampm}
                    </motion.span>
                )}
            </motion.div>

            {/* Glow effect when animating */}
            {isAnimating && (
                <motion.div
                    className="absolute inset-0 rounded bg-indigo-500/20 blur-md -z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                />
            )}
        </div>
    );
};

export default AnimatedTimeDisplay;
