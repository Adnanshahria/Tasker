import React, { useState, useEffect } from 'react';
import { X, Clock, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface DurationPickerProps {
    isOpen: boolean;
    value: number; // Duration in minutes
    onChange: (minutes: number) => void;
    onClose: () => void;
    label?: string;
}

const DurationPicker: React.FC<DurationPickerProps> = ({ isOpen, value, onChange, onClose, label = 'Duration' }) => {
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);

    useEffect(() => {
        if (value > 0) {
            setHours(Math.floor(value / 60));
            setMinutes(value % 60);
        } else {
            setHours(0);
            setMinutes(0);
        }
    }, [value]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        const totalMinutes = hours * 60 + minutes;
        onChange(totalMinutes);
        onClose();
    };

    const handleClear = () => {
        onChange(0);
        onClose();
    };

    const quickDurations = [
        { label: '30m', value: 30 },
        { label: '1h', value: 60 },
        { label: '1h 30m', value: 90 },
        { label: '2h', value: 120 },
        { label: '3h', value: 180 },
        { label: '4h', value: 240 },
    ];

    const handleQuickSelect = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        setHours(h);
        setMinutes(m);
    };

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

                {/* Duration Display */}
                <div className="flex items-center justify-center gap-3 mb-5">
                    <div className="text-center">
                        <div className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            {hours.toString().padStart(2, '0')}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Hours</div>
                    </div>
                    <span className="text-4xl font-bold text-slate-500">:</span>
                    <div className="text-center">
                        <div className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            {minutes.toString().padStart(2, '0')}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Minutes</div>
                    </div>
                </div>

                {/* Hour/Minute Inputs */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Hours</label>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setHours(Math.max(0, hours - 1))}
                                className="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-slate-300"
                            >
                                -
                            </button>
                            <input
                                type="number"
                                min="0"
                                max="23"
                                value={hours}
                                onChange={e => setHours(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                                className="w-12 text-center bg-slate-900 border border-slate-600 rounded-lg py-2 text-white text-sm focus:border-indigo-500 outline-none"
                            />
                            <button
                                onClick={() => setHours(Math.min(23, hours + 1))}
                                className="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-slate-300"
                            >
                                +
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Minutes</label>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setMinutes(Math.max(0, minutes - 5))}
                                className="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-slate-300"
                            >
                                -
                            </button>
                            <input
                                type="number"
                                min="0"
                                max="55"
                                step="5"
                                value={minutes}
                                onChange={e => setMinutes(Math.min(55, Math.max(0, parseInt(e.target.value) || 0)))}
                                className="w-12 text-center bg-slate-900 border border-slate-600 rounded-lg py-2 text-white text-sm focus:border-indigo-500 outline-none"
                            />
                            <button
                                onClick={() => setMinutes(Math.min(55, minutes + 5))}
                                className="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-slate-300"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="mb-4">
                    <div className="text-xs text-slate-400 mb-2">Quick Select</div>
                    <div className="grid grid-cols-3 gap-2">
                        {quickDurations.map(({ label: l, value: v }) => {
                            const isSelected = hours * 60 + minutes === v;
                            return (
                                <button
                                    key={v}
                                    onClick={() => handleQuickSelect(v)}
                                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${isSelected
                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                                        }`}
                                >
                                    {l}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-2 pt-3 border-t border-slate-700/50">
                    <button
                        onClick={handleClear}
                        className="flex-1 py-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 text-sm font-medium transition-colors"
                    >
                        Clear
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium hover:from-indigo-500 hover:to-purple-500 transition-colors shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                    >
                        <Check size={14} />
                        Confirm
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default DurationPicker;
