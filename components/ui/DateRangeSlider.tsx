import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

interface DateRangeSliderProps {
    minDays: number;
    maxDays: number;
    value: number;
    onChange: (days: number) => void;
    label?: string;
}

const DateRangeSlider: React.FC<DateRangeSliderProps> = ({
    minDays = 7,
    maxDays = 90,
    value,
    onChange,
    label = 'Days'
}) => {
    const [isDragging, setIsDragging] = useState(false);

    const presets = [
        { label: '7D', value: 7 },
        { label: '14D', value: 14 },
        { label: '30D', value: 30 },
        { label: '60D', value: 60 },
        { label: '90D', value: 90 },
    ].filter(p => p.value >= minDays && p.value <= maxDays);

    const percentage = ((value - minDays) / (maxDays - minDays)) * 100;

    return (
        <div className="flex items-center gap-3">
            {/* Presets */}
            <div className="flex gap-1">
                {presets.map(preset => (
                    <motion.button
                        key={preset.value}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onChange(preset.value)}
                        className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${value === preset.value
                                ? 'bg-indigo-500 text-white'
                                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-white'
                            }`}
                    >
                        {preset.label}
                    </motion.button>
                ))}
            </div>

            {/* Slider */}
            <div className="flex-1 relative">
                <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                    {/* Progress fill */}
                    <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.2 }}
                    />
                </div>

                {/* Slider input */}
                <input
                    type="range"
                    min={minDays}
                    max={maxDays}
                    value={value}
                    onChange={e => onChange(parseInt(e.target.value))}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onTouchStart={() => setIsDragging(true)}
                    onTouchEnd={() => setIsDragging(false)}
                    className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
                />

                {/* Thumb indicator */}
                <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-indigo-500 pointer-events-none"
                    style={{ left: `calc(${percentage}% - 8px)` }}
                    animate={{
                        scale: isDragging ? 1.2 : 1,
                        boxShadow: isDragging ? '0 0 12px rgba(99, 102, 241, 0.5)' : '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                />
            </div>

            {/* Current value display */}
            <div className="flex items-center gap-1 min-w-[60px] justify-end">
                <Calendar size={14} className="text-indigo-400" />
                <span className="text-sm font-medium text-white">{value}</span>
                <span className="text-xs text-slate-400">{label}</span>
            </div>
        </div>
    );
};

export default DateRangeSlider;
