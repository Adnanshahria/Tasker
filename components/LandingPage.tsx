import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Timer, CheckSquare, Target, ArrowRight, Sparkles } from 'lucide-react';

const LandingPage: React.FC = () => {
    const features = [
        { icon: Timer, label: 'Focus Timer', description: 'Deep work sessions' },
        { icon: CheckSquare, label: 'Habit Tracker', description: 'Build consistency' },
        { icon: Target, label: 'Assignments', description: 'Stay organized' },
    ];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[120px]" />
                <div className="absolute bottom-[10%] right-[20%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-cyan-600/10 blur-[100px]" />
            </div>

            {/* Main Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 text-center max-w-2xl"
            >
                {/* Logo / Brand */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="mb-6"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
                        <Sparkles size={16} className="text-indigo-400" />
                        <span className="text-sm text-indigo-300 font-medium">Productivity Evolved</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                        Ogrogoti
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-md mx-auto">
                        Master your time, build better habits, and achieve your goals.
                    </p>
                </motion.div>

                {/* Feature Highlights */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="grid grid-cols-3 gap-4 mb-10 mt-10"
                >
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                            className="flex flex-col items-center p-4 rounded-2xl bg-slate-900/50 border border-white/5 backdrop-blur-sm"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-3">
                                <feature.icon size={24} className="text-indigo-400" />
                            </div>
                            <span className="text-sm font-semibold text-white">{feature.label}</span>
                            <span className="text-xs text-slate-500 mt-1">{feature.description}</span>
                        </motion.div>
                    ))}
                </motion.div>

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.4 }}
                >
                    <Link
                        to="/auth"
                        className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-105 active:scale-95"
                    >
                        Get Started
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </motion.div>

                {/* Footer Text */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    className="mt-8 text-sm text-slate-600"
                >
                    Free to use • No credit card required
                </motion.p>
            </motion.div>
        </div>
    );
};

export default LandingPage;
