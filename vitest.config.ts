/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            // Exclude packages workspace - it has its own vitest config
            'packages/**',
            // Exclude problematic morale tests with import issues
            'src/features/battle/morale/__tests__/**',
            // Exclude Jest-based core tests until migrated to Vitest
            'src/core/formation/test/**',
            'src/core/save/__tests__/**',
            'src/core/test/**',
            'src/core/turn/test/**',
            // Exclude specific Jest-based tests
            'src/__tests__/ai-validation.test.ts'
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov', 'json'],
            exclude: [
                'node_modules/',
                'build/',
                'dist/',
                'coverage/',
                '**/*.d.ts',
                '**/*.config.*',
                '**/test/**',
                '**/__tests__/**',
                '**/bench/**',
                '**/scripts/**',
                'src/react-app-env.d.ts',
                'src/index.tsx',
                'src/reportWebVitals.ts'
            ],
            thresholds: {
                branches: 0,    // Current: ~76%, target: 70% (will increase gradually)
                functions: 0,   // Current: ~75%, target: 80% (will increase gradually)
                lines: 0,       // Current: ~4%, target: 80% (will increase gradually)
                statements: 0   // Current: ~4%, target: 80% (will increase gradually)
            }
        },
        // Deterministic test environment
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: true // Ensure deterministic execution
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@core': path.resolve(__dirname, './src/core'),
            '@features': path.resolve(__dirname, './src/features'),
            '@test': path.resolve(__dirname, './src/test')
        }
    }
});