import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Calendar, Clock, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addDays, subMonths, addMonths, isFuture } from 'date-fns';
import { motion } from 'framer-motion';
import { useAuth } from '../../../contexts/AuthContext';
import { getFocusRecordsForRange } from '../../../services/focusDataService';
import { formatDuration } from '../../../hooks/useFocusDashboard';
import { FocusRecord } from '../../../types';

interface MonthChartProps {
    className?: string;
}

interface DailyData {
    date: string;
    displayDate: string;
    minutes: number;
    pomos: number;
}

const MonthChart: React.FC<MonthChartProps> = ({ className = '' }) => {
    const { currentUser } = useAuth();
    const [selectedMonth, setSelectedMonth] = useState(new Date());

    // Get monthly data for selected month
    const { data: monthlyData, stats } = useMemo(() => {
        if (!currentUser?.uid) return { data: [], stats: { totalMinutes: 0, dailyAverage: 0, daysWithData: 0 } };

        const monthStart = startOfMonth(selectedMonth);
        const monthEnd = endOfMonth(selectedMonth);

        const startStr = format(monthStart, 'yyyy-MM-dd');
        const endStr = format(monthEnd, 'yyyy-MM-dd');

        const records = getFocusRecordsForRange(currentUser.id, startStr, endStr);
        const recordMap = new Map<string, FocusRecord>();
        records.forEach(r => recordMap.set(r.date, r));

        // Generate all days in month
        const data: DailyData[] = [];
        let current = monthStart;
        while (current <= monthEnd) {
            const dateStr = format(current, 'yyyy-MM-dd');
            const record = recordMap.get(dateStr);
            data.push({
                date: dateStr,
                displayDate: format(current, 'd'),
                minutes: record?.totalFocusMinutes || 0,
                pomos: record?.totalPomos || 0,
            });
            current = addDays(current, 1);
        }

        // Calculate stats
        const totalMinutes = data.reduce((acc, d) => acc + d.minutes, 0);
        const daysWithData = data.filter(d => d.minutes > 0).length;
        const dailyAverage = daysWithData > 0 ? Math.round(totalMinutes / daysWithData) : 0;

        return {
            data,
            stats: { totalMinutes, dailyAverage, daysWithData }
        };
    }, [currentUser?.uid, selectedMonth]);

    const monthLabel = format(selectedMonth, 'MMMM yyyy');
    const hasData = monthlyData.some(d => d.minutes > 0);
    const isCurrentMonth = format(selectedMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM');
    const canGoNext = !isFuture(addMonths(startOfMonth(selectedMonth), 1));

    const goToPrevMonth = () => {
        setSelectedMonth(subMonths(selectedMonth, 1));
    };

    const goToNextMonth = () => {
        if (canGoNext) {
            setSelectedMonth(addMonths(selectedMonth, 1));
        }
    };

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm shadow-xl">
                    <p className="text-slate-400">Day {label}</p>
                    <p className="text-white font-medium">{formatDuration(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className={`bg-gradient-to-b from-slate-800/80 to-slate-900/80 rounded-2xl overflow-hidden border border-slate-700/50 ${className}`}>
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-white" />
                        <h3 className="text-base font-semibold text-white">Monthly Activity</h3>
                    </div>
                </div>
            </div>

            <div className="p-4">
                {/* Month Selector */}
                <div className="flex items-center justify-between mb-4 bg-slate-700/30 rounded-xl p-2">
                    <button
                        onClick={goToPrevMonth}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-600/50 transition-colors"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <motion.span
                        key={monthLabel}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-white font-medium"
                    >
                        {monthLabel}
                    </motion.span>
                    <button
                        onClick={goToNextMonth}
                        disabled={!canGoNext}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-600/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1.5 bg-slate-700/30 rounded-lg px-3 py-2">
                        <Clock size={14} className="text-purple-400" />
                        <span className="text-slate-400">Total:</span>
                        <span className="text-white font-medium">{formatDuration(stats.totalMinutes)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-700/30 rounded-lg px-3 py-2">
                        <TrendingUp size={14} className="text-pink-400" />
                        <span className="text-slate-400">Avg:</span>
                        <span className="text-white font-medium">{formatDuration(stats.dailyAverage)}/day</span>
                    </div>
                </div>

                {/* Chart */}
                {hasData ? (
                    <div className="h-28">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(71, 85, 105, 0.3)" vertical={false} />
                                <XAxis
                                    dataKey="displayDate"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 8 }}
                                    interval={6}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                    tickFormatter={(v) => `${Math.round(v)}m`}
                                    width={40}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar
                                    dataKey="minutes"
                                    fill="url(#pinkGradient)"
                                    radius={[2, 2, 0, 0]}
                                    maxBarSize={10}
                                />
                                <defs>
                                    <linearGradient id="pinkGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#a855f7" />
                                        <stop offset="100%" stopColor="#ec4899" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-28 flex flex-col items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center mb-2">
                            <Calendar size={20} className="text-slate-500" />
                        </div>
                        <p className="text-slate-500 text-xs">No data for {monthLabel}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MonthChart;
