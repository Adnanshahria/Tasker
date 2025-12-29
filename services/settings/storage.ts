import { UserSettings, SETTINGS_KEY } from './types';
import { DEFAULT_SETTINGS_BN } from './defaults';

// Get settings from localStorage
export const getSettings = (userId: string): UserSettings => {
    const stored = localStorage.getItem(SETTINGS_KEY + userId);
    if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS_BN, ...parsed };
    }
    return DEFAULT_SETTINGS_BN;
};

// Save settings to localStorage
export const saveSettings = (userId: string, settings: UserSettings): void => {
    localStorage.setItem(SETTINGS_KEY + userId, JSON.stringify(settings));
};
