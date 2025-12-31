import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Timer, CheckSquare, Target, ArrowRight, Zap, Download, Sparkles, Cloud } from 'lucide-react';

const LandingPage: React.FC = () => {
    const features = [
        {
            icon: Timer,
            label: 'Focus Timer',
            desc: 'Pomodoro technique for deep work',
            highlights: ['Suitable time', 'Break sessions', 'Session stats'],
            color: 'from-rose-500 to-orange-500',
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20',
            textColor: 'text-rose-400'
        },
        {
            icon: CheckSquare,
            label: 'Habit Tracker',
            desc: 'Build daily consistency',
            highlights: ['Daily streaks', 'Visual progress', 'Custom habits'],
            color: 'from-emerald-500 to-teal-500',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            textColor: 'text-emerald-400'
        },
        {
            icon: Target,
            label: 'Assignments',
            desc: 'Never miss a deadline',
            highlights: ['Due dates', 'Priority tags', 'Progress tracking'],
            color: 'from-blue-500 to-cyan-500',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            textColor: 'text-blue-400'
        },
        {
            icon: Cloud,
            label: 'Cloud Sync',
            desc: 'Your data, everywhere',
            highlights: ['Cross-device sync', 'Auto backup', 'Secure storage'],
            color: 'from-violet-500 to-purple-500',
            bg: 'bg-violet-500/10',
            border: 'border-violet-500/20',
            textColor: 'text-violet-400'
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
            {/* Floating Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-5 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]" />
                <div className="absolute bottom-20 right-5 w-80 h-80 bg-indigo-500/15 rounded-full blur-[100px]" />
                <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] hidden lg:block" />
            </div>

            {/* MOBILE LAYOUT (unchanged) */}
            <div className="lg:hidden min-h-screen flex flex-col relative z-10">
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-6 pt-8 pb-4 flex justify-center"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Zap size={20} className="text-white" />
                        </div>
                        <span className="text-xl font-bold">Ogrogoti</span>
                    </div>
                </motion.header>

                {/* Hero */}
                <section className="px-6 py-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4"
                    >
                        <Sparkles size={12} className="text-indigo-400" />
                        <span className="text-xs text-indigo-300">Productivity Redefined</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="text-4xl font-black leading-tight mb-3"
                    >
                        <span className="text-white">Master Your</span>
                        <br />
                        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Productivity
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-400 text-base max-w-sm mx-auto"
                    >
                        Track habits, manage assignments, and focus deeply — all in one powerful app.
                    </motion.p>
                </section>

                {/* Features */}
                <section className="px-6 py-6 flex-1 flex flex-col justify-center">
                    <div className="space-y-3">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.label}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                className={`p-4 rounded-2xl ${feature.bg} border ${feature.border}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                                        <feature.icon size={22} className="text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-base font-bold text-white">{feature.label}</h3>
                                        <p className="text-xs text-slate-400 mb-2">{feature.desc}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {feature.highlights.map((h) => (
                                                <span key={h} className={`text-[10px] px-2 py-0.5 rounded-full bg-white/5 ${feature.textColor}`}>
                                                    {h}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="px-6 py-8">
                    <Link
                        to="/auth"
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl font-bold shadow-xl shadow-indigo-500/25"
                    >
                        Get Started Free
                        <ArrowRight size={18} />
                    </Link>
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-4">
                        <Download size={12} />
                        <span>Install: Tap ⋮ → Add to Home Screen</span>
                    </div>
                </section>

                <footer className="px-6 py-4 text-center border-t border-white/5">
                    <p className="text-xs text-slate-600">Free Forever • No Credit Card Required</p>
                </footer>
            </div>

            {/* DESKTOP LAYOUT */}
            <div className="hidden lg:flex min-h-screen relative z-10 flex-col">
                {/* Centered Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full flex justify-center py-8"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Zap size={28} className="text-white" />
                        </div>
                        <span className="text-3xl font-black">Ogrogoti</span>
                    </div>
                </motion.header>

                {/* Two Column Content */}
                <div className="flex-1 flex items-stretch justify-center gap-8 xl:gap-12 px-8">
                    {/* Left Side - Hero Content */}
                    <div className="w-[480px] xl:w-[520px] flex flex-col justify-center">
                        <div className="max-w-xl">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8"
                            >
                                <Sparkles size={14} className="text-indigo-400" />
                                <span className="text-sm text-indigo-300 font-medium">Productivity Redefined</span>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="text-6xl xl:text-7xl font-black leading-tight mb-8"
                            >
                                <span className="text-white">Master Your</span>
                                <br />
                                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    Productivity
                                </span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-slate-400 text-lg xl:text-xl mb-10 max-w-lg"
                            >
                                Track habits, manage assignments, and focus deeply — all in one powerful app. Built for students who mean business.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                            >
                                <Link to="/auth">
                                    <motion.div
                                        animate={{
                                            background: [
                                                'linear-gradient(to right, #6366f1, #a855f7)',
                                                'linear-gradient(to right, #a855f7, #ec4899)',
                                                'linear-gradient(to right, #ec4899, #06b6d4)',
                                                'linear-gradient(to right, #06b6d4, #6366f1)',
                                            ]
                                        }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                        className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg text-white hover:scale-105 transition-transform cursor-pointer"
                                    >
                                        Get Started
                                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </motion.div>
                                </Link>
                            </motion.div>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-sm text-slate-600 mt-8"
                            >
                                Free Forever • No Credit Card Required
                            </motion.p>
                        </div>
                    </div>

                    {/* Right Side - Feature Cards */}
                    <div className="w-[460px] xl:w-[500px] flex flex-col justify-center">
                        <div className="space-y-3">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={feature.label}
                                    initial={{ opacity: 0, x: 40 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + index * 0.1 }}
                                    whileHover={{ scale: 1.02, x: -10 }}
                                    className={`p-5 rounded-2xl ${feature.bg} border ${feature.border} backdrop-blur-sm cursor-default transition-all`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                                            <feature.icon size={26} className="text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-white mb-1">{feature.label}</h3>
                                            <p className="text-sm text-slate-400 mb-3">{feature.desc}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {feature.highlights.map((h) => (
                                                    <span key={h} className={`text-xs px-3 py-1 rounded-full bg-white/5 ${feature.textColor} font-medium`}>
                                                        {h}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
