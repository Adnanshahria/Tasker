import React from 'react';
import { Plus, CheckCircle } from 'lucide-react';
import SelectDropdown from '../ui/SelectDropdown';

interface ToolbarProps {
    title: string;
    subjectFilter: string;
    statusFilter: string;
    subjects: string[];
    onSubjectChange: (v: string) => void;
    onStatusChange: (v: string) => void;
    onAddClick: () => void;
    t: { allSubjects: string; allStatus: string; pending: string; completed: string; new: string };
}

const Toolbar: React.FC<ToolbarProps> = ({
    title, subjectFilter, statusFilter, subjects,
    onSubjectChange, onStatusChange, onAddClick, t
}) => {
    // Build subject options
    const subjectOptions = [
        { value: 'All', label: t.allSubjects },
        ...subjects.map(s => ({ value: s, label: s }))
    ];

    // Build status options
    const statusOptions = [
        { value: 'All', label: t.allStatus },
        { value: 'Pending', label: t.pending },
        { value: 'Completed', label: t.completed }
    ];

    return (
        <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/10 border border-amber-500/20 p-2 md:p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 md:gap-4 shadow-lg">
            <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                <h2 className="text-sm md:text-lg font-bold text-white px-2 md:px-3 border-r border-white/10 flex items-center gap-2">
                    <span className="w-6 h-6 md:w-8 md:h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <CheckCircle size={14} className="md:hidden" />
                        <CheckCircle size={18} className="hidden md:block" />
                    </span>
                    <span className="hidden sm:inline">{title}</span>
                </h2>
                <div className="flex items-center gap-2">
                    <SelectDropdown
                        value={subjectFilter}
                        options={subjectOptions}
                        onChange={onSubjectChange}
                        placeholder={t.allSubjects}
                    />
                    <SelectDropdown
                        value={statusFilter}
                        options={statusOptions}
                        onChange={onStatusChange}
                        placeholder={t.allStatus}
                    />
                </div>
            </div>
            <button onClick={onAddClick} className="flex items-center gap-1 md:gap-2 bg-amber-500 hover:bg-amber-400 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-amber-500/30 hover:scale-105 transition-all shrink-0">
                <Plus size={14} className="md:hidden" />
                <Plus size={16} className="hidden md:block" />
                <span>{t.new}</span>
            </button>
        </div>
    );
};

export default Toolbar;
