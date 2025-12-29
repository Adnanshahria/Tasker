import React from 'react';
import { HelpCircle } from 'lucide-react';

interface StatCardProps {
    icon: React.ElementType;
    iconColor: string;
    label: string;
    value: string | number;
    helpKey?: string;
    onHelpClick?: (key: string) => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, iconColor, label, value, helpKey, onHelpClick }) => (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:scale-[1.02] transition-all shadow-xl group relative">
        <div className={`p-3 rounded-xl ${iconColor} shadow-lg`}>
            <Icon size={22} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider truncate">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        {helpKey && onHelpClick && (
            <button
                onClick={() => onHelpClick(helpKey)}
                className="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            >
                <HelpCircle size={16} />
            </button>
        )}
    </div>
);

export default StatCard;
