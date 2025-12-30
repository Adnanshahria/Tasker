import React from 'react';
import { HelpCircle } from 'lucide-react';

import { useTimerStore } from '../../store/timerStore';
import { getBorderClass, getBorderStyle } from '../../utils/styleUtils';

interface StatCardProps {
    icon: React.ElementType;
    iconColor: string;
    label: string;
    value: string | number;
    helpKey?: string;
    onHelpClick?: (key: string) => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, iconColor, label, value, helpKey, onHelpClick }) => {
    const borderColor = useTimerStore((state) => state.borderColor);

    return (
        <div className={getBorderClass(borderColor, "bg-slate-900/80 backdrop-blur-sm border rounded-xl md:rounded-2xl p-2.5 md:p-4 flex items-center gap-2 md:gap-4 md:hover:scale-[1.02] transition-all shadow-xl group relative")} style={getBorderStyle(borderColor)}>
            <div className={`p-2 md:p-3 rounded-lg md:rounded-xl ${iconColor} shadow-lg`}>
                <Icon size={18} className="md:hidden" />
                <Icon size={22} className="hidden md:block" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider truncate">{label}</p>
                <p className="text-lg md:text-2xl font-bold text-white">{value}</p>
            </div>
            {helpKey && onHelpClick && (
                <button
                    onClick={() => onHelpClick(helpKey)}
                    className="absolute top-1.5 right-1.5 md:top-2 md:right-2 p-1 md:p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                    <HelpCircle size={14} className="md:hidden" />
                    <HelpCircle size={16} className="hidden md:block" />
                </button>
            )}
        </div>
    );

};

export default StatCard;
