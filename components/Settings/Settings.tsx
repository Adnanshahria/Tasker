import React, { useState, useEffect } from 'react';
import { RotateCcw, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getSettings, saveSettings, UserSettings, DEFAULT_SETTINGS_BN } from '../../services/dataService';

import ConfirmModal from '../ui/ConfirmModal';
import LanguageToggle from './LanguageToggle';
import CategorySection from './CategorySection';
import { T, CATEGORY_CONFIG } from './translations';

type Category = 'subjects' | 'types' | 'statuses' | 'priorities';

const DEFAULT_EN: UserSettings = {
    subjects: ['Physics', 'Chemistry', 'Math', 'Biology', 'ICT', 'English', 'Bangla'],
    types: ['Project', 'Assignment', 'Quiz', 'Exam', 'Lab', 'Presentation'],
    statuses: ['Not Started', 'In Progress', 'Completed'],
    priorities: ['Low', 'Medium', 'High', 'Urgent'],
    language: 'en'
};

const Settings: React.FC = () => {
    const { currentUser } = useAuth();
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingItem, setEditingItem] = useState<{ category: Category; index: number; value: string } | null>(null);
    const [newItem, setNewItem] = useState<{ category: Category; value: string } | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const loadSettings = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const data = await getSettings(currentUser.uid);
            setSettings(data);
        } catch (error) {
            console.error('Error loading settings:', error);
            setSettings(DEFAULT_SETTINGS_BN);
        }
        setLoading(false);
    };

    useEffect(() => { loadSettings(); }, [currentUser]);

    const handleSave = async (s: UserSettings) => {
        if (!currentUser) return;
        setSaving(true);
        try {
            await saveSettings(currentUser.uid, s);
            setSettings(s);
        } catch (error) {
            console.error('Error saving settings:', error);
        }
        setSaving(false);
    };

    const handleLanguageChange = (l: 'en' | 'bn') => settings && handleSave({ ...settings, language: l });
    const handleAdd = (cat: Category) => { if (!newItem?.value.trim() || !settings || settings[cat].includes(newItem.value.trim())) return; handleSave({ ...settings, [cat]: [...settings[cat], newItem.value.trim()] }); setNewItem(null); };
    const handleDelete = (cat: Category, idx: number) => settings && handleSave({ ...settings, [cat]: settings[cat].filter((_, i) => i !== idx) });
    const handleRename = () => { if (!editingItem?.value.trim() || !settings) return; const u = { ...settings }; u[editingItem.category][editingItem.index] = editingItem.value.trim(); handleSave(u); setEditingItem(null); };
    const handleReset = () => { if (!currentUser || !settings) return; handleSave(settings.language === 'en' ? DEFAULT_EN : DEFAULT_SETTINGS_BN); setShowResetConfirm(false); };

    if (loading) {
        return <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div></div>;
    }

    if (!settings) return <div className="text-slate-500">Error loading settings</div>;

    const lang = settings.language || 'bn';
    const t = T[lang];
    const config = CATEGORY_CONFIG(lang);

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{t.settingsTitle}</h1>
                    <p className="text-slate-400 text-xs md:text-sm">{t.customizeDesc}</p>
                </div>
                <div className="flex items-center gap-2">
                    {saving && <Loader2 size={16} className="animate-spin text-indigo-400" />}
                    <button onClick={() => setShowResetConfirm(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-indigo-500/50 text-sm transition-all">
                        <RotateCcw size={14} /> {t.resetToDefault}
                    </button>
                </div>
            </div>
            <LanguageToggle lang={lang} label={t.language} englishLabel={t.english} banglaLabel={t.bangla} onLanguageChange={handleLanguageChange} />
            {(['subjects', 'types', 'statuses', 'priorities'] as Category[]).map(cat => (
                <CategorySection key={cat} category={cat} items={settings[cat]} config={config[cat]} t={t} editingItem={editingItem} newItem={newItem} onStartEdit={(c, i, v) => setEditingItem({ category: c, index: i, value: v })} onSaveEdit={handleRename} onCancelEdit={() => setEditingItem(null)} onEditChange={v => editingItem && setEditingItem({ ...editingItem, value: v })} onStartNew={c => setNewItem({ category: c, value: '' })} onSaveNew={handleAdd} onCancelNew={() => setNewItem(null)} onNewChange={v => newItem && setNewItem({ ...newItem, value: v })} onDelete={handleDelete} />
            ))}
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-4 text-sm text-slate-300"><strong className="text-indigo-400">💡 {t.tip}</strong> {t.tipText}</div>
            <ConfirmModal isOpen={showResetConfirm} title={t.resetConfirmTitle} message={t.resetConfirmMsg} confirmText={t.reset} cancelText={t.cancel} confirmColor="indigo" onConfirm={handleReset} onCancel={() => setShowResetConfirm(false)} />
        </div>
    );
};

export default Settings;
