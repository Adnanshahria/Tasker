import React from 'react';
import { format, isSameDay, isSameMonth, isPast, startOfDay } from 'date-fns';
import { Trash2, Check, X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LocalHabit } from '../../services/dataService';
import { isHabitCompletedOnDate, calculateCompletionRate } from './helpers';

interface TableProps {
    habits: LocalHabit[];
    daysInMonth: Date[];
    t: Record<string, string>;
    lang: 'en' | 'bn';
    onToggle: (habit: LocalHabit, date: Date) => void;
    onDelete: (id: string) => void;
}

const Table: React.FC<TableProps> = ({ habits, daysInMonth, t, lang, onToggle, onDelete }) => (
    <table className="w-full text-left border-separate border-spacing-0">
        <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-slate-800 to-slate-800/90 backdrop-blur-sm text-slate-300 text-[10px] md:text-xs font-bold border-b-2 border-emerald-500/30">
                <th className="w-8 p-2 md:p-3 text-center text-slate-500 bg-slate-800 border-b border-r border-slate-600/50 sticky left-0 z-20">#</th>
                <th className="p-2 md:p-3 border-b border-r border-slate-600/50 w-[90px] md:w-[120px] bg-slate-800 sticky left-8 z-20">{t.habitName}</th>
                <th className="hidden md:table-cell p-3 border-r border-slate-600/50 w-[80px]">{t.description}</th>
                {daysInMonth.map(day => (
                    <th key={day.toISOString()} className={`p-0.5 md:p-1 border-r border-slate-600/50 w-7 md:w-8 text-center ${isSameDay(day, new Date()) && isSameMonth(day, new Date()) ? 'bg-emerald-500/30 text-emerald-300' : ''}`}>
                        {format(day, 'd')}
                    </th>
                ))}
                <th className="p-1 md:p-2 border-r border-slate-600/50 w-[40px] md:w-[50px] text-center">%</th>
                <th className="p-1 md:p-2 w-[32px] md:w-[40px] text-center">{t.del}</th>
            </tr>
        </thead>
        <tbody className="bg-slate-900/50 text-xs md:text-sm">
            <AnimatePresence>
                {habits.map((habit, idx) => (
                    <motion.tr key={habit.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group hover:bg-emerald-500/5 transition-colors border-b border-slate-700/50">
                        <td className="w-8 text-center text-[10px] md:text-xs text-slate-500 bg-slate-800 font-mono p-1 md:p-2 border-b border-r border-slate-700/50 sticky left-0 z-10">{idx + 1}</td>
                        <td className="p-0 border-b border-r border-slate-700/50 bg-slate-900 sticky left-8 z-10"><div className="px-1.5 md:px-2 py-1.5 md:py-2 text-slate-200 font-medium truncate text-xs md:text-sm">{habit.title}</div></td>
                        <td className="hidden md:table-cell p-2 border-r border-slate-700/50 text-slate-400 text-xs"><div className="truncate max-w-[70px]" title={habit.description}>{habit.description || '-'}</div></td>
                        {daysInMonth.map(day => {
                            const done = isHabitCompletedOnDate(habit, day);
                            const isToday = isSameDay(day, new Date());
                            const isPastDay = isPast(startOfDay(day)) && !isToday;
                            const missed = isPastDay && !done;
                            return (
                                <td key={day.toISOString()} className="p-0 border-r border-slate-700/50 text-center">
                                    <button onClick={() => onToggle(habit, day)} className={`w-full h-8 md:h-9 flex items-center justify-center transition-all ${done ? 'bg-emerald-500/30 text-emerald-400' : missed ? 'bg-red-500/10 text-red-400/60' : 'hover:bg-slate-800'}`}>
                                        {done && <Check size={12} strokeWidth={3} className="md:hidden" />}
                                        {done && <Check size={14} strokeWidth={3} className="hidden md:block" />}
                                        {missed && <X size={10} strokeWidth={2} className="md:hidden" />}
                                        {missed && <X size={12} strokeWidth={2} className="hidden md:block" />}
                                    </button>
                                </td>
                            );
                        })}
                        <td className="p-1 md:p-2 border-r border-slate-700/50 text-center font-mono text-[10px] md:text-xs font-bold" style={{ color: `hsl(${calculateCompletionRate(habit, daysInMonth) * 1.2}, 70%, 50%)` }}>
                            {calculateCompletionRate(habit, daysInMonth)}%
                        </td>
                        <td className="p-1 md:p-2 text-center">
                            <button onClick={() => onDelete(habit.id)} className="p-1 md:p-1.5 hover:bg-red-500 hover:text-white rounded-lg text-slate-400 md:opacity-0 md:group-hover:opacity-100 transition-all"><Trash2 size={12} /></button>
                        </td>
                    </motion.tr>
                ))}
            </AnimatePresence>
        </tbody>
    </table>
);

export default Table;
