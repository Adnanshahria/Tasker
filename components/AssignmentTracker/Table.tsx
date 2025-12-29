import React from 'react';
import { format } from 'date-fns';
import { Trash2, Edit2, Clock, CheckCircle } from 'lucide-react';
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

const Table: React.FC<TableProps> = ({ assignments, t, lang, onEdit, onDelete, onToggleStatus, onAddClick }) => (
    <div className="flex-1 bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-xl">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-800/95 text-slate-400 text-xs font-semibold border-b border-slate-700">
                        <th className="p-3 w-10 text-center">#</th>
                        <th className="p-3">{t.taskName}</th>
                        <th className="p-3 hidden md:table-cell">{t.subject}</th>
                        <th className="p-3 hidden lg:table-cell">{t.type}</th>
                        <th className="p-3">{t.dueDate}</th>
                        <th className="p-3 hidden md:table-cell">{t.time}</th>
                        <th className="p-3 hidden lg:table-cell text-center">{t.duration}</th>
                        <th className="p-3">{t.priority}</th>
                        <th className="p-3">{t.status}</th>
                        <th className="p-3 w-20 text-center">{t.actions}</th>
                    </tr>
                </thead>
                <tbody>
                    <AnimatePresence>
                        {assignments.map((item, idx) => {
                            const urgency = getUrgencyBadge(item, lang);
                            const ps = getPriorityStyle(item.priority);
                            return (
                                <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`group hover:bg-white/5 transition-colors border-b border-slate-800 ${ps.rowBg || ''}`}>
                                    <td className="p-3 text-center text-slate-500 font-mono text-xs">{idx + 1}</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-white font-medium">{item.title}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${urgency.color}`}>{urgency.label}</span>
                                        </div>
                                        {item.description && <p className="text-slate-500 text-xs mt-0.5 truncate max-w-[200px]">{item.description}</p>}
                                        <div className="md:hidden text-xs text-slate-500 mt-1">{item.subject}</div>
                                    </td>
                                    <td className="p-3 text-slate-300 hidden md:table-cell">{item.subject}</td>
                                    <td className={`p-3 hidden lg:table-cell font-medium ${getTypeColor(item.type)}`}>{item.type || '-'}</td>
                                    <td className="p-3 text-slate-400 font-mono text-xs">{format(new Date(item.dueDate), 'dd MMM')}</td>
                                    <td className="p-3 text-slate-400 text-xs hidden md:table-cell">
                                        <div className="flex items-center gap-1"><Clock size={12} className="text-indigo-400" />{item.startTime || '--:--'} - {item.endTime || '--:--'}</div>
                                    </td>
                                    <td className="p-3 text-center text-indigo-400 font-mono text-xs font-bold hidden lg:table-cell">{calcDuration(item.startTime, item.endTime)}</td>
                                    <td className="p-3"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${ps.text} ${ps.pillBg}`}>{item.priority}</span></td>
                                    <td className="p-3"><button onClick={() => onToggleStatus(item)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all hover:scale-95 ${getStatusStyle(item.status)}`}>{item.status}</button></td>
                                    <td className="p-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button onClick={() => onEdit(item)} className="p-2 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 rounded-lg transition-colors"><Edit2 size={14} /></button>
                                            <button onClick={() => onDelete(item.id)} className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"><Trash2 size={14} /></button>
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

const EmptyState: React.FC<{ t: Record<string, string> }> = ({ t }) => (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-2xl flex items-center justify-center mb-3 border border-amber-500/20"><CheckCircle size={28} className="text-amber-400" /></div>
        <p className="text-base font-medium">{t.none}</p>
        <p className="text-sm">{t.clickNew}</p>
    </div>
);

const AddRow: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
    <div onClick={onClick} className="p-3 text-slate-500 text-sm hover:bg-indigo-500/5 cursor-pointer flex items-center gap-2 transition-colors border-t border-slate-800">
        <span className="text-indigo-400">+</span> {label}
    </div>
);

export default Table;
