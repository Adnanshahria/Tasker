import React, { useState } from 'react';
import { format, isSameDay, isSameMonth, isPast, startOfDay } from 'date-fns';
import { Trash2, Check, X, HelpCircle, FileText } from 'lucide-react';
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

// Description Modal Component
const DescriptionModal: React.FC<{
    isOpen: boolean;
    title: string;
    description: string;
    onClose: () => void
}> = ({ isOpen, title, description, onClose }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 w-full max-w-md shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <FileText size={16} className="text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {description || 'No description available.'}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="w-full mt-4 py-2.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-500/80 text-white font-medium transition-colors"
                >
                    Close
                </button>
            </motion.div>
        </div>
    );
};

const Table: React.FC<TableProps> = ({ habits, daysInMonth, t, lang, onToggle, onDelete }) => {
    const [descModal, setDescModal] = useState<{ isOpen: boolean; title: string; description: string }>({
        isOpen: false,
        title: '',
        description: ''
    });

    const openDescModal = (habit: LocalHabit) => {
        setDescModal({
            isOpen: true,
            title: habit.title,
            description: habit.description || ''
        });
    };

    const closeDescModal = () => {
        setDescModal({ isOpen: false, title: '', description: '' });
    };

    return (
        <>
            <table className="w-full text-left border-separate border-spacing-0">
                <thead className="sticky top-0 z-10">
                    <tr className="bg-gradient-to-r from-slate-800 to-slate-800/90 backdrop-blur-sm text-slate-300 text-[10px] md:text-xs font-bold border-b-2 border-emerald-500/30">
                        <th className="w-8 p-2 md:p-3 text-center text-slate-500 bg-slate-800 border-b border-r border-slate-600/50 sticky left-0 z-20">#</th>
                        <th className="p-2 md:p-3 border-b border-r border-slate-600/50 w-[100px] md:w-[140px] bg-slate-800 sticky left-8 z-20">{t.habitName}</th>
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
                                <td className="p-0 border-b border-r border-slate-700/50 bg-slate-900 sticky left-8 z-10">
                                    <div className="px-1.5 md:px-2 py-1.5 md:py-2 flex items-center gap-1">
                                        <span className="text-slate-200 font-medium truncate text-xs md:text-sm flex-1">{habit.title}</span>
                                        {habit.description && (
                                            <button
                                                onClick={() => openDescModal(habit)}
                                                className="p-0.5 text-emerald-400 hover:text-emerald-300 transition-colors flex-shrink-0 bg-emerald-500/10 rounded hover:bg-emerald-500/20"
                                                title="View description"
                                            >
                                                <HelpCircle size={12} />
                                            </button>
                                        )}
                                    </div>
                                </td>
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

            {/* Description Modal */}
            <AnimatePresence>
                {descModal.isOpen && (
                    <DescriptionModal
                        isOpen={descModal.isOpen}
                        title={descModal.title}
                        description={descModal.description}
                        onClose={closeDescModal}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default Table;
