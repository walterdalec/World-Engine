module.exports = {
    extends: ['react-app', 'react-app/jest'],
    env: {
        browser: true,
        es2022: true,
        node: true,
        jest: true
    },
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true
        }
    },
    rules: {
        // Allow console statements in development
        'no-console': 'off',

        // Allow unused variables that start with underscore, but make others warnings for now
        'no-unused-vars': ['warn', {
            'argsIgnorePattern': '^_',
            'varsIgnorePattern': '^_',
            'ignoreRestSiblings': true
        }],
        '@typescript-eslint/no-unused-vars': ['warn', {
            'argsIgnorePattern': '^_',
            'varsIgnorePattern': '^_',
            'ignoreRestSiblings': true
        }],

        // More lenient rules for our codebase
        'no-restricted-globals': 'off'
    },
    overrides: [
        {
            // For JavaScript files in scripts and public, allow Node.js patterns
            files: ['scripts/**/*.js', 'public/**/*.js'],
            env: {
                node: true,
                browser: false
            },
            rules: {
                'no-undef': 'off' // Allow Node.js globals
            }
        },
        {
            // For test files, allow additional patterns
            files: ['**/*.test.{ts,tsx,js,jsx}', '**/*.spec.{ts,tsx,js,jsx}'],
            env: {
                jest: true
            },
            rules: {
                'no-undef': 'off'
            }
        }
    ],
    ignorePatterns: [
        'build/',
        'dist/',
        'node_modules/',
        'coverage/',
        '*.min.js',
        'ai-backup-moved.ts',
        'scripts/**/*.js',
        'public/**/*.js',
        // Jest-based test files that are excluded from Vitest
        'src/core/test/**',
        'src/core/turn/test/**',
        'src/core/save/__tests__/**',
        'src/core/formation/test/**',
        'src/__tests__/ai-validation.test.ts'
    ]
};