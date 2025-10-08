/**
 * TODO #14 — Deterministic Encoding/Decoding
 * 
 * Deterministic JSON serialization with compression and integrity checking.
 * Ensures identical output across platforms for replay verification.
 */

import { CombatStateV3 } from './schema_combat';
import { CampaignStateV3 } from './schema_campaign';

export type SaveData = CombatStateV3 | CampaignStateV3;

export interface EncodingOptions {
    compress?: boolean;
    includeChecksum?: boolean;
    pretty?: boolean;
}

export interface DecodingResult<T = SaveData> {
    data: T;
    checksum: string;
    isValid: boolean;
    compressionUsed: boolean;
}

/**
 * Deterministic JSON stringify with sorted keys
 * Ensures identical serialization across platforms
 */
export function deterministicStringify(obj: any, space?: string | number): string {
    return JSON.stringify(obj, (key, value) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            // Sort object keys for deterministic output
            const sorted: any = {};
            Object.keys(value).sort().forEach(k => {
                sorted[k] = value[k];
            });
            return sorted;
        }
        return value;
    }, space);
}

/**
 * Encode save data with optional compression
 */
export async function encodeSave(
    data: SaveData,
    options: EncodingOptions = {}
): Promise<string> {
    const {
        compress = false,
        includeChecksum = true,
        pretty = false
    } = options;

    try {
        // Create a copy and prepare for serialization
        const saveData = { ...data };

        // Clear checksum field before encoding to avoid circular reference
        if ('checksum' in saveData) {
            saveData.checksum = '';
        }

        // Update timestamp
        saveData.saveTimestamp = Date.now();

        // Serialize deterministically
        const jsonString = deterministicStringify(
            saveData,
            pretty ? 2 : undefined
        );

        // Add checksum if requested
        if (includeChecksum) {
            const checksum = await computeChecksum(jsonString);
            const dataWithChecksum = { ...saveData, checksum };
            const finalJson = deterministicStringify(
                dataWithChecksum,
                pretty ? 2 : undefined
            );

            return compress ? await compressString(finalJson) : finalJson;
        }

        return compress ? await compressString(jsonString) : jsonString;

    } catch (error) {
        throw new Error(`Failed to encode save data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Decode save data with validation
 */
export async function decodeSave<T extends SaveData>(
    encoded: string
): Promise<DecodingResult<T>> {
    try {
        let jsonString = encoded;
        let compressionUsed = false;

        // Try to decompress if data appears compressed
        if (isCompressed(encoded)) {
            jsonString = await decompressString(encoded);
            compressionUsed = true;
        }

        // Parse JSON
        const data = JSON.parse(jsonString) as T;

        // Extract checksum
        const storedChecksum = data.checksum || '';

        // Verify checksum if present
        let isValid = true;
        if (storedChecksum) {
            const dataForValidation = { ...data, checksum: '' };
            const computedChecksum = await computeChecksum(
                deterministicStringify(dataForValidation)
            );
            isValid = storedChecksum === computedChecksum;
        }

        return {
            data,
            checksum: storedChecksum,
            isValid,
            compressionUsed
        };

    } catch (error) {
        throw new Error(`Failed to decode save data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Compute SHA-256 checksum for data integrity
 */
export async function computeChecksum(data: string): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        // Browser environment
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
        // Node.js environment
        const crypto = await import('crypto');
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}

/**
 * Fast CRC32 checksum for temporary saves
 */
export function computeCRC32(data: string): string {
    let crc = 0 ^ (-1);

    for (let i = 0; i < data.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ data.charCodeAt(i)) & 0xFF];
    }

    return ((crc ^ (-1)) >>> 0).toString(16);
}

/**
 * Compress string using LZ-based algorithm
 * Falls back to identity if compression unavailable
 */
export async function compressString(data: string): Promise<string> {
    try {
        // Try to use lz-string if available
        if (typeof window !== 'undefined' && (window as any).LZString) {
            const LZString = (window as any).LZString;
            return 'LZ:' + LZString.compress(data);
        }

        // Try dynamic import for Node.js
        try {
            const { compress } = await import('lz-string');
            return 'LZ:' + compress(data);
        } catch {
            // If no compression available, return as-is with marker
            return 'RAW:' + data;
        }
    } catch {
        return 'RAW:' + data;
    }
}

/**
 * Decompress string 
 */
export async function decompressString(data: string): Promise<string> {
    if (data.startsWith('LZ:')) {
        const compressed = data.slice(3);

        if (typeof window !== 'undefined' && (window as any).LZString) {
            const LZString = (window as any).LZString;
            return LZString.decompress(compressed) || data;
        }

        try {
            const { decompress } = await import('lz-string');
            return decompress(compressed) || data;
        } catch {
            throw new Error('Cannot decompress: lz-string not available');
        }
    }

    if (data.startsWith('RAW:')) {
        return data.slice(4);
    }

    // Assume uncompressed
    return data;
}

/**
 * Check if data appears to be compressed
 */
export function isCompressed(data: string): boolean {
    return data.startsWith('LZ:') || data.startsWith('RAW:');
}

/**
 * Create save metadata for registry
 */
export function createSaveMetadata(
    data: SaveData,
    slot: string,
    description?: string
): SaveMetadata {
    return {
        slot,
        timestamp: Date.now(),
        schemaVersion: data.schemaVersion,
        buildCommit: data.buildCommit,
        description: description || generateDescription(data),
        size: JSON.stringify(data).length,
        checksum: data.checksum,
        type: 'campaignId' in data ? 'campaign' : 'combat'
    };
}

/**
 * Generate human-readable description for save
 */
function generateDescription(data: SaveData): string {
    if ('campaignId' in data) {
        const campaign = data as CampaignStateV3;
        return `${campaign.campaignName} - Year ${campaign.worldClock.year}, ${campaign.worldClock.season}`;
    } else {
        const combat = data as CombatStateV3;
        return `${combat.battleType} - Turn ${combat.turnQueue.currentTurn}`;
    }
}

// Save metadata interface
export interface SaveMetadata {
    slot: string;
    timestamp: number;
    schemaVersion: number;
    buildCommit: string;
    description: string;
    size: number;
    checksum: string;
    type: 'campaign' | 'combat';
}

// CRC32 lookup table
const crcTable = new Array(256);
for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
        crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
    crcTable[i] = crc;
}