import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, Target, Minus, Plus, Settings as SettingsIcon, Check, X } from 'lucide-react';
import { useTimer } from '../../hooks/use-timer';
import { useAudioAlert } from '../../hooks/use-audio-alert';
import { useSessionRecorder } from '../../hooks/use-session-recorder';
import { useFocusDashboard } from '../../hooks/useFocusDashboard';
import { useTimerStore } from '../../store/timerStore';
import { getBorderClass, getBorderStyle } from '../../utils/styleUtils';

const FocusTimer: React.FC = () => {
    const navigate = useNavigate();
    const { formattedTime, progress, isActive, mode, toggle, reset, setMode, formattedElapsedTime } = useTimer();
    const { playAlert, initAudio } = useAudioAlert();
    const { recordSession } = useSessionRecorder();
    const { todayStats } = useFocusDashboard();
    const durations = useTimerStore((state) => state.durations);
    const setDurations = useTimerStore((state) => state.setDurations);
    const dailyGoal = useTimerStore((state) => state.dailyGoal);
    const borderColor = useTimerStore((state) => state.borderColor);

    const [showSettings, setShowSettings] = useState(false);
    const [prevTimeLeft, setPrevTimeLeft] = useState<number | null>(null);
    const [showFocusedTime, setShowFocusedTime] = useState(false);

    const [tempPomodoro, setTempPomodoro] = useState(Math.floor(durations.pomodoro / 60));
    const [tempShortBreak, setTempShortBreak] = useState(Math.floor(durations.shortBreak / 60));
    const [tempLongBreak, setTempLongBreak] = useState(Math.floor(durations.longBreak / 60));

    const timeLeft = useTimerStore((state) => state.timeLeft);

    // Dynamic Ring properties based on screen size
    const [size, setSize] = useState(240);
    const strokeWidth = 6;
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    useEffect(() => {
        const updateSize = () => {
            // Adjust ring size for mobile/desktop
            // Mobile (dvh based) vs Desktop
            if (window.innerWidth < 768) {
                // If height is small, reduce size
                const h = window.innerHeight;
                if (h < 700) setSize(200);
                else setSize(250);
            } else {
                setSize(280);
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    useEffect(() => {
        if (showSettings) {
            setTempPomodoro(Math.floor(durations.pomodoro / 60));
            setTempShortBreak(Math.floor(durations.shortBreak / 60));
            setTempLongBreak(Math.floor(durations.longBreak / 60));
        }
    }, [showSettings, durations]);

    useEffect(() => {
        if (prevTimeLeft !== null && prevTimeLeft > 0 && timeLeft === 0) {
            playAlert();
            recordSession(true);
        }
        setPrevTimeLeft(timeLeft);
    }, [timeLeft, prevTimeLeft, playAlert, recordSession]);

    const handleFirstInteraction = useCallback(() => {
        initAudio();
        window.removeEventListener('click', handleFirstInteraction);
    }, [initAudio]);

    useEffect(() => {
        window.addEventListener('click', handleFirstInteraction);
        return () => window.removeEventListener('click', handleFirstInteraction);
    }, [handleFirstInteraction]);

    const handleEndSession = () => {
        if (isActive) recordSession(false);
        reset();
    };

    const handleSaveSettings = () => {
        setDurations({
            pomodoro: tempPomodoro * 60,
            shortBreak: tempShortBreak * 60,
            longBreak: tempLongBreak * 60,
        });
        setShowSettings(false);
    };

    const formatTime = (mins: number) => {
        if (mins < 60) return `${mins}m`;
        return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    };

    const endTimeText = useMemo(() => {
        if (!isActive || timeLeft <= 0) return null;
        const endDate = new Date(Date.now() + timeLeft * 1000);
        return endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }, [isActive, timeLeft]);

    const modeColors = {
        pomodoro: '#8b5cf6', // violet-500
        shortBreak: '#10b981', // emerald-500
        longBreak: '#3b82f6', // blue-500
    };

    const activeColor = modeColors[mode];

    const modes = [
        { key: 'pomodoro', label: 'Pomodoro' },
        { key: 'shortBreak', label: 'Short Break' },
        { key: 'longBreak', label: 'Long Break' },
    ] as const;

    return (
        <div className="h-full md:h-auto overflow-hidden flex flex-col md:block relative">

            {/* Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                        onClick={() => setShowSettings(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-[380px] bg-slate-900 rounded-3xl p-6 shadow-2xl border border-white/10"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">Timer Settings</h2>
                                <button onClick={() => setShowSettings(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-slate-400">Focus Duration (min)</label>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setTempPomodoro(Math.max(5, tempPomodoro - 5))} className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700"><Minus size={18} /></button>
                                        <span className="flex-1 text-center text-2xl font-bold">{tempPomodoro}</span>
                                        <button onClick={() => setTempPomodoro(Math.min(180, tempPomodoro + 5))} className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700"><Plus size={18} /></button>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-slate-400">Short Break (min)</label>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setTempShortBreak(Math.max(1, tempShortBreak - 1))} className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700"><Minus size={18} /></button>
                                        <span className="flex-1 text-center text-2xl font-bold">{tempShortBreak}</span>
                                        <button onClick={() => setTempShortBreak(Math.min(30, tempShortBreak + 1))} className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700"><Plus size={18} /></button>
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleSaveSettings} className="w-full mt-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-500/25">
                                Save Changes
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full h-full pb-20 md:pb-8 relative z-10 px-4 md:px-0">

                {/* 1. Top Section: Mode Selector */}
                <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-1.5 flex relative z-20 border border-white/5 shadow-lg shrink-0 mt-2">
                    {modes.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => !isActive && setMode(key)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 relative overflow-hidden ${mode === key ? 'text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {mode === key && (
                                <motion.div
                                    layoutId="activeMode"
                                    className="absolute inset-0 bg-slate-800 rounded-xl"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10">{label}</span>
                        </button>
                    ))}
                </div>

                {/* 2. Middle Section: Timer & Controls */}
                <div className="flex-1 flex flex-col items-center justify-center relative min-h-0">
                    {/* Glow Effect */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-500/10 blur-[80px] rounded-full pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center justify-center flex-1">
                        <div className="relative">
                            <svg width={size} height={size} className="transform -rotate-90 drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
                                <motion.circle
                                    cx={size / 2} cy={size / 2} r={radius}
                                    fill="none"
                                    stroke={activeColor}
                                    strokeWidth={strokeWidth}
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    initial={false}
                                    animate={{ strokeDashoffset, stroke: activeColor }}
                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                />
                            </svg>

                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <motion.span
                                    key={showFocusedTime ? 'focused' : 'remaining'}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-[3.5rem] font-bold text-white tracking-tighter leading-none font-mono"
                                >
                                    {showFocusedTime ? formattedElapsedTime : formattedTime}
                                </motion.span>
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mt-2">
                                    {isActive ? (showFocusedTime ? 'FOCUSED' : 'REMAINING') : 'READY'}
                                </span>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-8 mt-6 md:mt-8">
                            {/* Minus 1 min */}
                            <button
                                disabled={isActive}
                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                <Minus size={20} />
                            </button>

                            {/* Play/Pause */}
                            <button
                                onClick={toggle}
                                className="w-20 h-20 flex items-center justify-center rounded-[2rem] bg-slate-100 text-slate-900 shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95 transition-all duration-300"
                            >
                                {isActive ? (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                                ) : (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M5 3l14 9-14 9V3z" /></svg>
                                )}
                            </button>

                            {/* Plus 1 min */}
                            <button
                                disabled={isActive}
                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        <div className="flex gap-6 mt-6">
                            <button onClick={() => setShowSettings(true)} className="text-xs font-semibold text-slate-500 hover:text-white transition-colors flex items-center gap-1.5">
                                <Clock size={12} /> Set Time
                            </button>
                            <button onClick={handleEndSession} className="text-xs font-semibold text-slate-500 hover:text-emerald-400 transition-colors">
                                End & Save
                            </button>
                            <button onClick={reset} className="text-xs font-semibold text-slate-500 hover:text-rose-400 transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. Bottom Section: Details Grid & Action Bar */}
                <div className="pb-2 md:pb-0 shrink-0 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-800/40 rounded-2xl p-3 border border-indigo-500/10 backdrop-blur-sm flex flex-col items-center justify-center gap-1 text-center h-24">
                            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 mb-0.5"><Clock size={14} /></div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase whitespace-nowrap">Today Focus</span>
                            <span className="text-sm font-bold text-white">{formatTime(todayStats.totalFocusMinutes)}</span>
                        </div>
                        <div className="bg-slate-800/40 rounded-2xl p-3 border border-purple-500/10 backdrop-blur-sm flex flex-col items-center justify-center gap-1 text-center h-24">
                            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 mb-0.5"><Calendar size={14} /></div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase whitespace-nowrap">This Week</span>
                            <span className="text-sm font-bold text-white">{formatTime(todayStats.totalFocusMinutes)}</span>
                        </div>
                        <div className="bg-slate-800/40 rounded-2xl p-3 border border-emerald-500/10 backdrop-blur-sm flex flex-col items-center justify-center gap-1 text-center h-24 relative overflow-hidden">
                            <div className="absolute inset-0 bg-emerald-500/5" style={{ height: `${Math.min(100, Math.round((todayStats.totalFocusMinutes / dailyGoal) * 100))}%`, bottom: 0, top: 'auto', transition: 'height 1s ease' }} />
                            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 mb-0.5 relative z-10"><Target size={14} /></div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase relative z-10 whitespace-nowrap">Daily Goal</span>
                            <span className="text-sm font-bold text-white relative z-10">{Math.round((todayStats.totalFocusMinutes / dailyGoal) * 100)}%</span>
                        </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => navigate('/deepfocus')}
                            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl py-3.5 text-xs font-bold transition-all shadow-lg active:scale-95"
                        >
                            Deep Focus
                        </button>
                        <button
                            onClick={() => navigate('/records')}
                            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl py-3.5 text-xs font-bold transition-all shadow-lg active:scale-95"
                        >
                            Record
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FocusTimer;
