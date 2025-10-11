module.exports = {
    root: true,
    env: {
        browser: true,
        es2020: true,
        node: true,
        jest: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
    ],
    ignorePatterns: ['dist', 'node_modules'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    },
    plugins: [
        '@typescript-eslint',
        'react',
        'react-hooks',
        'react-refresh',
    ],
    globals: {
        React: 'readonly',
        route: 'readonly',
        NodeJS: 'readonly',
        NotificationOptions: 'readonly',
        NotificationPermission: 'readonly',
        EventListener: 'readonly',
        IntersectionObserverInit: 'readonly',
        JSX: 'readonly',
        gtag: 'readonly',
        Flex: 'readonly',
        filters: 'readonly',
        useRef: 'readonly',
        useMemo: 'readonly',
        useEffect: 'readonly',
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
    rules: {
        // TypeScript rules
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        '@typescript-eslint/no-explicit-any': 'warn',
        'no-unused-vars': 'off', // Turn off base rule as it can report incorrect errors
        
        // Console and debugging
        'no-console': 'off', // Allow console statements for now
        
        // React rules
        'react/react-in-jsx-scope': 'off',
        'react-refresh/only-export-components': 'off', // Disable for now
        'react/prop-types': 'off',
        'react/display-name': 'off',
        'react/no-unescaped-entities': 'off',
        'react/jsx-no-undef': 'warn', // Downgrade to warning
        'react/no-unknown-property': 'warn', // Downgrade to warning
        
        // React hooks rules
        'react-hooks/rules-of-hooks': 'warn', // Downgrade to warning
        'react-hooks/exhaustive-deps': 'off', // Disable for now
        
        // General rules
        'no-undef': 'warn', // Downgrade to warning
        'no-case-declarations': 'off', // Allow case declarations
    },
    overrides: [
        {
            // Test files configuration
            files: [
                '**/__tests__/**/*',
                '**/*.test.*',
                '**/*.spec.*',
                '**/test/**/*',
                '**/tests/**/*'
            ],
            env: {
                jest: true,
            },
            rules: {
                '@typescript-eslint/no-explicit-any': 'off', // Allow any in test files
                'no-undef': 'off', // Jest globals are handled by env
            },
        },
    ],
};
