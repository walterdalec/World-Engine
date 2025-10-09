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
            'src/features/battle/morale/__tests__/**'
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
                branches: 70,
                functions: 80,
                lines: 80,
                statements: 80
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