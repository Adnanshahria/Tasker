import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PWAUpdate: React.FC = () => {
    const [needRefresh, setNeedRefresh] = useState(false);
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            // Handle controller change (when new SW takes over)
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
            });

            // Register SW and listen for updates
            navigator.serviceWorker.register('/sw.js').then((reg) => {
                setRegistration(reg);

                // Check for updates periodically
                setInterval(() => {
                    reg.update();
                }, 60 * 60 * 1000); // Check every hour

                // If there's a waiting worker, we need update
                if (reg.waiting) {
                    setNeedRefresh(true);
                }

                // Listen for new workers
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                setNeedRefresh(true);
                            }
                        });
                    }
                });
            });
        }
    }, []);

    const updateServiceWorker = () => {
        if (registration && registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
    };

    return (
        <AnimatePresence>
            {needRefresh && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-6 right-6 z-50 flex flex-col items-center"
                >
                    <div className="bg-slate-800 border border-indigo-500/50 shadow-2xl rounded-xl p-4 flex flex-col gap-3 max-w-xs backdrop-blur-md">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                <RefreshCw size={20} className="animate-spin-slow" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">Update Available</h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    A new version of Ogrogoti is available. Update now for the latest features.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2 w-full">
                            <button
                                onClick={() => setNeedRefresh(false)}
                                className="flex-1 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                            >
                                Later
                            </button>
                            <button
                                onClick={updateServiceWorker}
                                className="flex-1 px-3 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                            >
                                Update Now
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PWAUpdate;
