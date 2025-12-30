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
    const ringSize = 320;
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
                className="h-screen w-screen flex flex-col items-center justify-center px-6"
            >
                {/* Main Timer Display */}
                <motion.div
                    animate={{ opacity: isDimmed ? 0.2 : 1, scale: isDimmed ? 0.98 : 1 }}
                    transition={{ duration: 0.8 }}
                    className="relative flex items-center justify-center"
                >
                    {/* Outer glow ring */}
                    <div
                        className="absolute rounded-full"
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
                        className="transform -rotate-90 absolute"
                    >
                        {/* Background ring */}
                        <circle
                            cx={ringSize / 2}
                            cy={ringSize / 2}
                            r={ringRadius}
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.1)"
                            strokeWidth={ringStrokeWidth}
                        />
                        {/* Glow filter */}
                        <defs>
                            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        {/* Progress ring */}
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

                    {/* Timer Display */}
                    <div className="relative z-10 flex flex-col items-center">
                        <motion.span
                            className="text-7xl md:text-9xl font-extralight text-white tracking-tight"
                            style={{
                                fontVariantNumeric: 'tabular-nums',
                                textShadow: `0 0 40px ${modeGlow}`
                            }}
                            animate={{ opacity: isDimmed ? 0.3 : 1 }}
                        >
                            {formattedTime}
                        </motion.span>

                        {/* Mode indicator */}
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
                    </div>
                </motion.div>

                {/* Stats Bar */}
                <motion.div
                    animate={{ opacity: isDimmed ? 0 : 0.9, y: isDimmed ? 20 : 0 }}
                    transition={{ duration: 0.5 }}
                    className="mt-24 flex items-center gap-8"
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

                {/* Controls */}
                <AnimatePresence>
                    {showControls && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 30 }}
                            transition={{ duration: 0.3 }}
                            className="fixed bottom-16 left-0 right-0 flex items-center justify-center gap-6 pb-safe"
                        >
                            <button
                                onClick={handleClose}
                                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white/60 hover:text-white hover:bg-white/20 active:scale-95 transition-all border border-white/10"
                            >
                                <ChevronLeft size={22} />
                            </button>
                            <button
                                onClick={subtractTime}
                                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white/60 hover:text-white hover:bg-white/20 active:scale-95 transition-all border border-white/10"
                            >
                                <Minus size={20} />
                            </button>
                            <button
                                onClick={toggle}
                                className="w-16 h-16 flex items-center justify-center rounded-full text-white active:scale-95 transition-all shadow-lg"
                                style={{
                                    background: `linear-gradient(135deg, ${modeColor} 0%, ${mode === 'pomodoro' ? '#7c3aed' : '#059669'} 100%)`,
                                    boxShadow: `0 0 30px ${modeGlow}`
                                }}
                            >
                                {isActive ? <Pause size={26} fill="white" /> : <Play size={26} fill="white" className="ml-1" />}
                            </button>
                            <button
                                onClick={addTime}
                                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white/60 hover:text-white hover:bg-white/20 active:scale-95 transition-all border border-white/10"
                            >
                                <Plus size={20} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Dim hint */}
                <AnimatePresence>
                    {isDimmed && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.3 }}
                            exit={{ opacity: 0 }}
                            className="fixed bottom-6 text-xs text-slate-500 tracking-wide"
                        >
                            Tap anywhere to show controls
                        </motion.p>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
};

export default DeepFocusTimer;
