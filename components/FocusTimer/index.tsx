import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, Target, Minus, Plus, Settings as SettingsIcon } from 'lucide-react';
import { useTimer } from '../../hooks/use-timer';
import { useAudioAlert } from '../../hooks/use-audio-alert';
import { useSessionRecorder } from '../../hooks/use-session-recorder';
import { useTimerStore } from '../../store/timerStore';
import DeepFocusTimer from './DeepFocus';
import RecordsPage from './Records';

const FocusTimer: React.FC = () => {
    const { formattedTime, progress, isActive, mode, pomodorosCompleted, toggle, reset, setMode } = useTimer();
    const { playAlert, initAudio } = useAudioAlert();
    const { recordSession, getTodayStats, getAllTimeStats } = useSessionRecorder();
    const durations = useTimerStore((state) => state.durations);
    const setDurations = useTimerStore((state) => state.setDurations);
    const dailyGoal = useTimerStore((state) => state.dailyGoal);

    const [showFloatingTimer, setShowFloatingTimer] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showRecords, setShowRecords] = useState(false);
    const [todayStats, setTodayStats] = useState({ totalFocusMinutes: 0, totalPomos: 0 });
    const [prevTimeLeft, setPrevTimeLeft] = useState<number | null>(null);

    const [tempPomodoro, setTempPomodoro] = useState(Math.floor(durations.pomodoro / 60));
    const [tempShortBreak, setTempShortBreak] = useState(Math.floor(durations.shortBreak / 60));
    const [tempLongBreak, setTempLongBreak] = useState(Math.floor(durations.longBreak / 60));

    const timeLeft = useTimerStore((state) => state.timeLeft);

    // Ring properties
    const size = 220;
    const strokeWidth = 4;
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    useEffect(() => {
        if (showSettings) {
            setTempPomodoro(Math.floor(durations.pomodoro / 60));
            setTempShortBreak(Math.floor(durations.shortBreak / 60));
            setTempLongBreak(Math.floor(durations.longBreak / 60));
        }
    }, [showSettings, durations]);

    useEffect(() => {
        const stats = getTodayStats();
        setTodayStats({ totalFocusMinutes: stats.totalFocusMinutes, totalPomos: stats.totalPomos });
    }, [getTodayStats, pomodorosCompleted]);

    useEffect(() => {
        if (prevTimeLeft !== null && prevTimeLeft > 0 && timeLeft === 0) {
            playAlert();
            recordSession(true);
            const stats = getTodayStats();
            setTodayStats({ totalFocusMinutes: stats.totalFocusMinutes, totalPomos: stats.totalPomos });
        }
        setPrevTimeLeft(timeLeft);
    }, [timeLeft, prevTimeLeft, playAlert, recordSession, getTodayStats]);

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

    const allTimeStats = getAllTimeStats();
    const formatTime = (mins: number) => `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m`;

    const modes = [
        { key: 'pomodoro', label: 'Pomodoro' },
        { key: 'shortBreak', label: 'Short Break' },
        { key: 'longBreak', label: 'Long Break' },
    ] as const;

    return (
        <>
            {/* Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                        onClick={() => setShowSettings(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-xs bg-slate-800 rounded-2xl p-5"
                        >
                            <h2 className="text-lg font-semibold text-white mb-4">Timer Settings</h2>

                            {[
                                { label: 'Focus', value: tempPomodoro, setValue: setTempPomodoro, step: 5, max: 120 },
                                { label: 'Short Break', value: tempShortBreak, setValue: setTempShortBreak, step: 1, max: 30 },
                                { label: 'Long Break', value: tempLongBreak, setValue: setTempLongBreak, step: 5, max: 60 },
                            ].map(({ label, value, setValue, step, max }) => (
                                <div key={label} className="mb-4">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-slate-400">{label}</span>
                                        <span className="text-sm text-white font-medium">{value} min</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setValue(Math.max(1, value - step))} className="p-2 rounded-lg bg-slate-700"><Minus size={16} className="text-slate-300" /></button>
                                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full">
                                            <div className="h-1.5 bg-blue-500 rounded-full transition-all" style={{ width: `${(value / max) * 100}%` }} />
                                        </div>
                                        <button onClick={() => setValue(Math.min(max, value + step))} className="p-2 rounded-lg bg-slate-700"><Plus size={16} className="text-slate-300" /></button>
                                    </div>
                                </div>
                            ))}

                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setShowSettings(false)} className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300">Cancel</button>
                                <button onClick={handleSaveSettings} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white">Save</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Records Page */}
            <RecordsPage
                isOpen={showRecords}
                onClose={() => setShowRecords(false)}
                onOpenSettings={() => setShowSettings(true)}
                onOpenDeepFocus={() => { setShowRecords(false); setShowFloatingTimer(true); }}
                todayStats={todayStats}
                allTimeStats={allTimeStats}
            />

            {/* Main View */}
            <div className={`h-full overflow-y-auto pb-24 ${(showRecords || showFloatingTimer) ? 'hidden' : ''}`}>
                <div className="max-w-md md:max-w-5xl mx-auto px-4 md:px-8 pt-8 h-full flex flex-col md:justify-center">
                    {/* Header */}
                    <div className="flex items-center justify-between py-3 mb-4 md:mb-8">
                        <span className="text-lg font-semibold text-violet-400 hidden md:block">Ogrogoti</span>
                        <div className="flex gap-2">
                            <button onClick={() => setShowFloatingTimer(true)} className="px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/50 text-slate-300 text-xs hover:bg-slate-700/80 transition-colors">
                                Deep Focus
                            </button>
                            <button onClick={() => setShowRecords(true)} className="px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/50 text-slate-300 text-xs hover:bg-slate-700/80 transition-colors">
                                Record
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:items-center">
                        {/* Left Column: Timer Card */}
                        <div className="bg-slate-800/30 rounded-3xl p-6 relative overflow-hidden backdrop-blur-sm border border-white/5">
                            {/* Background Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-violet-500/20 blur-[80px] rounded-full pointer-events-none" />

                            {/* Mode Selector */}
                            <div className="flex justify-center mb-8 relative z-10">
                                <div className="flex bg-slate-800/60 rounded-full p-1 border border-white/5">
                                    {modes.map(({ key, label }) => (
                                        <button
                                            key={key}
                                            onClick={() => !isActive && setMode(key)}
                                            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${mode === key ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-slate-300'
                                                } ${isActive ? 'cursor-not-allowed opacity-50' : ''}`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Circular Timer */}
                            <div className="relative flex items-center justify-center py-4 z-10">
                                <svg width={size} height={size} className="transform -rotate-90 drop-shadow-2xl">
                                    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(71, 85, 105, 0.2)" strokeWidth={strokeWidth} />
                                    <motion.circle
                                        cx={size / 2} cy={size / 2} r={radius}
                                        fill="none"
                                        stroke={mode === 'pomodoro' ? '#8b5cf6' : '#10b981'}
                                        strokeWidth={strokeWidth}
                                        strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        initial={false}
                                        animate={{ strokeDashoffset }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </svg>

                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-6xl font-bold text-white tracking-tighter" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                        {formattedTime}
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-2">
                                        {isActive ? 'Focusing' : 'Ready'}
                                    </span>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-center gap-6 mt-8 z-10 relative">
                                <button onClick={() => { /* subtract time */ }} className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-700/30 text-slate-400 hover:bg-slate-700/50 hover:text-white transition-all">
                                    <Minus size={20} />
                                </button>

                                <button
                                    onClick={toggle}
                                    className="w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-b from-slate-700 to-slate-800 border border-t-slate-600 border-b-slate-900 text-white active:scale-95 transition-all shadow-xl shadow-black/20 hover:shadow-violet-500/10"
                                >
                                    {isActive ? (
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                                    ) : (
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="white" className="ml-1"><path d="M5 3l14 9-14 9V3z" /></svg>
                                    )}
                                </button>

                                <button onClick={() => { /* add time */ }} className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-700/30 text-slate-400 hover:bg-slate-700/50 hover:text-white transition-all">
                                    <Plus size={20} />
                                </button>
                            </div>

                            {/* Action Bar (Set Time | End & Save | Cancel) */}
                            <div className="w-full mt-8 flex items-center justify-center gap-4 text-xs font-medium text-slate-400 z-10 relative">
                                <button
                                    onClick={() => setShowSettings(true)}
                                    className="flex items-center gap-1.5 hover:text-violet-400 transition-colors"
                                >
                                    <Clock size={14} />
                                    Set Time
                                </button>
                                <span className="text-slate-700">|</span>
                                <button
                                    onClick={handleEndSession}
                                    className="hover:text-emerald-400 transition-colors"
                                >
                                    End & Save
                                </button>
                                <span className="text-slate-700">|</span>
                                <button
                                    onClick={() => reset()}
                                    className="hover:text-red-400 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>

                        {/* Right Column: Stats Cards */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-5 p-5 bg-slate-800/40 rounded-2xl border-l-[6px] border-violet-500 backdrop-blur-sm transition-transform hover:translate-x-1 duration-300">
                                <div className="p-3 rounded-xl bg-violet-500/10 shadow-inner">
                                    <Clock size={24} className="text-violet-400" />
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">TODAY'S FOCUS</span>
                                    <p className="text-2xl font-bold text-white">{formatTime(todayStats.totalFocusMinutes)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-5 p-5 bg-slate-800/40 rounded-2xl border-l-[6px] border-purple-500 backdrop-blur-sm transition-transform hover:translate-x-1 duration-300 delay-75">
                                <div className="p-3 rounded-xl bg-purple-500/10 shadow-inner">
                                    <Calendar size={24} className="text-purple-400" />
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">THIS WEEK</span>
                                    <p className="text-2xl font-bold text-white">{formatTime(todayStats.totalFocusMinutes)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-5 p-5 bg-slate-800/40 rounded-2xl border-l-[6px] border-emerald-500 backdrop-blur-sm transition-transform hover:translate-x-1 duration-300 delay-100">
                                <div className="p-3 rounded-xl bg-emerald-500/10 shadow-inner">
                                    <Target size={24} className="text-emerald-400" />
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">DAILY GOAL</span>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-2xl font-bold text-white">{Math.round((todayStats.totalFocusMinutes / dailyGoal) * 100)}%</p>
                                        <span className="text-xs text-slate-500">completed</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <DeepFocusTimer isOpen={showFloatingTimer} onClose={() => setShowFloatingTimer(false)} />
        </>
    );
};

export default FocusTimer;
