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
    }

    render() {
        if (this.state.hasError) {
            const isChunkError = this.state.error?.message.includes('Loading chunk') ||
                this.state.error?.message.includes('Failed to fetch') ||
                this.state.error?.name === 'ChunkLoadError';

            // Loop protection: Check if we just reloaded to fix this
            const lastReload = sessionStorage.getItem('last_chunk_reload');
            const recentlyReloaded = lastReload && (Date.now() - parseInt(lastReload) < 5000);

            // If it's a chunk error and we haven't just reloaded, try to fix it
            if (isChunkError && !recentlyReloaded) {
                console.log('Chunk load error detected. Performing hard reset...');
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
                }
                if ('caches' in window) {
                    caches.keys().then(names => names.forEach(name => caches.delete(name)));
                }
                sessionStorage.setItem('last_chunk_reload', Date.now().toString());
                window.location.reload();
                return null; // Render nothing while reloading
            }

            // Otherwise, show the Fallback UI (with inline styles for safety)
            return (
                <div style={{
                    height: '100vh',
                    width: '100vw',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#0f172a', // Slate-900
                    color: '#f8fafc', // Slate-50
                    padding: '20px',
                    textAlign: 'center',
                    fontFamily: 'sans-serif'
                }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', color: '#818cf8' }}>
                        Something went wrong
                    </h2>
                    <p style={{ color: '#94a3b8', marginBottom: '20px', maxWidth: '400px' }}>
                        {isChunkError ? "We couldn't load the latest version. Please check your connection." : "An unexpected error occurred."}
                    </p>
                    <div style={{ background: '#1e293b', padding: '10px', borderRadius: '5px', marginBottom: '20px', fontFamily: 'monospace', fontSize: '12px', color: '#ef4444' }}>
                        {this.state.error?.message || 'Unknown error'}
                    </div>
                    <button
                        onClick={() => {
                            sessionStorage.removeItem('last_chunk_reload');
                            window.location.reload();
                        }}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#4f46e5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
                        }}
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
