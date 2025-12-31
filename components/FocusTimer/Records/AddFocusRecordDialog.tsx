import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, set, isFuture, getDaysInMonth, startOfMonth, getDay } from 'date-fns';
import { useAuth } from '../../../contexts/AuthContext';
import { logManualSession } from '../../../services/focusDataService';
import TimePicker from './TimePicker';

interface AddFocusRecordDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const QUICK_DURATIONS = [15, 25, 30, 45, 60, 90];

const AddFocusRecordDialog: React.FC<AddFocusRecordDialogProps> = ({ isOpen, onClose, onSuccess }) => {
    const { currentUser } = useAuth();

    // Form state
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showCalendar, setShowCalendar] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const [hour, setHour] = useState(12);
    const [minute, setMinute] = useState(0);
    const [ampm, setAmpm] = useState<'am' | 'pm'>('pm');
    const [duration, setDuration] = useState(25);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset form when dialog opens
    React.useEffect(() => {
        if (isOpen) {
            const now = new Date();
            setSelectedDate(now);
            setCalendarMonth(now);
            const hours = now.getHours();
            setHour(hours === 0 ? 12 : hours > 12 ? hours - 12 : hours);
            setMinute(Math.floor(now.getMinutes() / 5) * 5);
            setAmpm(hours >= 12 ? 'pm' : 'am');
            setDuration(25);
            setError(null);
            setShowCalendar(false);
        }
    }, [isOpen]);

    const handleSubmit = useCallback(async () => {
        if (!currentUser?.id) {
            setError('You must be logged in');
            return;
        }

        if (duration < 1) {
            setError('Duration must be at least 1 minute');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            // Convert 12h to 24h format
            let hour24 = hour;
            if (ampm === 'pm' && hour < 12) hour24 += 12;
            if (ampm === 'am' && hour === 12) hour24 = 0;

            // Create the date with time
            const dateWithTime = set(selectedDate, {
                hours: hour24,
                minutes: minute,
                seconds: 0,
                milliseconds: 0,
            });

            // Check if in future
            if (isFuture(dateWithTime)) {
                setError('Cannot log sessions in the future');
                return;
            }

            await logManualSession(currentUser.id, dateWithTime, duration);

            onSuccess?.();
            onClose();
        } catch (err) {
            console.error('Failed to log session:', err);
            setError('Failed to save session');
        } finally {
            setIsSubmitting(false);
        }
    }, [currentUser?.id, selectedDate, hour, minute, ampm, duration, onSuccess, onClose]);

    const adjustDuration = (delta: number) => {
        setDuration(prev => Math.max(1, Math.min(180, prev + delta)));
    };

    // Check if selected date/time is in the future
    const isFutureSession = React.useMemo(() => {
        let hour24 = hour;
        if (ampm === 'pm' && hour < 12) hour24 += 12;
        if (ampm === 'am' && hour === 12) hour24 = 0;

        const dateWithTime = set(selectedDate, {
            hours: hour24,
            minutes: minute,
            seconds: 0,
            milliseconds: 0,
        });

        return isFuture(dateWithTime);
    }, [selectedDate, hour, minute, ampm]);

    // Calendar helpers
    const daysInMonth = getDaysInMonth(calendarMonth);
    const firstDayOfMonth = getDay(startOfMonth(calendarMonth));
    const today = new Date();

    const selectDay = (day: number) => {
        const newDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
        if (!isFuture(newDate)) {
            setSelectedDate(newDate);
            setShowCalendar(false);
        }
    };

    const prevMonth = () => {
        setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
        if (!isFuture(next)) {
            setCalendarMonth(next);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                {/* Backdrop with blur */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-sm bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700/50"
                >
                    {/* Header */}
                    <div className="relative px-5 py-4">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-violet-600/20 to-purple-600/20" />
                        <div className="relative flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">Log Session</h2>
                                <p className="text-sm text-slate-400">Record your focus time</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-600/50 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="px-5 pb-5 space-y-5">
                        {/* Date Picker */}
                        <div>
                            <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                                <Calendar size={14} /> Date
                            </label>
                            <button
                                onClick={() => setShowCalendar(!showCalendar)}
                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-left hover:bg-slate-700 transition-colors flex items-center justify-between"
                            >
                                <span>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                                <Calendar size={16} className="text-slate-400" />
                            </button>

                            {/* Calendar Dropdown */}
                            <AnimatePresence>
                                {showCalendar && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-2 bg-slate-700/50 rounded-xl border border-slate-600/50 overflow-hidden"
                                    >
                                        <div className="p-3">
                                            {/* Month Navigation */}
                                            <div className="flex items-center justify-between mb-3">
                                                <button onClick={prevMonth} className="p-1 text-slate-400 hover:text-white">
                                                    <ChevronLeft size={18} />
                                                </button>
                                                <span className="text-white font-medium">
                                                    {format(calendarMonth, 'MMMM yyyy')}
                                                </span>
                                                <button
                                                    onClick={nextMonth}
                                                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                                                    disabled={isFuture(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                            </div>

                                            {/* Day Headers */}
                                            <div className="grid grid-cols-7 gap-1 mb-2">
                                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                                    <div key={i} className="text-center text-xs text-slate-500 py-1">{d}</div>
                                                ))}
                                            </div>

                                            {/* Days */}
                                            <div className="grid grid-cols-7 gap-1">
                                                {Array.from({ length: firstDayOfMonth }, (_, i) => (
                                                    <div key={`empty-${i}`} />
                                                ))}
                                                {Array.from({ length: daysInMonth }, (_, i) => {
                                                    const day = i + 1;
                                                    const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                                                    const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                                                    const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                                                    const isFutureDay = isFuture(date);

                                                    return (
                                                        <button
                                                            key={day}
                                                            onClick={() => selectDay(day)}
                                                            disabled={isFutureDay}
                                                            className={`
                                                                p-2 text-sm rounded-lg transition-colors
                                                                ${isSelected ? 'bg-blue-600 text-white' : ''}
                                                                ${isToday && !isSelected ? 'bg-violet-600/30 text-violet-300' : ''}
                                                                ${!isSelected && !isToday && !isFutureDay ? 'text-slate-300 hover:bg-slate-600/50' : ''}
                                                                ${isFutureDay ? 'text-slate-600 cursor-not-allowed' : ''}
                                                            `}
                                                        >
                                                            {day}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Time Picker */}
                        <div>
                            <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                                <Clock size={14} /> Time
                            </label>
                            <TimePicker
                                hour={hour}
                                minute={minute}
                                ampm={ampm}
                                onChange={(h, m, a) => {
                                    setHour(h);
                                    setMinute(m);
                                    setAmpm(a);
                                }}
                            />
                        </div>

                        {/* Quick Duration Buttons */}
                        <div>
                            <label className="text-sm text-slate-400 mb-2 block">Quick Duration</label>
                            <div className="flex flex-wrap gap-2">
                                {QUICK_DURATIONS.map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setDuration(d)}
                                        className={`
                                            px-4 py-2 rounded-xl text-sm font-medium transition-all
                                            ${duration === d
                                                ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/25'
                                                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-white border border-slate-600/50'
                                            }
                                        `}
                                    >
                                        {d}m
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Duration Slider */}
                        <div className="bg-slate-700/30 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm text-slate-400">Duration</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-white">{duration}</span>
                                    <span className="text-sm text-slate-400">min</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => adjustDuration(-5)}
                                    className="p-3 rounded-xl bg-slate-600/50 text-slate-400 hover:bg-slate-600 hover:text-white active:scale-95 transition-all"
                                >
                                    <Minus size={18} />
                                </button>
                                <div className="flex-1 relative">
                                    <input
                                        type="range"
                                        min={5}
                                        max={180}
                                        step={5}
                                        value={duration}
                                        onChange={(e) => setDuration(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                        style={{
                                            background: `linear-gradient(to right, #3b82f6 0%, #8b5cf6 ${(duration - 5) / 175 * 100}%, #475569 ${(duration - 5) / 175 * 100}%, #475569 100%)`
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={() => adjustDuration(5)}
                                    className="p-3 rounded-xl bg-slate-600/50 text-slate-400 hover:bg-slate-600 hover:text-white active:scale-95 transition-all"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Future Date Warning */}
                        {isFutureSession && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 text-amber-400 text-sm bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3"
                            >
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <span>⚠️ You cannot log sessions in the future. Please select a past or current time.</span>
                            </motion.div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-sm text-center bg-red-500/10 rounded-xl py-2"
                            >
                                {error}
                            </motion.p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3.5 rounded-xl bg-slate-700/50 text-slate-300 font-medium hover:bg-slate-600/50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || isFutureSession}
                                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-medium hover:from-blue-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                        />
                                        Saving...
                                    </span>
                                ) : 'Log Session'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AddFocusRecordDialog;
