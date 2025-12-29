import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Assignment, Habit } from '../types';
import { format, isToday, isTomorrow, formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Bell, Calendar, CheckCircle2, ArrowRight, TrendingUp, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([]);
  const [todaysHabits, setTodaysHabits] = useState<{total: number, completed: number}>({ total: 0, completed: 0 });
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    const fetchData = async () => {
      if (!currentUser) return;
      setLoading(true);
      setError(null);

      try {
        // Fetch Assignments: Simple query by userId only
        const assignQ = query(
           collection(db, 'assignments'),
           where('userId', '==', currentUser.uid)
        );

        const assignSnap = await getDocs(assignQ);
        let assigns = assignSnap.docs
          .map(d => ({id: d.id, ...d.data()})) as Assignment[];
        
        // Client-side Filter: Status != Completed
        assigns = assigns.filter(a => a.status !== 'Completed');

        // Client-side Sort: Due Date Ascending
        assigns.sort((a, b) => a.dueDate.seconds - b.dueDate.seconds);
        
        setUpcomingAssignments(assigns.slice(0, 4));

        // Habits
        const habitQ = query(collection(db, 'habits'), where('userId', '==', currentUser.uid));
        const habitSnap = await getDocs(habitQ);
        const habits = habitSnap.docs.map(d => d.data()) as Habit[];
        
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const completed = habits.filter(h => h.completedDates.includes(todayStr)).length;
        
        setTodaysHabits({ total: habits.length, completed });
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        if (error.code === 'permission-denied') {
          setError("Permission denied. Please check your Firestore Security Rules.");
        } else {
          setError("Failed to load dashboard data.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
         <div className="text-slate-400 animate-pulse">Loading your dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-6 text-center">
         <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl max-w-md">
            <h3 className="text-red-400 font-bold text-lg mb-2">Access Error</h3>
            <p className="text-slate-300">{error}</p>
         </div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12"
    >
      {/* Hero Header */}
      <motion.div 
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-8 md:p-10 shadow-2xl border border-white/10"
      >
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-black/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{greeting}, {currentUser?.displayName?.split(' ')[0] || 'User'}!</h1>
            <p className="text-indigo-100 text-lg opacity-90">Ready to conquer your goals today?</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Calendar className="text-white" size={24} />
            </div>
            <div>
              <p className="text-indigo-100 text-xs uppercase font-semibold tracking-wider">Today</p>
              <p className="text-white font-bold text-lg">{format(new Date(), 'MMMM d, yyyy')}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Habit Progress Card */}
        <motion.div variants={itemVariants} className="bg-slate-900/50 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-slate-400 font-medium mb-1">Daily Habits</h3>
              <p className="text-3xl font-bold text-white">
                {todaysHabits.completed} <span className="text-slate-500 text-lg font-normal">/ {todaysHabits.total}</span>
              </p>
            </div>
            <div className="bg-emerald-500/10 p-2 rounded-lg">
              <TrendingUp className="text-emerald-400" size={20} />
            </div>
          </div>
          
          <div className="w-full bg-slate-800 rounded-full h-3 mb-2 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${todaysHabits.total > 0 ? (todaysHabits.completed / todaysHabits.total) * 100 : 0}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
            />
          </div>
          <p className="text-xs text-slate-500 text-right">{todaysHabits.total > 0 ? Math.round((todaysHabits.completed / todaysHabits.total) * 100) : 0}% Completed</p>
        </motion.div>

        {/* Pending Assignments Card */}
        <motion.div variants={itemVariants} className="bg-slate-900/50 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-slate-400 font-medium mb-1">Assignments Due</h3>
              <p className="text-3xl font-bold text-white">{upcomingAssignments.length}</p>
            </div>
            <div className="bg-amber-500/10 p-2 rounded-lg">
              <Bell className="text-amber-400" size={20} />
            </div>
          </div>
          <div className="mt-2">
            {upcomingAssignments.length > 0 ? (
               <p className="text-slate-400 text-sm">Next due: <span className="text-amber-300 font-medium">{upcomingAssignments[0].title}</span></p>
            ) : (
               <p className="text-slate-500 text-sm">All caught up! Great job.</p>
            )}
          </div>
          <Link to="/assignments" className="mt-4 flex items-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            View all assignments <ArrowRight size={14} className="ml-1" />
          </Link>
        </motion.div>

        {/* Motivation Card */}
        <motion.div variants={itemVariants} className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col justify-center text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 p-3 opacity-10">
              <CheckCircle2 size={100} />
           </div>
           <p className="text-slate-300 italic mb-2">"Productivity is never an accident. It is always the result of a commitment to excellence."</p>
           <p className="text-slate-500 text-sm">– Paul J. Meyer</p>
        </motion.div>

      </div>

      {/* Upcoming Deadlines List */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Upcoming Deadlines</h2>
          <Link to="/assignments" className="text-sm text-slate-400 hover:text-white transition-colors">See all</Link>
        </div>
        
        <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
          {upcomingAssignments.length > 0 ? (
            <div className="divide-y divide-white/5">
              {upcomingAssignments.map((assignment) => (
                <div key={assignment.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      assignment.priority === 'Urgent' ? 'bg-red-500/10 text-red-400' : 
                      assignment.priority === 'Medium' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-500/10 text-slate-400'
                    }`}>
                      <Clock size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-200">{assignment.title}</h4>
                      <p className="text-xs text-slate-500">{assignment.subject} • {format(assignment.dueDate.toDate(), 'MMM d, h:mm a')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                       isToday(assignment.dueDate.toDate()) ? 'bg-amber-500/20 text-amber-300' : 
                       isTomorrow(assignment.dueDate.toDate()) ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700/50 text-slate-400'
                    }`}>
                      {isToday(assignment.dueDate.toDate()) ? 'Today' : formatDistanceToNow(assignment.dueDate.toDate(), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center">
              <CheckCircle2 size={40} className="mb-2 opacity-20" />
              <p>No upcoming assignments.</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;