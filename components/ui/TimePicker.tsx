import React, { useState, useEffect, useRef } from 'react';
import { X, Clock } from 'lucide-react';
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
    const clockRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':').map(Number);
            setHours(h);
            setMinutes(m);
        }
    }, [value]);

    if (!isOpen) return null;

    const handleClockClick = (e: React.MouseEvent | React.TouchEvent) => {
        if (!clockRef.current) return;

        const rect = clockRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX - rect.left;
            clientY = e.touches[0].clientY - rect.top;
        } else {
            clientX = e.clientX - rect.left;
            clientY = e.clientY - rect.top;
        }

        const angle = Math.atan2(clientY - centerY, clientX - centerX);
        let degrees = (angle * 180) / Math.PI + 90;
        if (degrees < 0) degrees += 360;

        if (mode === 'hours') {
            let hour = Math.round(degrees / 30) % 12;
            if (hour === 0) hour = 12;
            // Convert to 24h format if needed
            const finalHour = hours >= 12 ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
            setHours(finalHour);
        } else {
            let minute = Math.round(degrees / 6) % 60;
            setMinutes(minute);
        }
    };

    const handleMouseDown = () => {
        isDragging.current = true;
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        if (mode === 'hours') {
            setMode('minutes');
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging.current) {
            handleClockClick(e);
        }
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

    // Generate hour markers
    const hourMarkers = Array.from({ length: 12 }, (_, i) => {
        const hour = i === 0 ? 12 : i;
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const radius = 80;
        const x = 100 + radius * Math.cos(angle);
        const y = 100 + radius * Math.sin(angle);
        const displayHour = hours >= 12 ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
        const isSelected = hours % 12 === hour % 12 || (hours === 0 && hour === 12) || (hours === 12 && hour === 12);

        return { hour, displayHour, x, y, isSelected };
    });

    // Generate minute markers
    const minuteMarkers = Array.from({ length: 12 }, (_, i) => {
        const minute = i * 5;
        const angle = (minute * 6 - 90) * (Math.PI / 180);
        const radius = 80;
        const x = 100 + radius * Math.cos(angle);
        const y = 100 + radius * Math.sin(angle);
        const isSelected = Math.abs(minutes - minute) < 3 || (minute === 0 && minutes >= 58);

        return { minute, x, y, isSelected };
    });

    // Calculate hand position
    const handAngle = mode === 'hours'
        ? ((hours % 12) * 30 - 90) * (Math.PI / 180)
        : (minutes * 6 - 90) * (Math.PI / 180);
    const handLength = 65;
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

                {/* Time Display */}
                <div className="flex items-center justify-center gap-2 mb-4">
                    <button
                        onClick={() => setMode('hours')}
                        className={`text-4xl font-bold transition-colors ${mode === 'hours'
                                ? 'bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {hours.toString().padStart(2, '0')}
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
                <div
                    ref={clockRef}
                    className="relative mx-auto w-[200px] h-[200px] rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-indigo-500/30 shadow-inner cursor-pointer"
                    onClick={handleClockClick}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => { isDragging.current = false; }}
                    onTouchStart={(e) => { isDragging.current = true; handleClockClick(e); }}
                    onTouchMove={handleClockClick as any}
                    onTouchEnd={() => { isDragging.current = false; if (mode === 'hours') setMode('minutes'); }}
                >
                    <svg width="200" height="200" className="absolute inset-0">
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
                        <circle cx={handX} cy={handY} r="8" fill="url(#clockGradient)" />

                        <defs>
                            <linearGradient id="clockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#818cf8" />
                                <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Hour/Minute markers */}
                    {mode === 'hours' ? (
                        hourMarkers.map(({ hour, x, y, isSelected }) => (
                            <div
                                key={hour}
                                className={`absolute w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all ${isSelected
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white scale-110'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-600/50'
                                    }`}
                                style={{
                                    left: `${x}px`,
                                    top: `${y}px`,
                                    transform: 'translate(-50%, -50%)'
                                }}
                            >
                                {hour}
                            </div>
                        ))
                    ) : (
                        minuteMarkers.map(({ minute, x, y, isSelected }) => (
                            <div
                                key={minute}
                                className={`absolute w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all ${isSelected
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white scale-110'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-600/50'
                                    }`}
                                style={{
                                    left: `${x}px`,
                                    top: `${y}px`,
                                    transform: 'translate(-50%, -50%)'
                                }}
                            >
                                {minute.toString().padStart(2, '0')}
                            </div>
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
