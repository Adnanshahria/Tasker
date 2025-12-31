import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, Target, Minus, Plus, Settings as SettingsIcon, Check } from 'lucide-react';
import { useTimer } from '../../hooks/use-timer';
import { useAudioAlert } from '../../hooks/use-audio-alert';
import { useSessionRecorder } from '../../hooks/use-session-recorder';
import { useFocusDashboard } from '../../hooks/useFocusDashboard';
import { useTimerStore } from '../../store/timerStore';
import { getBorderClass, getBorderStyle } from '../../utils/styleUtils';
import DeepFocusTimer from './DeepFocus';
import RecordsPage from './Records';

const FocusTimer: React.FC = () => {
    const { formattedTime, progress, isActive, mode, pomodorosCompleted, toggle, reset, setMode, formattedElapsedTime } = useTimer();
    const { playAlert, initAudio } = useAudioAlert();
    const { recordSession } = useSessionRecorder();
    const { todayStats, allTimeStats } = useFocusDashboard();
    const durations = useTimerStore((state) => state.durations);
    const setDurations = useTimerStore((state) => state.setDurations);
    const dailyGoal = useTimerStore((state) => state.dailyGoal);
    const borderColor = useTimerStore((state) => state.borderColor);
    const setBorderColor = useTimerStore((state) => state.setBorderColor);

    const [showFloatingTimer, setShowFloatingTimer] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showRecords, setShowRecords] = useState(false);
    const [prevTimeLeft, setPrevTimeLeft] = useState<number | null>(null);
    const [showFocusedTime, setShowFocusedTime] = useState(false);

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

    const formatTime = (mins: number) => `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m`;

    // Calculate estimated end time
    const endTimeText = useMemo(() => {
        if (!isActive || timeLeft <= 0) return null;
        const endDate = new Date(Date.now() + timeLeft * 1000);
        return endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }, [isActive, timeLeft]);

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
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setShowSettings(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-[340px] bg-[#1e293b] rounded-3xl p-6 shadow-2xl border border-white/5"
                        >
                            <h2 className="text-xl font-bold text-white mb-6">Timer Settings</h2>

                            <div className="space-y-6">
                                {/* Border Color Picker */}
                                <div>
                                    <div className="flex justify-between mb-3">
                                        <span className="text-sm font-medium text-slate-400">Border Color</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: 'none', color: 'bg-slate-700', label: 'None' },
                                            { id: 'blue', color: 'bg-blue-500', label: 'Blue' },
                                            { id: 'red', color: 'bg-red-500', label: 'Red' },
                                            { id: 'white', color: 'bg-white', label: 'White' },
                                            { id: 'yellow', color: 'bg-yellow-500', label: 'Yellow' },
                                            { id: 'cyan', color: 'bg-cyan-500', label: 'Cyan' },
                                            { id: 'purple', color: 'bg-purple-500', label: 'Purple' },
                                            { id: 'green', color: 'bg-green-500', label: 'Green' },
                                            { id: 'orange', color: 'bg-orange-500', label: 'Orange' },
                                            { id: 'pink', color: 'bg-pink-500', label: 'Pink' },
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setBorderColor(item.id as any)}
                                                className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center transition-transform hover:scale-110 relative group`}
                                                title={item.label}
                                            >
                                                {borderColor === item.id && (
                                                    <Check size={14} className={['white', 'yellow', 'cyan', 'green', 'orange', 'pink'].includes(item.id) ? 'text-black' : 'text-white'} />
                                                )}
                                                {borderColor === item.id && (
                                                    <div className={`absolute inset-0 rounded-full ring-2 ring-offset-2 ring-offset-[#1e293b] ${item.id === 'none' ? 'ring-slate-500' : item.color.replace('bg-', 'ring-')}`} />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="h-px bg-white/10" />

                                {[
                                    { label: 'Focus', value: tempPomodoro, setValue: setTempPomodoro, step: 5, max: 360 }, // Max 6 hours
                                    { label: 'Short Break', value: tempShortBreak, setValue: setTempShortBreak, step: 1, max: 30 },
                                    { label: 'Long Break', value: tempLongBreak, setValue: setTempLongBreak, step: 5, max: 60 },
                                ].map(({ label, value, setValue, step, max }) => (
                                    <div key={label}>
                                        <div className="flex justify-between mb-3">
                                            <span className="text-sm font-medium text-slate-400">{label}</span>
                                            <span className="text-sm font-bold text-white tabular-nums">{value} min</span>
                                        </div>

                                        {/* Presets for Focus only */}
                                        {label === 'Focus' && (
                                            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                                                {[30, 60, 90, 120, 150, 180, 240, 300, 360].map((preset) => (
                                                    <button
                                                        key={preset}
                                                        onClick={() => setValue(preset)}
                                                        className={`
                                                            flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                                                            ${value === preset
                                                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25'
                                                                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
                                                            }
                                                        `}
                                                    >
                                                        {`${Math.floor(preset / 60)}h ${preset % 60}m`}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setValue(Math.max(1, value - step))}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                            >
                                                <Minus size={18} />
                                            </button>

                                            <div className="flex-1 px-2">
                                                <input
                                                    type="range"
                                                    min={step}
                                                    max={max}
                                                    step={step}
                                                    value={value}
                                                    onChange={(e) => setValue(Number(e.target.value))}
                                                    className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                                                    style={{
                                                        backgroundImage: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(value / max) * 100}%, rgba(51, 65, 85, 0.5) ${(value / max) * 100}%, rgba(51, 65, 85, 0.5) 100%)`
                                                    }}
                                                />
                                            </div>

                                            <button
                                                onClick={() => setValue(Math.min(max, value + step))}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="flex-1 py-3.5 rounded-xl bg-slate-700/50 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveSettings}
                                    className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                                >
                                    Save
                                </button>
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
                        <div className={getBorderClass(borderColor, "bg-slate-800/30 rounded-3xl p-6 relative overflow-hidden backdrop-blur-sm border")} style={getBorderStyle(borderColor)}>
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

                                <div
                                    className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group"
                                    onClick={() => isActive && setShowFocusedTime(!showFocusedTime)}
                                >
                                    {/* Flip container */}
                                    <motion.div
                                        className="relative"
                                        animate={{ rotateX: showFocusedTime ? 180 : 0 }}
                                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                                        style={{ transformStyle: 'preserve-3d' }}
                                    >
                                        {/* Front: Remaining Time */}
                                        <motion.span
                                            className="text-6xl font-bold text-white tracking-tighter block"
                                            style={{
                                                fontVariantNumeric: 'tabular-nums',
                                                backfaceVisibility: 'hidden'
                                            }}
                                            animate={{ opacity: showFocusedTime ? 0 : 1 }}
                                        >
                                            {formattedTime}
                                        </motion.span>

                                        {/* Back: Focused Time */}
                                        <motion.span
                                            className="text-6xl font-bold text-emerald-400 tracking-tighter absolute inset-0 flex items-center justify-center"
                                            style={{
                                                fontVariantNumeric: 'tabular-nums',
                                                backfaceVisibility: 'hidden',
                                                transform: 'rotateX(180deg)'
                                            }}
                                            animate={{ opacity: showFocusedTime ? 1 : 0 }}
                                        >
                                            {formattedElapsedTime}
                                        </motion.span>
                                    </motion.div>

                                    <span className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-2">
                                        {isActive ? (showFocusedTime ? 'Focused' : 'Remaining') : 'Ready'}
                                    </span>
                                    {endTimeText && !showFocusedTime && (
                                        <span className="text-[10px] text-slate-400 mt-1">
                                            Ends at <span className="font-semibold text-violet-400">{endTimeText}</span>
                                        </span>
                                    )}
                                    {isActive && (
                                        <span className="text-[9px] text-slate-500/60 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Tap to {showFocusedTime ? 'show remaining' : 'show focused'}
                                        </span>
                                    )}
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
                            <div className={getBorderClass(borderColor, "flex items-center gap-5 p-5 bg-slate-800/40 rounded-2xl backdrop-blur-sm transition-transform hover:translate-x-1 duration-300 border")} style={getBorderStyle(borderColor)}>
                                <div className="p-3 rounded-xl bg-violet-500/10 shadow-inner">
                                    <Clock size={24} className="text-violet-400" />
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">TODAY'S FOCUS</span>
                                    <p className="text-2xl font-bold text-white">{formatTime(todayStats.totalFocusMinutes)}</p>
                                </div>
                            </div>

                            <div className={getBorderClass(borderColor, "flex items-center gap-5 p-5 bg-slate-800/40 rounded-2xl backdrop-blur-sm transition-transform hover:translate-x-1 duration-300 delay-75 border")} style={getBorderStyle(borderColor)}>
                                <div className="p-3 rounded-xl bg-purple-500/10 shadow-inner">
                                    <Calendar size={24} className="text-purple-400" />
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">THIS WEEK</span>
                                    <p className="text-2xl font-bold text-white">{formatTime(todayStats.totalFocusMinutes)}</p>
                                </div>
                            </div>

                            <div className={getBorderClass(borderColor, "flex items-center gap-5 p-5 bg-slate-800/40 rounded-2xl backdrop-blur-sm transition-transform hover:translate-x-1 duration-300 delay-100 border")} style={getBorderStyle(borderColor)}>
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
