import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedTimeDisplayProps {
    time: string; // Format: "HH:MM" (24h)
    isAutoCalculated?: boolean;
    className?: string;
}

// Helper to format time to 12h
const formatTime12h = (timeStr: string): { hour: string; minute: string; ampm: string } => {
    if (!timeStr || timeStr === '--:--') return { hour: '--', minute: '--', ampm: '' };
    const parts = timeStr.split(':');
    if (parts.length !== 2) return { hour: '--', minute: '--', ampm: '' };
    const h = parseInt(parts[0]) || 0;
    const m = parseInt(parts[1]) || 0;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return {
        hour: hour12.toString().padStart(2, '0'),
        minute: m.toString().padStart(2, '0'),
        ampm
    };
};

// Single animated digit with slot machine effect
const SlotDigit: React.FC<{ value: string; delay?: number }> = ({ value, delay = 0 }) => {
    return (
        <div className="relative h-6 w-3 overflow-hidden">
            <AnimatePresence mode="popLayout">
                <motion.span
                    key={value}
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 30, opacity: 0 }}
                    transition={{
                        type: 'spring',
                        stiffness: 200,
                        damping: 20,
                        delay,
                        duration: 0.4,
                    }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    {value}
                </motion.span>
            </AnimatePresence>
        </div>
    );
};

// Animated counting effect for time - SLOWER slot machine style
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
        // Clear any existing animation
        if (animationRef.current) {
            clearInterval(animationRef.current);
        }

        if (time !== prevTimeRef.current && isAutoCalculated && time && prevTimeRef.current) {
            // Animate the counting effect - SLOW slot machine style
            setIsAnimating(true);

            const startTime = prevTimeRef.current;
            const endTime = time;

            // Parse times
            const startParts = startTime.split(':');
            const endParts = endTime.split(':');

            if (startParts.length !== 2 || endParts.length !== 2) {
                setDisplayTime(time);
                prevTimeRef.current = time;
                return;
            }

            const startH = parseInt(startParts[0]) || 0;
            const startM = parseInt(startParts[1]) || 0;
            const endH = parseInt(endParts[0]) || 0;
            const endM = parseInt(endParts[1]) || 0;

            const startMins = startH * 60 + startM;
            const endMins = endH * 60 + endM;

            const diff = endMins - startMins;

            // SLOWER animation: 40 steps over 2 seconds = 50ms per step
            const totalSteps = Math.min(Math.abs(diff), 40);
            const stepDuration = 100; // 100ms per step = SLOW, visible animation

            if (totalSteps > 0) {
                let currentStep = 0;

                animationRef.current = setInterval(() => {
                    currentStep++;

                    // Ease-out: slow down at the end
                    const progress = 1 - Math.pow(1 - (currentStep / totalSteps), 2);
                    const currentMins = Math.round(startMins + (diff * progress));

                    let normalizedMins = currentMins;
                    if (normalizedMins < 0) normalizedMins += 24 * 60;
                    if (normalizedMins >= 24 * 60) normalizedMins -= 24 * 60;

                    const h = Math.floor(normalizedMins / 60);
                    const m = normalizedMins % 60;
                    setDisplayTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);

                    if (currentStep >= totalSteps) {
                        if (animationRef.current) {
                            clearInterval(animationRef.current);
                            animationRef.current = null;
                        }
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
        }

        prevTimeRef.current = time;

        return () => {
            if (animationRef.current) {
                clearInterval(animationRef.current);
            }
        };
    }, [time, isAutoCalculated]);

    const { hour, minute, ampm } = formatTime12h(displayTime);

    return (
        <div className={`relative ${className}`}>
            <motion.div
                className="font-mono text-sm flex items-center"
                animate={isAnimating ? {
                    scale: [1, 1.05, 1],
                    textShadow: ['0 0 0px transparent', '0 0 10px rgba(99, 102, 241, 0.5)', '0 0 0px transparent']
                } : {}}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center">
                    <SlotDigit value={hour[0]} delay={0} />
                    <SlotDigit value={hour[1]} delay={0.05} />
                </div>
                <motion.span
                    className="mx-0.5"
                    animate={isAnimating ? { opacity: [1, 0.3, 1] } : {}}
                    transition={{ repeat: isAnimating ? Infinity : 0, duration: 0.2 }}
                >
                    :
                </motion.span>
                <div className="flex items-center">
                    <SlotDigit value={minute[0]} delay={0.1} />
                    <SlotDigit value={minute[1]} delay={0.15} />
                </div>
                {ampm && (
                    <motion.span
                        key={ampm}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="ml-1 text-xs text-slate-400"
                    >
                        {ampm}
                    </motion.span>
                )}
            </motion.div>

            {/* Glowing border effect when animating */}
            <AnimatePresence>
                {isAnimating && (
                    <motion.div
                        className="absolute -inset-2 rounded-lg border-2 border-indigo-500/50 -z-10"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0.95, 1.02, 0.95]
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 0.8,
                            repeat: Infinity
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Background glow */}
            <AnimatePresence>
                {isAnimating && (
                    <motion.div
                        className="absolute -inset-3 rounded-lg bg-indigo-500/10 blur-md -z-20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.8, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1, repeat: Infinity }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default AnimatedTimeDisplay;
