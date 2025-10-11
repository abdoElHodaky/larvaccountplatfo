export default {
    plugins: {
        tailwindcss: {},
        autoprefixer: {},
        // CSS optimization for production
        ...(process.env.NODE_ENV === 'production' && {
            cssnano: {
                preset: ['default', {
                    discardComments: {
                        removeAll: true,
                    },
                    normalizeWhitespace: true,
                    mergeLonghand: true,
                    mergeRules: true,
                    minifySelectors: true,
                    reduceIdents: false, // Keep animation names intact
                }]
            }
        })
    },
};
