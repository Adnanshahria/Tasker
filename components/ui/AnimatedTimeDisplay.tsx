import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedTimeDisplayProps {
    time: string;
    isAutoCalculated?: boolean;
    className?: string;
}

const formatTime12h = (timeStr: string): { hours: string; minutes: string; ampm: string } => {
    if (!timeStr) return { hours: '--', minutes: '--', ampm: '' };
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

// Fast rolling digit
const RollingDigit: React.FC<{ digit: string }> = ({ digit }) => (
    <div className="relative w-[0.55em] h-[1.1em] overflow-hidden inline-flex justify-center">
        <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
                key={digit}
                initial={{ y: -15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 15, opacity: 0 }}
                transition={{ duration: 0.1, ease: 'easeOut' }}
                className="absolute"
            >
                {digit}
            </motion.span>
        </AnimatePresence>
    </div>
);

const AnimatedTimeDisplay: React.FC<AnimatedTimeDisplayProps> = ({
    time,
    isAutoCalculated = false,
    className = '',
}) => {
    const [displayTime, setDisplayTime] = useState(time);
    const prevTimeRef = useRef(time);
    const animationRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (animationRef.current) {
            clearInterval(animationRef.current);
            animationRef.current = null;
        }

        if (time !== prevTimeRef.current && isAutoCalculated && time && prevTimeRef.current) {
            const [sh, sm] = prevTimeRef.current.split(':').map(Number);
            const [eh, em] = time.split(':').map(Number);

            const startMins = sh * 60 + sm;
            const endMins = eh * 60 + em;
            const diff = endMins - startMins;

            // FAST: 8 steps at 60ms each = ~0.5 seconds total
            const steps = Math.min(Math.abs(diff), 8);
            let step = 0;

            if (steps > 0) {
                animationRef.current = setInterval(() => {
                    step++;
                    const progress = step / steps;
                    const eased = 1 - Math.pow(1 - progress, 2);
                    let currentMins = Math.round(startMins + diff * eased);
                    if (currentMins < 0) currentMins += 1440;
                    if (currentMins >= 1440) currentMins -= 1440;

                    const h = Math.floor(currentMins / 60);
                    const m = currentMins % 60;
                    setDisplayTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);

                    if (step >= steps) {
                        clearInterval(animationRef.current!);
                        setDisplayTime(time);
                    }
                }, 60);
            } else {
                setDisplayTime(time);
            }
        } else {
            setDisplayTime(time);
        }

        prevTimeRef.current = time;
        return () => { if (animationRef.current) clearInterval(animationRef.current); };
    }, [time, isAutoCalculated]);

    const { hours, minutes, ampm } = formatTime12h(displayTime);

    return (
        <span className={`inline-flex items-center font-mono text-sm ${className}`}>
            <RollingDigit digit={hours[0]} />
            <RollingDigit digit={hours[1]} />
            <span className="mx-0.5">:</span>
            <RollingDigit digit={minutes[0]} />
            <RollingDigit digit={minutes[1]} />
            {ampm && <span className="ml-1 text-xs text-slate-400">{ampm}</span>}
        </span>
    );
};

export default AnimatedTimeDisplay;
