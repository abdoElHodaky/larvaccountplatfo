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

// Animation Components
export { AnimatedFormInput } from './AnimatedFormInput';
export { AnimatedModal, AnimatedConfirmationModal, useAnimatedModal } from './AnimatedModal';
export { AnimatedSidebar, useAnimatedSidebar } from './AnimatedSidebar';
