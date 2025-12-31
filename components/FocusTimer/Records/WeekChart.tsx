import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts';
import { Calendar, Clock, TrendingUp, Settings, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusDashboard, formatDuration } from '../../../hooks/useFocusDashboard';
import { useTimerStore } from '../../../store/timerStore';

interface WeekChartProps {
    className?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

const WeekChart: React.FC<WeekChartProps> = ({ className = '' }) => {
    const [weekStartsOn, setWeekStartsOn] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(() => {
        const saved = localStorage.getItem('weekStartsOn');
        return saved ? (parseInt(saved) as 0 | 1 | 2 | 3 | 4 | 5 | 6) : 1;
    });
    const [showSettings, setShowSettings] = useState(false);
    const [tempWeekStart, setTempWeekStart] = useState(weekStartsOn);

    const handleSaveSettings = () => {
        setWeekStartsOn(tempWeekStart);
        localStorage.setItem('weekStartsOn', tempWeekStart.toString());
        setShowSettings(false);
    };

    const { getWeeklyData, calculateWeeklyStats } = useFocusDashboard();
    const dailyGoal = useTimerStore((state) => state.dailyGoal);

    const weeklyData = useMemo(() => getWeeklyData(weekStartsOn), [getWeeklyData, weekStartsOn]);
    const stats = useMemo(() => calculateWeeklyStats(weeklyData), [calculateWeeklyStats, weeklyData]);

    const hasData = weeklyData.some(d => d.minutes > 0);

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm">
                    <p className="text-slate-400">{label}</p>
                    <p className="text-white font-medium">{formatDuration(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <>
            <div className={`bg-slate-800/50 rounded-2xl overflow-hidden ${className}`}>
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar size={18} className="text-white" />
                            <h3 className="text-base font-semibold text-white">Weekly Activity</h3>
                        </div>
                        <button
                            onClick={() => { setTempWeekStart(weekStartsOn); setShowSettings(true); }}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
                        >
                            <Settings size={14} />
                        </button>
                    </div>
                </div>

                <div className="p-4">
                    {/* Stats Row */}
                    <div className="flex items-center gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-1">
                            <Clock size={12} className="text-slate-500" />
                            <span className="text-slate-400">Total: <span className="text-white font-medium">{formatDuration(stats.totalMinutes)}</span></span>
                        </div>
                        <div className="flex items-center gap-1">
                            <TrendingUp size={12} className="text-slate-500" />
                            <span className="text-slate-400">Avg: <span className="text-white font-medium">{formatDuration(stats.dailyAverage)}/day</span></span>
                        </div>
                    </div>

                    {/* Chart */}
                    {hasData ? (
                        <div className="h-32">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(71, 85, 105, 0.3)" vertical={false} />
                                    <XAxis
                                        dataKey="displayDate"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 10 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 10 }}
                                        tickFormatter={(v) => `${Math.round(v)}m`}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <ReferenceLine y={dailyGoal} stroke="#10b981" strokeDasharray="3 3" />
                                    <Bar
                                        dataKey="minutes"
                                        fill="#3b82f6"
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={40}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-32 flex flex-col items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center mb-2">
                                <Calendar size={20} className="text-slate-500" />
                            </div>
                            <p className="text-slate-500 text-xs">No data for this week</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowSettings(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-6 shadow-2xl border border-white/10"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                        <Calendar size={20} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Week Settings</h3>
                                        <p className="text-xs text-slate-400">Choose week start day</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Day Selection */}
                            <div className="space-y-2 mb-6">
                                {DAYS.map((day, i) => (
                                    <button
                                        key={day}
                                        onClick={() => setTempWeekStart(i as 0 | 1 | 2 | 3 | 4 | 5 | 6)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${tempWeekStart === i
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                            }`}
                                    >
                                        <span className="font-medium">{FULL_DAYS[i]}</span>
                                        {tempWeekStart === i && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                            >
                                                <Check size={18} />
                                            </motion.div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-medium hover:bg-white/10 transition-all"
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSaveSettings}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold transition-all shadow-lg shadow-blue-500/25"
                                >
                                    Save
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default WeekChart;

