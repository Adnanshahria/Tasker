import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts';
import { Clock, Target, Edit3, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusDashboard, formatDuration } from '../../../hooks/useFocusDashboard';
import { useTimerStore } from '../../../store/timerStore';

interface TodayChartProps {
    className?: string;
}

const TodayChart: React.FC<TodayChartProps> = ({ className = '' }) => {
    const { todayStats, getTodayHourlyData, getWeeklyData, calculateWeeklyStats } = useFocusDashboard();
    const dailyGoal = useTimerStore((state) => state.dailyGoal);
    const setDailyGoal = useTimerStore((state) => state.setDailyGoal);

    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [tempGoal, setTempGoal] = useState(dailyGoal);

    const hourlyData = useMemo(() => getTodayHourlyData(), [getTodayHourlyData]);
    const weeklyData = useMemo(() => getWeeklyData(1), [getWeeklyData]);
    const weeklyStats = useMemo(() => calculateWeeklyStats(weeklyData), [calculateWeeklyStats, weeklyData]);

    const totalMinutes = todayStats?.totalFocusMinutes || 0;
    const goalProgress = Math.min(100, (totalMinutes / dailyGoal) * 100);
    const hourlyGoal = dailyGoal / 24;

    const handleEditGoal = () => {
        setTempGoal(dailyGoal);
        setIsEditingGoal(true);
    };

    const handleSaveGoal = () => {
        setDailyGoal(tempGoal);
        setIsEditingGoal(false);
    };

    const handleCancelEdit = () => {
        setTempGoal(dailyGoal);
        setIsEditingGoal(false);
    };

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm shadow-xl">
                    <p className="text-slate-400">{label}</p>
                    <p className="text-white font-medium">{formatDuration(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    const hasData = hourlyData.some(d => d.minutes > 0);

    // Preset goals (up to 20 hours)
    const goalPresets = [30, 60, 120, 180, 300, 480, 600, 720, 960, 1200];

    return (
        <div className={`bg-gradient-to-b from-slate-800/80 to-slate-900/80 rounded-2xl overflow-hidden border border-slate-700/50 ${className}`}>
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-white">Today's Activity</h3>
                        <p className="text-violet-200 text-xs opacity-80">Hourly focus breakdown</p>
                    </div>
                    {/* Goal Display/Edit */}
                    <div className="flex items-center gap-2">
                        {!isEditingGoal ? (
                            <button
                                onClick={handleEditGoal}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white text-xs"
                            >
                                <Target size={12} />
                                Goal: {formatDuration(dailyGoal)}
                                <Edit3 size={10} className="ml-1 opacity-60" />
                            </button>
                        ) : (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleCancelEdit}
                                    className="p-1.5 rounded-full bg-white/20 text-white hover:bg-red-500/50"
                                >
                                    <X size={14} />
                                </button>
                                <button
                                    onClick={handleSaveGoal}
                                    className="p-1.5 rounded-full bg-white/20 text-white hover:bg-green-500/50"
                                >
                                    <Check size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Goal Editor Panel */}
            <AnimatePresence>
                {isEditingGoal && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 py-4 bg-slate-800/50 border-b border-slate-700/50">
                            <label className="text-sm text-slate-400 mb-3 block">Set Daily Goal</label>

                            {/* Preset buttons */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {goalPresets.map(preset => (
                                    <button
                                        key={preset}
                                        onClick={() => setTempGoal(preset)}
                                        className={`
                                            px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                            ${tempGoal === preset
                                                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg'
                                                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-white border border-slate-600/50'
                                            }
                                        `}
                                    >
                                        {formatDuration(preset)}
                                    </button>
                                ))}
                            </div>

                            {/* Slider - max 20 hours */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min={15}
                                    max={1200}
                                    step={15}
                                    value={tempGoal}
                                    onChange={(e) => setTempGoal(parseInt(e.target.value))}
                                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                                    style={{
                                        background: `linear-gradient(to right, #8b5cf6 0%, #a855f7 ${(tempGoal - 15) / (1200 - 15) * 100}%, #475569 ${(tempGoal - 15) / (1200 - 15) * 100}%, #475569 100%)`
                                    }}
                                />
                                <div className="min-w-[70px] text-right">
                                    <span className="text-lg font-bold text-white">{formatDuration(tempGoal)}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="p-4">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="p-3 bg-slate-700/30 rounded-xl border-l-4 border-violet-500">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock size={14} className="text-violet-400" />
                            <span className="text-[10px] text-slate-500 uppercase">Today</span>
                        </div>
                        <p className="text-sm font-semibold text-white">{formatDuration(totalMinutes)}</p>
                    </div>
                    <div className="p-3 bg-slate-700/30 rounded-xl border-l-4 border-blue-500">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock size={14} className="text-blue-400" />
                            <span className="text-[10px] text-slate-500 uppercase">Week</span>
                        </div>
                        <p className="text-sm font-semibold text-white">{formatDuration(weeklyStats.totalMinutes)}</p>
                    </div>
                    <div className="p-3 bg-slate-700/30 rounded-xl border-l-4 border-emerald-500">
                        <div className="flex items-center gap-2 mb-1">
                            <Target size={14} className="text-emerald-400" />
                            <span className="text-[10px] text-slate-500 uppercase">Goal</span>
                        </div>
                        <p className="text-sm font-semibold text-white">{Math.round(goalProgress)}%</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>{formatDuration(totalMinutes)} focused</span>
                        <span>{formatDuration(dailyGoal)} goal</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${goalProgress}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                    </div>
                </div>

                {/* Chart */}
                {hasData ? (
                    <div className="h-36">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(71, 85, 105, 0.3)" vertical={false} />
                                <XAxis
                                    dataKey="hour"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                    interval={2}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                    tickFormatter={(v) => `${v}m`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <ReferenceLine y={hourlyGoal} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1.5} />
                                <Bar
                                    dataKey="minutes"
                                    fill="url(#purpleGradient)"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={18}
                                />
                                <defs>
                                    <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8b5cf6" />
                                        <stop offset="100%" stopColor="#7c3aed" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-36 flex flex-col items-center justify-center">
                        <Clock size={32} className="text-slate-600 mb-2" />
                        <p className="text-slate-400 text-sm">No focus sessions today</p>
                        <p className="text-slate-600 text-xs">Start a timer to begin tracking!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TodayChart;
