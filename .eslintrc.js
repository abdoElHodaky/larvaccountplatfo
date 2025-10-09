module.exports = {
    root: true,
    env: {
        browser: true,
        es2020: true,
        node: true,
    },
    extends: [
        'eslint:recommended',
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
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
    rules: {
        'no-unused-vars': 'off', // Turn off base rule as it can report incorrect errors
        'no-console': 'off', // Allow console statements for now
        'react/react-in-jsx-scope': 'off',
        'react-refresh/only-export-components': 'off', // Disable for now
        // Disable problematic rules
        'react/prop-types': 'off',
        'react/display-name': 'off',
        'react/no-unescaped-entities': 'off',
        'react-hooks/rules-of-hooks': 'warn', // Downgrade to warning
        'react-hooks/exhaustive-deps': 'off', // Disable for now
        'no-undef': 'warn', // Downgrade to warning
        'no-case-declarations': 'off', // Allow case declarations
    },
};
