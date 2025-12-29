import { format, isBefore, addDays } from 'date-fns';
import { AlertCircle, Clock } from 'lucide-react';
import { LocalAssignment } from '../services/dataService';

type AssignmentStatus = 'Not Started' | 'In Progress' | 'Completed';

export const getUrgencyBadge = (assignment: LocalAssignment) => {
    if (assignment.status === 'Completed') return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(assignment.dueDate);
    const threeDaysFromNow = addDays(today, 3);

    if (isBefore(dueDate, today)) {
        return { icon: AlertCircle, text: 'OVERDUE', color: 'text-red-300' };
    }
    if (isBefore(dueDate, threeDaysFromNow)) {
        return { icon: Clock, text: 'SOON', color: 'text-amber-300' };
    }
    return null;
};

export const getGradeBadge = (scoreVal?: number, total?: number) => {
    if (scoreVal === undefined || total === undefined || total === 0) {
        return { text: '-', color: 'text-slate-600' };
    }
    const pct = (scoreVal / total) * 100;
    let color = 'text-red-400';
    if (pct >= 90) color = 'text-green-400';
    else if (pct >= 80) color = 'text-blue-400';
    else if (pct >= 70) color = 'text-amber-400';
    else if (pct >= 60) color = 'text-orange-400';

    return { text: `${Math.round(pct)}%`, color };
};

export const getStatusColor = (status: AssignmentStatus) => {
    switch (status) {
        case 'Completed': return 'bg-emerald-500/20 text-emerald-300';
        case 'In Progress': return 'bg-blue-500/20 text-blue-300';
        default: return 'bg-slate-700/50 text-slate-400 opacity-70';
    }
};

export const getTypeColor = (type: string) => {
    switch (type) {
        case 'Exam': return 'text-rose-300';
        case 'Project': return 'text-violet-300';
        case 'Quiz': return 'text-amber-300';
        default: return 'text-slate-300';
    }
};
