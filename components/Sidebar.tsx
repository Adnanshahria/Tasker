import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Timer, CheckSquare, Sprout, LogOut, X, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSettings } from '../services/dataService';
import { useTimerStore } from '../store/timerStore';
import { getBorderClass, getBorderStyle } from '../utils/styleUtils';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const T = {
  en: { dashboard: 'Dashboard', focus: 'Focus', assignments: 'Assignments', habits: 'Habits', settings: 'Settings', logout: 'Sign Out' },
  bn: { dashboard: 'ড্যাশবোর্ড', focus: 'ফোকাস', assignments: 'অ্যাসাইনমেন্ট', habits: 'অভ্যাস', settings: 'সেটিংস', logout: 'লগ আউট' }
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const [lang, setLang] = useState<'en' | 'bn'>('bn');
  const borderColor = useTimerStore((state) => state.borderColor);

  useEffect(() => {
    const loadLang = async () => {
      if (currentUser) {
        try {
          const settings = await getSettings(currentUser.id);
          setLang(settings.language || 'bn');
        } catch (e) {
          console.log('Error loading settings for sidebar');
        }
      }
    };
    loadLang();
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const t = T[lang];

  const navItems = [
    { name: t.dashboard, icon: LayoutDashboard, path: '/', color: 'indigo' },
    { name: t.focus, icon: Timer, path: '/focus', color: 'rose' },
    { name: t.assignments, icon: CheckSquare, path: '/assignments', color: 'amber' },
    { name: t.habits, icon: Sprout, path: '/habits', color: 'emerald' },
    { name: t.settings, icon: Settings, path: '/settings', color: 'slate' },
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 md:relative md:translate-x-0
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
      `}>
        {/* Floating Container */}
        <div className="h-full md:h-[calc(100vh-2rem)] md:my-4 md:ml-4 flex flex-col bg-slate-900/50 backdrop-blur-xl border border-white/5 md:rounded-3xl overflow-hidden shadow-2xl">

          {/* Header */}
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Ogrogoti" className="w-10 h-10 rounded-xl shadow-lg shadow-indigo-500/20" />
              <span className="font-bold text-xl tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Ogrogoti</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => {
                  const activeClass = getBorderClass(borderColor, 'bg-slate-800/80 text-white shadow-xl border');
                  const inactiveClass = 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent';

                  return `
                    flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden
                    ${isActive ? activeClass : inactiveClass}
                    `;
                }}
                style={({ isActive }) => isActive ? getBorderStyle(borderColor) : undefined}
              >
                <item.icon size={20} className="relative z-10 transition-transform duration-300 group-hover:scale-110" />
                <span className="font-medium relative z-10">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/5 bg-black/20">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all group"
            >
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">{t.logout}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;