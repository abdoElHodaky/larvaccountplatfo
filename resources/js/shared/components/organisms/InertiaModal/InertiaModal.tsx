import React, { memo, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { router } from '@inertiajs/react';
import { Button } from '../../atoms/Button/Button';

export interface InertiaModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  preserveState?: boolean;
  preserveScroll?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerActions?: React.ReactNode;
}

/**
 * Enhanced Modal component integrated with Inertia.js navigation
 * Handles browser history and state preservation
 */
export const InertiaModal = memo<InertiaModalProps>(({
  isOpen,
  onClose,
  title,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  preserveState = true,
  preserveScroll = true,
  children,
  footer,
  headerActions,
}) => {
  // Handle modal close with Inertia.js navigation
  const handleClose = () => {
    onClose();
    
    // Navigate back to preserve browser history
    // This ensures the modal URL is removed from history
    const currentUrl = new URL(window.location.href);
    const hasModalParam = currentUrl.searchParams.has('modal');
    
    if (hasModalParam) {
      currentUrl.searchParams.delete('modal');
      router.get(currentUrl.toString(), {}, {
        preserveState,
        preserveScroll,
        replace: true, // Replace current history entry
      });
    }
  };

  // Handle escape key
  useEffect(() => {
    if (!closeOnEsc) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEsc]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size={size}
      closeOnOverlayClick={closeOnOverlayClick}
      closeOnEsc={closeOnEsc}
      isCentered
      motionPreset="slideInBottom"
    >
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent>
        {title && (
          <ModalHeader
            fontSize="lg"
            fontWeight="semibold"
            borderBottom="1px"
            borderColor="gray.200"
            pb={4}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            {title}
            {headerActions}
          </ModalHeader>
        )}
        
        <ModalCloseButton />
        
        <ModalBody py={6}>
          {children}
        </ModalBody>
        
        {footer && (
          <ModalFooter
            borderTop="1px"
            borderColor="gray.200"
            pt={4}
          >
            {footer}
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
});

InertiaModal.displayName = 'InertiaModal';

/**
 * Hook for managing Inertia modal state
 */
export function useInertiaModal(modalKey: string = 'modal') {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Check if modal should be open based on URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldOpen = urlParams.get(modalKey) === 'true';
    
    if (shouldOpen && !isOpen) {
      onOpen();
    } else if (!shouldOpen && isOpen) {
      onClose();
    }
  }, [modalKey, isOpen, onOpen, onClose]);

  // Open modal and update URL
  const openModal = (additionalParams: Record<string, string> = {}) => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set(modalKey, 'true');
    
    // Add any additional parameters
    Object.entries(additionalParams).forEach(([key, value]) => {
      currentUrl.searchParams.set(key, value);
    });

    router.get(currentUrl.toString(), {}, {
      preserveState: true,
      preserveScroll: true,
      replace: false,
    });
  };

  // Close modal and update URL
  const closeModal = () => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete(modalKey);
    
    router.get(currentUrl.toString(), {}, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  };

  return {
    isOpen,
    openModal,
    closeModal,
  };
}

/**
 * Confirmation Modal component for destructive actions
 */
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal = memo<ConfirmationModalProps>(({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  variant = 'danger',
}) => {
  const handleConfirm = () => {
    onConfirm();
    if (!isLoading) {
      onClose();
    }
  };

  const confirmButtonVariant = variant === 'danger' ? 'danger' : 'primary';

  return (
    <InertiaModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            mr={3}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmButtonVariant}
            onClick={handleConfirm}
            loading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      {message}
    </InertiaModal>
  );
});

ConfirmationModal.displayName = 'ConfirmationModal';
