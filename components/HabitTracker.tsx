import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Habit } from '../types';
import { format } from 'date-fns';
import { Plus, Trash2, Sprout, Leaf, TreeDeciduous, Flower2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HabitTracker: React.FC = () => {
  const { currentUser } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (!currentUser) return;
    setError(null);

    const q = query(collection(db, 'habits'), where('userId', '==', currentUser.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Habit[];
      setHabits(data);
      setError(null);
    }, (err) => {
      console.error("Habit listener error:", err);
      if (err.code === 'permission-denied') {
        setError("Access denied. Please update Firestore Rules.");
      } else {
        setError("Failed to load habits.");
      }
    });

    return unsubscribe;
  }, [currentUser]);

  const addHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim() || !currentUser) return;
    try {
      await addDoc(collection(db, 'habits'), {
        userId: currentUser.uid,
        name: newHabitName,
        completedDates: []
      });
      setNewHabitName('');
    } catch (err: any) {
      console.error(err);
      alert("Failed to add habit: " + err.message);
    }
  };

  const toggleHabit = async (habit: Habit) => {
    try {
      const isCompleted = habit.completedDates.includes(todayStr);
      const habitRef = doc(db, 'habits', habit.id);
      if (isCompleted) {
        await updateDoc(habitRef, { completedDates: arrayRemove(todayStr) });
      } else {
        await updateDoc(habitRef, { completedDates: arrayUnion(todayStr) });
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to update habit: " + err.message);
    }
  };

  const deleteHabit = async (id: string) => {
    if (confirm("Delete this habit?")) {
      try {
        await deleteDoc(doc(db, 'habits', id));
      } catch (err: any) {
        console.error(err);
        alert("Failed to delete habit: " + err.message);
      }
    }
  };

  // Logic for Tree Growth
  const completedCount = habits.filter(h => h.completedDates.includes(todayStr)).length;
  const totalCount = habits.length;
  const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const getTreeStage = () => {
    if (percentage === 0 && totalCount > 0) return { icon: Sprout, color: 'text-stone-500', label: 'Plant a seed', scale: 0.8 };
    if (percentage <= 20) return { icon: Sprout, color: 'text-amber-700', label: 'Seeding', scale: 0.9 };
    if (percentage <= 50) return { icon: Leaf, color: 'text-green-500', label: 'Sprouting', scale: 1.0 };
    if (percentage <= 80) return { icon: TreeDeciduous, color: 'text-emerald-500', label: 'Growing Strong', scale: 1.1 };
    return { icon: Flower2, color: 'text-pink-400', label: 'Full Bloom', scale: 1.2 };
  };

  const stage = getTreeStage();
  const StageIcon = stage.icon;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-8rem)]">
      
      {/* Left Column: Habits List */}
      <div className="lg:col-span-2 space-y-6 flex flex-col h-full">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sprout className="text-green-400" /> Daily Habits
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-300">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Add Habit Form */}
        <form onSubmit={addHabit} className="flex gap-3">
          <input
            type="text"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            placeholder="New habit (e.g., Read 10 pages)"
            className="flex-1 bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none backdrop-blur-sm"
          />
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition-colors">
            <Plus />
          </button>
        </form>

        {/* Habit Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 pb-4">
          <AnimatePresence>
            {habits.map((habit) => {
              const isDone = habit.completedDates.includes(todayStr);
              return (
                <motion.div
                  key={habit.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => toggleHabit(habit)}
                  className={`
                    cursor-pointer p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group
                    ${isDone 
                      ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30' 
                      : 'bg-slate-800/40 border-white/5 hover:border-white/20'
                    }
                  `}
                >
                  <div className="flex justify-between items-center relative z-10">
                    <span className={`font-medium text-lg ${isDone ? 'text-green-200 line-through decoration-green-500/50' : 'text-slate-300'}`}>
                      {habit.name}
                    </span>
                    <div className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                      ${isDone ? 'bg-green-500 border-green-500' : 'border-slate-500 group-hover:border-indigo-400'}
                    `}>
                      {isDone && <motion.div initial={{scale: 0}} animate={{scale: 1}}><div className="w-2 h-2 bg-white rounded-full" /></motion.div>}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteHabit(habit.id); }}
                    className="absolute top-2 right-2 p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Column: Tree Visualization */}
      <div className="lg:col-span-1">
        <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 h-full flex flex-col items-center justify-center relative overflow-hidden shadow-2xl backdrop-blur-xl">
          
          {/* Progress Circle Background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="w-64 h-64 rounded-full border-4 border-slate-800/50" />
          </div>

          <div className="text-center z-10 space-y-2 mb-8">
            <h3 className="text-slate-400 uppercase tracking-widest text-sm font-semibold">Daily Growth</h3>
            <p className="text-4xl font-bold text-white">{percentage}%</p>
          </div>

          {/* The Tree */}
          <div className="relative w-48 h-48 flex items-center justify-center">
            {totalCount === 0 ? (
               <div className="text-slate-500 text-center">Add habits to start growing!</div>
            ) : (
                <motion.div
                  key={stage.label}
                  animate={{ scale: stage.scale, rotate: [0, 5, -5, 0] }}
                  transition={{ 
                    scale: { duration: 0.5, type: 'spring' },
                    rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className={`drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] ${stage.color}`}
                >
                  <StageIcon size={120} strokeWidth={1} />
                </motion.div>
            )}
          </div>

          <div className="mt-8 text-center z-10">
            <p className={`text-xl font-medium ${stage.color}`}>{stage.label}</p>
            <p className="text-slate-500 text-sm mt-2">{completedCount}/{totalCount} habits completed</p>
          </div>

          {/* Decorative Particles */}
          {percentage === 100 && (
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               className="absolute inset-0 pointer-events-none"
             >
                {[...Array(10)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-pink-400 rounded-full"
                    initial={{ x: Math.random() * 300 - 150, y: 300, opacity: 1 }}
                    animate={{ y: -300, opacity: 0 }}
                    transition={{ duration: 2 + Math.random(), repeat: Infinity, delay: Math.random() * 2 }}
                    style={{ left: '50%' }}
                  />
                ))}
             </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};

export default HabitTracker;