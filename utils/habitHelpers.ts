import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { LocalHabit } from '../services/dataService';

export const getCurrentMonthDays = () => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    return eachDayOfInterval({ start, end });
};

export const calculateCompletionRate = (habit: LocalHabit, daysInMonth: Date[]) => {
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());

    const thisMonthCompletions = habit.completedDates.filter(d => {
        const date = new Date(d);
        return date >= monthStart && date <= monthEnd;
    }).length;

    return Math.round((thisMonthCompletions / daysInMonth.length) * 100);
};

export const isHabitCompletedOnDate = (habit: LocalHabit, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return habit.completedDates.includes(dateStr);
};

export const toggleHabitDate = (habit: LocalHabit, date: Date): string[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isCompleted = habit.completedDates.includes(dateStr);

    if (isCompleted) {
        return habit.completedDates.filter(d => d !== dateStr);
    } else {
        return [...habit.completedDates, dateStr];
    }
};
