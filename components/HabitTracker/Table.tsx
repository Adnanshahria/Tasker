import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { format, isSameDay, isSameMonth, isPast, startOfDay } from 'date-fns';
import { Trash2, Check, X, HelpCircle, FileText, GripVertical } from 'lucide-react';
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
    onReorder?: (orderedIds: string[]) => void;
}

// Description Modal Component with Portal
const DescriptionModal: React.FC<{
    isOpen: boolean;
    title: string;
    description: string;
    onClose: () => void
}> = ({ isOpen, title, description, onClose }) => {
    if (!isOpen) return null;

    const modalContent = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 bg-black/80 backdrop-blur-lg"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 w-full max-w-md shadow-2xl mx-2"
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

    return ReactDOM.createPortal(modalContent, document.body);
};

const Table: React.FC<TableProps> = ({ habits, daysInMonth, t, lang, onToggle, onDelete, onReorder }) => {
    const [descModal, setDescModal] = useState<{ isOpen: boolean; title: string; description: string }>({
        isOpen: false,
        title: '',
        description: ''
    });
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

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

    const handleDragStart = (e: React.DragEvent, habitId: string) => {
        setDraggedId(habitId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', habitId);
    };

    const handleDragOver = (e: React.DragEvent, habitId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (habitId !== draggedId) {
            setDragOverId(habitId);
        }
    };

    const handleDragLeave = () => {
        setDragOverId(null);
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        const sourceId = e.dataTransfer.getData('text/plain');

        if (sourceId && sourceId !== targetId && onReorder) {
            const sourceIndex = habits.findIndex(h => h.id === sourceId);
            const targetIndex = habits.findIndex(h => h.id === targetId);

            if (sourceIndex !== -1 && targetIndex !== -1) {
                const newHabits = [...habits];
                const [removed] = newHabits.splice(sourceIndex, 1);
                newHabits.splice(targetIndex, 0, removed);
                onReorder(newHabits.map(h => h.id));
            }
        }

        setDraggedId(null);
        setDragOverId(null);
    };

    const handleDragEnd = () => {
        setDraggedId(null);
        setDragOverId(null);
    };

    return (
        <>
            <table className="w-full text-left border-separate border-spacing-0">
                <thead className="sticky top-0 z-10">
                    <tr className="bg-gradient-to-r from-slate-800 to-slate-800/90 backdrop-blur-sm text-slate-300 text-xs md:text-sm font-bold border-b-2 border-emerald-500/30">
                        <th className="w-14 p-3 md:p-4 text-center text-slate-400 bg-slate-800 border-b border-r border-slate-600/50 sticky left-0 z-20">#</th>
                        <th className="p-3 md:p-4 border-b border-r border-slate-600/50 w-[120px] md:w-[180px] bg-slate-800 sticky left-14 z-20">{t.habitName}</th>
                        {daysInMonth.map(day => (
                            <th key={day.toISOString()} className={`p-1 md:p-1.5 border-r border-slate-600/50 w-8 md:w-10 text-center text-xs md:text-sm ${isSameDay(day, new Date()) && isSameMonth(day, new Date()) ? 'bg-emerald-500/30 text-emerald-300' : ''}`}>
                                {format(day, 'd')}
                            </th>
                        ))}
                        <th className="p-2 md:p-3 border-r border-slate-600/50 w-[50px] md:w-[60px] text-center">%</th>
                        <th className="p-2 md:p-3 w-[40px] md:w-[50px] text-center">{t.del}</th>
                    </tr>
                </thead>
                <tbody className="bg-slate-900/50 text-sm md:text-base">
                    <AnimatePresence>
                        {habits.map((habit, idx) => (
                            <motion.tr
                                key={habit.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                draggable
                                onDragStart={(e) => handleDragStart(e as any, habit.id)}
                                onDragOver={(e) => handleDragOver(e as any, habit.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e as any, habit.id)}
                                onDragEnd={handleDragEnd}
                                className={`group transition-colors border-b border-slate-700/50 
                                    ${draggedId === habit.id ? 'opacity-50 bg-slate-700' : 'hover:bg-emerald-500/5'}
                                    ${dragOverId === habit.id ? 'border-t-2 border-t-emerald-500' : ''}`}
                            >
                                {/* Drag Handle + Serial Number */}
                                <td className="w-14 text-center text-xs md:text-sm text-slate-400 bg-slate-800 font-mono p-2 md:p-3 border-b border-r border-slate-700/50 sticky left-0 z-10">
                                    <div className="flex items-center justify-center gap-1">
                                        <span
                                            className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-emerald-500/20 rounded transition-colors"
                                            title="Drag to reorder"
                                        >
                                            <GripVertical size={16} className="text-slate-400 hover:text-emerald-400 transition-colors" />
                                        </span>
                                        <span className="text-slate-400 font-semibold">{idx + 1}</span>
                                    </div>
                                </td>
                                <td className="p-0 border-b border-r border-slate-700/50 bg-slate-900 sticky left-14 z-10">
                                    <div className="px-2 md:px-3 py-2 md:py-3 flex items-center gap-2">
                                        <span className="text-slate-100 font-semibold truncate text-sm md:text-base flex-1">{habit.title}</span>
                                        <button
                                            onClick={() => openDescModal(habit)}
                                            className={`p-1 transition-colors flex-shrink-0 rounded-lg ${habit.description
                                                ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25'
                                                : 'text-slate-500 hover:text-slate-400 bg-slate-700/30 hover:bg-slate-700/50'
                                                }`}
                                            title={habit.description ? "View description" : "No description"}
                                        >
                                            <HelpCircle size={16} />
                                        </button>
                                    </div>
                                </td>
                                {daysInMonth.map(day => {
                                    const done = isHabitCompletedOnDate(habit, day);
                                    const isToday = isSameDay(day, new Date());
                                    const isPastDay = isPast(startOfDay(day)) && !isToday;
                                    const missed = isPastDay && !done;
                                    return (
                                        <td key={day.toISOString()} className="p-0 border-r border-slate-700/50 text-center">
                                            <button onClick={() => onToggle(habit, day)} className={`w-full h-10 md:h-12 flex items-center justify-center transition-all ${done ? 'bg-emerald-500/30 text-emerald-400' : missed ? 'bg-red-500/10 text-red-400/60' : 'hover:bg-slate-800'}`}>
                                                {done && <Check size={14} strokeWidth={3} className="md:hidden" />}
                                                {done && <Check size={18} strokeWidth={3} className="hidden md:block" />}
                                                {missed && <X size={12} strokeWidth={2} className="md:hidden" />}
                                                {missed && <X size={16} strokeWidth={2} className="hidden md:block" />}
                                            </button>
                                        </td>
                                    );
                                })}
                                <td className="p-2 md:p-3 border-r border-slate-700/50 text-center font-mono text-xs md:text-sm font-bold" style={{ color: `hsl(${calculateCompletionRate(habit, daysInMonth) * 1.2}, 70%, 50%)` }}>
                                    {calculateCompletionRate(habit, daysInMonth)}%
                                </td>
                                <td className="p-2 md:p-3 text-center">
                                    <button onClick={() => onDelete(habit.id)} className="p-1.5 md:p-2 hover:bg-red-500 hover:text-white rounded-lg text-slate-400 md:opacity-0 md:group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
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
