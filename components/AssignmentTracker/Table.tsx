import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import { Trash2, Edit2, CheckCircle, HelpCircle, X, FileText } from 'lucide-react';
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

// Row border colors for alternating rows
const rowBorderColors = [
    'border-b-rose-500/30',
    'border-b-orange-500/30',
    'border-b-amber-500/30',
    'border-b-yellow-500/30',
    'border-b-lime-500/30',
    'border-b-green-500/30',
    'border-b-emerald-500/30',
    'border-b-teal-500/30',
    'border-b-cyan-500/30',
    'border-b-sky-500/30',
    'border-b-blue-500/30',
    'border-b-indigo-500/30',
    'border-b-violet-500/30',
    'border-b-purple-500/30',
    'border-b-fuchsia-500/30',
    'border-b-pink-500/30',
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
                    className="w-full mt-4 py-2.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-500/80 text-white font-medium transition-colors"
                >
                    Close
                </button>
            </motion.div>
        </div>
    );
};

const Table: React.FC<TableProps> = ({ assignments, t, lang, onEdit, onDelete, onToggleStatus, onAddClick }) => {
    const [descModal, setDescModal] = useState<{ isOpen: boolean; title: string; description: string }>({
        isOpen: false,
        title: '',
        description: ''
    });

    const openDescModal = (item: LocalAssignment) => {
        setDescModal({
            isOpen: true,
            title: item.title,
            description: item.description || ''
        });
    };

    const closeDescModal = () => {
        setDescModal({ isOpen: false, title: '', description: '' });
    };

    return (
        <>
            <div className="flex-1 bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-xl relative">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-separate border-spacing-0 text-[10px] md:text-xs min-w-[700px]">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-gradient-to-r from-slate-800 via-slate-800/95 to-slate-800 text-slate-300 font-semibold uppercase tracking-wider">
                                <th className="py-2 px-1.5 md:px-2 w-6 text-center border-b-2 border-b-indigo-500/50 border-r border-r-indigo-500/30 bg-slate-800 sticky left-0 z-20">#</th>
                                <th className="py-2 px-1.5 md:px-2 border-b-2 border-b-indigo-500/50 border-r border-r-purple-500/30 min-w-[130px] bg-slate-800 sticky left-6 z-20">{t.taskName}</th>
                                <th className="py-2 px-1.5 md:px-2 border-b-2 border-b-indigo-500/50 border-r border-r-blue-500/30">{t.subject}</th>
                                <th className="py-2 px-1.5 md:px-2 border-b-2 border-b-indigo-500/50 border-r border-r-cyan-500/30">{t.type}</th>
                                <th className="py-2 px-1.5 md:px-2 border-b-2 border-b-indigo-500/50 border-r border-r-teal-500/30">{t.dueDate}</th>
                                <th className="py-2 px-1.5 md:px-2 border-b-2 border-b-indigo-500/50 border-r border-r-emerald-500/30">{t.time}</th>
                                <th className="py-2 px-1.5 md:px-2 border-b-2 border-b-indigo-500/50 border-r border-r-lime-500/30 text-center">Duration</th>
                                <th className="py-2 px-1.5 md:px-2 border-b-2 border-b-indigo-500/50 border-r border-r-amber-500/30">{t.priority}</th>
                                <th className="py-2 px-1.5 md:px-2 border-b-2 border-b-indigo-500/50 border-r border-r-rose-500/30">{t.status}</th>
                                <th className="py-2 px-1.5 md:px-2 w-14 text-center border-b-2 border-b-indigo-500/50">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {assignments.map((item, idx) => {
                                    const timeStatus = getTimeStatus(item, lang);
                                    const ps = getPriorityStyle(item.priority);
                                    const ts = getTypeStyle(item.type);
                                    const duration = calcDuration(item.startTime, item.endTime);
                                    const isEven = idx % 2 === 0;
                                    const rowBorderColor = rowBorderColors[idx % rowBorderColors.length];

                                    return (
                                        <motion.tr
                                            key={item.id}
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2, delay: idx * 0.02 }}
                                            className={`group hover:bg-white/5 transition-all duration-150 ${isEven ? 'bg-slate-900/50' : 'bg-slate-800/30'} ${ps.rowBg}`}
                                        >
                                            {/* Row Number */}
                                            <td className={`py-1.5 px-1.5 md:px-2 text-center text-slate-500 font-mono text-[9px] border-b ${rowBorderColor} border-r border-r-indigo-500/20 bg-slate-900/80 sticky left-0 z-10`}>
                                                {idx + 1}
                                            </td>

                                            {/* Task Name + Time Status (inline) + Description ? icon */}
                                            <td className={`py-1.5 px-1.5 md:px-2 border-b ${rowBorderColor} border-r border-r-purple-500/20 bg-slate-900/80 sticky left-6 z-10 relative`}>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-white font-medium truncate max-w-[80px] md:max-w-[100px]">{item.title}</span>
                                                    <span className={`text-[7px] md:text-[8px] font-bold px-1 py-0.5 rounded-full whitespace-nowrap ${timeStatus.color}`}>
                                                        {timeStatus.label}
                                                    </span>
                                                    {item.description && (
                                                        <button
                                                            onClick={() => openDescModal(item)}
                                                            className="p-0.5 text-amber-400 hover:text-amber-300 transition-colors ml-auto flex-shrink-0 bg-amber-500/10 rounded hover:bg-amber-500/20"
                                                            title="View description"
                                                        >
                                                            <HelpCircle size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Subject - Colored Pill */}
                                            <td className={`py-1.5 px-1.5 md:px-2 border-b ${rowBorderColor} border-r border-r-blue-500/20`}>
                                                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium text-[9px] md:text-[10px] border border-indigo-500/30 whitespace-nowrap">
                                                    {item.subject}
                                                </span>
                                            </td>

                                            {/* Type - Colored Badge */}
                                            <td className={`py-1.5 px-1.5 md:px-2 border-b ${rowBorderColor} border-r border-r-cyan-500/20`}>
                                                <span className={`px-2 py-0.5 rounded-md font-semibold text-[9px] md:text-[10px] ${ts.bg} ${ts.text} ${ts.border} border`}>
                                                    {item.type || '-'}
                                                </span>
                                            </td>

                                            {/* Due Date */}
                                            <td className={`py-1.5 px-1.5 md:px-2 border-b ${rowBorderColor} border-r border-r-teal-500/20`}>
                                                <span className="text-cyan-400 font-mono text-[9px] md:text-[10px] bg-cyan-500/10 px-1.5 py-0.5 rounded">
                                                    {format(new Date(item.dueDate), 'dd MMM')}
                                                </span>
                                            </td>

                                            {/* Time Range */}
                                            <td className={`py-1.5 px-1.5 md:px-2 border-b ${rowBorderColor} border-r border-r-emerald-500/20`}>
                                                <span className="text-purple-400 font-mono text-[9px] md:text-[10px] whitespace-nowrap">
                                                    {item.startTime && item.endTime ? (
                                                        <span className="bg-purple-500/10 px-1.5 py-0.5 rounded">{item.startTime}-{item.endTime}</span>
                                                    ) : <span className="text-slate-600">-</span>}
                                                </span>
                                            </td>

                                            {/* Duration - NEW COLUMN */}
                                            <td className={`py-1.5 px-1.5 md:px-2 border-b ${rowBorderColor} border-r border-r-lime-500/20 text-center`}>
                                                <span className="text-lime-400 font-mono text-[9px] md:text-[10px] bg-lime-500/10 px-1.5 py-0.5 rounded">
                                                    {duration}
                                                </span>
                                            </td>

                                            {/* Priority - Glowing Badge */}
                                            <td className={`py-1.5 px-1.5 md:px-2 border-b ${rowBorderColor} border-r border-r-amber-500/20`}>
                                                <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] md:text-[10px] ${ps.pillBg} ${ps.text} shadow-sm`}
                                                    style={{ boxShadow: ps.glow }}>
                                                    {item.priority || '-'}
                                                </span>
                                            </td>

                                            {/* Status Button */}
                                            <td className={`py-1.5 px-1.5 md:px-2 border-b ${rowBorderColor} border-r border-r-rose-500/20`}>
                                                <button
                                                    onClick={() => onToggleStatus(item)}
                                                    className={`px-2 py-0.5 text-[9px] md:text-[10px] font-bold rounded-full border transition-all hover:scale-105 active:scale-95 ${getStatusStyle(item.status)}`}
                                                >
                                                    {item.status}
                                                </button>
                                            </td>

                                            {/* Actions */}
                                            <td className={`py-1.5 px-1.5 md:px-2 text-center border-b ${rowBorderColor}`}>
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
