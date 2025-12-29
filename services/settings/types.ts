// Settings types
export interface UserSettings {
    subjects: string[];
    types: string[];
    statuses: string[];
    priorities: string[];
    language: 'en' | 'bn';
}

export const SETTINGS_KEY = 'tasker_settings_';
