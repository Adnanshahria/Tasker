import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Timer, CheckSquare, Sprout, LogOut, X, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSettings, DEFAULT_SETTINGS } from '../services/dataService';

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

  useEffect(() => {
    const loadLang = async () => {
      if (currentUser) {
        try {
          const settings = await getSettings(currentUser.uid);
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
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-white/5
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col
      `}>
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <CheckSquare size={22} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">অগ্রগতি</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${isActive
                  ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 text-white border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">{t.logout}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;