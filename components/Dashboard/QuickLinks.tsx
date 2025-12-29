import React from 'react';
import { Link } from 'react-router-dom';

interface QuickLinksProps {
    t: Record<string, string>;
    onLogout: () => void;
}

const QuickLinks: React.FC<QuickLinksProps> = ({ t, onLogout }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/assignments" className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5 hover:scale-[1.02] transition-all text-center shadow-lg">
            <p className="font-bold text-white text-lg">{t.assignments}</p>
        </Link>
        <Link to="/habits" className="bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-5 hover:scale-[1.02] transition-all text-center shadow-lg">
            <p className="font-bold text-white text-lg">{t.habitsNav}</p>
        </Link>
        <Link to="/settings" className="bg-gradient-to-br from-slate-500/20 to-slate-600/10 border border-slate-500/20 rounded-2xl p-5 hover:scale-[1.02] transition-all text-center shadow-lg">
            <p className="font-bold text-white text-lg">{t.settings}</p>
        </Link>
        <button onClick={onLogout} className="bg-gradient-to-br from-red-500/20 to-rose-500/10 border border-red-500/20 rounded-2xl p-5 hover:scale-[1.02] transition-all text-center shadow-lg">
            <p className="font-bold text-white text-lg">{t.logout}</p>
        </button>
    </div>
);

export default QuickLinks;
