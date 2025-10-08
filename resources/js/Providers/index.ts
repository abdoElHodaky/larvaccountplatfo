/**
 * @deprecated Use @/shared/providers instead
 * 
 * Legacy re-exports for backward compatibility.
 * This file maintains compatibility with existing imports while encouraging
 * migration to the new shared structure.
 */

// Re-export from new location
export { ChakraProvider, ChakraProviderDefault } from '@/shared/providers';

// Default export for backward compatibility
export { default } from '@/shared/providers/ChakraProvider';
