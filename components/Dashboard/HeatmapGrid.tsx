import React from 'react';
import { HelpCircle } from 'lucide-react';
import SectionHeader from '../ui/SectionHeader';

interface HeatmapGridProps {
    title: string;
    data: { date: string; day: number; count: number; intensity: number }[];
    habitsLabel: string;
    helpKey?: string;
    onHelpClick?: (key: string) => void;
}

const HeatmapGrid: React.FC<HeatmapGridProps> = ({ title, data, habitsLabel, helpKey, onHelpClick }) => (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-5 shadow-xl">
        <SectionHeader title={title} helpKey={helpKey} onHelpClick={onHelpClick} />
        <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-2">
            {data.map((day) => (
                <div
                    key={day.date}
                    className="w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all hover:scale-110 cursor-default relative group"
                    style={{
                        backgroundColor: day.intensity === 0 ? 'rgba(30, 41, 59, 0.6)' : `rgba(16, 185, 129, ${Math.max(0.25, day.intensity)})`,
                        color: day.intensity > 0.5 ? '#fff' : '#64748b',
                        border: '1px solid rgba(255,255,255,0.08)'
                    }}
                >
                    {day.day}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10 border border-white/10 shadow-xl">
                        {day.date}: {day.count} {habitsLabel}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default HeatmapGrid;
