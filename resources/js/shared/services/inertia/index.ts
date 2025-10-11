/**
 * Enhanced Inertia.js Integration - Phase 6
 *
 * Advanced Inertia.js utilities and optimizations for better performance,
 * caching, and developer experience.
 */

export { InertiaPageResolver } from './PageResolver';
export { InertiaCache } from './Cache';
export { InertiaPreloader } from './Preloader';
export { InertiaOptimizer } from './Optimizer';
export { InertiaAnalytics } from './Analytics';
export { InertiaErrorHandler } from './ErrorHandler';

// Enhanced page registry
export { enhancedPageRegistry } from './PageRegistry';

// Inertia hooks
export { useInertiaPage } from './hooks/useInertiaPage';
export { useInertiaNavigation } from './hooks/useInertiaNavigation';
export { useInertiaCache } from './hooks/useInertiaCache';
export { useInertiaPreload } from './hooks/useInertiaPreload';

// Types
export type * from './types';
