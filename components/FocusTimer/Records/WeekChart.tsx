import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts';
import { Calendar, Clock, TrendingUp } from 'lucide-react';
import { useFocusDashboard, formatDuration } from '../../../hooks/useFocusDashboard';
import { useTimerStore } from '../../../store/timerStore';

interface WeekChartProps {
    className?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const WeekChart: React.FC<WeekChartProps> = ({ className = '' }) => {
    const [weekStartsOn, setWeekStartsOn] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(1); // Default Monday
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
        <div className={`bg-slate-800/50 rounded-2xl overflow-hidden ${className}`}>
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3">
                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-white" />
                    <h3 className="text-base font-semibold text-white">Weekly Activity</h3>
                </div>
            </div>

            <div className="p-4">
                {/* Stats Row */}
                <div className="flex items-center gap-4 mb-3 text-sm">
                    <div className="flex items-center gap-1">
                        <Clock size={12} className="text-slate-500" />
                        <span className="text-slate-400">Total: <span className="text-white font-medium">{formatDuration(stats.totalMinutes)}</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                        <TrendingUp size={12} className="text-slate-500" />
                        <span className="text-slate-400">Avg: <span className="text-white font-medium">{formatDuration(stats.dailyAverage)}/day</span></span>
                    </div>
                </div>

                {/* Week Start Selector */}
                <div className="flex items-center gap-1 mb-4">
                    <span className="text-slate-500 text-xs mr-2">Starts:</span>
                    {DAYS.map((day, i) => (
                        <button
                            key={day}
                            onClick={() => setWeekStartsOn(i as 0 | 1 | 2 | 3 | 4 | 5 | 6)}
                            className={`px-2 py-1 text-xs rounded transition-colors ${weekStartsOn === i
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            {day}
                        </button>
                    ))}
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
    );
};

export default WeekChart;
