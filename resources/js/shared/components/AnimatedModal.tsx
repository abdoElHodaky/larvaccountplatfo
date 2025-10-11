/**
 * Animated Modal Component - Phase 3 Integration
 * Enhanced modal with smooth entrance/exit animations and backdrop effects
 */

import React, { useRef, useCallback, forwardRef, useEffect, useState } from 'react';
import { useAnimation } from '../providers/AnimationProvider';

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  animationType?: 'fade' | 'slide' | 'scale' | 'bounce';
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  footer?: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
}

export const AnimatedModal = forwardRef<HTMLDivElement, AnimatedModalProps>(({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  animationType = 'fade',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  footer,
  headerActions,
  className = '',
  ...props
}, ref) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { animate, presets, isReducedMotion } = useAnimation();

  // Size classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  // Handle ESC key
  useEffect(() => {
    if (!closeOnEsc || !isOpen) return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, closeOnEsc]);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsVisible(true);
    } else {
      document.body.style.overflow = '';
      setIsVisible(false);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Animation handlers
  const handleOpen = useCallback(async () => {
    if (isReducedMotion) return;

    const overlay = overlayRef.current;
    const modal = modalRef.current;

    if (overlay && modal) {
      setIsAnimating(true);
      
      try {
        switch (animationType) {
          case 'fade':
            await Promise.all([
              animate(overlay, [
                { opacity: 0 },
                { opacity: 1 }
              ], { ...presets.normal }),
              animate(modal, [
                { opacity: 0, transform: 'scale(0.95)' },
                { opacity: 1, transform: 'scale(1)' }
              ], { ...presets.normal })
            ]);
            break;

          case 'slide':
            await Promise.all([
              animate(overlay, [
                { opacity: 0 },
                { opacity: 1 }
              ], { ...presets.normal }),
              animate(modal, [
                { opacity: 0, transform: 'translateY(-50px)' },
                { opacity: 1, transform: 'translateY(0px)' }
              ], { ...presets.normal })
            ]);
            break;

          case 'scale':
            await Promise.all([
              animate(overlay, [
                { opacity: 0 },
                { opacity: 1 }
              ], { ...presets.normal }),
              animate(modal, [
                { opacity: 0, transform: 'scale(0.8)' },
                { opacity: 1, transform: 'scale(1)' }
              ], { ...presets.spring })
            ]);
            break;

          case 'bounce':
            await Promise.all([
              animate(overlay, [
                { opacity: 0 },
                { opacity: 1 }
              ], { ...presets.normal }),
              animate(modal, [
                { opacity: 0, transform: 'scale(0.3)' },
                { opacity: 1, transform: 'scale(1.05)' },
                { opacity: 1, transform: 'scale(1)' }
              ], { ...presets.spring })
            ]);
            break;
        }
      } catch (error) {
        console.warn('Modal open animation failed:', error);
      } finally {
        setIsAnimating(false);
      }
    }
  }, [animate, animationType, presets, isReducedMotion]);

  const handleClose = useCallback(async () => {
    if (isAnimating) return;

    if (!isReducedMotion) {
      const overlay = overlayRef.current;
      const modal = modalRef.current;

      if (overlay && modal) {
        setIsAnimating(true);
        
        try {
          switch (animationType) {
            case 'fade':
              await Promise.all([
                animate(overlay, [
                  { opacity: 1 },
                  { opacity: 0 }
                ], { ...presets.fast }),
                animate(modal, [
                  { opacity: 1, transform: 'scale(1)' },
                  { opacity: 0, transform: 'scale(0.95)' }
                ], { ...presets.fast })
              ]);
              break;

            case 'slide':
              await Promise.all([
                animate(overlay, [
                  { opacity: 1 },
                  { opacity: 0 }
                ], { ...presets.fast }),
                animate(modal, [
                  { opacity: 1, transform: 'translateY(0px)' },
                  { opacity: 0, transform: 'translateY(-50px)' }
                ], { ...presets.fast })
              ]);
              break;

            case 'scale':
              await Promise.all([
                animate(overlay, [
                  { opacity: 1 },
                  { opacity: 0 }
                ], { ...presets.fast }),
                animate(modal, [
                  { opacity: 1, transform: 'scale(1)' },
                  { opacity: 0, transform: 'scale(0.8)' }
                ], { ...presets.fast })
              ]);
              break;

            case 'bounce':
              await Promise.all([
                animate(overlay, [
                  { opacity: 1 },
                  { opacity: 0 }
                ], { ...presets.fast }),
                animate(modal, [
                  { opacity: 1, transform: 'scale(1)' },
                  { opacity: 0, transform: 'scale(0.8)' }
                ], { ...presets.fast })
              ]);
              break;
          }
        } catch (error) {
          console.warn('Modal close animation failed:', error);
        } finally {
          setIsAnimating(false);
        }
      }
    }

    onClose();
  }, [animate, animationType, presets, isReducedMotion, isAnimating, onClose]);

  // Trigger open animation
  useEffect(() => {
    if (isOpen && isVisible) {
      handleOpen();
    }
  }, [isOpen, isVisible, handleOpen]);

  // Handle overlay click
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      handleClose();
    }
  }, [closeOnOverlayClick, handleClose]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={handleOverlayClick}
      />

      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          ref={(node) => {
            if (modalRef.current !== node) {
              (modalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref && 'current' in ref) {
              (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }
          }}
          className={`
            relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all
            ${sizeClasses[size]}
            ${className}
          `}
          {...props}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900" id="modal-title">
                {title}
              </h3>
              <div className="flex items-center space-x-2">
                {headerActions}
                <button
                  onClick={handleClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Body */}
          <div className="px-6 py-4">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

AnimatedModal.displayName = 'AnimatedModal';

/**
 * Hook for managing animated modal state
 */
export function useAnimatedModal() {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleModal = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
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
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  animationType?: 'fade' | 'slide' | 'scale' | 'bounce';
}

export const AnimatedConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  animationType = 'scale',
}) => {
  const variantStyles = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      animationType={animationType}
      footer={
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantStyles[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      }
    >
      <p className="text-sm text-gray-600">{message}</p>
    </AnimatedModal>
  );
};
