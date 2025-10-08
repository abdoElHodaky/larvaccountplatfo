/**
 * @deprecated Use @/shared/components/layouts instead
 * 
 * Legacy re-exports for backward compatibility.
 * This file maintains compatibility with existing imports while encouraging
 * migration to the new shared structure.
 */

// Re-export from new location
export { AppLayout, AuthLayout } from '@/shared/components/layouts';

// Default exports for backward compatibility
export { default as AppLayoutDefault } from '@/shared/components/layouts/AppLayout';
export { default as AuthLayoutDefault } from '@/shared/components/layouts/AuthLayout';
