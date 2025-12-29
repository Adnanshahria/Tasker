import React, { useState, useEffect, useRef } from 'react';
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
    const [isPM, setIsPM] = useState(false);

    const hourRef = useRef<HTMLDivElement>(null);
    const minRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':').map(Number);
            setHours(h % 12 || 12);
            setMinutes(m);
            setIsPM(h >= 12);
        }
    }, [value]);

    // Scroll to selected values on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                hourRef.current?.querySelector(`[data-hour="${hours}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                minRef.current?.querySelector(`[data-min="${minutes}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }, 100);
        }
    }, [isOpen, hours, minutes]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        let h = hours;
        if (isPM && hours !== 12) h = hours + 12;
        if (!isPM && hours === 12) h = 0;
        onChange(`${h.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
        onClose();
    };

    const handleClear = () => {
        onChange('');
        onClose();
    };

    const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);
    const minOptions = Array.from({ length: 60 }, (_, i) => i); // All 60 minutes

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 w-full max-w-sm shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Clock size={18} className="text-indigo-400" />
                        <span className="font-medium text-white">{label}</span>
                    </div>
                    <button onClick={onClose} className="p-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Time Display - Editable */}
                <div className="flex items-center justify-center gap-1 mb-4">
                    <input
                        type="number"
                        min="1"
                        max="12"
                        value={hours}
                        onChange={e => {
                            const val = parseInt(e.target.value) || 1;
                            setHours(Math.min(12, Math.max(1, val)));
                        }}
                        className="w-16 text-4xl font-bold text-white bg-slate-700/50 border border-slate-600 rounded-lg text-center py-1 focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="text-4xl font-bold text-slate-500">:</span>
                    <input
                        type="number"
                        min="0"
                        max="59"
                        value={minutes.toString().padStart(2, '0')}
                        onChange={e => {
                            const val = parseInt(e.target.value) || 0;
                            setMinutes(Math.min(59, Math.max(0, val)));
                        }}
                        className="w-16 text-4xl font-bold text-white bg-slate-700/50 border border-slate-600 rounded-lg text-center py-1 focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                        onClick={() => setIsPM(!isPM)}
                        className="ml-2 px-3 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-xl font-bold transition-colors"
                    >
                        {isPM ? 'PM' : 'AM'}
                    </button>
                </div>

                {/* Scroll Picker */}
                <div className="flex gap-2 mb-4">
                    {/* Hours */}
                    <div className="flex-1">
                        <div className="text-xs text-slate-400 text-center mb-1 uppercase font-medium">Hour</div>
                        <div ref={hourRef} className="h-40 overflow-y-auto bg-slate-900/50 rounded-xl border border-slate-700/50 scrollbar-hide">
                            {hourOptions.map(h => (
                                <button
                                    key={h}
                                    data-hour={h}
                                    onClick={() => setHours(h)}
                                    className={`w-full py-3 text-center text-lg font-medium transition-all ${hours === h
                                        ? 'bg-indigo-500 text-white'
                                        : 'text-slate-300 hover:bg-slate-700/50'
                                        }`}
                                >
                                    {h.toString().padStart(2, '0')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Minutes */}
                    <div className="flex-1">
                        <div className="text-xs text-slate-400 text-center mb-1 uppercase font-medium">Min</div>
                        <div ref={minRef} className="h-40 overflow-y-auto bg-slate-900/50 rounded-xl border border-slate-700/50 scrollbar-hide">
                            {minOptions.map(m => (
                                <button
                                    key={m}
                                    data-min={m}
                                    onClick={() => setMinutes(m)}
                                    className={`w-full py-3 text-center text-lg font-medium transition-all ${minutes === m
                                        ? 'bg-indigo-500 text-white'
                                        : 'text-slate-300 hover:bg-slate-700/50'
                                        }`}
                                >
                                    {m.toString().padStart(2, '0')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* AM/PM */}
                    <div className="w-20">
                        <div className="text-xs text-slate-400 text-center mb-1 uppercase font-medium">Period</div>
                        <div className="h-40 flex flex-col gap-2 justify-center">
                            <button
                                onClick={() => setIsPM(false)}
                                className={`flex-1 rounded-xl text-lg font-bold transition-all ${!isPM
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
                                    }`}
                            >
                                AM
                            </button>
                            <button
                                onClick={() => setIsPM(true)}
                                className={`flex-1 rounded-xl text-lg font-bold transition-all ${isPM
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
                                    }`}
                            >
                                PM
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Times */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                        { h: 9, m: 0, pm: false },
                        { h: 12, m: 0, pm: true },
                        { h: 6, m: 0, pm: true },
                        { h: 9, m: 0, pm: true },
                    ].map(({ h, m, pm }) => (
                        <button
                            key={`${h}-${pm}`}
                            onClick={() => { setHours(h); setMinutes(m); setIsPM(pm); }}
                            className="py-2 rounded-lg bg-slate-700/50 hover:bg-indigo-500/30 text-slate-300 hover:text-white text-sm font-medium transition-colors"
                        >
                            {h}{pm ? 'PM' : 'AM'}
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex gap-2">
                    <button onClick={handleClear} className="flex-1 py-2.5 rounded-xl bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 font-medium transition-colors">
                        Clear
                    </button>
                    <button onClick={handleConfirm} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25">
                        <Check size={16} />
                        Done
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default TimePicker;
