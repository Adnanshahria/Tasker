import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedTimeDisplayProps {
    time: string; // Format: "HH:MM" (24h)
    isAutoCalculated?: boolean;
    className?: string;
}

// Helper to format time to 12h
const formatTime12h = (timeStr: string): { hours: string; minutes: string; ampm: string } => {
    if (!timeStr || timeStr === '--:--') return { hours: '--', minutes: '--', ampm: '' };
    const parts = timeStr.split(':');
    if (parts.length !== 2) return { hours: '--', minutes: '--', ampm: '' };
    const h = parseInt(parts[0]) || 0;
    const m = parseInt(parts[1]) || 0;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return {
        hours: hour12.toString().padStart(2, '0'),
        minutes: m.toString().padStart(2, '0'),
        ampm
    };
};

// Single digit slot
const SlotDigit: React.FC<{ digit: string; direction?: 'up' | 'down' }> = ({ digit, direction = 'down' }) => (
    <div className="relative w-[0.6em] h-[1.2em] overflow-hidden inline-flex items-center justify-center">
        <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
                key={digit}
                initial={{ y: direction === 'down' ? -20 : 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: direction === 'down' ? 20 : -20, opacity: 0 }}
                transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                    duration: 0.3
                }}
                className="absolute"
            >
                {digit}
            </motion.span>
        </AnimatePresence>
    </div>
);

// Rolling slot machine animation for auto-calculated fields
const AnimatedTimeDisplay: React.FC<AnimatedTimeDisplayProps> = ({
    time,
    isAutoCalculated = false,
    className = '',
}) => {
    const [displayTime, setDisplayTime] = useState(time);
    const [isAnimating, setIsAnimating] = useState(false);
    const prevTimeRef = useRef(time);
    const animationRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (animationRef.current) {
            clearInterval(animationRef.current);
            animationRef.current = null;
        }

        if (time !== prevTimeRef.current && isAutoCalculated && time && prevTimeRef.current) {
            setIsAnimating(true);

            const startParts = prevTimeRef.current.split(':');
            const endParts = time.split(':');

            if (startParts.length === 2 && endParts.length === 2) {
                const startH = parseInt(startParts[0]) || 0;
                const startM = parseInt(startParts[1]) || 0;
                const endH = parseInt(endParts[0]) || 0;
                const endM = parseInt(endParts[1]) || 0;

                const startMins = startH * 60 + startM;
                const endMins = endH * 60 + endM;
                const diff = endMins - startMins;

                // Animate through values - 15 steps over 1.5 seconds
                const totalSteps = Math.min(Math.abs(diff), 15);
                const stepDuration = 100;

                if (totalSteps > 0) {
                    let step = 0;
                    animationRef.current = setInterval(() => {
                        step++;
                        const progress = step / totalSteps;
                        // Ease out for smoother end
                        const easedProgress = 1 - Math.pow(1 - progress, 2);
                        const currentMins = Math.round(startMins + diff * easedProgress);

                        let normalizedMins = currentMins % (24 * 60);
                        if (normalizedMins < 0) normalizedMins += 24 * 60;

                        const h = Math.floor(normalizedMins / 60);
                        const m = normalizedMins % 60;
                        setDisplayTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);

                        if (step >= totalSteps) {
                            clearInterval(animationRef.current!);
                            animationRef.current = null;
                            setDisplayTime(time);
                            setTimeout(() => setIsAnimating(false), 200);
                        }
                    }, stepDuration);
                } else {
                    setDisplayTime(time);
                    setIsAnimating(false);
                }
            } else {
                setDisplayTime(time);
                setIsAnimating(false);
            }
        } else {
            setDisplayTime(time);
        }

        prevTimeRef.current = time;

        return () => {
            if (animationRef.current) {
                clearInterval(animationRef.current);
            }
        };
    }, [time, isAutoCalculated]);

    const { hours, minutes, ampm } = formatTime12h(displayTime);

    return (
        <div className={`relative inline-flex items-center ${className}`}>
            <motion.div
                className="font-mono text-sm flex items-center"
                animate={isAnimating ? {
                    scale: [1, 1.02, 1],
                } : {}}
            >
                {/* Hours */}
                <span className="inline-flex">
                    <SlotDigit digit={hours[0]} />
                    <SlotDigit digit={hours[1]} />
                </span>

                <span className="mx-0.5">:</span>

                {/* Minutes */}
                <span className="inline-flex">
                    <SlotDigit digit={minutes[0]} />
                    <SlotDigit digit={minutes[1]} />
                </span>

                {ampm && (
                    <motion.span
                        key={ampm}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="ml-1 text-xs text-slate-400"
                    >
                        {ampm}
                    </motion.span>
                )}
            </motion.div>

            {/* Glow effect when animating */}
            {isAnimating && (
                <motion.div
                    className="absolute -inset-1 rounded bg-indigo-500/20 blur-sm -z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                />
            )}
        </div>
    );
};

export default AnimatedTimeDisplay;
