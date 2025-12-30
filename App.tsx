import React, { Suspense, lazy, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { migrateLocalStorageData } from './services/migrationService';

// Lazy load components for better initial load performance
const Sidebar = lazy(() => import('./components/Sidebar'));
const BottomNav = lazy(() => import('./components/BottomNav'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const AssignmentTracker = lazy(() => import('./components/AssignmentTracker'));
const HabitTracker = lazy(() => import('./components/HabitTracker'));
const FocusTimer = lazy(() => import('./components/FocusTimer'));
const Settings = lazy(() => import('./components/Settings'));
const Auth = lazy(() => import('./components/Auth'));
const UpdatePassword = lazy(() => import('./components/UpdatePassword'));
const NetworkStatus = lazy(() => import('./components/ui/NetworkStatus'));
import TimerController from './components/FocusTimer/TimerController';

// Run data migration on app load (migrates from old 'agrogoti_' to new 'ogrogoti_' keys)
// Migration running logic removed from top-level

// Loading spinner component
const LoadingSpinner = () => (
  <div className="h-screen w-full flex items-center justify-center bg-slate-900">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      <p className="text-slate-400 text-sm">Loading...</p>
    </div>
  </div>
);

// Page loading skeleton
const PageSkeleton = () => (
  <div className="animate-pulse p-4 space-y-4">
    <div className="h-8 bg-slate-700/50 rounded-lg w-1/3"></div>
    <div className="h-32 bg-slate-700/50 rounded-xl"></div>
    <div className="h-48 bg-slate-700/50 rounded-xl"></div>
  </div>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-black text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Suspense fallback={<div className="w-64 bg-slate-900"></div>}>
          <Sidebar isOpen={false} setIsOpen={() => { }} />
        </Suspense>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-center p-3 border-b border-white/10 bg-slate-900/80 backdrop-blur-md z-20">
          <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Ogrogoti</h1>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-3 md:p-8 pb-20 md:pb-8 relative z-10 scroll-smooth overscroll-y-contain">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <Suspense fallback={<PageSkeleton />}>
                {children}
              </Suspense>
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
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>

      {/* Network Status Indicator */}
      <Suspense fallback={null}>
        <NetworkStatus />
      </Suspense>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!currentUser) return <Navigate to="/auth" />;
  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  useEffect(() => {
    // Run data migration asynchronously to avoid blocking initial render
    setTimeout(() => migrateLocalStorageData(), 0);
  }, []);

  return (
    <HashRouter>
      <AuthProvider>
        <TimerController />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/focus" element={<ProtectedRoute><FocusTimer /></ProtectedRoute>} />
            <Route path="/assignments" element={<ProtectedRoute><AssignmentTracker /></ProtectedRoute>} />
            <Route path="/habits" element={<ProtectedRoute><HabitTracker /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;