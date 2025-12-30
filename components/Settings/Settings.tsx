import React, { useState, useEffect } from 'react';
import { RotateCcw, Loader2, LogOut, Send, MessageCircle, Mail, MessageSquare, Bug, RefreshCw, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getSettings, saveSettings, UserSettings, DEFAULT_SETTINGS, DEFAULT_SETTINGS_BN } from '../../services/dataService';

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

import { useTimerStore } from '../../store/timerStore';


// Contact Developer Section
const ContactDeveloperSection: React.FC<{ developerName: string; contactDesc: string }> = ({ developerName, contactDesc }) => {
    const contacts = [
        {
            name: 'Telegram',
            icon: Send,
            url: 'https://t.me/adnanshahria',
            color: 'text-blue-400 hover:text-blue-300',
            bg: 'bg-blue-500/10 hover:bg-blue-500/20',
        },
        {
            name: 'WhatsApp',
            icon: MessageCircle,
            url: 'https://wa.me/8801705818105',
            color: 'text-green-400 hover:text-green-300',
            bg: 'bg-green-500/10 hover:bg-green-500/20',
        },
        {
            name: 'Email',
            icon: Mail,
            url: 'mailto:adnanshahria2019@gmail.com',
            color: 'text-purple-400 hover:text-purple-300',
            bg: 'bg-purple-500/10 hover:bg-purple-500/20',
        },
    ];

    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4 md:p-6 space-y-4">
            <div>
                <h2 className="text-lg font-semibold text-white">{developerName}</h2>
                <p className="text-sm text-slate-400 mt-1">{contactDesc}</p>
            </div>
            <div className="flex flex-wrap gap-3">
                {contacts.map((contact) => (
                    <a
                        key={contact.name}
                        href={contact.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg ${contact.bg} ${contact.color} transition-all hover:scale-105 active:scale-95`}
                        title={contact.name}
                    >
                        <contact.icon size={20} />
                        <span className="font-medium text-sm">{contact.name}</span>
                    </a>
                ))}
            </div>
        </div>
    );
};

// Feedback & Bug Report Section
const FeedbackSection: React.FC<{ title: string; description: string }> = ({ title, description }) => {
    const contacts = [
        {
            name: 'Telegram',
            icon: Send,
            url: 'https://t.me/adnanshahria',
            color: 'text-blue-400 hover:text-blue-300',
            bg: 'bg-blue-500/10 hover:bg-blue-500/20',
        },
        {
            name: 'WhatsApp',
            icon: MessageCircle,
            url: 'https://wa.me/8801705818105',
            color: 'text-green-400 hover:text-green-300',
            bg: 'bg-green-500/10 hover:bg-green-500/20',
        },
        {
            name: 'Email',
            icon: Mail,
            url: 'mailto:adnanshahria2019@gmail.com',
            color: 'text-purple-400 hover:text-purple-300',
            bg: 'bg-purple-500/10 hover:bg-purple-500/20',
        },
    ];

    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4 md:p-6 space-y-4">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                    <MessageSquare size={20} className="text-amber-400" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-white">{title}</h2>
                    <p className="text-sm text-slate-400">{description}</p>
                </div>
            </div>
            <div className="flex flex-wrap gap-3">
                {contacts.map((contact) => (
                    <a
                        key={contact.name}
                        href={contact.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg ${contact.bg} ${contact.color} transition-all hover:scale-105 active:scale-95`}
                        title={contact.name}
                    >
                        <contact.icon size={20} />
                        <span className="font-medium text-sm">{contact.name}</span>
                    </a>
                ))}
            </div>
        </div>
    );
};

// Check for Updates Section
const CheckForUpdatesSection: React.FC<{ lang: 'en' | 'bn' }> = ({ lang }) => {
    const [checking, setChecking] = useState(false);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [lastChecked, setLastChecked] = useState<string | null>(null);

    const checkForUpdates = async () => {
        setChecking(true);
        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    await registration.update();
                    if (registration.waiting) {
                        setUpdateAvailable(true);
                    } else {
                        setUpdateAvailable(false);
                    }
                }
            }
            setLastChecked(new Date().toLocaleTimeString());
        } catch (error) {
            console.error('Error checking for updates:', error);
        } finally {
            setChecking(false);
        }
    };

    const applyUpdate = () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then((registration) => {
                if (registration?.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                }
            });
        }
    };

    const forceRefresh = () => {
        window.location.reload();
    };

    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4 md:p-6 space-y-4">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                    <Download size={20} className="text-cyan-400" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-white">
                        {lang === 'en' ? 'App Updates' : 'অ্যাপ আপডেট'}
                    </h2>
                    <p className="text-sm text-slate-400">
                        {lang === 'en' ? 'Check for the latest version' : 'সর্বশেষ ভার্সন চেক করুন'}
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                <button
                    onClick={checkForUpdates}
                    disabled={checking}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RefreshCw size={18} className={checking ? 'animate-spin' : ''} />
                    <span className="font-medium text-sm">
                        {checking
                            ? (lang === 'en' ? 'Checking...' : 'চেক করা হচ্ছে...')
                            : (lang === 'en' ? 'Check for Updates' : 'আপডেট চেক করুন')}
                    </span>
                </button>

                <button
                    onClick={forceRefresh}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all hover:scale-105 active:scale-95"
                >
                    <RotateCcw size={18} />
                    <span className="font-medium text-sm">
                        {lang === 'en' ? 'Refresh App' : 'অ্যাপ রিফ্রেশ'}
                    </span>
                </button>
            </div>

            {updateAvailable && (
                <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <span className="text-sm text-green-400">
                        {lang === 'en' ? '✨ New update available!' : '✨ নতুন আপডেট উপলব্ধ!'}
                    </span>
                    <button
                        onClick={applyUpdate}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        {lang === 'en' ? 'Update Now' : 'এখনই আপডেট'}
                    </button>
                </div>
            )}

            {lastChecked && !updateAvailable && (
                <p className="text-xs text-slate-500">
                    {lang === 'en'
                        ? `Last checked: ${lastChecked} - You're up to date!`
                        : `শেষ চেক: ${lastChecked} - আপনি আপডেটেড আছেন!`}
                </p>
            )}
        </div>
    );
};

const BorderColorSetting: React.FC = () => {
    const borderColor = useTimerStore((state) => state.borderColor);
    const setBorderColor = useTimerStore((state) => state.setBorderColor);

    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4 md:p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Border Glow Color</h2>
            <div className="flex flex-wrap gap-3">
                {([
                    { id: 'none', color: 'bg-slate-700 ring-slate-500', label: 'None' },
                    { id: 'white', color: 'bg-white ring-white', label: 'White' },
                    { id: 'blue', color: 'bg-blue-500 ring-blue-500', label: 'Blue' },
                    { id: 'red', color: 'bg-red-500 ring-red-500', label: 'Red' },
                    { id: 'yellow', color: 'bg-yellow-500 ring-yellow-500', label: 'Yellow' },
                    { id: 'cyan', color: 'bg-cyan-500 ring-cyan-500', label: 'Cyan' },
                    { id: 'purple', color: 'bg-purple-500 ring-purple-500', label: 'Purple' },
                    { id: 'green', color: 'bg-green-500 ring-green-500', label: 'Green' },
                    { id: 'orange', color: 'bg-orange-500 ring-orange-500', label: 'Orange' },
                    { id: 'pink', color: 'bg-pink-500 ring-pink-500', label: 'Pink' },
                ] as const).map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setBorderColor(item.id as any)}
                        className={`
                            px-4 py-2 rounded-lg font-medium text-sm transition-all capitalize
                            ${borderColor === item.id
                                ? `${item.id === 'white' ? 'bg-indigo-600 text-white' : item.color.split(' ')[0] + ' text-white'} shadow-lg ring-2 ring-offset-2 ring-offset-slate-900 ${item.color.split(' ')[1]}`
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}
                        `}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

const Settings: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
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
            const data = await getSettings(currentUser.id);
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
            await saveSettings(currentUser.id, s);
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

            {/* Border Color Setting */}
            <BorderColorSetting />

            {(['subjects', 'types', 'statuses', 'priorities'] as Category[]).map(cat => (
                <CategorySection key={cat} category={cat} items={settings[cat]} config={config[cat]} t={t} editingItem={editingItem} newItem={newItem} onStartEdit={(c, i, v) => setEditingItem({ category: c, index: i, value: v })} onSaveEdit={handleRename} onCancelEdit={() => setEditingItem(null)} onEditChange={v => editingItem && setEditingItem({ ...editingItem, value: v })} onStartNew={c => setNewItem({ category: c, value: '' })} onSaveNew={handleAdd} onCancelNew={() => setNewItem(null)} onNewChange={v => newItem && setNewItem({ ...newItem, value: v })} onDelete={handleDelete} />
            ))}
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-4 text-sm text-slate-300"><strong className="text-indigo-400">💡 {t.tip}</strong> {t.tipText}</div>

            {/* Contact Developer Section */}
            <ContactDeveloperSection developerName={t.developerName} contactDesc={t.contactDesc} />

            {/* Feedback & Bug Report Section */}
            <FeedbackSection title={t.feedbackBugReport} description={t.feedbackDesc} />

            {/* Check for Updates Section */}
            <CheckForUpdatesSection lang={lang} />

            {/* Logout Button - Visible on Mobile */}
            <button
                onClick={async () => {
                    try {
                        await logout();
                        navigate('/auth');
                    } catch (error) {
                        console.error('Logout failed:', error);
                    }
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
            >
                <LogOut size={18} />
                <span className="font-medium">{lang === 'en' ? 'Logout' : 'লগআউট'}</span>
            </button>

            <ConfirmModal isOpen={showResetConfirm} title={t.resetConfirmTitle} message={t.resetConfirmMsg} confirmText={t.reset} cancelText={t.cancel} confirmColor="indigo" onConfirm={handleReset} onCancel={() => setShowResetConfirm(false)} />
        </div>
    );
};

export default Settings;
