// Simplified animation system for real-time updates
export const transitions = {
  // Real-time connection status
  connection: {
    connected: 'animate-pulse text-green-500',
    disconnected: 'animate-bounce text-red-500',
    connecting: 'animate-spin text-yellow-500'
  },

  // Data updates
  dataUpdate: {
    fadeIn: 'animate-fade-in',
    slideIn: 'animate-slide-in-right',
    highlight: 'animate-highlight-flash'
  },

  // Loading states
  loading: {
    spinner: 'animate-spin',
    pulse: 'animate-pulse',
    skeleton: 'animate-pulse bg-gray-200'
  },

  // Notifications
  notification: {
    success: 'animate-slide-in-top bg-green-100 border-green-500',
    error: 'animate-shake bg-red-100 border-red-500',
    info: 'animate-fade-in bg-blue-100 border-blue-500'
  }
};

// CSS classes for custom animations
export const customAnimations = `
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slide-in-right {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes slide-in-top {
    from { transform: translateY(-100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @keyframes highlight-flash {
    0% { background-color: transparent; }
    50% { background-color: #fef3c7; }
    100% { background-color: transparent; }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }

  .animate-fade-in { animation: fade-in 0.3s ease-out; }
  .animate-slide-in-right { animation: slide-in-right 0.4s ease-out; }
  .animate-slide-in-top { animation: slide-in-top 0.3s ease-out; }
  .animate-highlight-flash { animation: highlight-flash 1s ease-out; }
  .animate-shake { animation: shake 0.5s ease-out; }
`;

// Animation utilities
export const animationUtils = {
  // Apply animation class temporarily
  flashAnimation: (element: HTMLElement, className: string, duration: number = 1000) => {
    element.classList.add(className);
    setTimeout(() => {
      element.classList.remove(className);
    }, duration);
  },

  // Smooth scroll to element
  scrollToElement: (elementId: string, behavior: ScrollBehavior = 'smooth') => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior, block: 'center' });
    }
  },

  // Stagger animations for lists
  staggerAnimation: (elements: NodeListOf<Element>, delay: number = 100) => {
    elements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('animate-fade-in');
      }, index * delay);
    });
  }
};

// React hook for animations
export function useAnimation() {
  const flashElement = (ref: React.RefObject<HTMLElement>, animation: string) => {
    if (ref.current) {
      animationUtils.flashAnimation(ref.current, animation);
    }
  };

  const highlightUpdate = (ref: React.RefObject<HTMLElement>) => {
    flashElement(ref, 'animate-highlight-flash');
  };

  return {
    flashElement,
    highlightUpdate,
    transitions,
    animationUtils
  };
}
