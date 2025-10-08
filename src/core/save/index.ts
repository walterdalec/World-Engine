/**
 * TODO #14 — Save Persistence Layer
 * 
 * Unified save/load interface with multiple backend implementations.
 * Supports localStorage, OPFS (PWA), and file system (desktop).
 */

import { CombatStateV3 } from './schema_combat';
import { CampaignStateV3 } from './schema_campaign';
import { encodeSave, decodeSave, SaveMetadata, createSaveMetadata } from './encode';
import { migrateSave, needsMigration, MigrationResult } from './migrate';

export type SaveData = CombatStateV3 | CampaignStateV3;

export interface SaveSlot {
    id: string;
    metadata: SaveMetadata;
    data?: SaveData;
}

export interface SaveBackend {
    /** Initialize the backend */
    init(): Promise<void>;

    /** List available save slots */
    list(): Promise<SaveMetadata[]>;

    /** Load save data from a slot */
    load(slotId: string): Promise<SaveData | null>;

    /** Save data to a slot */
    save(slotId: string, data: SaveData, description?: string): Promise<void>;

    /** Delete a save slot */
    delete(slotId: string): Promise<void>;

    /** Check if backend is available */
    isAvailable(): boolean;

    /** Get backend name */
    getName(): string;

    /** Get storage usage info */
    getStorageInfo(): Promise<{ used: number; available: number }>;
}

export interface SaveOptions {
    /** Whether to compress the save data */
    compress?: boolean;

    /** Whether to create a backup before saving */
    backup?: boolean;

    /** Whether to verify integrity after saving */
    verify?: boolean;

    /** Custom description for the save */
    description?: string;
}

export interface LoadOptions {
    /** Whether to auto-migrate old save formats */
    autoMigrate?: boolean;

    /** Whether to verify integrity when loading */
    verify?: boolean;

    /** Whether to create a backup before migration */
    backupBeforeMigration?: boolean;
}

export class SaveManager {
    private backends: Map<string, SaveBackend> = new Map();
    private primaryBackend: string = 'localStorage';
    private saveRegistry: Map<string, SaveMetadata> = new Map();

    constructor() {
        this.initializeBackends();
    }

    /**
     * Initialize all available backends
     */
    private async initializeBackends(): Promise<void> {
        // LocalStorage backend (always available)
        this.backends.set('localStorage', new LocalStorageBackend());

        // OPFS backend (PWA only)
        if (this.isOPFSAvailable()) {
            this.backends.set('opfs', new OPFSBackend());
        }

        // File system backend (desktop only)
        if (this.isFileSystemAvailable()) {
            this.backends.set('filesystem', new FileSystemBackend());
        }

        // Initialize all backends
        const backendEntries = Array.from(this.backends.entries());
        for (const [name, backend] of backendEntries) {
            try {
                await backend.init();
            } catch (error) {
                console.warn(`Failed to initialize ${backend.getName()} backend:`, error);
            }
        }

        // Choose best available backend
        this.selectPrimaryBackend();

        // Load save registry
        await this.loadSaveRegistry();
    }

    /**
     * Select the best available backend
     */
    private selectPrimaryBackend(): void {
        const preferenceOrder = ['opfs', 'filesystem', 'localStorage'];

        for (const backendName of preferenceOrder) {
            const backend = this.backends.get(backendName);
            if (backend?.isAvailable()) {
                this.primaryBackend = backendName;
                break;
            }
        }
    }

    /**
     * Save data to a slot
     */
    async save(
        slotId: string,
        data: SaveData,
        options: SaveOptions = {}
    ): Promise<void> {
        const {
            compress = true,
            backup = true,
            verify = true,
            description
        } = options;

        const backend = this.backends.get(this.primaryBackend);
        if (!backend) {
            throw new Error('No save backend available');
        }

        // Create backup if requested and slot exists
        if (backup) {
            try {
                const existing = await backend.load(slotId);
                if (existing) {
                    const backupSlotId = `${slotId}_backup_${Date.now()}`;
                    await backend.save(backupSlotId, existing, 'Auto-backup before overwrite');
                }
            } catch (error) {
                console.warn('Failed to create backup:', error);
            }
        }

        // Save the data
        await backend.save(slotId, data, description);

        // Verify if requested
        if (verify) {
            const loaded = await backend.load(slotId);
            if (!loaded) {
                throw new Error('Save verification failed: could not load saved data');
            }
        }

        // Update registry
        const metadata = createSaveMetadata(data, slotId, description);
        this.saveRegistry.set(slotId, metadata);
        await this.saveSaveRegistry();
    }

    /**
     * Load data from a slot
     */
    async load(
        slotId: string,
        options: LoadOptions = {}
    ): Promise<SaveData | null> {
        const {
            autoMigrate = true,
            verify = true,
            backupBeforeMigration = true
        } = options;

        const backend = this.backends.get(this.primaryBackend);
        if (!backend) {
            throw new Error('No save backend available');
        }

        const rawData = await backend.load(slotId);
        if (!rawData) {
            return null;
        }

        // Check if migration is needed
        if (needsMigration(rawData as any)) {
            if (!autoMigrate) {
                throw new Error(`Save slot ${slotId} requires migration but auto-migration is disabled`);
            }

            // Create backup before migration
            if (backupBeforeMigration) {
                const backupSlotId = `${slotId}_pre_migration_${Date.now()}`;
                await backend.save(backupSlotId, rawData, 'Pre-migration backup');
            }

            // Perform migration
            const migrationResult = await migrateSave(rawData as any);
            if (!migrationResult.success) {
                throw new Error(`Migration failed: ${migrationResult.errors.join(', ')}`);
            }

            if (migrationResult.warnings.length > 0) {
                console.warn('Migration warnings:', migrationResult.warnings);
            }

            // Save migrated data
            if (migrationResult.data) {
                await backend.save(slotId, migrationResult.data, 'Migrated save');
                return migrationResult.data;
            }
        }

        return rawData;
    }

    /**
     * List all available saves
     */
    async list(): Promise<SaveMetadata[]> {
        const backend = this.backends.get(this.primaryBackend);
        if (!backend) {
            return [];
        }

        return backend.list();
    }

    /**
     * Delete a save slot
     */
    async delete(slotId: string): Promise<void> {
        const backend = this.backends.get(this.primaryBackend);
        if (!backend) {
            throw new Error('No save backend available');
        }

        await backend.delete(slotId);
        this.saveRegistry.delete(slotId);
        await this.saveSaveRegistry();
    }

    /**
     * Get storage usage information
     */
    async getStorageInfo(): Promise<{ used: number; available: number; backend: string }> {
        const backend = this.backends.get(this.primaryBackend);
        if (!backend) {
            return { used: 0, available: 0, backend: 'none' };
        }

        const info = await backend.getStorageInfo();
        return { ...info, backend: backend.getName() };
    }

    /**
     * Export save data as JSON
     */
    async exportSave(slotId: string): Promise<string> {
        const data = await this.load(slotId, { verify: true });
        if (!data) {
            throw new Error(`Save slot ${slotId} not found`);
        }

        return encodeSave(data, { compress: false, pretty: true });
    }

    /**
     * Import save data from JSON
     */
    async importSave(slotId: string, jsonData: string, description?: string): Promise<void> {
        const decoded = await decodeSave(jsonData);
        if (!decoded.isValid) {
            throw new Error('Invalid save data: checksum mismatch');
        }

        await this.save(slotId, decoded.data, { description });
    }

    /**
     * Auto-save functionality
     */
    async autoSave(
        data: SaveData,
        type: 'turn' | 'combat' | 'world' = 'turn'
    ): Promise<void> {
        const slotId = `autosave_${type}`;
        await this.save(slotId, data, {
            description: `Auto-save (${type})`,
            backup: false,
            verify: false
        });
    }

    /**
     * Clean up old auto-saves
     */
    async cleanupAutoSaves(maxCount: number = 5): Promise<void> {
        const saves = await this.list();
        const autoSaves = saves
            .filter(save => save.slot.startsWith('autosave_'))
            .sort((a, b) => b.timestamp - a.timestamp);

        if (autoSaves.length > maxCount) {
            const toDelete = autoSaves.slice(maxCount);
            for (const save of toDelete) {
                await this.delete(save.slot);
            }
        }
    }

    // Backend availability checks
    private isOPFSAvailable(): boolean {
        return typeof window !== 'undefined' &&
            'navigator' in window &&
            'storage' in navigator &&
            'getDirectory' in navigator.storage;
    }

    private isFileSystemAvailable(): boolean {
        return typeof window === 'undefined' ||
            typeof (window as any).require !== 'undefined';
    }

    // Save registry management
    private async loadSaveRegistry(): Promise<void> {
        try {
            const backend = this.backends.get('localStorage');
            if (backend) {
                const registryData = await backend.load('_save_registry');
                if (registryData && 'entries' in registryData) {
                    const entries = (registryData as any).entries;
                    if (Array.isArray(entries)) {
                        for (const entry of entries) {
                            this.saveRegistry.set(entry.slot, entry);
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to load save registry:', error);
        }
    }

    private async saveSaveRegistry(): Promise<void> {
        try {
            const backend = this.backends.get('localStorage');
            if (backend) {
                const registryData = {
                    schemaVersion: 3,
                    buildCommit: process.env.REACT_APP_GIT_COMMIT || 'dev',
                    saveTimestamp: Date.now(),
                    seed: 'registry',
                    rngState: '0',
                    entries: Array.from(this.saveRegistry.values()),
                    checksum: ''
                } as any;

                await backend.save('_save_registry', registryData);
            }
        } catch (error) {
            console.warn('Failed to save registry:', error);
        }
    }
}

// =============================================================================
// Backend Implementations
// =============================================================================

/**
 * LocalStorage backend - always available but limited capacity
 */
class LocalStorageBackend implements SaveBackend {
    private prefix = 'worldengine_save_';

    async init(): Promise<void> {
        // Nothing to initialize
    }

    async list(): Promise<SaveMetadata[]> {
        const saves: SaveMetadata[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(this.prefix)) {
                const slotId = key.slice(this.prefix.length);
                const data = await this.load(slotId);
                if (data) {
                    saves.push(createSaveMetadata(data, slotId));
                }
            }
        }

        return saves.sort((a, b) => b.timestamp - a.timestamp);
    }

    async load(slotId: string): Promise<SaveData | null> {
        const key = this.prefix + slotId;
        const data = localStorage.getItem(key);

        if (!data) {
            return null;
        }

        try {
            const decoded = await decodeSave(data);
            return decoded.data;
        } catch (error) {
            console.error(`Failed to decode save ${slotId}:`, error);
            return null;
        }
    }

    async save(slotId: string, data: SaveData, description?: string): Promise<void> {
        const key = this.prefix + slotId;
        const encoded = await encodeSave(data, { compress: true });

        try {
            localStorage.setItem(key, encoded);
        } catch (error) {
            if (error instanceof Error && error.name === 'QuotaExceededError') {
                throw new Error('LocalStorage quota exceeded. Please delete some saves.');
            }
            throw error;
        }
    }

    async delete(slotId: string): Promise<void> {
        const key = this.prefix + slotId;
        localStorage.removeItem(key);
    }

    isAvailable(): boolean {
        return typeof localStorage !== 'undefined';
    }

    getName(): string {
        return 'LocalStorage';
    }

    async getStorageInfo(): Promise<{ used: number; available: number }> {
        let used = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(this.prefix)) {
                const value = localStorage.getItem(key);
                if (value) {
                    used += new Blob([value]).size;
                }
            }
        }

        // LocalStorage typically has 5-10MB limit
        const available = 5 * 1024 * 1024 - used;

        return { used, available: Math.max(0, available) };
    }
}

/**
 * OPFS backend - PWA with larger storage capacity
 */
class OPFSBackend implements SaveBackend {
    private rootDir: FileSystemDirectoryHandle | null = null;

    async init(): Promise<void> {
        if (!this.isAvailable()) {
            throw new Error('OPFS not available');
        }

        this.rootDir = await navigator.storage.getDirectory();
    }

    async list(): Promise<SaveMetadata[]> {
        if (!this.rootDir) return [];

        const saves: SaveMetadata[] = [];

        try {
            // Use the keys() method instead of entries() for better compatibility
            const dirEntries = (this.rootDir as any).entries?.() || [];
            if (typeof dirEntries[Symbol.asyncIterator] === 'function') {
                for await (const [name, handle] of dirEntries) {
                    if (handle.kind === 'file' && name.endsWith('.save')) {
                        const slotId = name.slice(0, -5); // Remove .save extension
                        const data = await this.load(slotId);
                        if (data) {
                            saves.push(createSaveMetadata(data, slotId));
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Failed to list OPFS saves:', error);
        }

        return saves.sort((a, b) => b.timestamp - a.timestamp);
    }

    async load(slotId: string): Promise<SaveData | null> {
        if (!this.rootDir) return null;

        try {
            const fileHandle = await this.rootDir.getFileHandle(`${slotId}.save`);
            const file = await fileHandle.getFile();
            const text = await file.text();

            const decoded = await decodeSave(text);
            return decoded.data;
        } catch (error) {
            if ((error as any).name !== 'NotFoundError') {
                console.error(`Failed to load OPFS save ${slotId}:`, error);
            }
            return null;
        }
    }

    async save(slotId: string, data: SaveData, description?: string): Promise<void> {
        if (!this.rootDir) {
            throw new Error('OPFS not initialized');
        }

        const encoded = await encodeSave(data, { compress: true });
        const fileHandle = await this.rootDir.getFileHandle(`${slotId}.save`, { create: true });
        const writableFactory = (fileHandle as any).createWritable as (() => Promise<any>) | undefined;
        if (!writableFactory) {
            throw new Error('createWritable is not supported in this environment');
        }
        const writable = await writableFactory.call(fileHandle);

        try {
            await writable.write(encoded);
        } finally {
            await writable.close();
        }
    }

    async delete(slotId: string): Promise<void> {
        if (!this.rootDir) return;

        try {
            await this.rootDir.removeEntry(`${slotId}.save`);
        } catch (error) {
            if ((error as any).name !== 'NotFoundError') {
                console.error(`Failed to delete OPFS save ${slotId}:`, error);
            }
        }
    }

    isAvailable(): boolean {
        return typeof navigator !== 'undefined' &&
            'storage' in navigator &&
            'getDirectory' in navigator.storage;
    }

    getName(): string {
        return 'OPFS';
    }

    async getStorageInfo(): Promise<{ used: number; available: number }> {
        if (!this.rootDir) {
            return { used: 0, available: 0 };
        }

        let used = 0;

        try {
            // Use the same compatibility approach as in list()
            const dirEntries = (this.rootDir as any).entries?.() || [];
            if (typeof dirEntries[Symbol.asyncIterator] === 'function') {
                for await (const [name, handle] of dirEntries) {
                    if (handle.kind === 'file' && name.endsWith('.save')) {
                        const fileHandle = handle as FileSystemFileHandle;
                        const file = await fileHandle.getFile();
                        used += file.size;
                    }
                }
            }
        } catch (error) {
            console.error('Failed to calculate OPFS usage:', error);
        }

        // OPFS typically has much larger limits
        const estimate = await navigator.storage.estimate();
        const available = (estimate.quota || 1024 * 1024 * 1024) - used;

        return { used, available: Math.max(0, available) };
    }
}

/**
 * File system backend - desktop apps with unlimited storage
 */
class FileSystemBackend implements SaveBackend {
    private savesDir = './saves';

    async init(): Promise<void> {
        if (!this.isAvailable()) {
            throw new Error('File system not available');
        }

        // Create saves directory if it doesn't exist
        const fs = await import('fs/promises');
        try {
            await fs.mkdir(this.savesDir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }
    }

    async list(): Promise<SaveMetadata[]> {
        const saves: SaveMetadata[] = [];

        try {
            const fs = await import('fs/promises');
            const files = await fs.readdir(this.savesDir);

            for (const file of files) {
                if (file.endsWith('.save')) {
                    const slotId = file.slice(0, -5);
                    const data = await this.load(slotId);
                    if (data) {
                        saves.push(createSaveMetadata(data, slotId));
                    }
                }
            }
        } catch (error) {
            console.error('Failed to list file system saves:', error);
        }

        return saves.sort((a, b) => b.timestamp - a.timestamp);
    }

    async load(slotId: string): Promise<SaveData | null> {
        try {
            const fs = await import('fs/promises');
            const path = await import('path');

            const filePath = path.join(this.savesDir, `${slotId}.save`);
            const text = await fs.readFile(filePath, 'utf-8');

            const decoded = await decodeSave(text);
            return decoded.data;
        } catch (error) {
            if ((error as any).code !== 'ENOENT') {
                console.error(`Failed to load file system save ${slotId}:`, error);
            }
            return null;
        }
    }

    async save(slotId: string, data: SaveData, description?: string): Promise<void> {
        const fs = await import('fs/promises');
        const path = await import('path');

        const encoded = await encodeSave(data, { compress: true });
        const filePath = path.join(this.savesDir, `${slotId}.save`);

        await fs.writeFile(filePath, encoded, 'utf-8');
    }

    async delete(slotId: string): Promise<void> {
        try {
            const fs = await import('fs/promises');
            const path = await import('path');

            const filePath = path.join(this.savesDir, `${slotId}.save`);
            await fs.unlink(filePath);
        } catch (error) {
            if ((error as any).code !== 'ENOENT') {
                console.error(`Failed to delete file system save ${slotId}:`, error);
            }
        }
    }

    isAvailable(): boolean {
        return typeof window === 'undefined' || typeof (window as any).require !== 'undefined';
    }

    getName(): string {
        return 'FileSystem';
    }

    async getStorageInfo(): Promise<{ used: number; available: number }> {
        try {
            const fs = await import('fs/promises');
            const path = await import('path');

            let used = 0;
            const files = await fs.readdir(this.savesDir);

            for (const file of files) {
                if (file.endsWith('.save')) {
                    const filePath = path.join(this.savesDir, file);
                    const stats = await fs.stat(filePath);
                    used += stats.size;
                }
            }

            // For file system, available is effectively unlimited
            return { used, available: Number.MAX_SAFE_INTEGER };

        } catch (error) {
            return { used: 0, available: 0 };
        }
    }
}

// Export singleton instance
export const saveManager = new SaveManager();