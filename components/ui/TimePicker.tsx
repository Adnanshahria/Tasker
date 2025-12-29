import React, { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
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
        setTimeout(() => setMode('minutes'), 200);
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
        if (hours < 12) {
            setHours(hours + 12);
        } else {
            setHours(hours - 12);
        }
    };

    // Generate hour markers (1-12 displayed in circle)
    const hourMarkers = Array.from({ length: 12 }, (_, i) => {
        const hour12 = i === 0 ? 12 : i;
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const radius = 70;
        const x = 100 + radius * Math.cos(angle);
        const y = 100 + radius * Math.sin(angle);

        // Check if this hour is selected
        const currentHour12 = hours % 12 === 0 ? 12 : hours % 12;
        const isSelected = currentHour12 === hour12;

        return { hour12, x, y, isSelected };
    });

    // Generate minute markers (00, 05, 10, ..., 55)
    const minuteMarkers = Array.from({ length: 12 }, (_, i) => {
        const minute = i * 5;
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const radius = 70;
        const x = 100 + radius * Math.cos(angle);
        const y = 100 + radius * Math.sin(angle);

        // Check if this minute range is selected
        const isSelected = Math.floor(minutes / 5) === i;

        return { minute, x, y, isSelected };
    });

    // Calculate hand position
    const handAngle = mode === 'hours'
        ? (((hours % 12) || 12) * 30 - 90) * (Math.PI / 180)
        : (Math.floor(minutes / 5) * 30 - 90) * (Math.PI / 180);
    const handLength = 55;
    const handX = 100 + handLength * Math.cos(handAngle);
    const handY = 100 + handLength * Math.sin(handAngle);

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 w-full max-w-xs shadow-2xl shadow-indigo-500/20"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Clock size={18} className="text-indigo-400" />
                        <span className="text-sm font-medium text-slate-400">{label}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Time Display - 12-hour format */}
                <div className="flex items-center justify-center gap-2 mb-4">
                    <button
                        onClick={() => setMode('hours')}
                        className={`text-4xl font-bold transition-colors ${mode === 'hours'
                                ? 'bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {(hours % 12 === 0 ? 12 : hours % 12).toString().padStart(2, '0')}
                    </button>
                    <span className="text-4xl font-bold text-slate-500">:</span>
                    <button
                        onClick={() => setMode('minutes')}
                        className={`text-4xl font-bold transition-colors ${mode === 'minutes'
                                ? 'bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {minutes.toString().padStart(2, '0')}
                    </button>
                    <button
                        onClick={toggleAMPM}
                        className="ml-2 px-2 py-1 rounded-lg bg-slate-700/50 hover:bg-indigo-500/30 text-slate-300 text-sm font-bold transition-colors"
                    >
                        {hours >= 12 ? 'PM' : 'AM'}
                    </button>
                </div>

                {/* Circular Clock */}
                <div className="relative mx-auto w-[200px] h-[200px] rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-indigo-500/30 shadow-inner">
                    {/* SVG for hand */}
                    <svg width="200" height="200" className="absolute inset-0 pointer-events-none">
                        {/* Center dot */}
                        <circle cx="100" cy="100" r="5" fill="url(#clockGradient)" />

                        {/* Hand line */}
                        <line
                            x1="100" y1="100"
                            x2={handX} y2={handY}
                            stroke="url(#clockGradient)"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />

                        {/* Hand end dot */}
                        <circle cx={handX} cy={handY} r="6" fill="url(#clockGradient)" />

                        <defs>
                            <linearGradient id="clockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#818cf8" />
                                <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Hour/Minute buttons */}
                    {mode === 'hours' ? (
                        hourMarkers.map(({ hour12, x, y, isSelected }) => (
                            <button
                                key={hour12}
                                onClick={() => handleHourClick(hour12)}
                                className={`absolute w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold transition-all z-10 ${isSelected
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white scale-110 shadow-lg'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-600/70'
                                    }`}
                                style={{
                                    left: `${x}px`,
                                    top: `${y}px`,
                                    transform: 'translate(-50%, -50%)'
                                }}
                            >
                                {hour12}
                            </button>
                        ))
                    ) : (
                        minuteMarkers.map(({ minute, x, y, isSelected }) => (
                            <button
                                key={minute}
                                onClick={() => handleMinuteClick(minute)}
                                className={`absolute w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold transition-all z-10 ${isSelected
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white scale-110 shadow-lg'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-600/70'
                                    }`}
                                style={{
                                    left: `${x}px`,
                                    top: `${y}px`,
                                    transform: 'translate(-50%, -50%)'
                                }}
                            >
                                {minute.toString().padStart(2, '0')}
                            </button>
                        ))
                    )}
                </div>

                {/* Mode indicator */}
                <div className="flex justify-center gap-2 mt-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${mode === 'hours' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500'}`}>
                        Hours
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${mode === 'minutes' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500'}`}>
                        Minutes
                    </span>
                </div>

                {/* Footer */}
                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-700/50">
                    <button
                        onClick={handleClear}
                        className="flex-1 py-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 text-sm font-medium transition-colors"
                    >
                        Clear
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium hover:from-indigo-500 hover:to-purple-500 transition-colors shadow-lg shadow-indigo-500/25"
                    >
                        Confirm
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default TimePicker;
