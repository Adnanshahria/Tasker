import React from 'react';
import { format } from 'date-fns';
import { Trash2, Edit2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LocalAssignment } from '../../services/dataService';
import { calcDuration, getUrgencyBadge } from './helpers';
import { getPriorityStyle, getStatusStyle, getTypeStyle } from './styles';

interface TableProps {
    assignments: LocalAssignment[];
    t: Record<string, string>;
    lang: 'en' | 'bn';
    onEdit: (a: LocalAssignment) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (a: LocalAssignment) => void;
    onAddClick: () => void;
}

const Table: React.FC<TableProps> = ({ assignments, t, lang, onEdit, onDelete, onToggleStatus, onAddClick }) => {
    return (
        <div className="flex-1 bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-xl">
            <div className="overflow-x-auto flex-1 custom-scrollbar">
                <table className="w-full text-left border-separate border-spacing-0 text-[10px] md:text-xs min-w-[650px]">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-gradient-to-r from-slate-800 to-slate-800/90 text-slate-300 font-semibold uppercase tracking-wider">
                            <th className="py-2 px-1.5 md:px-2 w-6 text-center border-b border-slate-700/50 bg-slate-800 sticky left-0 z-20">#</th>
                            <th className="py-2 px-1.5 md:px-2 border-b border-slate-700/50 min-w-[100px] bg-slate-800 sticky left-6 z-20">{t.taskName}</th>
                            <th className="py-2 px-1.5 md:px-2 border-b border-slate-700/50">{t.subject}</th>
                            <th className="py-2 px-1.5 md:px-2 border-b border-slate-700/50">{t.type}</th>
                            <th className="py-2 px-1.5 md:px-2 border-b border-slate-700/50">{t.dueDate}</th>
                            <th className="py-2 px-1.5 md:px-2 border-b border-slate-700/50">{t.time}</th>
                            <th className="py-2 px-1.5 md:px-2 border-b border-slate-700/50">{t.priority}</th>
                            <th className="py-2 px-1.5 md:px-2 border-b border-slate-700/50">{t.status}</th>
                            <th className="py-2 px-1.5 md:px-2 w-14 text-center border-b border-slate-700/50">{t.actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {assignments.map((item, idx) => {
                                const urgency = getUrgencyBadge(item, lang);
                                const ps = getPriorityStyle(item.priority);
                                const ts = getTypeStyle(item.type);
                                const duration = calcDuration(item.startTime, item.endTime);
                                const isEven = idx % 2 === 0;
                                return (
                                    <motion.tr
                                        key={item.id}
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: idx * 0.02 }}
                                        className={`group hover:bg-white/5 transition-all duration-150 ${isEven ? 'bg-slate-900/50' : 'bg-slate-800/30'} ${ps.rowBg}`}
                                    >
                                        {/* Row Number */}
                                        <td className="py-1.5 px-1.5 md:px-2 text-center text-slate-500 font-mono text-[9px] border-b border-slate-600/50 bg-slate-900/80 sticky left-0 z-10">
                                            {idx + 1}
                                        </td>

                                        {/* Task Name + Urgency */}
                                        <td className="py-1.5 px-1.5 md:px-2 border-b border-slate-600/50 bg-slate-900/80 sticky left-6 z-10">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-white font-medium truncate max-w-[120px]">{item.title}</span>
                                                <span className={`text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded-full w-fit ${urgency.color}`}>
                                                    {urgency.label}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Subject - Colored Pill */}
                                        <td className="py-1.5 px-1.5 md:px-2 border-b border-slate-600/50">
                                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium text-[9px] md:text-[10px] border border-indigo-500/30 whitespace-nowrap">
                                                {item.subject}
                                            </span>
                                        </td>

                                        {/* Type - Colored Badge */}
                                        <td className="py-1.5 px-1.5 md:px-2 border-b border-slate-600/50">
                                            <span className={`px-2 py-0.5 rounded-md font-semibold text-[9px] md:text-[10px] ${ts.bg} ${ts.text} ${ts.border} border`}>
                                                {item.type || '-'}
                                            </span>
                                        </td>

                                        {/* Due Date */}
                                        <td className="py-1.5 px-1.5 md:px-2 border-b border-slate-600/50">
                                            <span className="text-cyan-400 font-mono text-[9px] md:text-[10px] bg-cyan-500/10 px-1.5 py-0.5 rounded">
                                                {format(new Date(item.dueDate), 'dd MMM')}
                                            </span>
                                        </td>

                                        {/* Time */}
                                        <td className="py-1.5 px-1.5 md:px-2 border-b border-slate-600/50">
                                            <span className="text-purple-400 font-mono text-[9px] md:text-[10px] whitespace-nowrap">
                                                {item.startTime && item.endTime ? (
                                                    <span className="bg-purple-500/10 px-1.5 py-0.5 rounded">{item.startTime}-{item.endTime}</span>
                                                ) : <span className="text-slate-600">-</span>}
                                            </span>
                                        </td>

                                        {/* Priority - Glowing Badge */}
                                        <td className="py-1.5 px-1.5 md:px-2 border-b border-slate-600/50">
                                            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] md:text-[10px] ${ps.pillBg} ${ps.text} shadow-sm`}
                                                style={{ boxShadow: ps.glow }}>
                                                {item.priority || '-'}
                                            </span>
                                        </td>

                                        {/* Status Button */}
                                        <td className="py-1.5 px-1.5 md:px-2 border-b border-slate-600/50">
                                            <button
                                                onClick={() => onToggleStatus(item)}
                                                className={`px-2 py-0.5 text-[9px] md:text-[10px] font-bold rounded-full border transition-all hover:scale-105 active:scale-95 ${getStatusStyle(item.status)}`}
                                            >
                                                {item.status}
                                            </button>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-1.5 px-1.5 md:px-2 text-center border-b border-slate-600/50">
                                            <div className="flex items-center justify-center gap-0.5">
                                                <button
                                                    onClick={() => onEdit(item)}
                                                    className="p-1 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 rounded-md transition-all hover:scale-110 active:scale-95"
                                                >
                                                    <Edit2 size={10} />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(item.id)}
                                                    className="p-1 bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 rounded-md transition-all hover:scale-110 active:scale-95"
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </AnimatePresence>
                    </tbody>
                </table>
                {assignments.length === 0 && <EmptyState t={t} />}
            </div>
        </div>
    );
};

const EmptyState: React.FC<{ t: Record<string, string> }> = ({ t }) => (
    <div className="flex flex-col items-center justify-center py-10 text-slate-500">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-xl flex items-center justify-center mb-2 border border-amber-500/20">
            <CheckCircle size={20} className="text-amber-400" />
        </div>
        <p className="text-xs font-medium">{t.none}</p>
        <p className="text-[10px]">{t.clickNew}</p>
    </div>
);

export default Table;
