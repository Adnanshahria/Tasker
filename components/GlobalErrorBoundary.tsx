import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = { hasError: false, error: null };
    public props: Props;

    constructor(props: Props) {
        super(props);
        this.props = props;
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Global Error Boundary caught:', error, errorInfo);

        // Check for chunk loading errors
        if (
            error.message.includes('Failed to fetch dynamically imported module') ||
            error.message.includes('Loading chunk') ||
            error.name === 'ChunkLoadError'
        ) {
            console.log('Chunk load error detected. Performing hard reset...');

            // Unregister Service Workers
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    for (const registration of registrations) {
                        registration.unregister();
                    }
                });
            }

            // Clear Cache Storage
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => caches.delete(name));
                });
            }

            // Force reload from server
            window.location.reload();
        }
    }

    render() {
        if (this.state.hasError) {
            // If it's a chunk error, we likely reloaded already. 
            // But if not, show a fallback UI.
            return (
                <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white p-4 text-center">
                    <h2 className="text-xl font-bold mb-2 text-indigo-400">Something went wrong</h2>
                    <p className="text-slate-400 mb-6 max-w-md">
                        Usually this happens when a new update is deployed.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20"
                    >
                        Reload App
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
