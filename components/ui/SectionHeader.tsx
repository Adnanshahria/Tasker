import React from 'react';
import { HelpCircle } from 'lucide-react';

interface SectionHeaderProps {
    title: string;
    helpKey?: string;
    onHelpClick?: (key: string) => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, helpKey, onHelpClick }) => (
    <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
        <h2 className="text-md font-bold text-white">{title}</h2>
        {helpKey && onHelpClick && (
            <button
                onClick={() => onHelpClick(helpKey)}
                className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
            >
                <HelpCircle size={16} />
            </button>
        )}
    </div>
);

export default SectionHeader;
