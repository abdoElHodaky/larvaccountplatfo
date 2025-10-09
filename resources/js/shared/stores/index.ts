/**
 * Shared Stores
 * 
 * This module exports all shared store configurations and instances.
 * Centralized store management for the application.
 */

// Export individual stores
export * from './appStore';
export * from './authStore';

// Re-export for convenience
export { default as appStore } from './appStore';
export { default as authStore } from './authStore';
