import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Assignment, Habit } from '../types';
import { addDays, format } from 'date-fns';
import { BarChart2, PieChart as PieChartIcon, Activity, AlertCircle } from 'lucide-react';

const COLORS = ['#6366f1', '#06b6d4', '#ec4899', '#8b5cf6', '#10b981'];

const Analytics: React.FC = () => {
  const { currentUser } = useAuth();
  const [assignmentData, setAssignmentData] = useState<any[]>([]);
  const [habitData, setHabitData] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, completedRate: 0, streak: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      setError(null);

      try {
        // Fetch Assignments
        const assignQ = query(collection(db, 'assignments'), where('userId', '==', currentUser.uid));
        const assignSnap = await getDocs(assignQ);
        const assignments = assignSnap.docs.map(d => d.data()) as Assignment[];

        // Process for Pie Chart (Subject Load)
        const subjectMap: Record<string, number> = {};
        let completedAssigns = 0;
        assignments.forEach(a => {
          if(a.status === 'Completed') completedAssigns++;
          if (subjectMap[a.subject]) subjectMap[a.subject]++;
          else subjectMap[a.subject] = 1;
        });

        const pieData = Object.keys(subjectMap).map(key => ({
          name: key,
          value: subjectMap[key]
        }));
        setAssignmentData(pieData);

        // Fetch Habits
        const habitQ = query(collection(db, 'habits'), where('userId', '==', currentUser.uid));
        const habitSnap = await getDocs(habitQ);
        const habits = habitSnap.docs.map(d => d.data()) as Habit[];

        // Process for Line Chart (Last 14 days)
        const lineData = Array.from({ length: 14 }, (_, i) => {
          const d = addDays(new Date(), -(13 - i));
          const dateStr = format(d, 'yyyy-MM-dd');
          const count = habits.reduce((acc, habit) => {
            return acc + (habit.completedDates.includes(dateStr) ? 1 : 0);
          }, 0);
          return { date: format(d, 'MMM dd'), count };
        });
        setHabitData(lineData);

        // Stats
        setStats({
          pending: assignments.length - completedAssigns,
          completedRate: assignments.length > 0 ? Math.round((completedAssigns / assignments.length) * 100) : 0,
          streak: calculateStreak(habits)
        });
      } catch (err: any) {
        console.error("Analytics fetch error:", err);
        if (err.code === 'permission-denied') {
          setError("Access denied. Please check Firestore Rules.");
        } else {
          setError("Failed to load analytics data.");
        }
      }
    };

    fetchData();
  }, [currentUser]);

  const calculateStreak = (habits: Habit[]) => {
    // Simple logic: max consecutive days where at least one habit was done
    // For a real app, this logic would be more complex per-habit or global
    return 0; // Placeholder for complexity, requires mapping all completed dates to a timeline
  };

  return (
    <div className="space-y-8 pb-10">
      <h2 className="text-2xl font-bold text-white mb-6">Analytics Dashboard</h2>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-300">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-2 text-slate-400">
            <Activity size={20} className="text-indigo-400" />
            <span className="font-medium">Assignments Pending</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.pending}</p>
        </div>
        <div className="bg-slate-800/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-2 text-slate-400">
            <PieChartIcon size={20} className="text-cyan-400" />
            <span className="font-medium">Completion Rate</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.completedRate}%</p>
        </div>
        <div className="bg-slate-800/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
           <div className="flex items-center gap-3 mb-2 text-slate-400">
            <BarChart2 size={20} className="text-pink-400" />
            <span className="font-medium">Active Habits</span>
          </div>
          <p className="text-3xl font-bold text-white">{habitData.length > 0 ? Math.max(...habitData.map(d => d.count)) : 0}</p>
          <p className="text-xs text-slate-500 mt-1">Peak daily completions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Line Chart */}
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-6">Habit Consistency (Last 14 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={habitData}>
                <defs>
                   <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#475569" tick={{fill: '#94a3b8', fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" tick={{fill: '#94a3b8', fontSize: 12}} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                  cursor={{ stroke: '#475569', strokeWidth: 1 }}
                />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#818cf8', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-6">Assignment Distribution</h3>
          <div className="h-72">
            {assignmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assignmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {assignmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                No assignment data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;