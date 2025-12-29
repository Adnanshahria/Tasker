import React from 'react';
import { motion } from 'framer-motion';

interface DateRangeSliderProps {
    minDays?: number;
    maxDays?: number;
    value: number;
    onChange: (days: number) => void;
}

const DateRangeSlider: React.FC<DateRangeSliderProps> = ({
    minDays = 7,
    maxDays = 90,
    value,
    onChange,
}) => {
    const presets = [
        { label: '7D', value: 7 },
        { label: '14D', value: 14 },
        { label: '30D', value: 30 },
        { label: '60D', value: 60 },
        { label: '90D', value: 90 },
    ].filter(p => p.value >= minDays && p.value <= maxDays);

    return (
        <div className="flex items-center gap-1">
            {presets.map(preset => (
                <motion.button
                    key={preset.value}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onChange(preset.value)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${value === preset.value
                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-white'
                        }`}
                >
                    {preset.label}
                </motion.button>
            ))}
        </div>
    );
};

export default DateRangeSlider;
