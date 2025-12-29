import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Sprout, Settings } from 'lucide-react';

const BottomNav: React.FC = () => {
    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Home' },
        { to: '/assignments', icon: CheckSquare, label: 'Tasks' },
        { to: '/habits', icon: Sprout, label: 'Habits' },
        { to: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 safe-area-pb">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all ${isActive
                                ? 'text-indigo-400'
                                : 'text-slate-500 hover:text-slate-300'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-indigo-500/20' : ''}`}>
                                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <span className="text-[10px] font-medium">{label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;
