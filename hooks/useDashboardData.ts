import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { getAssignments, getHabits, LocalAssignment, LocalHabit } from '../services/dataService';

export interface DashboardData {
    allAssignments: LocalAssignment[];
    upcomingAssignments: LocalAssignment[];
    exams: LocalAssignment[];
    gpa: number | null;
    todaysHabits: { total: number; completed: number };
    // Analytics
    assignmentData: { name: string; value: number }[];
    habitData: { date: string; count: number }[];
    heatmapData: { date: string; intensity: number; count: number; day: string }[];
    stats: { pending: number; completedRate: number; peak: number };
}

export const useDashboardData = (userId: string | undefined): DashboardData => {
    const [data, setData] = useState<DashboardData>({
        allAssignments: [],
        upcomingAssignments: [],
        exams: [],
        gpa: null,
        todaysHabits: { total: 0, completed: 0 },
        assignmentData: [],
        habitData: [],
        heatmapData: [],
        stats: { pending: 0, completedRate: 0, peak: 0 }
    });

    useEffect(() => {
        if (!userId) return;

        const loadData = async () => {
            const assigns = await getAssignments(userId);
            const habits = await getHabits(userId);
            const todayStr = format(new Date(), 'yyyy-MM-dd');

            // Upcoming (Next 7 days, Not Completed)
            const pending = assigns.filter(a => a.status !== 'Completed');
            const upcoming = pending.filter(a => {
                const diff = a.dueDate - Date.now();
                return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
            }).slice(0, 5);

            // Exams
            const examList = pending.filter(a => a.type === 'Exam');

            // GPA Calculation
            let gpaValue: number | null = null;
            const graded = assigns.filter(a => a.score !== undefined && a.totalPoints !== undefined && a.totalPoints > 0);
            if (graded.length > 0) {
                const useWeights = graded.some(a => a.weight && a.weight > 0);
                if (useWeights) {
                    let totalWeighted = 0, totalW = 0;
                    graded.forEach(a => {
                        const w = a.weight || 0;
                        const s = (a.score! / a.totalPoints!) * 100;
                        totalWeighted += s * w;
                        totalW += w;
                    });
                    gpaValue = totalW > 0 ? Math.round(totalWeighted / totalW) : 0;
                } else {
                    const totalPct = graded.reduce((acc, a) => acc + ((a.score! / a.totalPoints!) * 100), 0);
                    gpaValue = Math.round(totalPct / graded.length);
                }
            }

            // Today's Habits
            const completedHabits = habits.filter(h => h.completedDates.includes(todayStr)).length;

            // --- Analytics Data ---
            // Pie Chart (Subject Distribution)
            const subjectMap: Record<string, number> = {};
            let completedAssignsCount = 0;
            assigns.forEach(a => {
                if (a.status === 'Completed') completedAssignsCount++;
                subjectMap[a.subject] = (subjectMap[a.subject] || 0) + 1;
            });
            const pieData = Object.keys(subjectMap).map(key => ({ name: key, value: subjectMap[key] }));

            // Line Chart (14 Days)
            const lineData = Array.from({ length: 14 }, (_, i) => {
                const d = addDays(new Date(), -(13 - i));
                const dateStr = format(d, 'yyyy-MM-dd');
                const count = habits.reduce((acc, habit) => acc + (habit.completedDates.includes(dateStr) ? 1 : 0), 0);
                return { date: format(d, 'MMM dd'), count };
            });

            // Heatmap (30 Days)
            const heatData = Array.from({ length: 30 }, (_, i) => {
                const d = addDays(new Date(), -(29 - i));
                const dateStr = format(d, 'yyyy-MM-dd');
                const completedCount = habits.filter(h => h.completedDates.includes(dateStr)).length;
                const total = habits.length;
                const intensity = total === 0 ? 0 : completedCount / total;
                return { date: dateStr, intensity, count: completedCount, day: format(d, 'd') };
            });

            // Stats
            const analyticsStats = {
                pending: assigns.length - completedAssignsCount,
                completedRate: assigns.length > 0 ? Math.round((completedAssignsCount / assigns.length) * 100) : 0,
                peak: lineData.length > 0 ? Math.max(...lineData.map(d => d.count)) : 0
            };

            setData({
                allAssignments: assigns,
                upcomingAssignments: upcoming,
                exams: examList,
                gpa: gpaValue,
                todaysHabits: { total: habits.length, completed: completedHabits },
                assignmentData: pieData,
                habitData: lineData,
                heatmapData: heatData,
                stats: analyticsStats
            });
        };

        loadData();

    }, [userId]);

    return data;
};
