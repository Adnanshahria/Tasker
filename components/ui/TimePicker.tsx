import React, { useState, useEffect } from 'react';
import { X, Clock, Check } from 'lucide-react';
import { motion } from 'framer-motion';

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

    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':').map(Number);
            setHours(h);
            setMinutes(m);
        }
    }, [value]);

    if (!isOpen) return null;

    const handleHourClick = (hour12: number) => {
        let newHour: number;
        if (hours >= 12) {
            newHour = hour12 === 12 ? 12 : hour12 + 12;
        } else {
            newHour = hour12 === 12 ? 0 : hour12;
        }
        setHours(newHour);
        setTimeout(() => setMode('minutes'), 150);
    };

    const handleMinuteClick = (minute: number) => {
        setMinutes(minute);
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
        setHours(hours < 12 ? hours + 12 : hours - 12);
    };

    // Clock face configuration
    const radius = 80;
    const centerX = 100;
    const centerY = 100;

    // Generate markers
    const hourMarkers = Array.from({ length: 12 }, (_, i) => {
        const hour12 = i === 0 ? 12 : i;
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        const currentHour12 = hours % 12 === 0 ? 12 : hours % 12;
        const isSelected = currentHour12 === hour12;
        return { hour12, x, y, isSelected };
    });

    const minuteMarkers = Array.from({ length: 12 }, (_, i) => {
        const minute = i * 5;
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        const isSelected = Math.floor(minutes / 5) === i;
        return { minute, x, y, isSelected };
    });

    // Hand angle
    const handAngle = mode === 'hours'
        ? (((hours % 12) || 12) * 30 - 90)
        : (Math.floor(minutes / 5) * 30 - 90);
    const handLength = 60;

    const displayHour = hours % 12 === 0 ? 12 : hours % 12;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 w-full max-w-xs shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Clock size={18} className="text-indigo-400" />
                        <span className="text-sm font-medium text-slate-400">{label}</span>
                    </div>
                    <button onClick={onClose} className="p-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Time Display */}
                <div className="flex items-center justify-center gap-1 mb-4">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setMode('hours')}
                        className={`text-5xl font-bold transition-all ${mode === 'hours' ? 'text-white' : 'text-slate-500'}`}
                    >
                        <motion.span key={displayHour} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.15 }}>
                            {displayHour.toString().padStart(2, '0')}
                        </motion.span>
                    </motion.button>
                    <span className="text-5xl font-bold text-slate-500">:</span>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setMode('minutes')}
                        className={`text-5xl font-bold transition-all ${mode === 'minutes' ? 'text-white' : 'text-slate-500'}`}
                    >
                        <motion.span key={minutes} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.15 }}>
                            {minutes.toString().padStart(2, '0')}
                        </motion.span>
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleAMPM}
                        className="ml-2 px-3 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-lg font-bold transition-colors"
                    >
                        {hours >= 12 ? 'PM' : 'AM'}
                    </motion.button>
                </div>

                {/* Circular Clock */}
                <div className="relative mx-auto w-[200px] h-[200px] rounded-full bg-slate-900/80 border-2 border-indigo-500/30">
                    {/* SVG Hand */}
                    <svg width="200" height="200" className="absolute inset-0">
                        <motion.g
                            animate={{ rotate: handAngle }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                            style={{ transformOrigin: '100px 100px' }}
                        >
                            <line x1="100" y1="100" x2={100 + handLength} y2="100" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" />
                            <circle cx={100 + handLength} cy="100" r="6" fill="#818cf8" />
                        </motion.g>
                        <circle cx="100" cy="100" r="4" fill="#818cf8" />
                    </svg>

                    {/* Numbers */}
                    {mode === 'hours' ? (
                        hourMarkers.map(({ hour12, x, y, isSelected }) => (
                            <motion.button
                                key={hour12}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleHourClick(hour12)}
                                className={`absolute w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${isSelected ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-slate-700/50'
                                    }`}
                                style={{ left: `${x}px`, top: `${y}px`, transform: 'translate(-50%, -50%)' }}
                            >
                                {hour12}
                            </motion.button>
                        ))
                    ) : (
                        minuteMarkers.map(({ minute, x, y, isSelected }) => (
                            <motion.button
                                key={minute}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleMinuteClick(minute)}
                                className={`absolute w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${isSelected ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-slate-700/50'
                                    }`}
                                style={{ left: `${x}px`, top: `${y}px`, transform: 'translate(-50%, -50%)' }}
                            >
                                {minute.toString().padStart(2, '0')}
                            </motion.button>
                        ))
                    )}
                </div>

                {/* Mode Toggle */}
                <div className="flex justify-center gap-2 mt-4 mb-4">
                    <button onClick={() => setMode('hours')} className={`px-4 py-1.5 rounded-full text-xs font-medium ${mode === 'hours' ? 'bg-indigo-500 text-white' : 'bg-slate-700/50 text-slate-400'}`}>
                        Hours
                    </button>
                    <button onClick={() => setMode('minutes')} className={`px-4 py-1.5 rounded-full text-xs font-medium ${mode === 'minutes' ? 'bg-indigo-500 text-white' : 'bg-slate-700/50 text-slate-400'}`}>
                        Minutes
                    </button>
                </div>

                {/* Footer */}
                <div className="flex gap-2">
                    <button onClick={handleClear} className="flex-1 py-2.5 rounded-xl bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 font-medium">Clear</button>
                    <button onClick={handleConfirm} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium flex items-center justify-center gap-2">
                        <Check size={16} /> Confirm
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default TimePicker;
