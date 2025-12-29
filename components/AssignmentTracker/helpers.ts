import { differenceInDays, differenceInMinutes, differenceInHours, isPast, isToday, isBefore, parse, format } from 'date-fns';
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

// Get time status - shows time to start, time left, or overdue
export const getTimeStatus = (item: LocalAssignment, lang: 'en' | 'bn'): { label: string; color: string; type: 'to_start' | 'left' | 'overdue' | 'upcoming' } => {
    const now = new Date();
    const dueDate = new Date(item.dueDate);

    // If has start time, calculate time until start
    if (item.startTime && isToday(dueDate)) {
        const [sh, sm] = item.startTime.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(sh, sm, 0, 0);

        const minutesToStart = differenceInMinutes(startDate, now);

        // Task hasn't started yet
        if (minutesToStart > 0) {
            const hrs = Math.floor(minutesToStart / 60);
            const mins = minutesToStart % 60;

            if (hrs === 0) {
                const label = lang === 'en' ? `${mins}m to start` : `${mins}মি. শুরু`;
                return { label, color: 'bg-sky-500/90 text-white', type: 'to_start' };
            } else {
                const label = lang === 'en' ? `${hrs}h ${mins}m to start` : `${hrs}ঘ ${mins}মি শুরু`;
                return { label, color: 'bg-sky-500/80 text-white', type: 'to_start' };
            }
        }
    }

    // Calculate time until due
    if (item.endTime) {
        const [eh, em] = item.endTime.split(':').map(Number);
        dueDate.setHours(eh, em, 0, 0);
    } else if (item.startTime) {
        const [h, m] = item.startTime.split(':').map(Number);
        dueDate.setHours(h, m, 0, 0);
    } else {
        dueDate.setHours(23, 59, 59, 0);
    }

    const minutesDiff = differenceInMinutes(dueDate, now);
    const hoursDiff = differenceInHours(dueDate, now);

    // Past due
    if (minutesDiff < 0) {
        const hoursAgo = Math.abs(hoursDiff);

        if (hoursAgo < 1) {
            const label = lang === 'en' ? `${Math.abs(minutesDiff)}m ago` : `${Math.abs(minutesDiff)}মি আগে`;
            return { label, color: 'bg-red-500/90 text-white', type: 'overdue' };
        } else if (hoursAgo < 24) {
            const label = lang === 'en' ? `${hoursAgo}h ago` : `${hoursAgo}ঘ আগে`;
            return { label, color: 'bg-red-500/90 text-white', type: 'overdue' };
        } else {
            const daysAgo = Math.floor(hoursAgo / 24);
            const label = lang === 'en' ? `${daysAgo}d ago` : `${daysAgo}দিন আগে`;
            return { label, color: 'bg-red-600/90 text-white', type: 'overdue' };
        }
    }

    // Due very soon (less than 1 hour)
    if (minutesDiff <= 60) {
        const label = lang === 'en' ? `${minutesDiff}m left` : `${minutesDiff}মি বাকি`;
        return { label, color: 'bg-rose-500 text-white animate-pulse', type: 'left' };
    }

    // Due within 24 hours
    if (minutesDiff <= 24 * 60) {
        const hrs = Math.floor(minutesDiff / 60);
        const mins = minutesDiff % 60;
        if (mins > 0) {
            const label = lang === 'en' ? `${hrs}h ${mins}m left` : `${hrs}ঘ ${mins}মি বাকি`;
            return { label, color: hrs <= 3 ? 'bg-amber-500 text-white' : 'bg-yellow-500/90 text-white', type: 'left' };
        } else {
            const label = lang === 'en' ? `${hrs}h left` : `${hrs}ঘ বাকি`;
            return { label, color: hrs <= 3 ? 'bg-amber-500 text-white' : 'bg-yellow-500/90 text-white', type: 'left' };
        }
    }

    // More than 24 hours - show days
    const days = Math.ceil(minutesDiff / (24 * 60));
    const label = lang === 'en' ? `${days}d left` : `${days}দিন বাকি`;
    return { label, color: days <= 3 ? 'bg-orange-500/80 text-white' : 'bg-slate-600 text-slate-200', type: 'upcoming' };
};

// Legacy function for compatibility
export const getUrgencyBadge = (item: LocalAssignment, lang: 'en' | 'bn') => {
    return getTimeStatus(item, lang);
};
