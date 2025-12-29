import React, { useState, useEffect } from 'react';
import { CheckCircle2, BookOpen, TrendingUp, Activity, BarChart2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { getSettings } from '../../services/settings';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { CHART_COLORS } from '../../constants/helpContent';

import StatCard from '../ui/StatCard';
import SectionHeader from '../ui/SectionHeader';
import HelpModal from '../ui/HelpModal';
import HeroBanner from './HeroBanner';
import QuickLinks from './QuickLinks';
import HeatmapGrid from './HeatmapGrid';
import { T } from './translations';

const Dashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const data = useDashboardData(currentUser?.uid);
    const [lang, setLang] = useState<'en' | 'bn'>('bn');
    const [helpKey, setHelpKey] = useState<string | null>(null);

    useEffect(() => { if (currentUser) setLang(getSettings(currentUser.uid).language || 'bn'); }, [currentUser]);

    const t = T[lang];

    return (
        <div className="space-y-6 pb-12 font-sans max-w-7xl mx-auto">
            <HeroBanner welcomeText={t.welcome} userName={currentUser?.displayName || ''} />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard icon={BookOpen} iconColor="bg-indigo-500/20 text-indigo-400" label={t.exams} value={data.exams.length} helpKey="upcomingExams" onHelpClick={setHelpKey} />
                <StatCard icon={CheckCircle2} iconColor="bg-amber-500/20 text-amber-400" label={t.habitsLabel} value={`${data.todaysHabits.completed}/${data.todaysHabits.total}`} helpKey="activeHabits" onHelpClick={setHelpKey} />
                <StatCard icon={Activity} iconColor="bg-rose-500/20 text-rose-400" label={t.pending} value={data.stats.pending} helpKey="pendingTasks" onHelpClick={setHelpKey} />
                <StatCard icon={TrendingUp} iconColor="bg-emerald-500/20 text-emerald-400" label={t.completion} value={`${data.stats.completedRate}%`} helpKey="completionRate" onHelpClick={setHelpKey} />
                <StatCard icon={BarChart2} iconColor="bg-violet-500/20 text-violet-400" label={t.peak} value={data.stats.peak} helpKey="peakHabits" onHelpClick={setHelpKey} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-5 shadow-xl">
                    <SectionHeader title={t.consistency} helpKey="habitConsistency" onHelpClick={setHelpKey} />
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.habitData}>
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
                        {data.assignmentData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart><Pie data={data.assignmentData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">{data.assignmentData.map((_, i) => <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="rgba(0,0,0,0)" />)}</Pie><Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc', fontSize: 12 }} /><Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} /></PieChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-slate-500 text-sm">{t.noData}</div>}
                    </div>
                </div>
            </div>

            <HeatmapGrid title={t.grid} data={data.heatmapData} habitsLabel={t.habits} helpKey="heatmapGrid" onHelpClick={setHelpKey} />
            <QuickLinks t={t} onLogout={logout} />

            <HelpModal helpKey={helpKey} lang={lang} onClose={() => setHelpKey(null)} />
        </div>
    );
};

export default Dashboard;
