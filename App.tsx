import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import AssignmentTracker from './components/AssignmentTracker';
import HabitTracker from './components/HabitTracker';
import Settings from './components/Settings';
import Auth from './components/Auth';
import NetworkStatus from './components/ui/NetworkStatus';
import { AnimatePresence, motion } from 'framer-motion';
import { migrateLocalStorageData } from './services/migrationService';

// Run data migration on app load (migrates from old 'agrogoti_' to new 'ogrogoti_' keys)
migrateLocalStorageData();

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar isOpen={false} setIsOpen={() => { }} />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-center p-3 border-b border-white/10 bg-slate-900/80 backdrop-blur-md z-20">
          <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">অগ্রগতি</h1>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-3 md:p-8 pb-20 md:pb-8 relative z-10 scroll-smooth overscroll-y-contain">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[100px]" />
          <div className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-cyan-600/10 blur-[100px]" />
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav />

      {/* Network Status Indicator */}
      <NetworkStatus />
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-900"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div></div>;
  if (!currentUser) return <Navigate to="/auth" />;
  return <Layout>{children}</Layout>;
};

const App: React.FC = () => (
  <HashRouter>
    <AuthProvider>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/assignments" element={<ProtectedRoute><AssignmentTracker /></ProtectedRoute>} />
        <Route path="/habits" element={<ProtectedRoute><HabitTracker /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  </HashRouter>
);

export default App;