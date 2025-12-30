import React, { useState, useEffect } from 'react';
import { startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getHabits, saveHabit, updateHabit, deleteHabit, reorderHabits, getSettings, LocalHabit, UserSettings, DEFAULT_SETTINGS } from '../../services/dataService';

import ConfirmModal from '../ui/ConfirmModal';
import Toolbar from './Toolbar';
import Table from './Table';
import { T } from './translations';
import { toggleHabitDate } from './helpers';
import { useTimerStore } from '../../store/timerStore';
import { getBorderClass, getBorderStyle } from '../../utils/styleUtils';

const HabitTracker: React.FC = () => {
    const { currentUser } = useAuth();
    const [habits, setHabits] = useState<LocalHabit[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const borderColor = useTimerStore((state) => state.borderColor);

    const selectedDate = new Date(selectedYear, selectedMonth, 1);
    const daysInMonth = eachDayOfInterval({ start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) });
    const yearOptions = Array.from({ length: 11 }, (_, i) => now.getFullYear() - 5 + i);

    const loadData = async () => {
        if (!currentUser) return;
        try {
            const [habitsData, settingsData] = await Promise.all([
                getHabits(currentUser.id),
                getSettings(currentUser.id)
            ]);
            setHabits(habitsData);
            setSettings(settingsData);
        } catch (error) {
            console.error('Error loading data:', error);
        }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [currentUser]);

    const lang = settings.language || 'bn';
    const t = T[lang];

    const handleAdd = async () => {
        if (!newTitle.trim() || !currentUser) return;
        try {
            await saveHabit({ userId: currentUser.id, title: newTitle, description: newDesc, completedDates: [], streak: 0, createdAt: Date.now() });
            setNewTitle(''); setNewDesc(''); setShowAddModal(false);
            await loadData();
        } catch (error) {
            console.error('Error adding habit:', error);
        }
    };

    const handleToggle = async (habit: LocalHabit, date: Date) => {
        if (!currentUser) return;
        const newCompletedDates = toggleHabitDate(habit, date);
        // Optimistic update - update UI immediately
        setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, completedDates: newCompletedDates } : h));
        try {
            await updateHabit(habit.id, { userId: currentUser.id, completedDates: newCompletedDates });
        } catch (error) {
            console.error('Error toggling habit:', error);
            // Revert on error
            setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, completedDates: habit.completedDates } : h));
        }
    };

    const handleDelete = async (id: string) => {
        const deletedItem = habits.find(h => h.id === id);
        setHabits(prev => prev.filter(h => h.id !== id));
        setDeleteConfirm(null);
        try {
            await deleteHabit(id);
        } catch (error) {
            console.error('Error deleting habit:', error);
            if (deletedItem) setHabits(prev => [...prev, deletedItem]);
        }
    };

    const handleReorder = async (orderedIds: string[]) => {
        if (!currentUser) return;
        // Optimistic update - reorder in UI immediately
        const reorderedHabits = orderedIds
            .map(id => habits.find(h => h.id === id))
            .filter((h): h is LocalHabit => h !== undefined);
        setHabits(reorderedHabits);
        try {
            await reorderHabits(currentUser.id, orderedIds);
        } catch (error) {
            console.error('Error reordering habits:', error);
            await loadData(); // Revert on error
        }
    };

    if (loading) {
        return <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div></div>;
    }



    return (
        <div className="h-full flex flex-col space-y-4 font-sans">
            <Toolbar title={t.title} addLabel={t.addHabit} selectedMonth={selectedMonth} selectedYear={selectedYear} showPicker={showMonthPicker} yearOptions={yearOptions} onPickerToggle={() => setShowMonthPicker(!showMonthPicker)} onMonthSelect={m => { setSelectedMonth(m); setShowMonthPicker(false); }} onYearSelect={setSelectedYear} onAddClick={() => setShowAddModal(true)} />
            <div className={getBorderClass(borderColor, "flex-1 bg-slate-900/80 backdrop-blur-sm border rounded-2xl overflow-hidden flex flex-col shadow-xl")} style={getBorderStyle(borderColor)}>
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <Table habits={habits} daysInMonth={daysInMonth} t={t} lang={lang} onToggle={handleToggle} onDelete={setDeleteConfirm} onReorder={handleReorder} />
                    {habits.length === 0 && <EmptyState t={t} />}
                </div>
            </div>

            {/* Add Habit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-4">{t.addHabit}</h3>
                        <div className="space-y-4">
                            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder={t.enterName} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-emerald-500" autoFocus />
                            <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2} placeholder={t.enterDesc} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-emerald-500 resize-none" />
                            <div className="flex gap-3">
                                <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 font-medium">{t.cancel}</button>
                                <button onClick={handleAdd} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 font-medium shadow-lg shadow-emerald-500/25">{t.addHabit}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal isOpen={!!deleteConfirm} title={t.deleteTitle} message={t.deleteMsg} confirmText={t.delete} cancelText={t.cancel} onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)} onCancel={() => setDeleteConfirm(null)} />
        </div>
    );
};

const EmptyState: React.FC<{ t: Record<string, string> }> = ({ t }) => (
    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20"><Check size={32} className="text-emerald-400" /></div>
        <p className="text-lg font-medium">{t.none}</p><p className="text-sm">{t.clickAdd}</p>
    </div>
);

const AddRow: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
    <div onClick={onClick} className="p-2 md:p-3 border-t border-slate-700/50 text-emerald-500 text-xs md:text-sm hover:bg-emerald-500/10 cursor-pointer flex items-center gap-1.5 transition-colors">
        <span className="text-emerald-400 font-bold">+</span>
        <span className="truncate">{label}</span>
    </div>
);

export default HabitTracker;
