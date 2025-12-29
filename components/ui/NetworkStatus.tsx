// Network Status Indicator Component
// Shows sync status: online/synced, syncing, pending, offline

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff, Check } from 'lucide-react';
import {
    isOnline,
    addNetworkListener,
    getSyncState,
    addSyncStateListener,
    SyncState,
    processPendingOperations
} from '../../services/syncService';
import { getPendingOperations } from '../../services/localStorageService';

const NetworkStatus: React.FC = () => {
    const [online, setOnline] = useState(isOnline());
    const [syncState, setSyncState] = useState<SyncState>(getSyncState());
    const [pendingCount, setPendingCount] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

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
        }, 5000);

        return () => {
            removeNetworkListener();
            removeSyncListener();
            clearInterval(interval);
        };
    }, []);

    const handleRetrySync = () => {
        if (online) {
            processPendingOperations();
        }
    };

    const getStatusConfig = () => {
        if (!online) {
            return {
                icon: WifiOff,
                color: 'text-rose-400',
                bgColor: 'bg-rose-500/20',
                borderColor: 'border-rose-500/30',
                label: 'অফলাইন',
                labelEn: 'Offline',
            };
        }

        switch (syncState) {
            case 'syncing':
                return {
                    icon: RefreshCw,
                    color: 'text-amber-400',
                    bgColor: 'bg-amber-500/20',
                    borderColor: 'border-amber-500/30',
                    label: 'সিঙ্ক হচ্ছে...',
                    labelEn: 'Syncing...',
                    animate: true,
                };
            case 'pending':
                return {
                    icon: Cloud,
                    color: 'text-amber-400',
                    bgColor: 'bg-amber-500/20',
                    borderColor: 'border-amber-500/30',
                    label: `${pendingCount} পেন্ডিং`,
                    labelEn: `${pendingCount} pending`,
                };
            case 'error':
                return {
                    icon: CloudOff,
                    color: 'text-rose-400',
                    bgColor: 'bg-rose-500/20',
                    borderColor: 'border-rose-500/30',
                    label: 'সিঙ্ক এরর',
                    labelEn: 'Sync Error',
                };
            case 'synced':
            default:
                return {
                    icon: Check,
                    color: 'text-emerald-400',
                    bgColor: 'bg-emerald-500/20',
                    borderColor: 'border-emerald-500/30',
                    label: 'সিঙ্কড',
                    labelEn: 'Synced',
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
                            {online ? '🟢 অনলাইন' : '🔴 অফলাইন'}
                        </span>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="text-slate-400 hover:text-white text-xs"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="space-y-2 text-xs text-slate-300">
                        <div className="flex justify-between">
                            <span>স্ট্যাটাস:</span>
                            <span className={config.color}>{config.label}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>পেন্ডিং:</span>
                            <span>{pendingCount} আইটেম</span>
                        </div>
                    </div>

                    {pendingCount > 0 && online && (
                        <button
                            onClick={handleRetrySync}
                            className="mt-3 w-full py-2 rounded-lg bg-indigo-500/30 border border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/40 text-xs font-medium flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={12} />
                            পুনরায় সিঙ্ক করুন
                        </button>
                    )}

                    {!online && (
                        <p className="mt-3 text-xs text-slate-400 text-center">
                            অনলাইনে আসলে অটো সিঙ্ক হবে
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default NetworkStatus;
