import { format, isSameDay } from 'date-fns';
import { LocalHabit } from '../../services/dataService';

// Check if habit is completed on a specific date
export const isHabitCompletedOnDate = (habit: LocalHabit, date: Date): boolean => {
    return habit.completedDates.some(d => isSameDay(new Date(d), date));
};

// Calculate completion rate for a habit in given days
export const calculateCompletionRate = (habit: LocalHabit, days: Date[]): number => {
    const completed = days.filter(day => isHabitCompletedOnDate(habit, day)).length;
    return Math.round((completed / days.length) * 100);
};

// Toggle habit completion for a date
export const toggleHabitDate = (habit: LocalHabit, date: Date): string[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isCompleted = habit.completedDates.includes(dateStr);
    return isCompleted
        ? habit.completedDates.filter(d => d !== dateStr)
        : [...habit.completedDates, dateStr];
};
