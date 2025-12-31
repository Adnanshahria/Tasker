import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, Target, Minus, Plus, Settings as SettingsIcon, Check, X, Pause, Play } from 'lucide-react';
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
    const [size, setSize] = useState(250);
    const strokeWidth = 6;
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    useEffect(() => {
        const updateSize = () => {
            if (window.innerWidth < 768) {
                const h = window.innerHeight;
                if (h < 650) setSize(200);
                else setSize(240);
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
        pomodoro: '#8b5cf6', // Violet
        shortBreak: '#3b82f6', // Blue
        longBreak: '#10b981', // Emerald
    };

    const activeColor = modeColors[mode];

    const modes = [
        { key: 'pomodoro', label: 'Pomodoro' },
        { key: 'shortBreak', label: 'Short Break' },
        { key: 'longBreak', label: 'Long Break' },
    ] as const;

    return (
        <div className="h-full md:h-auto overflow-hidden flex flex-col md:block relative bg-[#0B0B15]">

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
                            className="w-full max-w-[380px] bg-[#151520] rounded-3xl p-6 shadow-2xl border border-white/5"
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
                                        <button onClick={() => setTempPomodoro(Math.max(5, tempPomodoro - 5))} className="p-3 bg-[#1E1E2E] rounded-xl hover:bg-[#252535] text-white"><Minus size={18} /></button>
                                        <span className="flex-1 text-center text-2xl font-bold text-white">{tempPomodoro}</span>
                                        <button onClick={() => setTempPomodoro(Math.min(180, tempPomodoro + 5))} className="p-3 bg-[#1E1E2E] rounded-xl hover:bg-[#252535] text-white"><Plus size={18} /></button>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-slate-400">Short Break (min)</label>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setTempShortBreak(Math.max(1, tempShortBreak - 1))} className="p-3 bg-[#1E1E2E] rounded-xl hover:bg-[#252535] text-white"><Minus size={18} /></button>
                                        <span className="flex-1 text-center text-2xl font-bold text-white">{tempShortBreak}</span>
                                        <button onClick={() => setTempShortBreak(Math.min(30, tempShortBreak + 1))} className="p-3 bg-[#1E1E2E] rounded-xl hover:bg-[#252535] text-white"><Plus size={18} /></button>
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleSaveSettings} className="w-full mt-8 py-4 bg-white text-black font-bold rounded-xl transition-all hover:bg-slate-200">
                                Save Changes
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col md:grid md:grid-cols-2 md:items-center justify-between max-w-md md:max-w-5xl mx-auto w-full h-full pb-20 md:pb-8 relative z-10 px-4 md:px-8 pt-2 md:pt-12 gap-6 md:gap-12">

                {/* Desktop Header Placeholder */}
                <div className="hidden md:flex absolute top-0 left-0 right-0 p-8 justify-between items-center z-20">
                    <span className="text-lg font-semibold text-violet-400">Ogrogoti</span>
                </div>

                {/* Left Col (Timer) */}
                <div className="flex flex-col items-center justify-center relative min-h-0 md:h-auto md:bg-[#151520] md:rounded-3xl md:p-8 md:border md:border-white/5 order-2 md:order-1 flex-[2] md:flex-initial">

                    {/* Mode Selector */}
                    <div className="bg-[#151520] rounded-2xl p-1.5 flex relative z-20 border border-white/5 shadow-lg shrink-0 mb-4 w-full md:w-auto md:mb-8">
                        {modes.map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => !isActive && setMode(key)}
                                className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 relative overflow-hidden z-10 ${mode === key ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {mode === key && (
                                    <motion.div
                                        layoutId="activeMode"
                                        className="absolute inset-0 bg-[#252535] rounded-xl"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10">{label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="relative z-10 flex flex-col items-center justify-center">
                        <div className="relative">
                            {/* Simple Timer Ring */}
                            <svg width={size} height={size} className="transform -rotate-90">
                                {/* Track */}
                                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1E1E2E" strokeWidth={strokeWidth} />
                                {/* Progress */}
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

                            <div
                                className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group"
                                onClick={() => isActive && setShowFocusedTime(!showFocusedTime)}
                            >
                                <motion.span
                                    key={showFocusedTime ? 'focused' : 'remaining'}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-[3.5rem] font-bold text-white tracking-tighter leading-none font-mono"
                                >
                                    {showFocusedTime ? formattedElapsedTime : formattedTime}
                                </motion.span>
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#4B5563] mt-2">
                                    {isActive ? (showFocusedTime ? 'FOCUSED' : 'REMAINING') : 'READY'}
                                </span>
                                {endTimeText && !showFocusedTime && (
                                    <span className="text-[10px] text-[#4B5563] mt-1">
                                        Ends at <span className="font-semibold text-violet-400">{endTimeText}</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-8 mt-8 md:mt-10">
                            <button
                                disabled={isActive}
                                className="w-14 h-14 flex items-center justify-center rounded-[1.5rem] bg-[#151520] text-slate-400 hover:bg-[#1E1E2E] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                <Minus size={22} />
                            </button>

                            <button
                                onClick={toggle}
                                className="w-20 h-20 flex items-center justify-center rounded-[2rem] bg-white text-black shadow-lg shadow-white/10 hover:scale-105 active:scale-95 transition-all duration-300"
                            >
                                {isActive ? (
                                    <Pause size={28} fill="currentColor" className="ml-0.5" />
                                ) : (
                                    <Play size={28} fill="currentColor" className="ml-1" />
                                )}
                            </button>

                            <button
                                disabled={isActive}
                                className="w-14 h-14 flex items-center justify-center rounded-[1.5rem] bg-[#151520] text-slate-400 hover:bg-[#1E1E2E] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                <Plus size={22} />
                            </button>
                        </div>

                        <div className="flex gap-6 mt-6">
                            <button onClick={() => setShowSettings(true)} className="text-xs font-bold text-slate-500 hover:text-white transition-colors flex items-center gap-1.5">
                                <Clock size={14} /> Set Time
                            </button>
                            <button onClick={handleEndSession} className="text-xs font-bold text-slate-500 hover:text-emerald-400 transition-colors">
                                End & Save
                            </button>
                            <button onClick={reset} className="text-xs font-bold text-slate-500 hover:text-rose-400 transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Col / Bottom Section (Stats + Actions) */}
                <div className="pb-2 md:pb-0 shrink-0 space-y-4 order-3 md:order-2 w-full flex-1 md:flex-initial flex flex-col justify-end">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 md:grid-cols-1 gap-3 md:gap-4">
                        <div className="rounded-2xl p-2 md:p-5 border border-white/5 bg-white/5 flex flex-col md:flex-row items-center md:items-center justify-center md:justify-start gap-1 md:gap-4 text-center md:text-left h-20 md:h-auto backdrop-blur-sm">
                            <div className="text-indigo-400 mb-0.5 md:mb-0"><Clock size={18} className="md:w-5 md:h-5" /></div>
                            <div>
                                <span className="text-[9px] md:text-xs text-slate-400 font-medium uppercase whitespace-nowrap block mb-0.5">Today</span>
                                <span className="text-base md:text-2xl font-bold text-white leading-none">{formatTime(todayStats.totalFocusMinutes)}</span>
                            </div>
                        </div>
                        <div className="rounded-2xl p-2 md:p-5 border border-white/5 bg-white/5 flex flex-col md:flex-row items-center md:items-center justify-center md:justify-start gap-1 md:gap-4 text-center md:text-left h-20 md:h-auto backdrop-blur-sm">
                            <div className="text-purple-400 mb-0.5 md:mb-0"><Calendar size={18} className="md:w-5 md:h-5" /></div>
                            <div>
                                <span className="text-[9px] md:text-xs text-slate-400 font-medium uppercase whitespace-nowrap block mb-0.5">Week</span>
                                <span className="text-base md:text-2xl font-bold text-white leading-none">{formatTime(todayStats.totalFocusMinutes)}</span>
                            </div>
                        </div>
                        <div className="rounded-2xl p-2 md:p-5 border border-white/5 bg-white/5 flex flex-col md:flex-row items-center md:items-center justify-center md:justify-start gap-1 md:gap-4 text-center md:text-left h-20 md:h-auto backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute inset-x-0 bottom-0 bg-emerald-500/10 md:hidden" style={{ height: `${Math.min(100, Math.round((todayStats.totalFocusMinutes / dailyGoal) * 100))}%`, transition: 'height 1s ease' }} />
                            <div className="text-emerald-400 mb-0.5 md:mb-0 relative z-10"><Target size={18} className="md:w-5 md:h-5" /></div>
                            <div className="relative z-10">
                                <span className="text-[9px] md:text-xs text-slate-400 font-medium uppercase whitespace-nowrap block mb-0.5">Goal</span>
                                <span className="text-base md:text-2xl font-bold text-white leading-none">{Math.round((todayStats.totalFocusMinutes / dailyGoal) * 100)}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                        <button
                            onClick={() => navigate('/deepfocus')}
                            className="bg-[#1E1E2E] hover:bg-[#252535] border border-white/5 text-slate-200 rounded-2xl py-3.5 text-sm font-bold transition-all active:scale-95"
                        >
                            Deep Focus
                        </button>
                        <button
                            onClick={() => navigate('/records')}
                            className="bg-[#1E1E2E] hover:bg-[#252535] border border-white/5 text-slate-200 rounded-2xl py-3.5 text-sm font-bold transition-all active:scale-95"
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
