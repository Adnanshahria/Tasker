import React, { useState, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { Trash2, Edit2, Clock, CheckCircle, GripVertical } from 'lucide-react';
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

const DEFAULT_WIDTHS = { col0: 40, col1: 180, col2: 120, col3: 80, col4: 80, col5: 110, col6: 70, col7: 80, col8: 100, col9: 80 };

const Table: React.FC<TableProps> = ({ assignments, t, lang, onEdit, onDelete, onToggleStatus, onAddClick }) => {
    const [colWidths, setColWidths] = useState(DEFAULT_WIDTHS);
    const resizing = useRef<{ col: string; startX: number; startW: number } | null>(null);

    const handleMouseDown = (col: string, e: React.MouseEvent) => {
        e.preventDefault();
        resizing.current = { col, startX: e.clientX, startW: colWidths[col as keyof typeof colWidths] };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!resizing.current) return;
        const diff = e.clientX - resizing.current.startX;
        const newWidth = Math.max(50, resizing.current.startW + diff);
        setColWidths(prev => ({ ...prev, [resizing.current!.col]: newWidth }));
    }, []);

    const handleMouseUp = useCallback(() => {
        resizing.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    const ResizeHandle = ({ col }: { col: string }) => (
        <div onMouseDown={(e) => handleMouseDown(col, e)} className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-indigo-500 group-hover:bg-slate-600 transition-colors" />
    );

    const headers = [
        { key: 'col0', label: '#', align: 'center' },
        { key: 'col1', label: t.taskName },
        { key: 'col2', label: t.subject, hide: 'md' },
        { key: 'col3', label: t.type, hide: 'lg' },
        { key: 'col4', label: t.dueDate },
        { key: 'col5', label: t.time, hide: 'md' },
        { key: 'col6', label: t.duration, hide: 'lg', align: 'center' },
        { key: 'col7', label: t.priority },
        { key: 'col8', label: t.status },
        { key: 'col9', label: t.actions, align: 'center' },
    ];

    return (
        <div className="flex-1 bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-xl">
            <div className="text-[10px] text-slate-500 p-2 border-b border-slate-700 bg-slate-800/30 flex items-center gap-1">
                <GripVertical size={12} /> {lang === 'en' ? 'Drag column edges to resize' : 'কলাম সাইজ পরিবর্তন করতে প্রান্ত টানুন'}
            </div>
            <div className="overflow-x-auto flex-1 custom-scrollbar">
                <table className="text-sm border-collapse" style={{ minWidth: Object.values(colWidths).reduce((a, b) => a + b, 0) }}>
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-slate-800 text-slate-400 text-xs font-semibold border-b-2 border-slate-600">
                            {headers.map((h, i) => (
                                <th key={h.key} className={`p-3 border-r border-slate-700 relative group ${h.hide ? `hidden ${h.hide}:table-cell` : ''} ${h.align === 'center' ? 'text-center' : ''}`} style={{ width: colWidths[h.key as keyof typeof colWidths], minWidth: colWidths[h.key as keyof typeof colWidths] }}>
                                    {h.label}
                                    {i < headers.length - 1 && <ResizeHandle col={h.key} />}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {assignments.map((item, idx) => {
                                const urgency = getUrgencyBadge(item, lang);
                                const ps = getPriorityStyle(item.priority);
                                return (
                                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`group hover:bg-white/5 transition-colors border-b border-slate-700 ${ps.rowBg || ''}`}>
                                        <td className="p-3 text-center text-slate-500 font-mono border-r border-slate-700" style={{ width: colWidths.col0 }}>{idx + 1}</td>
                                        <td className="p-3 border-r border-slate-700" style={{ width: colWidths.col1 }}>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-white font-medium truncate">{item.title}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${urgency.color}`}>{urgency.label}</span>
                                            </div>
                                            {item.description && <p className="text-slate-500 text-xs mt-0.5 truncate">{item.description}</p>}
                                        </td>
                                        <td className="p-3 text-slate-300 border-r border-slate-700 hidden md:table-cell truncate" style={{ width: colWidths.col2 }}>{item.subject}</td>
                                        <td className={`p-3 border-r border-slate-700 hidden lg:table-cell font-medium ${getTypeColor(item.type)}`} style={{ width: colWidths.col3 }}>{item.type || '-'}</td>
                                        <td className="p-3 text-slate-400 font-mono border-r border-slate-700" style={{ width: colWidths.col4 }}>{format(new Date(item.dueDate), 'dd MMM')}</td>
                                        <td className="p-3 text-slate-400 border-r border-slate-700 hidden md:table-cell" style={{ width: colWidths.col5 }}>
                                            <div className="flex items-center gap-1 text-xs"><Clock size={12} className="text-indigo-400" />{item.startTime || '--:--'} - {item.endTime || '--:--'}</div>
                                        </td>
                                        <td className="p-3 text-center text-indigo-400 font-mono font-bold border-r border-slate-700 hidden lg:table-cell" style={{ width: colWidths.col6 }}>{calcDuration(item.startTime, item.endTime)}</td>
                                        <td className="p-3 border-r border-slate-700" style={{ width: colWidths.col7 }}><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${ps.text} ${ps.pillBg}`}>{item.priority}</span></td>
                                        <td className="p-3 border-r border-slate-700" style={{ width: colWidths.col8 }}><button onClick={() => onToggleStatus(item)} className={`px-2 py-1 text-[10px] font-semibold rounded-lg border ${getStatusStyle(item.status)}`}>{item.status}</button></td>
                                        <td className="p-3 text-center" style={{ width: colWidths.col9 }}>
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => onEdit(item)} className="p-1.5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 rounded-lg"><Edit2 size={14} /></button>
                                                <button onClick={() => onDelete(item.id)} className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg"><Trash2 size={14} /></button>
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
    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-2xl flex items-center justify-center mb-3 border border-amber-500/20"><CheckCircle size={28} className="text-amber-400" /></div>
        <p className="text-base font-medium">{t.none}</p><p className="text-sm">{t.clickNew}</p>
    </div>
);

const AddRow: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
    <div onClick={onClick} className="p-3 text-slate-500 text-sm hover:bg-indigo-500/5 cursor-pointer flex items-center gap-2 border-t border-slate-700">
        <span className="text-indigo-400 ml-6">+</span> {label}
    </div>
);

export default Table;
