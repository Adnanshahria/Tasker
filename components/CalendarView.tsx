import React, { useState } from 'react';
import {
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { LocalAssignment } from '../services/dataService';

interface CalendarViewProps {
    assignments: LocalAssignment[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ assignments }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const getAssignmentsForDay = (date: Date) => {
        return assignments.filter(a => isSameDay(new Date(a.dueDate), date));
    };

    const selectedAssignments = selectedDay ? getAssignmentsForDay(selectedDay) : [];

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* Calendar Grid */}
            <div className="flex-1 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">{format(currentDate, 'MMMM yyyy')}</h2>
                    <div className="flex gap-2">
                        <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-2">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1 auto-rows-fr">
                    {days.map((day, idx) => {
                        const dayAssignments = getAssignmentsForDay(day);
                        const isSelected = selectedDay && isSameDay(day, selectedDay);
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <motion.div
                                key={day.toISOString()}
                                onClick={() => setSelectedDay(day)}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.005 }}
                                className={`
                   min-h-[80px] p-2 rounded-xl cursor-pointer border transition-all relative group
                   ${isSelected
                                        ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                                        : isToday
                                            ? 'bg-slate-800/80 border-slate-600'
                                            : 'bg-slate-800/30 border-transparent hover:bg-slate-800/50 hover:border-white/10'
                                    }
                   ${!isCurrentMonth && 'opacity-30 grayscale'}
                 `}
                            >
                                <div className={`text-sm font-medium mb-1 ${isSelected || isToday ? 'text-white' : 'text-slate-400'}`}>
                                    {format(day, 'd')}
                                </div>

                                {/* Visual Dots for assignments */}
                                <div className="flex flex-wrap gap-1">
                                    {dayAssignments.slice(0, 4).map((a, i) => {
                                        let color = 'bg-indigo-500';
                                        if (a.type === 'Exam') color = 'bg-red-500';
                                        if (a.type === 'Quiz') color = 'bg-amber-500';
                                        if (a.type === 'Project') color = 'bg-emerald-500';

                                        return (
                                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${color}`} />
                                        );
                                    })}
                                    {dayAssignments.length > 4 && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Selected Day Detail View */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={selectedDay?.toISOString()}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="w-full lg:w-80 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col h-full"
                >
                    <div className="mb-6">
                        <p className="text-slate-400 text-sm uppercase tracking-wider font-semibold">Schedule</p>
                        <h3 className="text-3xl font-bold text-white mt-1">{selectedDay ? format(selectedDay, 'EEEE') : 'Select a Day'}</h3>
                        <p className="text-indigo-300 font-medium">{selectedDay ? format(selectedDay, 'MMM d, yyyy') : ''}</p>
                    </div>

                    <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                        {selectedAssignments.length > 0 ? (
                            selectedAssignments.map(a => (
                                <div key={a.id} className="p-4 rounded-xl bg-slate-800/50 border border-white/5 hover:border-white/10 transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${a.type === 'Exam' ? 'text-red-300 bg-red-400/10 border-red-500/20' :
                                                a.type === 'Project' ? 'text-emerald-300 bg-emerald-400/10 border-emerald-500/20' :
                                                    'text-indigo-300 bg-indigo-400/10 border-indigo-500/20'
                                            }`}>
                                            {a.type || 'Assignment'}
                                        </span>
                                        <span className={`text-xs ${a.status === 'Completed' ? 'text-green-400' : 'text-amber-400'}`}>
                                            {a.status}
                                        </span>
                                    </div>
                                    <h4 className="text-white font-medium mb-1 leading-tight group-hover:text-indigo-300 transition-colors">{a.title}</h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Clock size={12} />
                                        <span>{format(new Date(a.dueDate), 'h:mm a')}</span>
                                        <span>•</span>
                                        <span>{a.subject}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-center border-2 border-dashed border-slate-800 rounded-xl">
                                <p className="mb-2">No tasks</p>
                                <p className="text-xs">Enjoy your free time!</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default CalendarView;
