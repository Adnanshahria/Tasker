import React, { useState, useEffect } from 'react';
import { CheckCircle2, BookOpen, TrendingUp, Activity, BarChart2 } from 'lucide-react';
import { eachDayOfInterval, subDays, format, isSameDay } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { getAssignments, getHabits, getSettings, LocalAssignment, LocalHabit, UserSettings, DEFAULT_SETTINGS } from '../../services/dataService';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

import StatCard from '../ui/StatCard';
import SectionHeader from '../ui/SectionHeader';
import HelpModal from '../ui/HelpModal';
import DateRangeSlider from '../ui/DateRangeSlider';
import HeroBanner from './HeroBanner';
import QuickLinks from './QuickLinks';
import HeatmapGrid from './HeatmapGrid';
import { T } from './translations';

const CHART_COLORS = ['#6366f1', '#22c55e', '#f97316', '#ec4899', '#a855f7', '#14b8a6'];

const Dashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [assignments, setAssignments] = useState<LocalAssignment[]>([]);
    const [habits, setHabits] = useState<LocalHabit[]>([]);
    const [loading, setLoading] = useState(true);
    const [helpKey, setHelpKey] = useState<string | null>(null);
    const [habitDaysRange, setHabitDaysRange] = useState(14);
    const [customStart, setCustomStart] = useState<Date | null>(null);
    const [customEnd, setCustomEnd] = useState<Date | null>(null);

    const loadData = async () => {
        if (!currentUser) return;
        try {
            const [assignmentsData, habitsData, settingsData] = await Promise.all([
                getAssignments(currentUser.uid),
                getHabits(currentUser.uid),
                getSettings(currentUser.uid)
            ]);
            setAssignments(assignmentsData);
            setHabits(habitsData);
            setSettings(settingsData);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [currentUser]);

    const lang = settings.language || 'bn';
    const t = T[lang];

    // Calculate stats
    const completedStatus = settings.statuses[settings.statuses.length - 1] || 'Completed';
    const completed = assignments.filter(a => a.status === completedStatus).length;
    const pending = assignments.length - completed;
    const completedRate = assignments.length > 0 ? Math.round((completed / assignments.length) * 100) : 0;

    const today = new Date();
    const todaysCompletedHabits = habits.filter(h => h.completedDates?.some(d => isSameDay(new Date(d), today))).length;

    // Habit data for chart (dynamic range or custom range)
    const habitData = (() => {
        if (customStart && customEnd) {
            const days = eachDayOfInterval({ start: customStart, end: customEnd });
            return days.map(date => ({
                date: format(date, 'dd'),
                count: habits.filter(h => h.completedDates?.some(d => isSameDay(new Date(d), date))).length
            }));
        } else {
            return Array.from({ length: habitDaysRange }, (_, i) => {
                const date = subDays(today, habitDaysRange - 1 - i);
                const count = habits.filter(h => h.completedDates?.some(d => isSameDay(new Date(d), date))).length;
                return { date: format(date, 'dd'), count };
            });
        }
    })();

    // Assignment distribution by subject
    const assignmentData = Object.entries(
        assignments.reduce((acc, a) => {
            acc[a.subject] = (acc[a.subject] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value: value as number }));

    // Heatmap data (last 30 days)
    const heatmapData = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(today, 29 - i);
        const count = habits.filter(h => h.completedDates?.some(d => isSameDay(new Date(d), date))).length;
        return { date: format(date, 'MMM dd'), day: date.getDate(), count, intensity: habits.length > 0 ? count / habits.length : 0 };
    });

    const peak = Math.max(...habitData.map(d => d.count), 0);

    if (loading) {
        return <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div></div>;
    }

    return (
        <div className="space-y-3 md:space-y-5 pb-10 font-sans max-w-7xl mx-auto">
            <HeroBanner welcomeText={t.welcome} userName={currentUser?.displayName || currentUser?.email?.split('@')[0] || ''} />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
                <StatCard icon={BookOpen} iconColor="bg-indigo-500/20 text-indigo-400" label={t.exams} value={assignments.filter(a => a.type?.toLowerCase().includes('exam') || a.type?.includes('পরীক্ষা')).length} helpKey="upcomingExams" onHelpClick={setHelpKey} />
                <StatCard icon={CheckCircle2} iconColor="bg-amber-500/20 text-amber-400" label={t.habitsLabel} value={`${todaysCompletedHabits}/${habits.length}`} helpKey="activeHabits" onHelpClick={setHelpKey} />
                <StatCard icon={Activity} iconColor="bg-rose-500/20 text-rose-400" label={t.pending} value={pending} helpKey="pendingTasks" onHelpClick={setHelpKey} />
                <StatCard icon={TrendingUp} iconColor="bg-emerald-500/20 text-emerald-400" label={t.completion} value={`${completedRate}%`} helpKey="completionRate" onHelpClick={setHelpKey} />
                <StatCard icon={BarChart2} iconColor="bg-violet-500/20 text-violet-400" label={t.peak} value={peak} helpKey="peakHabits" onHelpClick={setHelpKey} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-5">
                <div className="bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-2 md:p-4 shadow-xl">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                        <SectionHeader title={`${t.consistency.replace('14', habitDaysRange.toString())}`} helpKey="habitConsistency" onHelpClick={setHelpKey} />
                        <DateRangeSlider
                            minDays={7}
                            maxDays={90}
                            value={habitDaysRange}
                            onChange={(days) => {
                                setHabitDaysRange(days);
                                setCustomStart(null);
                                setCustomEnd(null);
                            }}
                            onCustomRange={(start, end) => {
                                setCustomStart(start);
                                setCustomEnd(end);
                            }}
                            customStart={customStart}
                            customEnd={customEnd}
                        />
                    </div>
                    <div className="h-36 md:h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={habitData}>
                                <XAxis dataKey="date" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                                <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} width={30} domain={[0, habits.length || 1]} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc', fontSize: 12 }} />
                                <Line type="monotone" dataKey="count" stroke="url(#lineGradient)" strokeWidth={3} dot={{ r: 4, fill: '#818cf8', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#6366f1' }} />
                                <defs><linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#a855f7" /></linearGradient></defs>
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-2 md:p-4 shadow-xl">
                    <SectionHeader title={t.distribution} helpKey="assignmentDistribution" onHelpClick={setHelpKey} />
                    <div className="h-36 md:h-56">
                        {assignmentData.length > 0 ? (
                            <div className="h-full flex flex-col">
                                {/* Custom Radial Progress Chart */}
                                <div className="flex-1 flex items-center justify-center relative">
                                    <div className="relative w-32 h-32 md:w-40 md:h-40">
                                        {/* Background circle */}
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                                            {/* Animated segments */}
                                            {(() => {
                                                const total = assignmentData.reduce((sum, d) => sum + d.value, 0);
                                                let accumulated = 0;
                                                return assignmentData.map((d, i) => {
                                                    const percentage = d.value / total;
                                                    const circumference = 2 * Math.PI * 42;
                                                    const strokeDash = percentage * circumference;
                                                    const offset = (accumulated / total) * circumference;
                                                    accumulated += d.value;
                                                    return (
                                                        <circle
                                                            key={i}
                                                            cx="50"
                                                            cy="50"
                                                            r="42"
                                                            fill="none"
                                                            stroke={CHART_COLORS[i % CHART_COLORS.length]}
                                                            strokeWidth="12"
                                                            strokeDasharray={`${strokeDash} ${circumference}`}
                                                            strokeDashoffset={-offset}
                                                            strokeLinecap="round"
                                                            className="transition-all duration-700 ease-out"
                                                            style={{ filter: `drop-shadow(0 0 6px ${CHART_COLORS[i % CHART_COLORS.length]}40)` }}
                                                        />
                                                    );
                                                });
                                            })()}
                                        </svg>
                                        {/* Center content */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                                {assignments.length}
                                            </span>
                                            <span className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider">Total</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Legend pills */}
                                <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 mt-2">
                                    {assignmentData.slice(0, 5).map((d, i) => (
                                        <div key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/80 border border-white/5">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length], boxShadow: `0 0 6px ${CHART_COLORS[i % CHART_COLORS.length]}` }} />
                                            <span className="text-[10px] md:text-xs text-slate-300 truncate max-w-[60px] md:max-w-[80px]">{d.name}</span>
                                            <span className="text-[10px] font-semibold text-white">{d.value}</span>
                                        </div>
                                    ))}
                                    {assignmentData.length > 5 && (
                                        <div className="flex items-center px-2 py-0.5 rounded-full bg-slate-700/50 border border-white/5">
                                            <span className="text-[10px] text-slate-400">+{assignmentData.length - 5} more</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : <div className="h-full flex items-center justify-center text-slate-500 text-sm">{t.noData}</div>}
                    </div>
                </div>
            </div>

            <HeatmapGrid title={t.grid} data={heatmapData} habitsLabel={t.habits} helpKey="heatmapGrid" onHelpClick={setHelpKey} />
            <QuickLinks t={t} onLogout={logout} />

            <HelpModal helpKey={helpKey} lang={lang} onClose={() => setHelpKey(null)} />
        </div>
    );
};

export default Dashboard;
