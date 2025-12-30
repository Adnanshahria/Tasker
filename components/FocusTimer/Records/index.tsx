import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Settings as SettingsIcon, Maximize2 } from 'lucide-react';

// Chart Components
import TodayChart from './TodayChart';
import WeekChart from './WeekChart';
import MonthChart from './MonthChart';
import OverallChart from './OverallChart';
import RecentActivityCard from './RecentActivityCard';
import AddFocusRecordDialog from './AddFocusRecordDialog';

interface RecordsPageProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenSettings: () => void;
    onOpenDeepFocus: () => void;
    todayStats: { totalFocusMinutes: number; totalPomos: number };
    allTimeStats: { totalFocusMinutes: number; totalPomos: number; totalDays: number };
}

const RecordsPage: React.FC<RecordsPageProps> = ({
    isOpen,
    onClose,
    onOpenSettings,
    onOpenDeepFocus,
}) => {
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleLogSession = useCallback(() => {
        setShowAddDialog(true);
    }, []);

    const handleAddSuccess = useCallback(() => {
        // Trigger refresh of charts by changing key
        setRefreshKey(k => k + 1);
    }, []);

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-900 md:absolute md:inset-0 md:z-10"
                    >
                        <div className="h-full overflow-y-auto pb-24 md:pb-8">
                            <div className="max-w-md mx-auto px-4 py-4 md:max-w-7xl md:px-8">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
                                            <ChevronLeft size={20} />
                                        </button>
                                        <h1 className="text-lg font-semibold text-white">Record</h1>
                                    </div>
                                    <button onClick={onOpenSettings} className="p-2 text-slate-400 hover:text-white transition-colors">
                                        <SettingsIcon size={18} />
                                    </button>
                                </div>

                                {/* Chart Cards Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6" key={refreshKey}>
                                    {/* Today's Activity - Spans 2 cols on large screens if we want, or just 1 */}
                                    <div className="lg:col-span-2">
                                        <TodayChart />
                                    </div>

                                    {/* Overall Activity */}
                                    <OverallChart />

                                    {/* Weekly Activity */}
                                    <WeekChart />

                                    {/* Monthly Activity */}
                                    <MonthChart />

                                    {/* Recent Activity - Full width on mobile/tablet, span 2 on lg */}
                                    <div className="md:col-span-2 lg:col-span-1">
                                        <RecentActivityCard onLogSession={handleLogSession} />
                                    </div>
                                </div>

                                {/* Deep Focus CTA */}
                                <div className="text-center py-6 mt-8 max-w-md mx-auto">
                                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                                        <Maximize2 size={20} className="text-blue-400" />
                                    </div>
                                    <h3 className="text-white font-semibold mb-1">Deep Focus Mode</h3>
                                    <p className="text-slate-500 text-xs mb-4">Eliminate distractions and boost productivity.</p>
                                    <button
                                        onClick={onOpenDeepFocus}
                                        className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                                    >
                                        Enter Focus Mode
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Focus Record Dialog */}
            <AddFocusRecordDialog
                isOpen={showAddDialog}
                onClose={() => setShowAddDialog(false)}
                onSuccess={handleAddSuccess}
            />
        </>
    );
};

export default RecordsPage;
