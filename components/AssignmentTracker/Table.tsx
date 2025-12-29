import React, { useState, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { Trash2, Edit2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LocalAssignment } from '../../services/dataService';
import { calcDuration, getUrgencyBadge } from './helpers';
import { getPriorityStyle, getStatusStyle, getTypeColor } from './styles';

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
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-slate-800 text-slate-400 font-semibold border-b border-slate-700">
                            <th className="p-2 md:p-3 w-8 text-center border-r border-slate-700">#</th>
                            <th className="p-2 md:p-3 border-r border-slate-700">{t.taskName}</th>
                            <th className="p-2 md:p-3 hidden md:table-cell border-r border-slate-700">{t.subject}</th>
                            <th className="p-2 md:p-3 hidden lg:table-cell border-r border-slate-700">{t.dueDate}</th>
                            <th className="p-2 md:p-3">{t.status}</th>
                            <th className="p-2 md:p-3 w-16 text-center">{t.actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {assignments.map((item, idx) => {
                                const urgency = getUrgencyBadge(item, lang);
                                const ps = getPriorityStyle(item.priority);
                                return (
                                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`group hover:bg-white/5 transition-colors border-b border-slate-700 ${ps.rowBg || ''}`}>
                                        <td className="p-2 md:p-3 text-center text-slate-500 font-mono border-r border-slate-700">{idx + 1}</td>
                                        <td className="p-2 md:p-3 border-r border-slate-700">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-white font-medium text-xs md:text-sm">{item.title}</span>
                                                <span className={`text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full ${urgency.color}`}>{urgency.label}</span>
                                            </div>
                                            <div className="text-slate-500 text-[10px] md:text-xs mt-0.5">{item.subject}</div>
                                        </td>
                                        <td className="p-2 md:p-3 text-slate-300 border-r border-slate-700 hidden md:table-cell">{item.subject}</td>
                                        <td className="p-2 md:p-3 text-slate-400 font-mono border-r border-slate-700 hidden lg:table-cell">{format(new Date(item.dueDate), 'dd MMM')}</td>
                                        <td className="p-2 md:p-3">
                                            <button onClick={() => onToggleStatus(item)} className={`px-2 py-1 text-[10px] font-semibold rounded-lg border ${getStatusStyle(item.status)}`}>{item.status}</button>
                                        </td>
                                        <td className="p-2 md:p-3 text-center">
                                            <div className="flex items-center justify-center gap-0.5">
                                                <button onClick={() => onEdit(item)} className="p-1.5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 rounded-lg"><Edit2 size={12} /></button>
                                                <button onClick={() => onDelete(item.id)} className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg"><Trash2 size={12} /></button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </AnimatePresence>
                    </tbody>
                </table>
                {assignments.length === 0 && <EmptyState t={t} />}
                <AddRow onClick={onAddClick} label={t.addNew} />
            </div>
        </div>
    );
};

const EmptyState: React.FC<{ t: Record<string, string> }> = ({ t }) => (
    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-xl flex items-center justify-center mb-3 border border-amber-500/20"><CheckCircle size={24} className="text-amber-400" /></div>
        <p className="text-sm font-medium">{t.none}</p>
        <p className="text-xs">{t.clickNew}</p>
    </div>
);

const AddRow: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
    <div onClick={onClick} className="p-2.5 text-slate-500 text-xs hover:bg-indigo-500/5 cursor-pointer flex items-center gap-2 border-t border-slate-700">
        <span className="text-indigo-400 ml-4">+</span> {label}
    </div>
);

export default Table;
