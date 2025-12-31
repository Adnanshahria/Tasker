// Focus Data Refresh Utility
// Separate file to avoid circular imports between focusDataService and useFocusDashboard

// Global refresh counter - increment this to trigger re-renders in all components using useFocusDashboard
let globalRefreshCounter = 0;
const listeners = new Set<() => void>();

export const triggerFocusDataRefresh = () => {
    globalRefreshCounter++;
    console.log('[FocusRefresh] Triggering refresh, counter:', globalRefreshCounter, 'listeners:', listeners.size);
    listeners.forEach(listener => listener());
};

export const subscribeFocusRefresh = (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
};

export const getRefreshCounter = () => globalRefreshCounter;
