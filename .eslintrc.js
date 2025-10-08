module.exports = {
    root: true,
    env: {
        browser: true,
        es2020: true,
        node: true,
    },
    extends: [
        'eslint:recommended',
        // Note: TypeScript rules will be added via plugins for now
    ],
    ignorePatterns: ['node_modules', 'dist', 'public', 'storage', 'vendor'],
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
    rules: {
        // Basic rules
        'no-unused-vars': 'off', // Use TypeScript version instead
        'no-console': 'warn',
        
        // TypeScript rules (warnings for gradual adoption)
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-undef': 'off', // TypeScript handles this
        
        // React rules (warnings for gradual adoption)
        'react/prop-types': 'off',
        'react/jsx-uses-react': 'off',
        'react/react-in-jsx-scope': 'off',
        'react-hooks/rules-of-hooks': 'warn',
        'react-hooks/exhaustive-deps': 'warn',
        
        // React Refresh
        'react-refresh/only-export-components': [
            'warn',
            { allowConstantExport: true },
        ],
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
};
