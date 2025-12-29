import React from 'react';
import { HelpCircle, X } from 'lucide-react';
import { HELP_CONTENT } from '../../constants/helpContent';

interface HelpModalProps {
    helpKey: string | null;
    lang: 'en' | 'bn';
    onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ helpKey, lang, onClose }) => {
    if (!helpKey) return null;

    const content = HELP_CONTENT[lang]?.[helpKey as keyof typeof HELP_CONTENT['en']];
    if (!content) return null;

    const buttonText = lang === 'en' ? 'Got it!' : 'বুঝেছি!';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                            <HelpCircle size={18} className="text-indigo-400" />
                        </div>
                        {content.title}
                    </h3>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{content.description}</p>
                <button onClick={onClose} className="mt-6 w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/25 text-sm">
                    {buttonText}
                </button>
            </div>
        </div>
    );
};

export default HelpModal;
