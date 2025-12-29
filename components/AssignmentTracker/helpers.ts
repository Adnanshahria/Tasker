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

// Get time until due with hours and minutes
const getTimeUntilDue = (item: LocalAssignment, lang: 'en' | 'bn'): { label: string; color: string } | null => {
    const now = new Date();
    const dueDate = new Date(item.dueDate);

    // If has specific time, use it
    if (item.startTime) {
        const [h, m] = item.startTime.split(':').map(Number);
        dueDate.setHours(h, m, 0, 0);
    } else {
        // Default to end of day
        dueDate.setHours(23, 59, 59, 0);
    }

    const minutesDiff = differenceInMinutes(dueDate, now);
    const hoursDiff = differenceInHours(dueDate, now);

    // Past due
    if (minutesDiff < 0) {
        const hoursAgo = Math.abs(hoursDiff);
        const minutesAgo = Math.abs(minutesDiff) % 60;

        if (hoursAgo < 1) {
            const label = lang === 'en' ? `${Math.abs(minutesDiff)}m ago` : `${Math.abs(minutesDiff)} মি. আগে`;
            return { label, color: 'bg-red-500/90 text-white' };
        } else if (hoursAgo < 24) {
            const label = lang === 'en' ? `${hoursAgo}h ago` : `${hoursAgo} ঘ. আগে`;
            return { label, color: 'bg-red-500/90 text-white' };
        } else {
            const daysAgo = Math.floor(hoursAgo / 24);
            const label = lang === 'en' ? `${daysAgo}d ago` : `${daysAgo} দিন আগে`;
            return { label, color: 'bg-red-600/90 text-white' };
        }
    }

    // Due very soon (less than 1 hour)
    if (minutesDiff <= 60) {
        const label = lang === 'en' ? `${minutesDiff}m left` : `${minutesDiff} মি. বাকি`;
        return { label, color: 'bg-rose-500 text-white animate-pulse' };
    }

    // Due within hours today
    if (minutesDiff <= 24 * 60) {
        const hrs = Math.floor(minutesDiff / 60);
        const mins = minutesDiff % 60;
        if (mins > 0) {
            const label = lang === 'en' ? `${hrs}h ${mins}m left` : `${hrs}ঘ ${mins}মি বাকি`;
            return { label, color: hrs <= 3 ? 'bg-amber-500 text-white' : 'bg-yellow-500/90 text-white' };
        } else {
            const label = lang === 'en' ? `${hrs}h left` : `${hrs} ঘন্টা বাকি`;
            return { label, color: hrs <= 3 ? 'bg-amber-500 text-white' : 'bg-yellow-500/90 text-white' };
        }
    }

    return null; // Fall back to day-based display
};

// Get urgency badge based on due date with precise relative time
export const getUrgencyBadge = (item: LocalAssignment, lang: 'en' | 'bn') => {
    // Try precise time first
    const preciseTime = getTimeUntilDue(item, lang);
    if (preciseTime) {
        return preciseTime;
    }

    // Fall back to day-based calculation
    const dueDate = new Date(item.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const days = differenceInDays(dueDate, today);

    // Tomorrow
    if (days === 1) {
        const label = lang === 'en' ? '1d left' : '১ দিন বাকি';
        return { label, color: 'bg-orange-500/90 text-white' };
    }

    // Within a week
    if (days <= 7) {
        const label = lang === 'en' ? `${days}d left` : `${days} দিন বাকি`;
        return { label, color: 'bg-yellow-600/80 text-white' };
    }

    // More than a week
    const label = lang === 'en' ? `${days}d left` : `${days} দিন বাকি`;
    return { label, color: 'bg-slate-600 text-slate-200' };
};
