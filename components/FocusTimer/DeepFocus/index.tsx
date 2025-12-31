import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { ChevronLeft, Minus, Plus, Pause, Play } from 'lucide-react';
import { useTimer } from '../../../hooks/use-timer';
import { useWakelock } from '../../../hooks/use-wakelock';
import { useTimerStore } from '../../../store/timerStore';
import { useFocusDashboard, formatDuration } from '../../../hooks/useFocusDashboard';

interface DeepFocusTimerProps {
    isOpen: boolean;
    onClose: () => void;
}

const DeepFocusTimer: React.FC<DeepFocusTimerProps> = ({ isOpen, onClose }) => {
    const { formattedTime, isActive, toggle, addTime, subtractTime, timeLeft, formattedElapsedTime } = useTimer();
    const antiBurnIn = useTimerStore((state) => state.antiBurnIn);
    const dailyGoal = useTimerStore((state) => state.dailyGoal);
    const sessionDuration = useTimerStore((state) => state.sessionDuration);
    const mode = useTimerStore((state) => state.mode);

    const { todayStats } = useFocusDashboard();
    const totalMinutes = todayStats?.totalFocusMinutes || 0;
    const goalProgress = Math.min(100, (totalMinutes / dailyGoal) * 100);

    const [isDimmed, setIsDimmed] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [lastActivity, setLastActivity] = useState(Date.now());
    const [showDimWarning, setShowDimWarning] = useState(false);
    const [dimCountdown, setDimCountdown] = useState(0); // 0-100% for pre-dim countdown
    const [warningCountdown, setWarningCountdown] = useState(0); // 0-100% for warning countdown

    // Pixel shift for anti-burn-in
    const pixelShiftControls = useAnimation();

    const { requestWakeLock, releaseWakeLock } = useWakelock();

    // Progress ring properties
    const ringSize = 500;
    const ringStrokeWidth = 8;
    const ringRadius = (ringSize - ringStrokeWidth * 2) / 2;
    const ringCircumference = 2 * Math.PI * ringRadius;
    const ringProgress = sessionDuration > 0 ? (sessionDuration - timeLeft) / sessionDuration : 0;
    const ringStrokeDashoffset = ringCircumference * (1 - ringProgress);

    // Mode colors
    const modeColor = mode === 'pomodoro' ? '#8b5cf6' : '#10b981';
    const modeGlow = mode === 'pomodoro' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)';

    // Anti-burn-in pixel shifting every 60 seconds
    useEffect(() => {
        if (!isOpen || !antiBurnIn) return;

        const shiftPixel = () => {
            const maxJitter = window.innerWidth > 480 ? 15 : 8;
            const x = Math.floor(Math.random() * (maxJitter * 2 + 1)) - maxJitter;
            const y = Math.floor(Math.random() * (maxJitter * 2 + 1)) - maxJitter;
            pixelShiftControls.start({ x, y, transition: { duration: 1.5, ease: 'easeInOut' } });
        };

        pixelShiftControls.set({ x: 0, y: 0 });
        const intervalId = setInterval(shiftPixel, 60000);
        return () => clearInterval(intervalId);
    }, [isOpen, antiBurnIn, pixelShiftControls]);

    // Request fullscreen when opening
    useEffect(() => {
        if (!isOpen) return;

        const enterFullscreen = async () => {
            try {
                const elem = document.documentElement;
                if (elem.requestFullscreen) {
                    await elem.requestFullscreen();
                } else if ((elem as any).webkitRequestFullscreen) {
                    await (elem as any).webkitRequestFullscreen();
                }
            } catch (err) {
                console.log('Fullscreen not available');
            }
        };

        enterFullscreen();
        requestWakeLock();
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = '';
            releaseWakeLock();
        };
    }, [isOpen, requestWakeLock, releaseWakeLock]);

    // Exit fullscreen when closing
    const handleClose = useCallback(async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }
        } catch (err) { }
        onClose();
    }, [onClose]);

    // Listen for fullscreen exit
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && isOpen) {
                onClose();
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [isOpen, onClose]);

    // Handle activity
    const handleActivity = useCallback(() => {
        setLastActivity(Date.now());
        setIsDimmed(false);
        setShowControls(true);
    }, []);

    // Auto-dim after inactivity with countdown
    useEffect(() => {
        if (!isOpen || !isActive) {
            setDimCountdown(0);
            return;
        }

        const interval = setInterval(() => {
            const inactiveTime = Date.now() - lastActivity;

            // Hide controls after 3s
            if (inactiveTime > 3000) setShowControls(false);

            // Pre-dim countdown (3s to 8s = 5 second countdown)
            if (inactiveTime >= 3000 && inactiveTime < 8000) {
                const progress = ((inactiveTime - 3000) / 5000) * 100;
                setDimCountdown(progress);
            } else if (inactiveTime >= 8000 && !isDimmed) {
                setDimCountdown(0);
                setIsDimmed(true);
                setShowDimWarning(true);
                setWarningCountdown(0);

                // Animate warning countdown over 4 seconds
                const warningInterval = setInterval(() => {
                    setWarningCountdown(prev => {
                        if (prev >= 100) {
                            clearInterval(warningInterval);
                            setShowDimWarning(false);
                            return 100;
                        }
                        return prev + 2.5; // 100% over 4 seconds (40 steps * 100ms)
                    });
                }, 100);
            } else if (inactiveTime < 3000) {
                setDimCountdown(0);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [isOpen, isActive, lastActivity, isDimmed]);

    // Keyboard
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            handleActivity();
            if (e.code === 'Space') { e.preventDefault(); toggle(); }
            if (e.code === 'Escape') handleClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, toggle, handleClose, handleActivity]);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // ... existing hooks ...

    // Mobile Ring properties
    const mobileRingSize = 300;
    const mobileRingRadius = (mobileRingSize - ringStrokeWidth * 2) / 2;
    const mobileRingCircumference = 2 * Math.PI * mobileRingRadius;
    const mobileRingDashoffset = mobileRingCircumference * (1 - ringProgress);

    // ... existing hooks ...

    if (!isOpen || !mounted) return null;

    // Use Portal to ensure it covers EVERYTHING (Header, Bottom Nav, etc.)
    return ReactDOM.createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0"
            style={{
                zIndex: 9999,
                background: '#000000'
            }}
            onClick={handleActivity}
            onTouchStart={handleActivity}
        >
            {/* Pre-dim Countdown Circle with "Dimming" text - Filled style */}
            <AnimatePresence>
                {dimCountdown > 0 && dimCountdown < 100 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="fixed top-6 right-6 z-50 flex flex-col items-center"
                    >
                        <div className="relative w-16 h-16">
                            {/* Background circle */}
                            <div className="absolute inset-0 rounded-full bg-white/10 border border-white/20" />

                            {/* Filling circle using conic gradient */}
                            <div
                                className="absolute inset-0 rounded-full"
                                style={{
                                    background: `conic-gradient(rgba(139, 92, 246, 0.8) ${dimCountdown * 3.6}deg, transparent ${dimCountdown * 3.6}deg)`,
                                    transition: 'background 0.1s ease-out'
                                }}
                            />

                            {/* Center circle (hole effect) */}
                            <div className="absolute inset-2 rounded-full bg-black flex items-center justify-center">
                                <span className="text-[9px] font-semibold text-white/90 uppercase tracking-wide">
                                    Dimming
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* DESKTOP VIEW (Existing Ring Design) */}
            <div className="hidden md:flex h-full w-full flex-col items-center justify-center relative overflow-hidden">
                {/* ... existing desktop content ... */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none transition-opacity duration-1000"
                    style={{
                        background: modeGlow,
                        opacity: isDimmed ? 0.05 : 0.2
                    }}
                />

                <motion.div
                    animate={pixelShiftControls}
                    className="h-full w-full flex flex-col items-center justify-center px-6"
                >
                    {/* Main Timer Display Container */}
                    <motion.div
                        animate={{ opacity: isDimmed ? 0.5 : 1, scale: isDimmed ? 0.98 : 1 }}
                        transition={{ duration: 0.8 }}
                        className="relative flex items-center justify-center"
                        style={{
                            width: ringSize,
                            height: ringSize
                        }}
                    >
                        {/* Outer glow ring */}
                        <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                            style={{
                                width: ringSize + 60,
                                height: ringSize + 60,
                                background: `radial-gradient(circle, ${modeGlow} 0%, transparent 70%)`,
                                opacity: isActive ? 0.4 : 0.1
                            }}
                        />

                        {/* Progress Ring SVG */}
                        <svg
                            width={ringSize}
                            height={ringSize}
                            className="transform -rotate-90 absolute inset-0"
                        >
                            <circle
                                cx={ringSize / 2}
                                cy={ringSize / 2}
                                r={ringRadius}
                                fill="none"
                                stroke="rgba(255, 255, 255, 0.1)"
                                strokeWidth={ringStrokeWidth}
                            />
                            <defs>
                                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>
                            <motion.circle
                                cx={ringSize / 2}
                                cy={ringSize / 2}
                                r={ringRadius}
                                fill="none"
                                stroke={modeColor}
                                strokeWidth={ringStrokeWidth}
                                strokeLinecap="round"
                                strokeDasharray={ringCircumference}
                                strokeDashoffset={ringStrokeDashoffset}
                                filter="url(#glow)"
                                initial={false}
                                animate={{ strokeDashoffset: ringStrokeDashoffset }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                            />
                        </svg>

                        {/* Timer Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                            <motion.span
                                className="text-9xl font-extralight text-white tracking-tight"
                                style={{
                                    fontVariantNumeric: 'tabular-nums',
                                    textShadow: `0 0 40px ${modeGlow}`
                                }}
                                animate={{ opacity: isDimmed ? 0.5 : 1 }}
                            >
                                {formattedTime}
                            </motion.span>

                            <motion.div
                                animate={{ opacity: isDimmed ? 0 : 0.6 }}
                                className="mt-6 flex items-center gap-3"
                            >
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: modeColor }}
                                />
                                <span className="text-sm text-zinc-400 uppercase tracking-[0.2em]">
                                    {mode === 'pomodoro' ? 'Focus' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
                                </span>
                            </motion.div>

                            {/* Elapsed Time Display */}
                            {isActive && (
                                <motion.div
                                    animate={{ opacity: isDimmed ? 0.4 : 0.8 }}
                                    className="mt-4 px-4 py-2 rounded-full bg-white/5 border border-white/10"
                                >
                                    <span className="text-sm text-emerald-400">
                                        Focused: <span className="font-semibold">{formattedElapsedTime}</span>
                                    </span>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>

                    {/* Stats Bar */}
                    <motion.div
                        animate={{ opacity: isDimmed ? 0 : 0.9, y: isDimmed ? 20 : 0 }}
                        transition={{ duration: 0.5 }}
                        className="mt-12 flex items-center gap-8"
                    >
                        <div className="text-center px-8 py-4 rounded-3xl bg-white/5 backdrop-blur-md border border-white/5 hover:bg-white/10 transition-colors">
                            <span className="text-[11px] text-zinc-500 uppercase tracking-widest block mb-2">Goal</span>
                            <span className="text-xl font-light text-white">{formatDuration(dailyGoal)}</span>
                        </div>

                        <div className="text-center px-8 py-4 rounded-3xl bg-white/5 backdrop-blur-md border border-white/5 hover:bg-white/10 transition-colors">
                            <span className="text-[11px] text-zinc-500 uppercase tracking-widest block mb-2">Focused</span>
                            <span className="text-xl font-light text-white">{formatDuration(totalMinutes)}</span>
                        </div>

                        <div className="text-center px-8 py-4 rounded-3xl bg-white/5 backdrop-blur-md border border-white/5 relative overflow-hidden hover:bg-white/10 transition-colors">
                            <div
                                className="absolute inset-0 opacity-20"
                                style={{
                                    background: `linear-gradient(90deg, ${modeColor} ${goalProgress}%, transparent ${goalProgress}%)`
                                }}
                            />
                            <span className="text-[11px] text-zinc-500 uppercase tracking-widest block mb-2 relative">Progress</span>
                            <span className="text-xl font-light text-white relative">{Math.round(goalProgress)}%</span>
                        </div>
                    </motion.div>

                    {/* Desktop Control Bar */}
                    <AnimatePresence>
                        {showControls && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="mt-12 flex items-center justify-center gap-6"
                            >
                                {/* Back Button */}
                                <button
                                    onClick={handleClose}
                                    className="w-14 h-14 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white transition-all"
                                >
                                    <ChevronLeft size={24} />
                                </button>

                                {/* Subtract Time */}
                                <button
                                    onClick={subtractTime}
                                    className="w-14 h-14 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white transition-all"
                                >
                                    <Minus size={24} />
                                </button>

                                {/* Play/Pause - Main Action */}
                                <button
                                    onClick={toggle}
                                    className="w-20 h-20 flex items-center justify-center rounded-full bg-white text-black hover:bg-zinc-200 transition-all shadow-[0_0_60px_-10px_rgba(255,255,255,0.4)]"
                                >
                                    {isActive ? (
                                        <Pause size={36} fill="currentColor" />
                                    ) : (
                                        <Play size={36} fill="currentColor" className="ml-1" />
                                    )}
                                </button>

                                {/* Add Time */}
                                <button
                                    onClick={addTime}
                                    className="w-14 h-14 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white transition-all"
                                >
                                    <Plus size={24} />
                                </button>

                                {/* End Session */}
                                <button
                                    onClick={handleClose}
                                    className="w-14 h-14 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white transition-all"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Desktop Dim Warning */}
                    <AnimatePresence>
                        {showDimWarning && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20"
                            >
                                <div className="bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl px-10 py-6 text-center flex flex-col items-center shadow-2xl shadow-black/50">
                                    {/* Countdown Circle with icon */}
                                    <div className="relative mb-4">
                                        <svg width="70" height="70" className="transform -rotate-90">
                                            <circle cx="35" cy="35" r="30" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                                            <circle
                                                cx="35" cy="35" r="30"
                                                fill="none"
                                                stroke="url(#warningGradient)"
                                                strokeWidth="4"
                                                strokeLinecap="round"
                                                strokeDasharray={188}
                                                strokeDashoffset={188 - (warningCountdown / 100) * 188}
                                                style={{ transition: 'stroke-dashoffset 0.1s ease-out' }}
                                            />
                                            <defs>
                                                <linearGradient id="warningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#a78bfa" />
                                                    <stop offset="100%" stopColor="#818cf8" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-2xl">🔅</span>
                                    </div>
                                    <p className="text-base text-white font-semibold mb-2">Screen Dimmed</p>
                                    <p className="text-sm text-white/60 max-w-[200px] leading-relaxed">
                                        Saving power & protecting pixels.<br />
                                        <span className="text-violet-300/80">Screen will stay on.</span>
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>


            {/* MOBILE VIEW (OLED Minimalist Design) */}
            <div className="flex md:hidden h-full w-full flex-col justify-between px-6 pb-12 pt-20 relative overflow-hidden">
                {/* Minimalist Top Bar */}
                <div className={`flex justify-center transition-opacity duration-500 ${isDimmed ? 'opacity-0' : 'opacity-100'}`}>
                    <span className="text-base font-medium text-slate-400/50 uppercase tracking-widest">
                        {mode === 'pomodoro' ? 'Deep Focus' : 'Break'}
                    </span>
                </div>

                {/* Center Timer Area */}
                <div className="flex-1 flex flex-col items-center justify-center">
                    <motion.div
                        animate={{
                            opacity: isDimmed ? 0.5 : 1,
                            scale: isDimmed ? 0.95 : 1
                        }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col items-center w-full"
                    >
                        {/* Mobile Ring & Timer */}
                        <div className="relative flex items-center justify-center mb-10" style={{ width: mobileRingSize, height: mobileRingSize }}>
                            <svg
                                width={mobileRingSize}
                                height={mobileRingSize}
                                className="transform -rotate-90 absolute inset-0 pointer-events-none"
                            >
                                <circle
                                    cx={mobileRingSize / 2}
                                    cy={mobileRingSize / 2}
                                    r={mobileRingRadius}
                                    fill="none"
                                    stroke="rgba(255, 255, 255, 0.05)"
                                    strokeWidth={ringStrokeWidth}
                                />
                                <motion.circle
                                    cx={mobileRingSize / 2}
                                    cy={mobileRingSize / 2}
                                    r={mobileRingRadius}
                                    fill="none"
                                    stroke={modeColor}
                                    strokeWidth={ringStrokeWidth}
                                    strokeLinecap="round"
                                    strokeDasharray={mobileRingCircumference}
                                    strokeDashoffset={mobileRingDashoffset}
                                    initial={false}
                                    animate={{ strokeDashoffset: mobileRingDashoffset }}
                                    transition={{ duration: 0.5 }}
                                />
                            </svg>

                            <span className="text-[4rem] xs:text-[5rem] leading-none font-medium text-white tracking-tighter tabular-nums z-10">
                                {formattedTime}
                            </span>

                            {/* Elapsed Time (inside ring) */}
                            {isActive && (
                                <span className="absolute bottom-8 text-xs text-emerald-400 z-10">
                                    Focused: <span className="font-semibold">{formattedElapsedTime}</span>
                                </span>
                            )}
                        </div>

                        {/* Mobile Stats Cards */}
                        <div className={`grid grid-cols-2 gap-4 w-full max-w-xs transition-all duration-500 ${isDimmed ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                            {/* Daily Goal Card */}
                            <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4 flex flex-col items-center justify-center h-24">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Daily Goal</span>
                                <span className="text-xl font-medium text-slate-200">{formatDuration(dailyGoal)}</span>
                            </div>

                            {/* Progress Card */}
                            <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4 flex flex-col items-center justify-center h-24">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Progress</span>
                                <span className="text-xl font-medium text-slate-200">{Math.round(goalProgress)}%</span>
                            </div>
                        </div>
                    </motion.div>
                </div>


                {/* Bottom Control Bar */}
                <AnimatePresence>
                    {showControls && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="flex items-center justify-center gap-4"
                        >
                            {/* Back Button */}
                            <button
                                onClick={handleClose}
                                className="w-14 h-14 flex items-center justify-center rounded-full bg-white/[0.03] border border-white/[0.05] text-slate-400 active:scale-95 transition-transform"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            {/* Subtract Time */}
                            <button
                                onClick={subtractTime}
                                className="w-14 h-14 flex items-center justify-center rounded-full bg-white/[0.03] border border-white/[0.05] text-slate-400 active:scale-95 transition-transform"
                            >
                                <Minus size={20} />
                            </button>

                            {/* Play/Pause - Main Action */}
                            <button
                                onClick={toggle}
                                className="w-20 h-20 flex items-center justify-center rounded-full bg-slate-200 text-slate-900 active:scale-95 transition-transform shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
                            >
                                {isActive ? (
                                    <Pause size={32} fill="currentColor" className="text-slate-900" />
                                ) : (
                                    <Play size={32} fill="currentColor" className="text-slate-900 ml-1" />
                                )}
                            </button>

                            {/* Add Time */}
                            <button
                                onClick={addTime}
                                className="w-14 h-14 flex items-center justify-center rounded-full bg-white/[0.03] border border-white/[0.05] text-slate-400 active:scale-95 transition-transform"
                            >
                                <Plus size={20} />
                            </button>

                            {/* Finish/Check Button (using Close logic for now, or just placeholder) */}
                            <button
                                onClick={handleClose}
                                className="w-14 h-14 flex items-center justify-center rounded-full bg-white/[0.03] border border-white/[0.05] text-slate-400 active:scale-95 transition-transform"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mobile Dim Warning */}
                <AnimatePresence>
                    {showDimWarning && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute top-1/2 left-0 right-0 -translate-y-1/2 px-6 z-20"
                        >
                            <div className="max-w-xs mx-auto bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 text-center flex flex-col items-center shadow-2xl shadow-black/50">
                                {/* Countdown Circle with icon */}
                                <div className="relative mb-4">
                                    <svg width="60" height="60" className="transform -rotate-90">
                                        <circle cx="30" cy="30" r="25" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                                        <circle
                                            cx="30" cy="30" r="25"
                                            fill="none"
                                            stroke="url(#mobileWarningGrad)"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeDasharray={157}
                                            strokeDashoffset={157 - (warningCountdown / 100) * 157}
                                            style={{ transition: 'stroke-dashoffset 0.1s ease-out' }}
                                        />
                                        <defs>
                                            <linearGradient id="mobileWarningGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#a78bfa" />
                                                <stop offset="100%" stopColor="#818cf8" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-xl">🔅</span>
                                </div>
                                <p className="text-base text-white font-semibold mb-1">Screen Dimmed</p>
                                <p className="text-xs text-white/60 leading-relaxed">
                                    Saving power & protecting pixels.<br />
                                    <span className="text-violet-300/80">Screen will stay on.</span>
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Dim overlay hint */}
                <AnimatePresence>
                    {isDimmed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute bottom-12 left-0 right-0 text-center"
                        >
                            <span className="text-[10px] text-white/10 uppercase tracking-[0.2em]">Focused</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Shared Auto-dim hint (hidden in mobile by new layout, reused logic) */}
            {/* Note: I removed the shared Controls/Dim hint from the root level and moved them into respective Desktop/Mobile blocks to customize them. */}
        </motion.div>,
        document.body
    );
};

export default DeepFocusTimer;
