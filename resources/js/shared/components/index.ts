// Shared Components Barrel Export
export * from './atoms';
export * from './molecules';
export * from './organisms';
export * from './ui';
export * from './layouts';

// Re-export commonly used components for convenience
export { default as AppLayout } from './layouts/AppLayout';
export { Container, CardContainer } from './molecules/Container';
export { DataTable } from './molecules/DataTable';
export { FormInput } from './molecules/FormInput';
export { Button, PrimaryButton } from './atoms/Button';
export { TextInput } from './atoms/TextInput';
export { InputError } from './atoms/InputError';
export { InputLabel } from './atoms/InputLabel';

// Animation Components - All Phases
export * from './animations';

// Phase 4 Animation Components - New Implementations
export { AnimatedCard, useAnimatedCard } from './animations/AnimatedCard';
export { AnimatedList, AnimatedListItem, useAnimatedList } from './animations/AnimatedList';

// Phase 5 Enhanced Components - HeadlessUI + LiveIcons Integration
export { EnhancedMenu, ActionMenu } from './enhanced/EnhancedMenu';
export { EnhancedDialog, ConfirmDialog } from './enhanced/EnhancedDialog';

// Phase 5 Integration Showcase
export { IntegrationShowcase } from './examples/IntegrationShowcase';
