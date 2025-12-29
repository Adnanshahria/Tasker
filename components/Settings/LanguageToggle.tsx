import React from 'react';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
    lang: 'en' | 'bn';
    label: string;
    englishLabel: string;
    banglaLabel: string;
    onLanguageChange: (lang: 'en' | 'bn') => void;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({
    lang, label, englishLabel, banglaLabel, onLanguageChange
}) => (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Globe size={20} className="text-cyan-400" />
                <h2 className="font-bold text-white">{label}</h2>
            </div>
            <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
                <button
                    onClick={() => onLanguageChange('en')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${lang === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    🇺🇸 {englishLabel}
                </button>
                <button
                    onClick={() => onLanguageChange('bn')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${lang === 'bn' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    🇧🇩 {banglaLabel}
                </button>
            </div>
        </div>
    </div>
);

export default LanguageToggle;
