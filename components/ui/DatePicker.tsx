import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';

interface DatePickerProps {
    isOpen: boolean;
    value: string;
    onChange: (date: string) => void;
    onClose: () => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ isOpen, value, onChange, onClose }) => {
    const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
    const selectedDate = value ? new Date(value) : null;

    useEffect(() => {
        if (value) {
            setCurrentMonth(new Date(value));
        }
    }, [value]);

    if (!isOpen) return null;

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get day of week for first day (0 = Sunday)
    const startDay = monthStart.getDay();
    const paddingDays = Array(startDay).fill(null);

    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const handleDateClick = (day: Date) => {
        onChange(format(day, 'yyyy-MM-dd'));
        onClose();
    };

    const handleTodayClick = () => {
        const today = new Date();
        onChange(format(today, 'yyyy-MM-dd'));
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 w-full max-w-xs shadow-2xl shadow-indigo-500/20"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="p-2 bg-slate-700/50 hover:bg-indigo-500/30 rounded-lg text-slate-300 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        {format(currentMonth, 'MMMM yyyy')}
                    </h3>
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="p-2 bg-slate-700/50 hover:bg-indigo-500/30 rounded-lg text-slate-300 hover:text-white transition-colors"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map(day => (
                        <div key={day} className="text-center text-xs font-medium text-slate-400 py-1">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7 gap-1">
                    {paddingDays.map((_, idx) => (
                        <div key={`pad-${idx}`} className="h-9" />
                    ))}
                    {days.map(day => {
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const isTodayDate = isToday(day);

                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => handleDateClick(day)}
                                className={`h-9 w-full rounded-lg text-sm font-medium transition-all ${isSelected
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                                        : isTodayDate
                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                                    }`}
                            >
                                {format(day, 'd')}
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-700/50">
                    <button
                        onClick={() => {
                            onChange('');
                            onClose();
                        }}
                        className="flex-1 py-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 text-sm font-medium transition-colors"
                    >
                        Clear
                    </button>
                    <button
                        onClick={handleTodayClick}
                        className="flex-1 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium hover:from-indigo-500 hover:to-purple-500 transition-colors shadow-lg shadow-indigo-500/25"
                    >
                        Today
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default DatePicker;
