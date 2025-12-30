import React, { useState, useEffect, useCallback } from 'react';
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
    const { formattedTime, isActive, toggle, addTime, subtractTime, timeLeft } = useTimer();
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

    // Auto-dim
    useEffect(() => {
        if (!isOpen || !isActive) return;

        const interval = setInterval(() => {
            const inactiveTime = Date.now() - lastActivity;
            if (inactiveTime > 5000) setShowControls(false);
            if (inactiveTime > 15000) setIsDimmed(true);
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen, isActive, lastActivity]);

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

    if (!isOpen) return null;

    return (
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
            {/* DESKTOP VIEW (Existing Ring Design) */}
            <div className="hidden md:flex h-full w-full flex-col items-center justify-center relative overflow-hidden">
                {/* Ambient glow effect */}
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
                        animate={{ opacity: isDimmed ? 0.2 : 1, scale: isDimmed ? 0.98 : 1 }}
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
                                animate={{ opacity: isDimmed ? 0.3 : 1 }}
                            >
                                {formattedTime}
                            </motion.span>

                            <motion.div
                                animate={{ opacity: isDimmed ? 0 : 0.6 }}
                                className="mt-8 flex items-center gap-3"
                            >
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: modeColor }}
                                />
                                <span className="text-sm text-zinc-400 uppercase tracking-[0.2em]">
                                    {mode === 'pomodoro' ? 'Focus' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
                                </span>
                            </motion.div>
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
                            opacity: isDimmed ? 0.3 : 1,
                            scale: isDimmed ? 0.95 : 1
                        }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col items-center"
                    >
                        {/* Large Timer Text */}
                        <span className="text-[5.5rem] leading-none font-medium text-white tracking-tighter tabular-nums mb-16">
                            {formattedTime}
                        </span>

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
        </motion.div>
    );
};

export default DeepFocusTimer;
