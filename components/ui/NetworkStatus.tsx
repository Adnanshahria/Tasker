// Network Status Indicator Component
// Shows sync status: online/synced, syncing, pending, offline

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff, Check, X } from 'lucide-react';
import {
    isOnline,
    addNetworkListener,
    getSyncState,
    addSyncStateListener,
    SyncState,
    processPendingOperations
} from '../../services/syncService';
import { getPendingOperations, getLocalSettings } from '../../services/localStorageService';
import { useAuth } from '../../contexts/AuthContext';

// Translations
const T = {
    en: {
        offline: 'Offline',
        online: 'Online',
        syncing: 'Syncing...',
        pending: 'pending',
        syncError: 'Sync Error',
        synced: 'Synced',
        status: 'Status:',
        pendingLabel: 'Pending:',
        items: 'items',
        retrySync: 'Retry Sync',
        autoSyncOnline: 'Will auto-sync when online'
    },
    bn: {
        offline: 'অফলাইন',
        online: 'অনলাইন',
        syncing: 'সিঙ্ক হচ্ছে...',
        pending: 'পেন্ডিং',
        syncError: 'সিঙ্ক এরর',
        synced: 'সিঙ্কড',
        status: 'স্ট্যাটাস:',
        pendingLabel: 'পেন্ডিং:',
        items: 'আইটেম',
        retrySync: 'পুনরায় সিঙ্ক করুন',
        autoSyncOnline: 'অনলাইনে আসলে অটো সিঙ্ক হবে'
    }
};

const NetworkStatus: React.FC = () => {
    const { currentUser } = useAuth();
    const [online, setOnline] = useState(isOnline());
    const [syncState, setSyncState] = useState<SyncState>(getSyncState());
    const [pendingCount, setPendingCount] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const [lang, setLang] = useState<'en' | 'bn'>('en');

    useEffect(() => {
        // Get language from settings
        if (currentUser) {
            const settings = getLocalSettings(currentUser.id);
            if (settings?.language) {
                setLang(settings.language);
            }
        }
    }, [currentUser]);

    useEffect(() => {
        // Listen for network changes
        const removeNetworkListener = addNetworkListener((isOnline) => {
            setOnline(isOnline);
        });

        // Listen for sync state changes
        const removeSyncListener = addSyncStateListener((state) => {
            setSyncState(state);
            setPendingCount(getPendingOperations().length);
        });

        // Update pending count periodically
        const interval = setInterval(() => {
            setPendingCount(getPendingOperations().length);
            // Also refresh language
            if (currentUser) {
                const settings = getLocalSettings(currentUser.id);
                if (settings?.language) {
                    setLang(settings.language);
                }
            }
        }, 5000);

        return () => {
            removeNetworkListener();
            removeSyncListener();
            clearInterval(interval);
        };
    }, [currentUser]);

    const handleRetrySync = () => {
        if (online) {
            processPendingOperations();
        }
    };

    const t = T[lang];

    const getStatusConfig = () => {
        if (!online) {
            return {
                icon: WifiOff,
                color: 'text-rose-400',
                bgColor: 'bg-rose-500/20',
                borderColor: 'border-rose-500/30',
                label: t.offline,
            };
        }

        switch (syncState) {
            case 'syncing':
                return {
                    icon: RefreshCw,
                    color: 'text-amber-400',
                    bgColor: 'bg-amber-500/20',
                    borderColor: 'border-amber-500/30',
                    label: t.syncing,
                    animate: true,
                };
            case 'pending':
                return {
                    icon: Cloud,
                    color: 'text-amber-400',
                    bgColor: 'bg-amber-500/20',
                    borderColor: 'border-amber-500/30',
                    label: `${pendingCount} ${t.pending}`,
                };
            case 'error':
                return {
                    icon: CloudOff,
                    color: 'text-rose-400',
                    bgColor: 'bg-rose-500/20',
                    borderColor: 'border-rose-500/30',
                    label: t.syncError,
                };
            case 'synced':
            default:
                return {
                    icon: Check,
                    color: 'text-emerald-400',
                    bgColor: 'bg-emerald-500/20',
                    borderColor: 'border-emerald-500/30',
                    label: t.synced,
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    // Don't show if synced and online (clean state)
    if (online && syncState === 'synced' && pendingCount === 0 && !isExpanded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className="fixed bottom-20 md:bottom-4 right-4 z-50 p-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-all shadow-lg"
                title="Sync Status"
            >
                <Wifi size={16} />
            </button>
        );
    }

    return (
        <div className="fixed bottom-20 md:bottom-4 right-4 z-50">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full ${config.bgColor} border ${config.borderColor} ${config.color} hover:opacity-90 transition-all shadow-lg backdrop-blur-sm`}
            >
                <Icon
                    size={16}
                    className={config.animate ? 'animate-spin' : ''}
                />
                <span className="text-xs font-medium hidden sm:inline">
                    {config.label}
                </span>
            </button>

            {/* Expanded Panel */}
            {isExpanded && (
                <div className={`absolute bottom-full right-0 mb-2 p-4 rounded-xl ${config.bgColor} border ${config.borderColor} backdrop-blur-md shadow-xl min-w-[200px]`}>
                    <div className="flex items-center justify-between mb-3">
                        <span className={`text-sm font-semibold ${config.color}`}>
                            {online ? `🟢 ${t.online}` : `🔴 ${t.offline}`}
                        </span>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="text-slate-400 hover:text-white"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <div className="space-y-2 text-xs text-slate-300">
                        <div className="flex justify-between">
                            <span>{t.status}</span>
                            <span className={config.color}>{config.label}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>{t.pendingLabel}</span>
                            <span>{pendingCount} {t.items}</span>
                        </div>
                    </div>

                    {pendingCount > 0 && online && (
                        <button
                            onClick={handleRetrySync}
                            className="mt-3 w-full py-2 rounded-lg bg-indigo-500/30 border border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/40 text-xs font-medium flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={12} />
                            {t.retrySync}
                        </button>
                    )}

                    {!online && (
                        <p className="mt-3 text-xs text-slate-400 text-center">
                            {t.autoSyncOnline}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default NetworkStatus;
