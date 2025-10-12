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
export { Button } from './atoms/Button';
export { PrimaryButton } from './atoms/PrimaryButton';
export { TextInput } from './atoms/TextInput';
export { InputError } from './atoms/InputError';
export { InputLabel } from './atoms/InputLabel';

// Phase 3 Animation Components
export { AnimatedFormInput } from './AnimatedFormInput';
export { AnimatedModal, AnimatedConfirmationModal, useAnimatedModal } from './AnimatedModal';
export { AnimatedSidebar, useAnimatedSidebar } from './AnimatedSidebar';

// Phase 4 Animation Components - Unified Structure
export { Card } from './Card';
export { Widget } from './Widget';
export { List } from './List';
export { Loader } from './Loader';

// Phase 5 Enhanced Components - HeadlessUI + LiveIcons Integration
export { EnhancedMenu, ActionMenu } from './enhanced/EnhancedMenu';
export { EnhancedDialog, ConfirmDialog } from './enhanced/EnhancedDialog';

// Phase 5 Integration Showcase
export { IntegrationShowcase } from './examples/IntegrationShowcase';
