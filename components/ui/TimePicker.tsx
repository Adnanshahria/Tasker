import React, { useState, useEffect } from 'react';
import { X, Clock, Check, ChevronUp, ChevronDown } from 'lucide-react';
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
    const [isPM, setIsPM] = useState(false);

    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':').map(Number);
            setHours(h % 12 || 12);
            setMinutes(m);
            setIsPM(h >= 12);
        }
    }, [value]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        let h = hours;
        if (isPM && hours !== 12) h = hours + 12;
        if (!isPM && hours === 12) h = 0;
        const timeStr = `${h.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        onChange(timeStr);
        onClose();
    };

    const handleClear = () => {
        onChange('');
        onClose();
    };

    const incrementHours = () => setHours(h => h >= 12 ? 1 : h + 1);
    const decrementHours = () => setHours(h => h <= 1 ? 12 : h - 1);
    const incrementMinutes = () => setMinutes(m => m >= 55 ? 0 : m + 5);
    const decrementMinutes = () => setMinutes(m => m <= 0 ? 55 : m - 5);

    // Slot machine style digit
    const SlotDigit: React.FC<{ value: number; padStart?: number }> = ({ value, padStart = 2 }) => (
        <AnimatePresence mode="popLayout">
            <motion.span
                key={value}
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="inline-block"
            >
                {value.toString().padStart(padStart, '0')}
            </motion.span>
        </AnimatePresence>
    );

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Clock size={20} className="text-indigo-400" />
                        <span className="text-lg font-medium text-white">{label}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Time Picker - Slot Machine Style */}
                <div className="flex items-center justify-center gap-3 mb-6">
                    {/* Hours */}
                    <div className="flex flex-col items-center">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={incrementHours}
                            className="p-2 rounded-xl bg-slate-700/50 hover:bg-indigo-500/30 text-slate-400 hover:text-white transition-colors"
                        >
                            <ChevronUp size={24} />
                        </motion.button>
                        <div className="my-2 w-20 h-20 flex items-center justify-center bg-slate-900/80 border-2 border-indigo-500/40 rounded-2xl overflow-hidden">
                            <span className="text-5xl font-bold bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">
                                <SlotDigit value={hours} />
                            </span>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={decrementHours}
                            className="p-2 rounded-xl bg-slate-700/50 hover:bg-indigo-500/30 text-slate-400 hover:text-white transition-colors"
                        >
                            <ChevronDown size={24} />
                        </motion.button>
                        <span className="mt-1 text-xs text-slate-500 uppercase">Hours</span>
                    </div>

                    {/* Separator */}
                    <div className="text-5xl font-bold text-indigo-400 pb-8">:</div>

                    {/* Minutes */}
                    <div className="flex flex-col items-center">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={incrementMinutes}
                            className="p-2 rounded-xl bg-slate-700/50 hover:bg-indigo-500/30 text-slate-400 hover:text-white transition-colors"
                        >
                            <ChevronUp size={24} />
                        </motion.button>
                        <div className="my-2 w-20 h-20 flex items-center justify-center bg-slate-900/80 border-2 border-indigo-500/40 rounded-2xl overflow-hidden">
                            <span className="text-5xl font-bold bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">
                                <SlotDigit value={minutes} />
                            </span>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={decrementMinutes}
                            className="p-2 rounded-xl bg-slate-700/50 hover:bg-indigo-500/30 text-slate-400 hover:text-white transition-colors"
                        >
                            <ChevronDown size={24} />
                        </motion.button>
                        <span className="mt-1 text-xs text-slate-500 uppercase">Minutes</span>
                    </div>

                    {/* AM/PM */}
                    <div className="flex flex-col items-center">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsPM(false)}
                            className={`p-2 rounded-xl transition-colors ${!isPM ? 'bg-indigo-500 text-white' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'}`}
                        >
                            <span className="text-sm font-bold px-1">AM</span>
                        </motion.button>
                        <div className="my-2 h-20 flex items-center justify-center">
                            <AnimatePresence mode="popLayout">
                                <motion.span
                                    key={isPM ? 'PM' : 'AM'}
                                    initial={{ y: isPM ? 20 : -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: isPM ? -20 : 20, opacity: 0 }}
                                    className="text-2xl font-bold text-indigo-400"
                                >
                                    {isPM ? 'PM' : 'AM'}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsPM(true)}
                            className={`p-2 rounded-xl transition-colors ${isPM ? 'bg-indigo-500 text-white' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'}`}
                        >
                            <span className="text-sm font-bold px-1">PM</span>
                        </motion.button>
                        <span className="mt-1 text-xs text-slate-500 opacity-0">Period</span>
                    </div>
                </div>

                {/* Quick Time Options */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                    {[
                        { h: 9, m: 0, pm: false, label: '9 AM' },
                        { h: 12, m: 0, pm: true, label: '12 PM' },
                        { h: 3, m: 0, pm: true, label: '3 PM' },
                        { h: 6, m: 0, pm: true, label: '6 PM' },
                    ].map(({ h, m, pm, label: l }) => (
                        <motion.button
                            key={l}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setHours(h); setMinutes(m); setIsPM(pm); }}
                            className="py-2 px-3 rounded-xl bg-slate-700/50 hover:bg-indigo-500/30 text-slate-300 hover:text-white text-sm font-medium transition-colors"
                        >
                            {l}
                        </motion.button>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex gap-3">
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleClear}
                        className="flex-1 py-3 rounded-xl bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 font-medium transition-colors"
                    >
                        Clear
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleConfirm}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-500 hover:to-purple-500 transition-colors shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                    >
                        <Check size={18} />
                        Confirm
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};

export default TimePicker;
