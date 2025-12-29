import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedTimeDisplayProps {
    time: string; // Format: "HH:MM" (24h)
    isAutoCalculated?: boolean;
    className?: string;
}

// Helper to format time to 12h
const formatTime12h = (timeStr: string): string => {
    if (!timeStr || timeStr === '--:--') return '--:--';
    const parts = timeStr.split(':');
    if (parts.length !== 2) return '--:--';
    const h = parseInt(parts[0]) || 0;
    const m = parseInt(parts[1]) || 0;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
};

// Simple, elegant animated time display
const AnimatedTimeDisplay: React.FC<AnimatedTimeDisplayProps> = ({
    time,
    isAutoCalculated = false,
    className = '',
}) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const prevTimeRef = useRef(time);

    useEffect(() => {
        if (time !== prevTimeRef.current && isAutoCalculated) {
            setIsAnimating(true);
            const timeout = setTimeout(() => setIsAnimating(false), 600);
            prevTimeRef.current = time;
            return () => clearTimeout(timeout);
        }
        prevTimeRef.current = time;
    }, [time, isAutoCalculated]);

    const displayTime = formatTime12h(time);

    return (
        <AnimatePresence mode="wait">
            <motion.span
                key={time}
                initial={isAutoCalculated ? { opacity: 0, scale: 0.8, y: 5 } : false}
                animate={{
                    opacity: 1,
                    scale: isAnimating ? [1, 1.1, 1] : 1,
                    y: 0,
                    color: isAnimating ? ['#ffffff', '#818cf8', '#ffffff'] : '#ffffff'
                }}
                transition={{
                    duration: 0.4,
                    ease: 'easeOut'
                }}
                className={`inline-block ${className}`}
            >
                {displayTime}
            </motion.span>
        </AnimatePresence>
    );
};

export default AnimatedTimeDisplay;
