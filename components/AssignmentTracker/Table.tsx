import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Trash2, Edit2, CheckCircle, HelpCircle, X, FileText, Settings2, GripVertical, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LocalAssignment } from '../../services/dataService';
import { calcDuration, getTimeStatus } from './helpers';
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

// Column definition
interface ColumnDef {
    id: string;
    label: string;
    width?: string;
}

// Default column order as requested: Task Name, Subject, Duration, Time, Date, Priority, Status, Actions
const DEFAULT_COLUMNS: string[] = ['taskName', 'subject', 'duration', 'time', 'date', 'priority', 'status', 'actions'];

// Row border colors for alternating rows
const rowBorderColors = [
    'border-b-rose-500/30', 'border-b-orange-500/30', 'border-b-amber-500/30', 'border-b-yellow-500/30',
    'border-b-lime-500/30', 'border-b-green-500/30', 'border-b-emerald-500/30', 'border-b-teal-500/30',
    'border-b-cyan-500/30', 'border-b-sky-500/30', 'border-b-blue-500/30', 'border-b-indigo-500/30',
    'border-b-violet-500/30', 'border-b-purple-500/30', 'border-b-fuchsia-500/30', 'border-b-pink-500/30',
];

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
                className="bg-gradient-to-br from-slate-800 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 w-full max-w-md shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                            <FileText size={16} className="text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white">{title}</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {description || 'No description available.'}
                    </p>
                </div>
                <button onClick={onClose} className="w-full mt-4 py-2.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-500/80 text-white font-medium transition-colors">
                    Close
                </button>
            </motion.div>
        </div>
    );
};

// Column Edit Modal
const ColumnEditModal: React.FC<{
    isOpen: boolean;
    columns: string[];
    columnLabels: Record<string, string>;
    onSave: (newOrder: string[]) => void;
    onClose: () => void;
}> = ({ isOpen, columns, columnLabels, onSave, onClose }) => {
    const [tempColumns, setTempColumns] = useState<string[]>(columns);
    const [draggedCol, setDraggedCol] = useState<string | null>(null);
    const [dragOverCol, setDragOverCol] = useState<string | null>(null);

    useEffect(() => {
        setTempColumns(columns);
    }, [columns, isOpen]);

    if (!isOpen) return null;

    const handleDragStart = (e: React.DragEvent, colId: string) => {
        setDraggedCol(colId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, colId: string) => {
        e.preventDefault();
        if (colId !== draggedCol) setDragOverCol(colId);
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (draggedCol && draggedCol !== targetId) {
            const sourceIdx = tempColumns.indexOf(draggedCol);
            const targetIdx = tempColumns.indexOf(targetId);
            const newCols = [...tempColumns];
            newCols.splice(sourceIdx, 1);
            newCols.splice(targetIdx, 0, draggedCol);
            setTempColumns(newCols);
        }
        setDraggedCol(null);
        setDragOverCol(null);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/30 rounded-2xl p-5 w-full max-w-md shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                            <Settings2 size={16} className="text-amber-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Reorder Columns</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>
                <p className="text-sm text-slate-400 mb-4">Drag columns to reorder them:</p>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {tempColumns.map((colId, idx) => (
                        <div
                            key={colId}
                            draggable
                            onDragStart={(e) => handleDragStart(e, colId)}
                            onDragOver={(e) => handleDragOver(e, colId)}
                            onDrop={(e) => handleDrop(e, colId)}
                            onDragEnd={() => { setDraggedCol(null); setDragOverCol(null); }}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing
                                ${draggedCol === colId ? 'opacity-50 bg-slate-700 border-amber-500/50' : 'bg-slate-800/50 border-slate-700/50 hover:border-amber-500/30'}
                                ${dragOverCol === colId ? 'border-t-2 border-t-amber-400' : ''}`}
                        >
                            <GripVertical size={16} className="text-slate-500" />
                            <span className="text-slate-200 font-medium flex-1">{columnLabels[colId] || colId}</span>
                            <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">{idx + 1}</span>
                        </div>
                    ))}
                </div>
                <div className="flex gap-3 mt-4">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 font-medium transition-colors">
                        Cancel
                    </button>
                    <button onClick={() => { onSave(tempColumns); onClose(); }} className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors flex items-center justify-center gap-2">
                        <Check size={16} /> Save Order
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const Table: React.FC<TableProps> = ({ assignments, t, lang, onEdit, onDelete, onToggleStatus, onAddClick }) => {
    const [descModal, setDescModal] = useState<{ isOpen: boolean; title: string; description: string }>({
        isOpen: false, title: '', description: ''
    });
    const [columnOrder, setColumnOrder] = useState<string[]>(() => {
        const saved = localStorage.getItem('assignment_column_order');
        return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    });
    const [showColumnEdit, setShowColumnEdit] = useState(false);

    const columnLabels: Record<string, string> = {
        taskName: t.taskName || 'Task Name',
        subject: t.subject || 'Subject',
        duration: 'Duration',
        time: t.time || 'Time',
        date: t.dueDate || 'Date',
        priority: t.priority || 'Priority',
        status: t.status || 'Status',
        actions: t.actions || 'Actions',
    };

    const openDescModal = (item: LocalAssignment) => {
        setDescModal({ isOpen: true, title: item.title, description: item.description || '' });
    };

    const closeDescModal = () => {
        setDescModal({ isOpen: false, title: '', description: '' });
    };

    const handleColumnOrderSave = (newOrder: string[]) => {
        setColumnOrder(newOrder);
        localStorage.setItem('assignment_column_order', JSON.stringify(newOrder));
    };

    // Render a single cell based on column ID
    const renderCell = (colId: string, item: LocalAssignment, idx: number) => {
        const timeStatus = getTimeStatus(item, lang);
        const ps = getPriorityStyle(item.priority);
        const ts = getTypeStyle(item.type);
        const duration = calcDuration(item.startTime, item.endTime);
        const rowBorderColor = rowBorderColors[idx % rowBorderColors.length];

        switch (colId) {
            case 'taskName':
                return (
                    <td key={colId} className={`py-1.5 px-1.5 md:px-2 border-b ${rowBorderColor} border-r border-r-purple-500/20 bg-slate-900/80 sticky left-6 z-10`}>
                        <div className="flex items-center justify-between gap-1">
                            <span className="text-white font-medium truncate max-w-[60px] md:max-w-[100px]">{item.title}</span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <span className={`text-[7px] md:text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${timeStatus.color}`}>
                                    {timeStatus.label}
                                </span>
                                {item.description && (
                                    <button onClick={() => openDescModal(item)} className="p-0.5 text-amber-400 hover:text-amber-300 transition-colors flex-shrink-0 bg-amber-500/10 rounded hover:bg-amber-500/20" title="View description">
                                        <HelpCircle size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </td>
                );
            case 'subject':
                return (
                    <td key={colId} className={`py-1.5 px-1.5 md:px-2 border-b ${rowBorderColor} border-r border-r-blue-500/20`}>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium text-[9px] md:text-[10px] border border-indigo-500/30 whitespace-nowrap">
                            {item.subject}
                        </span>
                    </td>
                );
            case 'duration':
                return (
                    <td key={colId} className={`py-1.5 px-1.5 md:px-2 border-b ${rowBorderColor} border-r border-r-lime-500/20 text-center`}>
                        <span className="text-lime-400 font-mono text-[9px] md:text-[10px] bg-lime-500/10 px-1.5 py-0.5 rounded">
                            {duration}
                        </span>
                    </td>
                );
            case 'time':
                return (
                    <td key={colId} className={`py-1.5 px-1.5 md:px-2 border-b ${rowBorderColor} border-r border-r-emerald-500/20`}>
                        <span className="text-purple-400 font-mono text-[9px] md:text-[10px] whitespace-nowrap">
                            {item.startTime && item.endTime ? (
                                <span className="bg-purple-500/10 px-1.5 py-0.5 rounded">{item.startTime}-{item.endTime}</span>
                            ) : <span className="text-slate-600">-</span>}
                        </span>
                    </td>
                );
            case 'date':
                return (
                    <td key={colId} className={`py-1.5 px-1.5 md:px-2 border-b ${rowBorderColor} border-r border-r-teal-500/20`}>
                        <span className="text-cyan-400 font-mono text-[9px] md:text-[10px] bg-cyan-500/10 px-1.5 py-0.5 rounded">
                            {format(new Date(item.dueDate), 'dd MMM')}
                        </span>
                    </td>
                );
            case 'priority':
                return (
                    <td key={colId} className={`py-1.5 px-1.5 md:px-2 border-b ${rowBorderColor} border-r border-r-amber-500/20`}>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] md:text-[10px] ${ps.pillBg} ${ps.text} shadow-sm`} style={{ boxShadow: ps.glow }}>
                            {item.priority || '-'}
                        </span>
                    </td>
                );
            case 'status':
                return (
                    <td key={colId} className={`py-1.5 px-1.5 md:px-2 border-b ${rowBorderColor} border-r border-r-rose-500/20`}>
                        <button onClick={() => onToggleStatus(item)} className={`px-2 py-0.5 text-[9px] md:text-[10px] font-bold rounded-full border transition-all hover:scale-105 active:scale-95 ${getStatusStyle(item.status)}`}>
                            {item.status}
                        </button>
                    </td>
                );
            case 'actions':
                return (
                    <td key={colId} className={`py-1.5 px-1.5 md:px-2 text-center border-b ${rowBorderColor}`}>
                        <div className="flex items-center justify-center gap-0.5">
                            <button onClick={() => onEdit(item)} className="p-1 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 rounded-md transition-all hover:scale-110 active:scale-95">
                                <Edit2 size={10} />
                            </button>
                            <button onClick={() => onDelete(item.id)} className="p-1 bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 rounded-md transition-all hover:scale-110 active:scale-95">
                                <Trash2 size={10} />
                            </button>
                        </div>
                    </td>
                );
            default:
                return null;
        }
    };

    // Render header cell
    const renderHeaderCell = (colId: string) => {
        const borderColors: Record<string, string> = {
            taskName: 'border-r-purple-500/30',
            subject: 'border-r-blue-500/30',
            duration: 'border-r-lime-500/30',
            time: 'border-r-emerald-500/30',
            date: 'border-r-teal-500/30',
            priority: 'border-r-amber-500/30',
            status: 'border-r-rose-500/30',
            actions: '',
        };
        const widths: Record<string, string> = {
            taskName: 'min-w-[130px]',
            actions: 'w-14',
        };

        return (
            <th key={colId} className={`py-2 px-1.5 md:px-2 border-b-2 border-b-indigo-500/50 border-r ${borderColors[colId] || ''} ${widths[colId] || ''} ${colId === 'taskName' ? 'bg-slate-800 sticky left-6 z-20' : ''}`}>
                {columnLabels[colId]}
            </th>
        );
    };

    return (
        <>
            <div className="flex-1 bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-xl relative">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-separate border-spacing-0 text-[10px] md:text-xs min-w-[700px]">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-gradient-to-r from-slate-800 via-slate-800/95 to-slate-800 text-slate-300 font-semibold uppercase tracking-wider">
                                <th className="py-2 px-1.5 md:px-2 w-8 text-center border-b-2 border-b-indigo-500/50 border-r border-r-indigo-500/30 bg-slate-800 sticky left-0 z-20">
                                    <button onClick={() => setShowColumnEdit(true)} className="p-1 hover:bg-amber-500/20 rounded transition-colors" title="Reorder columns">
                                        <Settings2 size={12} className="text-amber-400" />
                                    </button>
                                </th>
                                {columnOrder.map(colId => renderHeaderCell(colId))}
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {assignments.map((item, idx) => {
                                    const isEven = idx % 2 === 0;
                                    const ps = getPriorityStyle(item.priority);
                                    const rowBorderColor = rowBorderColors[idx % rowBorderColors.length];

                                    return (
                                        <motion.tr
                                            key={item.id}
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2, delay: idx * 0.02 }}
                                            className={`group hover:bg-white/5 transition-all duration-150 ${isEven ? 'bg-slate-900/50' : 'bg-slate-800/30'} ${ps.rowBg}`}
                                        >
                                            <td className={`py-1.5 px-1.5 md:px-2 text-center text-slate-500 font-mono text-[9px] border-b ${rowBorderColor} border-r border-r-indigo-500/20 bg-slate-900/80 sticky left-0 z-10`}>
                                                {idx + 1}
                                            </td>
                                            {columnOrder.map(colId => renderCell(colId, item, idx))}
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        </tbody>
                    </table>
                    {assignments.length === 0 && <EmptyState t={t} />}
                </div>
            </div>

            {/* Description Modal */}
            <AnimatePresence>
                {descModal.isOpen && (
                    <DescriptionModal isOpen={descModal.isOpen} title={descModal.title} description={descModal.description} onClose={closeDescModal} />
                )}
            </AnimatePresence>

            {/* Column Edit Modal */}
            <AnimatePresence>
                {showColumnEdit && (
                    <ColumnEditModal
                        isOpen={showColumnEdit}
                        columns={columnOrder}
                        columnLabels={columnLabels}
                        onSave={handleColumnOrderSave}
                        onClose={() => setShowColumnEdit(false)}
                    />
                )}
            </AnimatePresence>
        </>
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
