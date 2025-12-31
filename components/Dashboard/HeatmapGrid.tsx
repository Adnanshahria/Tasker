import React from 'react';
import SectionHeader from '../ui/SectionHeader';
import { useTimerStore } from '../../store/timerStore';
import { getBorderClass, getBorderStyle } from '../../utils/styleUtils';

interface HeatmapGridProps {
    title: string;
    data: { date: string; day: number; count: number; intensity: number }[];
    habitsLabel: string;
    helpKey?: string;
    onHelpClick?: (key: string) => void;
}

const HeatmapGrid: React.FC<HeatmapGridProps> = ({ title, data, habitsLabel, helpKey, onHelpClick }) => {
    const borderColor = useTimerStore((state) => state.borderColor);

    return (
        <div className={getBorderClass(borderColor, "bg-slate-900/80 backdrop-blur-sm border rounded-2xl p-4 md:p-6 shadow-xl h-full flex flex-col")} style={getBorderStyle(borderColor)}>
            <div className="mb-4">
                <SectionHeader title={title} helpKey={helpKey} onHelpClick={onHelpClick} />
            </div>

            <div className="flex-1 flex items-center justify-center w-full">
                <div className="grid grid-cols-7 sm:grid-cols-10 gap-2 md:gap-3 w-full">
                    {data.map((day) => (
                        <div
                            key={day.date}
                            className="aspect-square rounded-lg md:rounded-xl flex items-center justify-center text-[10px] md:text-xs font-bold transition-all hover:scale-110 cursor-default relative group"
                            style={{
                                background: day.intensity === 0
                                    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.4))'
                                    : `linear-gradient(135deg, rgba(16, 185, 129, ${Math.max(0.4, day.intensity)}), rgba(5, 150, 105, ${Math.max(0.5, day.intensity + 0.1)}))`,
                                color: day.intensity > 0 ? '#fff' : '#475569',
                                border: day.intensity > 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                                boxShadow: day.intensity > 0 ? `0 4px 12px rgba(16, 185, 129, ${day.intensity * 0.4})` : 'none'
                            }}
                        >
                            {day.day}

                            {/* Hover Tooltip */}
                            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-2 bg-slate-800 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-20 border border-white/10 shadow-2xl transform translate-y-2 group-hover:translate-y-0 transition-all font-medium">
                                <span className="text-slate-400 block text-[10px] mb-0.5">{day.date}</span>
                                {day.count} {habitsLabel}
                                {/* Arrow */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HeatmapGrid;
