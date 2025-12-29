import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X, Check } from 'lucide-react';
import { format, subDays, differenceInDays } from 'date-fns';

interface DateRangeSliderProps {
    minDays?: number;
    maxDays?: number;
    value: number;
    onChange: (days: number) => void;
    onCustomRange?: (startDate: Date, endDate: Date) => void;
    customStart?: Date | null;
    customEnd?: Date | null;
}

const DateRangeSlider: React.FC<DateRangeSliderProps> = ({
    minDays = 7,
    maxDays = 90,
    value,
    onChange,
    onCustomRange,
    customStart,
    customEnd,
}) => {
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [isCustomActive, setIsCustomActive] = useState(false);
    const [tempStart, setTempStart] = useState('');
    const [tempEnd, setTempEnd] = useState('');

    const presets = [
        { label: '7D', value: 7 },
        { label: '14D', value: 14 },
        { label: '30D', value: 30 },
        { label: '60D', value: 60 },
        { label: '90D', value: 90 },
    ].filter(p => p.value >= minDays && p.value <= maxDays);

    const handlePresetClick = (preset: number) => {
        setIsCustomActive(false);
        onChange(preset);
    };

    const handleCustomClick = () => {
        const today = new Date();
        setTempEnd(format(today, 'yyyy-MM-dd'));
        setTempStart(format(subDays(today, 30), 'yyyy-MM-dd'));
        setShowCustomPicker(true);
    };

    const handleApplyCustom = () => {
        if (tempStart && tempEnd) {
            const startDate = new Date(tempStart);
            const endDate = new Date(tempEnd);
            const days = differenceInDays(endDate, startDate) + 1;

            if (days > 0 && days <= 365) {
                setIsCustomActive(true);
                if (onCustomRange) {
                    onCustomRange(startDate, endDate);
                }
                onChange(days);
                setShowCustomPicker(false);
            }
        }
    };

    const customLabel = customStart && customEnd && isCustomActive
        ? `${format(customStart, 'MMM d')} - ${format(customEnd, 'MMM d')}`
        : 'Custom';

    const modalContent = showCustomPicker && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 bg-black/80 backdrop-blur-lg" onClick={() => setShowCustomPicker(false)}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 w-full max-w-md shadow-2xl mx-2"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-indigo-400" />
                        <span className="font-medium text-white">Custom Date Range</span>
                    </div>
                    <button onClick={() => setShowCustomPicker(false)} className="p-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-slate-400 hover:text-white">
                        <X size={16} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={tempStart}
                            onChange={e => setTempStart(e.target.value)}
                            max={tempEnd || format(new Date(), 'yyyy-MM-dd')}
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs uppercase font-bold text-slate-400 mb-1">End Date</label>
                        <input
                            type="date"
                            value={tempEnd}
                            onChange={e => setTempEnd(e.target.value)}
                            min={tempStart}
                            max={format(new Date(), 'yyyy-MM-dd')}
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none"
                        />
                    </div>

                    {tempStart && tempEnd && (
                        <div className="text-center text-sm text-slate-400">
                            {differenceInDays(new Date(tempEnd), new Date(tempStart)) + 1} days selected
                        </div>
                    )}
                </div>

                <div className="flex gap-2 mt-5">
                    <button onClick={() => setShowCustomPicker(false)} className="flex-1 py-2.5 rounded-xl bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 font-medium">
                        Cancel
                    </button>
                    <button onClick={handleApplyCustom} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium flex items-center justify-center gap-2">
                        <Check size={16} />
                        Apply
                    </button>
                </div>
            </motion.div>
        </div>
    );

    return (
        <>
            <div className="flex items-center gap-1 flex-wrap">
                {presets.map(preset => (
                    <motion.button
                        key={preset.value}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePresetClick(preset.value)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${value === preset.value && !isCustomActive
                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-white'
                            }`}
                    >
                        {preset.label}
                    </motion.button>
                ))}

                {/* Custom button */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCustomClick}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${isCustomActive
                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-white'
                        }`}
                >
                    <Calendar size={12} />
                    {customLabel}
                </motion.button>
            </div>

            {/* Custom Date Range Picker Modal - Rendered via Portal */}
            <AnimatePresence>
                {showCustomPicker && ReactDOM.createPortal(modalContent, document.body)}
            </AnimatePresence>
        </>
    );
};

export default DateRangeSlider;
