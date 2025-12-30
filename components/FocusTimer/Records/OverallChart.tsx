import React, { useMemo, useState } from 'react';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Scatter } from 'recharts';
import { Target, Calendar, Clock, Flame, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, subMonths, subWeeks, startOfMonth, endOfMonth, isFuture, getDaysInMonth, getDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusDashboard, formatDuration } from '../../../hooks/useFocusDashboard';

interface OverallChartProps {
    className?: string;
}

type RangePreset = '1w' | '2w' | '1m' | '3m' | 'custom';

const OverallChart: React.FC<OverallChartProps> = ({ className = '' }) => {
    const [rangePreset, setRangePreset] = useState<RangePreset>('1m');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
    const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
    const [pickerMonth, setPickerMonth] = useState(new Date());
    const [selectingStart, setSelectingStart] = useState(true);

    const { allTimeStats, getRangeData } = useFocusDashboard();

    // Calculate date range based on preset or custom
    const dateRange = useMemo(() => {
        const end = new Date();
        let start: Date;

        if (rangePreset === 'custom' && customStartDate && customEndDate) {
            return { start: customStartDate, end: customEndDate };
        }

        switch (rangePreset) {
            case '1w':
                start = subWeeks(end, 1);
                break;
            case '2w':
                start = subWeeks(end, 2);
                break;
            case '1m':
                start = subMonths(end, 1);
                break;
            case '3m':
                start = subMonths(end, 3);
                break;
            default:
                start = subMonths(end, 1);
                break;
        }

        return { start, end };
    }, [rangePreset, customStartDate, customEndDate]);

    const rangeData = useMemo(() => getRangeData(dateRange.start, dateRange.end), [getRangeData, dateRange]);
    const rangeStats = useMemo(() => {
        const totalMinutes = rangeData.reduce((acc, d) => acc + d.minutes, 0);
        const totalPomos = rangeData.reduce((acc, d) => acc + d.pomos, 0);
        return { totalMinutes, totalPomos };
    }, [rangeData]);

    const hasData = rangeData.some(d => d.minutes > 0);

    // Date picker helpers
    const daysInMonth = getDaysInMonth(pickerMonth);
    const firstDayOfMonth = getDay(startOfMonth(pickerMonth));
    const today = new Date();

    const selectDay = (day: number) => {
        const selectedDate = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), day);
        if (isFuture(selectedDate)) return;

        if (selectingStart) {
            setCustomStartDate(selectedDate);
            setCustomEndDate(null);
            setSelectingStart(false);
        } else {
            if (customStartDate && selectedDate < customStartDate) {
                setCustomEndDate(customStartDate);
                setCustomStartDate(selectedDate);
            } else {
                setCustomEndDate(selectedDate);
            }
            setSelectingStart(true);
        }
    };

    const applyCustomRange = () => {
        if (customStartDate && customEndDate) {
            setRangePreset('custom');
            setShowDatePicker(false);
        }
    };

    const openDatePicker = () => {
        setShowDatePicker(true);
        setSelectingStart(true);
        setCustomStartDate(null);
        setCustomEndDate(null);
        setPickerMonth(new Date());
    };

    const isDateInRange = (day: number) => {
        if (!customStartDate || !customEndDate) return false;
        const date = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), day);
        return date >= customStartDate && date <= customEndDate;
    };

    const isDateSelected = (day: number) => {
        const date = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), day);
        const dateStr = format(date, 'yyyy-MM-dd');
        return (customStartDate && format(customStartDate, 'yyyy-MM-dd') === dateStr) ||
            (customEndDate && format(customEndDate, 'yyyy-MM-dd') === dateStr);
    };

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm shadow-xl">
                    <p className="text-slate-400">{label}</p>
                    <p className="text-cyan-400 font-medium">{formatDuration(payload[0]?.value || 0)}</p>
                    {payload[1]?.value > 0 && (
                        <p className="text-orange-400 text-xs">{payload[1].value} pomos</p>
                    )}
                </div>
            );
        }
        return null;
    };

    const presets: { key: RangePreset; label: string }[] = [
        { key: '1w', label: '1W' },
        { key: '2w', label: '2W' },
        { key: '1m', label: '1M' },
        { key: '3m', label: '3M' },
    ];

    return (
        <div className={`bg-gradient-to-b from-slate-800/80 to-slate-900/80 rounded-2xl overflow-hidden border border-slate-700/50 ${className}`}>
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 px-4 py-3">
                <div className="flex items-center gap-2">
                    <Target size={18} className="text-white" />
                    <h3 className="text-base font-semibold text-white">Overall Activity</h3>
                </div>
            </div>

            <div className="p-4">
                {/* Lifetime Stats */}
                <div className="flex items-center gap-4 mb-3 text-sm">
                    <div className="bg-slate-700/30 rounded-lg px-3 py-2">
                        <span className="text-slate-500 text-xs block">LIFETIME</span>
                        <span className="text-white font-medium">{formatDuration(allTimeStats.totalFocusMinutes)}</span>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg px-3 py-2">
                        <span className="text-slate-500 text-xs block">POMOS</span>
                        <span className="text-white font-medium">{allTimeStats.totalPomos}</span>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg px-3 py-2">
                        <span className="text-slate-500 text-xs block">DAYS</span>
                        <span className="text-white font-medium">{allTimeStats.totalDays}</span>
                    </div>
                </div>

                {/* Date Range Selector */}
                <div className="flex items-center gap-2 bg-slate-700/30 rounded-xl p-2 mb-3">
                    <button
                        onClick={openDatePicker}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-600/50 hover:bg-slate-600 rounded-lg transition-colors text-slate-300 text-xs"
                    >
                        <Calendar size={14} />
                        {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
                    </button>
                    <div className="flex-1" />
                    <div className="flex gap-1">
                        {presets.map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setRangePreset(key)}
                                className={`px-2.5 py-1.5 text-xs rounded-lg font-medium transition-all ${rangePreset === key
                                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:bg-slate-600/50 hover:text-white'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Date Picker Modal */}
                <AnimatePresence>
                    {showDatePicker && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-3 overflow-hidden"
                        >
                            <div className="bg-slate-700/50 rounded-xl border border-slate-600/50 p-3">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-white text-sm font-medium">Select Date Range</span>
                                    <button
                                        onClick={() => setShowDatePicker(false)}
                                        className="p-1 text-slate-400 hover:text-white"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Selection status */}
                                <div className="flex gap-2 mb-3 text-xs">
                                    <div className={`flex-1 p-2 rounded-lg border ${selectingStart ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-600 bg-slate-700/30'}`}>
                                        <span className="text-slate-400 block">Start</span>
                                        <span className="text-white">{customStartDate ? format(customStartDate, 'MMM d, yyyy') : '...'}</span>
                                    </div>
                                    <div className={`flex-1 p-2 rounded-lg border ${!selectingStart ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-600 bg-slate-700/30'}`}>
                                        <span className="text-slate-400 block">End</span>
                                        <span className="text-white">{customEndDate ? format(customEndDate, 'MMM d, yyyy') : '...'}</span>
                                    </div>
                                </div>

                                {/* Month Navigation */}
                                <div className="flex items-center justify-between mb-2">
                                    <button
                                        onClick={() => setPickerMonth(subMonths(pickerMonth, 1))}
                                        className="p-1 text-slate-400 hover:text-white"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <span className="text-white font-medium text-sm">
                                        {format(pickerMonth, 'MMMM yyyy')}
                                    </span>
                                    <button
                                        onClick={() => !isFuture(endOfMonth(pickerMonth)) && setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 1))}
                                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                                        disabled={isFuture(endOfMonth(pickerMonth))}
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>

                                {/* Day Headers */}
                                <div className="grid grid-cols-7 gap-1 mb-1">
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
                                        const date = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), day);
                                        const isFutureDay = isFuture(date);
                                        const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                                        const isSelected = isDateSelected(day);
                                        const inRange = isDateInRange(day);

                                        return (
                                            <button
                                                key={day}
                                                onClick={() => selectDay(day)}
                                                disabled={isFutureDay}
                                                className={`
                                                    p-1.5 text-xs rounded-lg transition-all
                                                    ${isSelected ? 'bg-cyan-600 text-white' : ''}
                                                    ${inRange && !isSelected ? 'bg-cyan-600/30 text-cyan-300' : ''}
                                                    ${isToday && !isSelected && !inRange ? 'bg-violet-600/30 text-violet-300' : ''}
                                                    ${!isSelected && !inRange && !isToday && !isFutureDay ? 'text-slate-300 hover:bg-slate-600/50' : ''}
                                                    ${isFutureDay ? 'text-slate-600 cursor-not-allowed' : ''}
                                                `}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Apply Button */}
                                <button
                                    onClick={applyCustomRange}
                                    disabled={!customStartDate || !customEndDate}
                                    className="w-full mt-3 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Apply Range
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Range Stats */}
                <div className="flex items-center gap-4 text-xs mb-3">
                    <span className="flex items-center gap-1.5 text-slate-400">
                        <Clock size={12} className="text-cyan-400" />
                        Focus: <span className="text-white font-medium">{formatDuration(rangeStats.totalMinutes)}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                        <Flame size={12} className="text-orange-400" />
                        Pomos: <span className="text-white font-medium">{rangeStats.totalPomos}</span>
                    </span>
                </div>

                {/* Chart */}
                {hasData ? (
                    <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={rangeData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(71, 85, 105, 0.3)" vertical={false} />
                                <XAxis
                                    dataKey="displayDate"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 8 }}
                                    interval={Math.max(0, Math.floor(rangeData.length / 7) - 1)}
                                />
                                <YAxis
                                    yAxisId="left"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                    tickFormatter={(v) => `${Math.round(v)}m`}
                                    width={40}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    hide
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar
                                    yAxisId="left"
                                    dataKey="minutes"
                                    fill="url(#cyanGradient)"
                                    radius={[2, 2, 0, 0]}
                                    maxBarSize={10}
                                />
                                <Scatter
                                    yAxisId="right"
                                    dataKey="pomos"
                                    fill="#f97316"
                                    shape="circle"
                                />
                                <defs>
                                    <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#06b6d4" />
                                        <stop offset="100%" stopColor="#3b82f6" />
                                    </linearGradient>
                                </defs>
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-32 flex flex-col items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center mb-2">
                            <Target size={20} className="text-slate-500" />
                        </div>
                        <p className="text-slate-500 text-xs">No data for this period</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OverallChart;
