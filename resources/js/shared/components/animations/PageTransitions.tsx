/**
 * Phase 10C: Page Transition Components
 * Advanced page-level animations and route transitions
 */

import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageTransition } from '../../hooks/useAnimation';
import { useAnimationContext } from './AnimationProvider';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  transitionKey?: string;
  direction?: 'horizontal' | 'vertical';
  mode?: 'wait' | 'sync' | 'popLayout';
}

/**
 * PageTransition - Main page transition wrapper
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = '',
  transitionKey,
  direction = 'horizontal',
  mode = 'wait'
}) => {
  const { shouldAnimate } = useAnimationContext();
  const { variants: _variants } = usePageTransition();

  if (!shouldAnimate('high')) {
    return <div className={className}>{children}</div>;
  }

  const pageVariants = {
    initial: {
      opacity: 0,
      x: direction === 'horizontal' ? 30 : 0,
      y: direction === 'vertical' ? 30 : 0,
      scale: 0.98
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      x: direction === 'horizontal' ? -30 : 0,
      y: direction === 'vertical' ? -30 : 0,
      scale: 0.98,
      transition: {
        duration: 0.3,
        ease: 'easeIn'
      }
    }
  };

  return (
    <AnimatePresence mode={mode}>
      <motion.div
        key={transitionKey}
        className={className}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

interface ModalTransitionProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  overlayClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

/**
 * ModalTransition - Enhanced modal with smooth transitions
 */
export const ModalTransition: React.FC<ModalTransitionProps> = ({
  children,
  isOpen,
  onClose,
  className = '',
  overlayClassName = '',
  size = 'md'
}) => {
  const { shouldAnimate } = useAnimationContext();

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.95,
      y: 20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { 
        duration: 0.3,
        ease: 'easeOut',
        delay: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      y: 20,
      transition: { 
        duration: 0.2,
        ease: 'easeIn'
      }
    }
  };

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4'
  };

  if (!shouldAnimate('medium')) {
    if (!isOpen) return null;
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${overlayClassName}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className={`relative bg-white rounded-lg shadow-xl ${sizeClasses[size]} ${className}`}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${overlayClassName}`}>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className={`relative bg-white rounded-lg shadow-xl ${sizeClasses[size]} ${className}`}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface SlideOverTransitionProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  className?: string;
  overlayClassName?: string;
}

/**
 * SlideOverTransition - Slide-over panel with smooth transitions
 */
export const SlideOverTransition: React.FC<SlideOverTransitionProps> = ({
  children,
  isOpen,
  onClose,
  side = 'right',
  className = '',
  overlayClassName = ''
}) => {
  const { shouldAnimate } = useAnimationContext();

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const slideVariants = {
    hidden: { 
      x: side === 'right' ? '100%' : '-100%',
      opacity: 0
    },
    visible: { 
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 200
      }
    },
    exit: { 
      x: side === 'right' ? '100%' : '-100%',
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: 'easeIn'
      }
    }
  };

  const positionClasses = {
    left: 'left-0',
    right: 'right-0'
  };

  if (!shouldAnimate('medium')) {
    if (!isOpen) return null;
    return (
      <div className={`fixed inset-0 z-50 ${overlayClassName}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className={`fixed top-0 ${positionClasses[side]} h-full w-96 bg-white shadow-xl ${className}`}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 z-50 ${overlayClassName}`}>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
          
          {/* Slide Panel */}
          <motion.div
            className={`fixed top-0 ${positionClasses[side]} h-full w-96 bg-white shadow-xl ${className}`}
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface TabTransitionProps {
  children: ReactNode;
  activeTab: string;
  className?: string;
  direction?: 'horizontal' | 'vertical';
}

/**
 * TabTransition - Smooth tab content transitions
 */
export const TabTransition: React.FC<TabTransitionProps> = ({
  children,
  activeTab,
  className = '',
  direction = 'horizontal'
}) => {
  const { shouldAnimate } = useAnimationContext();

  const tabVariants = {
    hidden: {
      opacity: 0,
      x: direction === 'horizontal' ? 20 : 0,
      y: direction === 'vertical' ? 20 : 0
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      x: direction === 'horizontal' ? -20 : 0,
      y: direction === 'vertical' ? -20 : 0,
      transition: {
        duration: 0.2,
        ease: 'easeIn'
      }
    }
  };

  if (!shouldAnimate('low')) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        className={className}
        variants={tabVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

interface AccordionTransitionProps {
  children: ReactNode;
  isOpen: boolean;
  className?: string;
  duration?: number;
}

/**
 * AccordionTransition - Smooth accordion expand/collapse
 */
export const AccordionTransition: React.FC<AccordionTransitionProps> = ({
  children,
  isOpen,
  className = '',
  duration = 0.3
}) => {
  const { shouldAnimate } = useAnimationContext();

  if (!shouldAnimate('low')) {
    return isOpen ? <div className={className}>{children}</div> : null;
  }

  return (
    <motion.div
      className={`overflow-hidden ${className}`}
      initial={false}
      animate={{
        height: isOpen ? 'auto' : 0,
        opacity: isOpen ? 1 : 0
      }}
      transition={{
        duration,
        ease: 'easeInOut'
      }}
    >
      <div>{children}</div>
    </motion.div>
  );
};
