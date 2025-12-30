import React from 'react';
import { Flame, Timer, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useFocusDashboard, safeParseDate, formatDuration } from '../../../hooks/useFocusDashboard';
import { FocusSession, TimerMode } from '../../../types';

interface RecentActivityCardProps {
    className?: string;
    onLogSession: () => void;
}

const getSessionIcon = (type: TimerMode | 'manual') => {
    if (type === 'manual') return Timer;
    if (type === 'pomodoro') return Flame;
    return Clock;
};

const getSessionColor = (type: TimerMode | 'manual') => {
    if (type === 'manual') return 'text-blue-500 bg-blue-500/10';
    if (type === 'pomodoro') return 'text-orange-500 bg-orange-500/10';
    return 'text-emerald-500 bg-emerald-500/10';
};

const getSessionLabel = (type: TimerMode | 'manual') => {
    if (type === 'manual') return 'Manual Entry';
    if (type === 'pomodoro') return 'Pomodoro';
    if (type === 'shortBreak') return 'Short Break';
    if (type === 'longBreak') return 'Long Break';
    return 'Focus';
};

const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ className = '', onLogSession }) => {
    const { todayStats } = useFocusDashboard();

    // Get sessions sorted by start time (most recent first)
    const sessions = React.useMemo(() => {
        if (!todayStats?.sessions) return [];
        return [...todayStats.sessions]
            .sort((a, b) => b.startTime - a.startTime)
            .slice(0, 5);
    }, [todayStats?.sessions]);

    const hasData = sessions.length > 0;

    return (
        <div className={`bg-slate-800/50 rounded-2xl overflow-hidden ${className}`}>
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Flame size={18} className="text-white" />
                        <div>
                            <h3 className="text-base font-semibold text-white">Recent Activity</h3>
                            <p className="text-emerald-200 text-xs opacity-80">Today's focus sessions</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogSession}
                        className="text-white text-xs px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    >
                        + Log
                    </button>
                </div>
            </div>

            <div className="p-4">
                {hasData ? (
                    <div className="space-y-2">
                        {sessions.map((session, index) => {
                            const Icon = getSessionIcon(session.type);
                            const colorClass = getSessionColor(session.type);
                            const label = getSessionLabel(session.type);
                            const startDate = safeParseDate(session.startTime);

                            return (
                                <div
                                    key={session.id || index}
                                    className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl"
                                >
                                    <div className={`p-2 rounded-full ${colorClass}`}>
                                        <Icon size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{label}</p>
                                        <p className="text-xs text-slate-500">
                                            {formatDistanceToNow(startDate, { addSuffix: true })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-semibold text-white">
                                            {Math.round(session.duration)}m
                                        </span>
                                        {session.completed && session.type === 'pomodoro' && (
                                            <span className="block text-[10px] text-emerald-400">✓ Complete</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <Clock size={32} className="text-slate-600 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">No sessions today</p>
                        <p className="text-slate-600 text-xs mb-3">Start your first focus session!</p>
                        <button
                            onClick={onLogSession}
                            className="px-4 py-2 rounded-full border border-emerald-500/50 text-emerald-400 text-xs hover:bg-emerald-500/10 transition-colors"
                        >
                            + Log a session
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecentActivityCard;
