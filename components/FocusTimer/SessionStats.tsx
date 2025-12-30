import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, Target } from 'lucide-react';

interface SessionStatsProps {
    pomodorosCompleted: number;
    totalFocusMinutes: number;
    dailyGoal?: number; // in minutes
}

const SessionStats: React.FC<SessionStatsProps> = ({
    pomodorosCompleted,
    totalFocusMinutes,
    dailyGoal = 120, // 2 hours default
}) => {
    const goalProgress = useMemo(() => {
        return Math.min(100, (totalFocusMinutes / dailyGoal) * 100);
    }, [totalFocusMinutes, dailyGoal]);

    const formatTime = (mins: number): string => {
        const hours = Math.floor(mins / 60);
        const remaining = Math.round(mins % 60);
        return `${hours}h ${remaining}m`;
    };

    const stats = [
        {
            icon: Clock,
            label: 'TODAY',
            value: formatTime(totalFocusMinutes),
            accentColor: 'border-l-violet-500',
            iconBg: 'bg-violet-500/20',
            iconColor: 'text-violet-400',
        },
        {
            icon: Calendar,
            label: 'THIS WEEK',
            value: formatTime(totalFocusMinutes),
            accentColor: 'border-l-purple-500',
            iconBg: 'bg-purple-500/20',
            iconColor: 'text-purple-400',
        },
        {
            icon: Target,
            label: 'DAILY GOAL',
            value: `${Math.round(goalProgress)}%`,
            accentColor: 'border-l-emerald-500',
            iconBg: 'bg-emerald-500/20',
            iconColor: 'text-emerald-400',
        },
    ];

    return (
        <div className="grid grid-cols-3 gap-2">
            {stats.map((stat, index) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className={`
            p-3 bg-slate-800/50 rounded-xl border border-slate-700/40
            border-l-4 ${stat.accentColor}
          `}
                >
                    <div className={`p-1.5 rounded-lg ${stat.iconBg} w-fit mb-1.5`}>
                        <stat.icon size={14} className={stat.iconColor} />
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                        {stat.label}
                    </span>
                    <p className="text-sm font-semibold text-white">
                        {stat.value}
                    </p>
                </motion.div>
            ))}
        </div>
    );
};

export default SessionStats;
