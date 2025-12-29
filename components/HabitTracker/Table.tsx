import React from 'react';
import { format, isSameDay, isSameMonth } from 'date-fns';
import { Trash2, Check, FileText } from 'lucide-react';
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
    <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-slate-800 to-slate-800/90 backdrop-blur-sm text-slate-300 text-xs font-bold border-b-2 border-emerald-500/30">
                <th className="w-10 p-3 border-r border-slate-600/50 text-center text-slate-500">#</th>
                <th className="p-3 border-r border-slate-600/50 w-[120px]">{t.habitName}</th>
                <th className="p-3 border-r border-slate-600/50 w-[80px]">{t.description}</th>
                {daysInMonth.map(day => (
                    <th key={day.toISOString()} className={`p-1 border-r border-slate-600/50 w-8 text-center ${isSameDay(day, new Date()) && isSameMonth(day, new Date()) ? 'bg-emerald-500/30 text-emerald-300' : ''}`}>
                        {format(day, 'd')}
                    </th>
                ))}
                <th className="p-2 border-r border-slate-600/50 w-[50px] text-center">%</th>
                <th className="p-2 w-[40px] text-center">{t.del}</th>
            </tr>
        </thead>
        <tbody className="bg-slate-900/50 text-sm">
            <AnimatePresence>
                {habits.map((habit, idx) => (
                    <motion.tr key={habit.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group hover:bg-emerald-500/5 transition-colors border-b border-slate-700/50">
                        <td className="w-10 text-center text-xs text-slate-500 border-r border-slate-700/50 bg-slate-800/30 font-mono p-2">{idx + 1}</td>
                        <td className="p-0 border-r border-slate-700/50"><div className="px-2 py-2 text-slate-200 font-medium truncate text-sm">{habit.title}</div></td>
                        <td className="p-2 border-r border-slate-700/50 text-slate-400 text-xs"><div className="truncate max-w-[70px]" title={habit.description}>{habit.description || '-'}</div></td>
                        {daysInMonth.map(day => {
                            const done = isHabitCompletedOnDate(habit, day);
                            return (
                                <td key={day.toISOString()} className="p-0 border-r border-slate-700/50 text-center">
                                    <button onClick={() => onToggle(habit, day)} className={`w-full h-9 flex items-center justify-center transition-all ${done ? 'bg-emerald-500/30 text-emerald-400' : 'hover:bg-slate-800'}`}>
                                        {done && <Check size={14} strokeWidth={3} />}
                                    </button>
                                </td>
                            );
                        })}
                        <td className="p-2 border-r border-slate-700/50 text-center font-mono text-xs font-bold" style={{ color: `hsl(${calculateCompletionRate(habit, daysInMonth) * 1.2}, 70%, 50%)` }}>
                            {calculateCompletionRate(habit, daysInMonth)}%
                        </td>
                        <td className="p-2 text-center">
                            <button onClick={() => onDelete(habit.id)} className="p-1.5 hover:bg-red-500 hover:text-white rounded-lg text-slate-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12} /></button>
                        </td>
                    </motion.tr>
                ))}
            </AnimatePresence>
        </tbody>
    </table>
);

export default Table;
