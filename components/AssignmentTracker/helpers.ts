import { differenceInDays, differenceInMinutes, isPast, isToday, isBefore, parse, format } from 'date-fns';
import { LocalAssignment } from '../../services/dataService';

// Calculate duration between two times (24h format)
export const calcDuration = (start?: string, end?: string): string => {
    if (!start || !end) return '-';
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let totalMinutes = (eh * 60 + em) - (sh * 60 + sm);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
};

// Check if task is currently active (within time range today)
const isTaskActive = (item: LocalAssignment): { active: boolean; minutesLeft?: number } => {
    if (!item.startTime || !item.endTime) return { active: false };
    if (!isToday(new Date(item.dueDate))) return { active: false };

    const now = new Date();
    const [sh, sm] = item.startTime.split(':').map(Number);
    const [eh, em] = item.endTime.split(':').map(Number);

    const startDate = new Date();
    startDate.setHours(sh, sm, 0, 0);
    const endDate = new Date();
    endDate.setHours(eh, em, 0, 0);

    if (now >= startDate && now <= endDate) {
        const minutesLeft = differenceInMinutes(endDate, now);
        return { active: true, minutesLeft };
    }
    return { active: false };
};

// Get urgency badge based on due date with relative time
export const getUrgencyBadge = (item: LocalAssignment, lang: 'en' | 'bn') => {
    const dueDate = new Date(item.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const days = differenceInDays(dueDate, today);

    // Check if task is currently active
    const { active, minutesLeft } = isTaskActive(item);
    if (active && minutesLeft !== undefined) {
        const label = lang === 'en' ? `${minutesLeft}m left` : `${minutesLeft} মি. বাকি`;
        return { label, color: 'bg-cyan-500 text-white animate-pulse' };
    }

    // Overdue
    if (days < 0) {
        const ago = Math.abs(days);
        const label = lang === 'en' ? `${ago}d ago` : `${ago} দিন আগে`;
        return { label, color: 'bg-red-500 text-white' };
    }

    // Today
    if (days === 0) {
        const label = lang === 'en' ? 'TODAY' : 'আজ';
        return { label, color: 'bg-amber-500 text-white' };
    }

    // Tomorrow
    if (days === 1) {
        const label = lang === 'en' ? 'Tomorrow' : 'আগামীকাল';
        return { label, color: 'bg-orange-500 text-white' };
    }

    // Within a week
    if (days <= 7) {
        const label = lang === 'en' ? `${days}d` : `${days} দিন`;
        return { label, color: 'bg-yellow-500/80 text-white' };
    }

    // More than a week
    const label = lang === 'en' ? `${days}d` : `${days} দিন`;
    return { label, color: 'bg-slate-600 text-slate-300' };
};
