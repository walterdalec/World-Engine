/**
 * Vitest Test Setup - World Engine
 * Provides deterministic testing environment with frozen RNG and time
 */

import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';
import { setTestRNG, setTestTime } from './utils/deterministic';

// Freeze time for deterministic tests
const FIXED_TIME = new Date('2025-01-01T00:00:00.000Z').getTime();

beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Set deterministic time
    setTestTime(FIXED_TIME);

    // Set deterministic RNG with known seed
    setTestRNG(12345);

    // Mock Math.random to use our deterministic RNG
    vi.spyOn(Math, 'random').mockImplementation(() => {
        // This will be overridden by setTestRNG
        return 0.5;
    });

    // Mock Date.now to return fixed time
    vi.spyOn(Date, 'now').mockReturnValue(FIXED_TIME);

    // Mock performance.now for consistent timing that shows progression
    let performanceTime = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => {
        performanceTime += Math.random() * 5 + 1; // 1-6ms progression for realistic timing
        return performanceTime;
    });

    // Suppress console.log in tests unless explicitly needed
    if (!process.env.DEBUG_TESTS) {
        vi.spyOn(console, 'log').mockImplementation(() => { });
        vi.spyOn(console, 'debug').mockImplementation(() => { });
    }
});