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
                        className="fixed inset-0 z-50 bg-slate-900"
                    >
                        <div className="h-full overflow-y-auto pb-24">
                            <div className="max-w-md mx-auto px-4 py-4">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
                                            <ChevronLeft size={20} />
                                        </button>
                                        <h1 className="text-lg font-semibold text-white">Record</h1>
                                    </div>
                                    <button onClick={onOpenSettings} className="p-2 text-slate-400 hover:text-white">
                                        <SettingsIcon size={18} />
                                    </button>
                                </div>

                                {/* Chart Cards */}
                                <div className="space-y-4" key={refreshKey}>
                                    {/* Today's Activity with Hourly Chart */}
                                    <TodayChart />

                                    {/* Weekly Activity */}
                                    <WeekChart />

                                    {/* Monthly Activity */}
                                    <MonthChart />

                                    {/* Overall Activity */}
                                    <OverallChart />

                                    {/* Recent Activity */}
                                    <RecentActivityCard onLogSession={handleLogSession} />
                                </div>

                                {/* Deep Focus CTA */}
                                <div className="text-center py-6 mt-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                                        <Maximize2 size={20} className="text-blue-400" />
                                    </div>
                                    <h3 className="text-white font-semibold mb-1">Deep Focus Mode</h3>
                                    <p className="text-slate-500 text-xs mb-4">Eliminate distractions and boost productivity.</p>
                                    <button
                                        onClick={onOpenDeepFocus}
                                        className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
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
