/**
 * Utility to detect if the app is running as an installed PWA
 */
export const isPWA = (): boolean => {
    // Check for standalone display mode (works on Android Chrome, Edge, etc.)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    // Check for iOS-specific standalone mode (Safari)
    const isIOSStandalone = (navigator as any).standalone === true;

    return isStandalone || isIOSStandalone;
};
