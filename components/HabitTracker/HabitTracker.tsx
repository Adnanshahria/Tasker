import React, { useState, useEffect } from 'react';
import { startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getHabits, saveHabit, updateHabit, deleteHabit, getSettings, LocalHabit, UserSettings, DEFAULT_SETTINGS_BN } from '../../services/dataService';

import ConfirmModal from '../ui/ConfirmModal';
import Toolbar from './Toolbar';
import Table from './Table';
import { T } from './translations';
import { toggleHabitDate } from './helpers';

const HabitTracker: React.FC = () => {
    const { currentUser } = useAuth();
    const [habits, setHabits] = useState<LocalHabit[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS_BN);
    const [loading, setLoading] = useState(true);
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    const selectedDate = new Date(selectedYear, selectedMonth, 1);
    const daysInMonth = eachDayOfInterval({ start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) });
    const yearOptions = Array.from({ length: 11 }, (_, i) => now.getFullYear() - 5 + i);

    const loadData = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const [habitsData, settingsData] = await Promise.all([
                getHabits(currentUser.uid),
                getSettings(currentUser.uid)
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
            await saveHabit({ userId: currentUser.uid, title: newTitle, description: newDesc, completedDates: [], streak: 0, createdAt: Date.now() });
            setNewTitle(''); setNewDesc(''); setShowAddModal(false);
            await loadData();
        } catch (error) {
            console.error('Error adding habit:', error);
        }
    };

    const handleToggle = async (habit: LocalHabit, date: Date) => {
        try {
            await updateHabit(habit.id, { completedDates: toggleHabitDate(habit, date) });
            await loadData();
        } catch (error) {
            console.error('Error toggling habit:', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteHabit(id);
            await loadData();
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting habit:', error);
        }
    };

    if (loading) {
        return <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div></div>;
    }

    return (
        <div className="h-full flex flex-col space-y-4 font-sans">
            <Toolbar title={t.title} addLabel={t.addHabit} selectedMonth={selectedMonth} selectedYear={selectedYear} showPicker={showMonthPicker} yearOptions={yearOptions} onPickerToggle={() => setShowMonthPicker(!showMonthPicker)} onMonthSelect={m => { setSelectedMonth(m); setShowMonthPicker(false); }} onYearSelect={setSelectedYear} onAddClick={() => setShowAddModal(true)} />
            <div className="flex-1 bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-xl">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <Table habits={habits} daysInMonth={daysInMonth} t={t} lang={lang} onToggle={handleToggle} onDelete={setDeleteConfirm} />
                    {habits.length === 0 && <EmptyState t={t} />}
                    <AddRow onClick={() => setShowAddModal(true)} label={t.addNew} />
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
    <div onClick={onClick} className="w-full p-3 border-b border-slate-700 text-slate-500 text-sm hover:bg-emerald-500/5 cursor-pointer flex items-center gap-2 pl-16 transition-colors">
        <span className="text-emerald-400">+</span> {label}
    </div>
);

export default HabitTracker;
