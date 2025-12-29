import React, { useState, useEffect } from 'react';
import { X, Clock, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimePickerProps {
    isOpen: boolean;
    value: string;
    onChange: (time: string) => void;
    onClose: () => void;
    label?: string;
}

const TimePicker: React.FC<TimePickerProps> = ({ isOpen, value, onChange, onClose, label = 'Select Time' }) => {
    const [hours, setHours] = useState(12);
    const [minutes, setMinutes] = useState(0);
    const [mode, setMode] = useState<'hours' | 'minutes'>('hours');
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':').map(Number);
            setHours(h);
            setMinutes(m);
        }
    }, [value]);

    if (!isOpen) return null;

    const handleHourClick = (hour12: number) => {
        setIsAnimating(true);
        // Convert 12h to 24h based on AM/PM
        let newHour: number;
        if (hours >= 12) {
            // PM
            newHour = hour12 === 12 ? 12 : hour12 + 12;
        } else {
            // AM
            newHour = hour12 === 12 ? 0 : hour12;
        }
        setHours(newHour);
        // Auto-switch to minutes after selecting hour
        setTimeout(() => {
            setMode('minutes');
            setIsAnimating(false);
        }, 300);
    };

    const handleMinuteClick = (minute: number) => {
        setIsAnimating(true);
        setMinutes(minute);
        setTimeout(() => setIsAnimating(false), 300);
    };

    const handleConfirm = () => {
        const h = hours.toString().padStart(2, '0');
        const m = minutes.toString().padStart(2, '0');
        onChange(`${h}:${m}`);
        onClose();
    };

    const handleClear = () => {
        onChange('');
        onClose();
    };

    const toggleAMPM = () => {
        setIsAnimating(true);
        if (hours < 12) {
            setHours(hours + 12);
        } else {
            setHours(hours - 12);
        }
        setTimeout(() => setIsAnimating(false), 300);
    };

    // Calculate hand angle
    const getHandAngle = () => {
        if (mode === 'hours') {
            const hour12 = hours % 12 || 12;
            return (hour12 * 30 - 90);
        } else {
            return (Math.floor(minutes / 5) * 30 - 90);
        }
    };

    // Generate hour markers (1-12 displayed in circle)
    const hourMarkers = Array.from({ length: 12 }, (_, i) => {
        const hour12 = i === 0 ? 12 : i;
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const radius = 70;
        const x = 100 + radius * Math.cos(angle);
        const y = 100 + radius * Math.sin(angle);

        const currentHour12 = hours % 12 === 0 ? 12 : hours % 12;
        const isSelected = currentHour12 === hour12;

        return { hour12, x, y, isSelected, angle: i * 30 - 90 };
    });

    // Generate minute markers
    const minuteMarkers = Array.from({ length: 12 }, (_, i) => {
        const minute = i * 5;
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const radius = 70;
        const x = 100 + radius * Math.cos(angle);
        const y = 100 + radius * Math.sin(angle);

        const isSelected = Math.floor(minutes / 5) === i;

        return { minute, x, y, isSelected, angle: i * 30 - 90 };
    });

    const handAngle = getHandAngle();
    const handLength = 55;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 30 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 w-full max-w-xs shadow-2xl shadow-indigo-500/20"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <motion.div
                                animate={{ rotate: isAnimating ? 360 : 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Clock size={18} className="text-indigo-400" />
                            </motion.div>
                            <span className="text-sm font-medium text-slate-400">{label}</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Time Display with animation */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <motion.button
                            onClick={() => setMode('hours')}
                            whileTap={{ scale: 0.95 }}
                            className={`text-4xl font-bold transition-all duration-300 ${mode === 'hours'
                                ? 'bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent scale-110'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <motion.span
                                key={hours}
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            >
                                {(hours % 12 === 0 ? 12 : hours % 12).toString().padStart(2, '0')}
                            </motion.span>
                        </motion.button>
                        <motion.span
                            className="text-4xl font-bold text-slate-500"
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                            :
                        </motion.span>
                        <motion.button
                            onClick={() => setMode('minutes')}
                            whileTap={{ scale: 0.95 }}
                            className={`text-4xl font-bold transition-all duration-300 ${mode === 'minutes'
                                ? 'bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent scale-110'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <motion.span
                                key={minutes}
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            >
                                {minutes.toString().padStart(2, '0')}
                            </motion.span>
                        </motion.button>
                        <motion.button
                            onClick={toggleAMPM}
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.05 }}
                            className="ml-2 px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-indigo-500/30 text-slate-300 text-sm font-bold transition-colors"
                        >
                            <motion.span
                                key={hours >= 12 ? 'PM' : 'AM'}
                                initial={{ rotateX: 90 }}
                                animate={{ rotateX: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {hours >= 12 ? 'PM' : 'AM'}
                            </motion.span>
                        </motion.button>
                    </div>

                    {/* Circular Clock with animated hand */}
                    <div className="relative mx-auto w-[200px] h-[200px] rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-indigo-500/30 shadow-inner overflow-hidden">
                        {/* Pulsing ring animation */}
                        <motion.div
                            className="absolute inset-2 rounded-full border border-indigo-500/20"
                            animate={{ scale: [1, 1.02, 1], opacity: [0.3, 0.5, 0.3] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        />

                        {/* SVG for animated hand */}
                        <svg width="200" height="200" className="absolute inset-0">
                            {/* Center dot with pulse */}
                            <motion.circle
                                cx="100"
                                cy="100"
                                r="6"
                                fill="url(#clockGradient2)"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            />

                            {/* Animated hand */}
                            <motion.g
                                animate={{ rotate: handAngle }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 100,
                                    damping: 15,
                                    duration: 0.5
                                }}
                                style={{ transformOrigin: '100px 100px' }}
                            >
                                <line
                                    x1="100"
                                    y1="100"
                                    x2={100 + handLength}
                                    y2="100"
                                    stroke="url(#clockGradient2)"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                                <circle
                                    cx={100 + handLength}
                                    cy="100"
                                    r="8"
                                    fill="url(#clockGradient2)"
                                />
                                {/* Glow effect */}
                                <circle
                                    cx={100 + handLength}
                                    cy="100"
                                    r="12"
                                    fill="url(#clockGradient2)"
                                    opacity="0.3"
                                />
                            </motion.g>

                            <defs>
                                <linearGradient id="clockGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#818cf8" />
                                    <stop offset="100%" stopColor="#a855f7" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Hour/Minute buttons */}
                        {mode === 'hours' ? (
                            hourMarkers.map(({ hour12, x, y, isSelected }, index) => (
                                <motion.button
                                    key={hour12}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.03, type: 'spring', stiffness: 300 }}
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleHourClick(hour12)}
                                    className={`absolute w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold transition-all z-10 ${isSelected
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/50'
                                        : 'text-slate-300 hover:text-white hover:bg-slate-600/70'
                                        }`}
                                    style={{
                                        left: `${x}px`,
                                        top: `${y}px`,
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                >
                                    {hour12}
                                </motion.button>
                            ))
                        ) : (
                            minuteMarkers.map(({ minute, x, y, isSelected }, index) => (
                                <motion.button
                                    key={minute}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.03, type: 'spring', stiffness: 300 }}
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleMinuteClick(minute)}
                                    className={`absolute w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold transition-all z-10 ${isSelected
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/50'
                                        : 'text-slate-300 hover:text-white hover:bg-slate-600/70'
                                        }`}
                                    style={{
                                        left: `${x}px`,
                                        top: `${y}px`,
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                >
                                    {minute.toString().padStart(2, '0')}
                                </motion.button>
                            ))
                        )}
                    </div>

                    {/* Mode indicator */}
                    <div className="flex justify-center gap-2 mt-4 mb-3">
                        <motion.button
                            onClick={() => setMode('hours')}
                            whileTap={{ scale: 0.95 }}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${mode === 'hours'
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                                    : 'bg-slate-700/50 text-slate-400 hover:text-white'
                                }`}
                        >
                            Hours
                        </motion.button>
                        <motion.button
                            onClick={() => setMode('minutes')}
                            whileTap={{ scale: 0.95 }}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${mode === 'minutes'
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                                    : 'bg-slate-700/50 text-slate-400 hover:text-white'
                                }`}
                        >
                            Minutes
                        </motion.button>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-2 pt-3 border-t border-slate-700/50">
                        <motion.button
                            onClick={handleClear}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 py-2.5 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 text-sm font-medium transition-colors"
                        >
                            Clear
                        </motion.button>
                        <motion.button
                            onClick={handleConfirm}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium hover:from-indigo-500 hover:to-purple-500 transition-colors shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                        >
                            <Check size={16} />
                            Confirm
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default TimePicker;
