import React, { useState, useEffect } from 'react';
import { CheckCircle2, BookOpen, TrendingUp, Activity, BarChart2 } from 'lucide-react';
import { subDays, format, isSameDay } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { getAssignments, getHabits, getSettings, LocalAssignment, LocalHabit, UserSettings, DEFAULT_SETTINGS_BN } from '../../services/dataService';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

import StatCard from '../ui/StatCard';
import SectionHeader from '../ui/SectionHeader';
import HelpModal from '../ui/HelpModal';
import HeroBanner from './HeroBanner';
import QuickLinks from './QuickLinks';
import HeatmapGrid from './HeatmapGrid';
import { T } from './translations';

const CHART_COLORS = ['#6366f1', '#22c55e', '#f97316', '#ec4899', '#a855f7', '#14b8a6'];

const Dashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS_BN);
    const [assignments, setAssignments] = useState<LocalAssignment[]>([]);
    const [habits, setHabits] = useState<LocalHabit[]>([]);
    const [loading, setLoading] = useState(true);
    const [helpKey, setHelpKey] = useState<string | null>(null);

    const loadData = async () => {
        if (!currentUser) return;
        setLoading(true);
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

    // Habit data for chart (last 14 days)
    const habitData = Array.from({ length: 14 }, (_, i) => {
        const date = subDays(today, 13 - i);
        const count = habits.filter(h => h.completedDates?.some(d => isSameDay(new Date(d), date))).length;
        return { date: format(date, 'dd'), count };
    });

    // Assignment distribution by subject
    const assignmentData = Object.entries(
        assignments.reduce((acc, a) => {
            acc[a.subject] = (acc[a.subject] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }));

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
        <div className="space-y-6 pb-12 font-sans max-w-7xl mx-auto">
            <HeroBanner welcomeText={t.welcome} userName={currentUser?.displayName || currentUser?.email?.split('@')[0] || ''} />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard icon={BookOpen} iconColor="bg-indigo-500/20 text-indigo-400" label={t.exams} value={assignments.filter(a => a.type?.toLowerCase().includes('exam') || a.type?.includes('পরীক্ষা')).length} helpKey="upcomingExams" onHelpClick={setHelpKey} />
                <StatCard icon={CheckCircle2} iconColor="bg-amber-500/20 text-amber-400" label={t.habitsLabel} value={`${todaysCompletedHabits}/${habits.length}`} helpKey="activeHabits" onHelpClick={setHelpKey} />
                <StatCard icon={Activity} iconColor="bg-rose-500/20 text-rose-400" label={t.pending} value={pending} helpKey="pendingTasks" onHelpClick={setHelpKey} />
                <StatCard icon={TrendingUp} iconColor="bg-emerald-500/20 text-emerald-400" label={t.completion} value={`${completedRate}%`} helpKey="completionRate" onHelpClick={setHelpKey} />
                <StatCard icon={BarChart2} iconColor="bg-violet-500/20 text-violet-400" label={t.peak} value={peak} helpKey="peakHabits" onHelpClick={setHelpKey} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-5 shadow-xl">
                    <SectionHeader title={t.consistency} helpKey="habitConsistency" onHelpClick={setHelpKey} />
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={habitData}>
                                <XAxis dataKey="date" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                                <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc', fontSize: 12 }} />
                                <Line type="monotone" dataKey="count" stroke="url(#lineGradient)" strokeWidth={3} dot={{ r: 4, fill: '#818cf8', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#6366f1' }} />
                                <defs><linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#a855f7" /></linearGradient></defs>
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-5 shadow-xl">
                    <SectionHeader title={t.distribution} helpKey="assignmentDistribution" onHelpClick={setHelpKey} />
                    <div className="h-64">
                        {assignmentData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart><Pie data={assignmentData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">{assignmentData.map((_, i) => <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="rgba(0,0,0,0)" />)}</Pie><Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc', fontSize: 12 }} /><Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} /></PieChart>
                            </ResponsiveContainer>
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
