// Focus Dashboard Data Hook
// Provides processed data for Record Cards (Today, Week, Month, Overall)

import { useMemo, useCallback } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, addDays, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { getFocusRecordsForRange, getTodayFocusStats, getAllTimeFocusStats } from '../services/focusDataService';
import { FocusRecord, FocusSession } from '../types';

export interface HourlyData {
    hour: string;
    minutes: number;
}

export interface DailyData {
    date: string;
    displayDate: string;
    minutes: number;
    pomos: number;
}

export const useFocusDashboard = () => {
    const { currentUser } = useAuth();
    const userId = currentUser?.id;

    // Get today's focus stats
    const todayStats = useMemo(() => {
        if (!userId) return { totalFocusMinutes: 0, totalPomos: 0, sessions: [] as FocusSession[] };
        return getTodayFocusStats(userId);
    }, [userId]);

    // Get all-time stats
    const allTimeStats = useMemo(() => {
        if (!userId) return { totalFocusMinutes: 0, totalPomos: 0, totalDays: 0 };
        return getAllTimeFocusStats(userId);
    }, [userId]);

    // Get hourly breakdown for today
    const getTodayHourlyData = useCallback((): HourlyData[] => {
        const hourlyData: HourlyData[] = Array.from({ length: 24 }, (_, i) => ({
            hour: `${String(i).padStart(2, '0')}:00`,
            minutes: 0,
        }));

        if (!todayStats.sessions) return hourlyData;

        todayStats.sessions.forEach((session) => {
            if (session.startTime && typeof session.duration === 'number') {
                const startDate = new Date(session.startTime);
                const hour = startDate.getHours();
                if (hour >= 0 && hour < 24) {
                    hourlyData[hour].minutes += session.duration;
                }
            }
        });

        return hourlyData;
    }, [todayStats.sessions]);

    // Get weekly data with configurable start day
    const getWeeklyData = useCallback((weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1): DailyData[] => {
        if (!userId) return [];

        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn });
        const weekEnd = endOfWeek(now, { weekStartsOn });

        const startStr = format(weekStart, 'yyyy-MM-dd');
        const endStr = format(weekEnd, 'yyyy-MM-dd');

        const records = getFocusRecordsForRange(userId, startStr, endStr);
        const recordMap = new Map<string, FocusRecord>();
        records.forEach(r => recordMap.set(r.date, r));

        // Generate all 7 days
        const data: DailyData[] = [];
        for (let i = 0; i < 7; i++) {
            const date = addDays(weekStart, i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const record = recordMap.get(dateStr);
            data.push({
                date: dateStr,
                displayDate: format(date, 'EEE'),
                minutes: record?.totalFocusMinutes || 0,
                pomos: record?.totalPomos || 0,
            });
        }

        return data;
    }, [userId]);

    // Get monthly data
    const getMonthlyData = useCallback((): { data: DailyData[]; monthLabel: string } => {
        if (!userId) return { data: [], monthLabel: '' };

        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        const startStr = format(monthStart, 'yyyy-MM-dd');
        const endStr = format(monthEnd, 'yyyy-MM-dd');

        const records = getFocusRecordsForRange(userId, startStr, endStr);
        const recordMap = new Map<string, FocusRecord>();
        records.forEach(r => recordMap.set(r.date, r));

        // Generate all days in month
        const data: DailyData[] = [];
        let current = monthStart;
        while (current <= monthEnd) {
            const dateStr = format(current, 'yyyy-MM-dd');
            const record = recordMap.get(dateStr);
            data.push({
                date: dateStr,
                displayDate: format(current, 'd'),
                minutes: record?.totalFocusMinutes || 0,
                pomos: record?.totalPomos || 0,
            });
            current = addDays(current, 1);
        }

        return {
            data,
            monthLabel: format(now, 'MMMM yyyy'),
        };
    }, [userId]);

    // Get data for custom date range
    const getRangeData = useCallback((startDate: Date, endDate: Date): DailyData[] => {
        if (!userId) return [];

        const startStr = format(startDate, 'yyyy-MM-dd');
        const endStr = format(endDate, 'yyyy-MM-dd');

        const records = getFocusRecordsForRange(userId, startStr, endStr);
        const recordMap = new Map<string, FocusRecord>();
        records.forEach(r => recordMap.set(r.date, r));

        // Generate all days in range
        const data: DailyData[] = [];
        let current = startDate;
        while (current <= endDate) {
            const dateStr = format(current, 'yyyy-MM-dd');
            const record = recordMap.get(dateStr);
            data.push({
                date: dateStr,
                displayDate: format(current, 'MMM d'),
                minutes: record?.totalFocusMinutes || 0,
                pomos: record?.totalPomos || 0,
            });
            current = addDays(current, 1);
        }

        return data;
    }, [userId]);

    // Calculate weekly totals from data
    const calculateWeeklyStats = useCallback((data: DailyData[]) => {
        const totalMinutes = data.reduce((acc, d) => acc + d.minutes, 0);
        const daysWithData = data.filter(d => d.minutes > 0).length;
        const dailyAverage = daysWithData > 0 ? Math.round(totalMinutes / daysWithData) : 0;
        return { totalMinutes, dailyAverage, daysWithData };
    }, []);

    return {
        // Raw stats
        todayStats,
        allTimeStats,

        // Data getters
        getTodayHourlyData,
        getWeeklyData,
        getMonthlyData,
        getRangeData,

        // Utilities
        calculateWeeklyStats,
    };
};

// Utility: Format minutes to "Xh Ym"
export const formatDuration = (minutes: number): string => {
    if (isNaN(minutes) || minutes < 0) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
};

// Utility: Safe parse date from various formats
export const safeParseDate = (date: any): Date => {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    if (typeof date === 'string') return parseISO(date);
    if (date.toDate && typeof date.toDate === 'function') return date.toDate();
    if (date.seconds) return new Date(date.seconds * 1000);
    if (typeof date === 'number') return new Date(date);
    return new Date();
};
