// Migration Service - Handles data migration between app versions
// Migrates localStorage data from old 'agrogoti_' keys to new 'ogrogoti_' keys

const MIGRATION_KEY = 'ogrogoti_migration_v1_complete';

/**
 * Migrates localStorage data from old 'agrogoti_' prefix to new 'ogrogoti_' prefix.
 * This ensures users don't lose their data after the app rename.
 * Runs once on app initialization and marks itself as complete.
 */
export const migrateLocalStorageData = (): void => {
    // Skip if migration already completed
    if (localStorage.getItem(MIGRATION_KEY) === 'true') {
        console.log('[Migration] Already completed, skipping...');
        return;
    }

    console.log('[Migration] Starting data migration from agrogoti_ to ogrogoti_...');

    const keysToMigrate: string[] = [];

    // Find all keys with old prefix
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('agrogoti_')) {
            keysToMigrate.push(key);
        }
    }

    if (keysToMigrate.length === 0) {
        console.log('[Migration] No old data found, marking as complete.');
        localStorage.setItem(MIGRATION_KEY, 'true');
        return;
    }

    console.log(`[Migration] Found ${keysToMigrate.length} keys to migrate:`, keysToMigrate);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const oldKey of keysToMigrate) {
        const newKey = oldKey.replace('agrogoti_', 'ogrogoti_');

        // Check if new key already exists (don't overwrite)
        if (localStorage.getItem(newKey) !== null) {
            console.log(`[Migration] Skipping ${oldKey} - new key already exists`);
            skippedCount++;
            continue;
        }

        // Copy data to new key
        const data = localStorage.getItem(oldKey);
        if (data) {
            localStorage.setItem(newKey, data);
            console.log(`[Migration] Migrated: ${oldKey} -> ${newKey}`);
            migratedCount++;
        }
    }

    // Mark migration as complete
    localStorage.setItem(MIGRATION_KEY, 'true');

    console.log(`[Migration] Complete! Migrated: ${migratedCount}, Skipped: ${skippedCount}`);
};

/**
 * Cleans up old 'agrogoti_' keys after successful migration.
 * Call this only after confirming the app works correctly with new keys.
 */
export const cleanupOldKeys = (): void => {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('agrogoti_')) {
            keysToRemove.push(key);
        }
    }

    if (keysToRemove.length === 0) {
        console.log('[Migration] No old keys to clean up.');
        return;
    }

    console.log(`[Migration] Cleaning up ${keysToRemove.length} old keys...`);

    for (const key of keysToRemove) {
        localStorage.removeItem(key);
    }

    console.log('[Migration] Cleanup complete!');
};

/**
 * Resets migration flag to allow re-running migration.
 * Use this for debugging purposes only.
 */
export const resetMigration = (): void => {
    localStorage.removeItem(MIGRATION_KEY);
    console.log('[Migration] Migration flag reset. Migration will run on next app load.');
};
