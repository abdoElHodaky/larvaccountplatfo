import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./resources/js/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './resources/js'),
      '@/app': path.resolve(__dirname, './resources/js/app'),
      '@/features': path.resolve(__dirname, './resources/js/features'),
      '@/shared': path.resolve(__dirname, './resources/js/shared'),
      '@/assets': path.resolve(__dirname, './resources/js/assets'),
      '@/types': path.resolve(__dirname, './resources/js/types'),
      '@/utils': path.resolve(__dirname, './resources/js/utils'),
      '@/components': path.resolve(__dirname, './resources/js/shared/components'),
      '@/hooks': path.resolve(__dirname, './resources/js/shared/hooks'),
      '@/services': path.resolve(__dirname, './resources/js/shared/services'),
      '@/api': path.resolve(__dirname, './resources/js/shared/services/api'),
      '@/theme': path.resolve(__dirname, './resources/js/shared/theme'),
      '@/providers': path.resolve(__dirname, './resources/js/app/providers'),
    },
  },
});
