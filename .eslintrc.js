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

        // Allow unused variables that start with underscore
        'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],

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
        '*.min.js'
    ]
};