/**
 * Phase 10A/10B: Animation Provider
 * Global animation context with performance monitoring and accessibility support
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

interface AnimationState {
  isReducedMotion: boolean;
  globalAnimationsEnabled: boolean;
  performanceMode: 'high' | 'balanced' | 'low';
  animationCount: number;
  frameRate: number;
}

interface AnimationContextType {
  state: AnimationState;
  dispatch: React.Dispatch<AnimationAction>;
  shouldAnimate: (priority?: 'low' | 'medium' | 'high') => boolean;
  registerAnimation: () => void;
  unregisterAnimation: () => void;
}

type AnimationAction =
  | { type: 'SET_REDUCED_MOTION'; payload: boolean }
  | { type: 'SET_GLOBAL_ANIMATIONS'; payload: boolean }
  | { type: 'SET_PERFORMANCE_MODE'; payload: 'high' | 'balanced' | 'low' }
  | { type: 'INCREMENT_ANIMATION_COUNT' }
  | { type: 'DECREMENT_ANIMATION_COUNT' }
  | { type: 'UPDATE_FRAME_RATE'; payload: number };

const initialState: AnimationState = {
  isReducedMotion: false,
  globalAnimationsEnabled: true,
  performanceMode: 'balanced',
  animationCount: 0,
  frameRate: 60
};

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

function animationReducer(state: AnimationState, action: AnimationAction): AnimationState {
  switch (action.type) {
    case 'SET_REDUCED_MOTION':
      return { ...state, isReducedMotion: action.payload };
    case 'SET_GLOBAL_ANIMATIONS':
      return { ...state, globalAnimationsEnabled: action.payload };
    case 'SET_PERFORMANCE_MODE':
      return { ...state, performanceMode: action.payload };
    case 'INCREMENT_ANIMATION_COUNT':
      return { ...state, animationCount: state.animationCount + 1 };
    case 'DECREMENT_ANIMATION_COUNT':
      return { ...state, animationCount: Math.max(0, state.animationCount - 1) };
    case 'UPDATE_FRAME_RATE':
      return { ...state, frameRate: action.payload };
    default:
      return state;
  }
}

interface AnimationProviderProps {
  children: ReactNode;
  enablePerformanceMonitoring?: boolean;
}

export const AnimationProvider: React.FC<AnimationProviderProps> = ({ 
  children, 
  enablePerformanceMonitoring = true 
}) => {
  const [state, dispatch] = useReducer(animationReducer, initialState);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      dispatch({ type: 'SET_REDUCED_MOTION', payload: e.matches });
    };

    dispatch({ type: 'SET_REDUCED_MOTION', payload: mediaQuery.matches });
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Performance monitoring
  useEffect(() => {
    if (!enablePerformanceMonitoring) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFrameRate = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        dispatch({ type: 'UPDATE_FRAME_RATE', payload: fps });
        
        // Auto-adjust performance mode based on frame rate
        if (fps < 30 && state.performanceMode !== 'low') {
          dispatch({ type: 'SET_PERFORMANCE_MODE', payload: 'low' });
        } else if (fps > 50 && state.performanceMode === 'low') {
          dispatch({ type: 'SET_PERFORMANCE_MODE', payload: 'balanced' });
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFrameRate);
    };

    animationId = requestAnimationFrame(measureFrameRate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [enablePerformanceMonitoring, state.performanceMode]);

  // Determine if animations should run based on various factors
  const shouldAnimate = (priority: 'low' | 'medium' | 'high' = 'medium'): boolean => {
    // Always respect reduced motion preference
    if (state.isReducedMotion) return false;
    
    // Check global animation setting
    if (!state.globalAnimationsEnabled) return false;
    
    // Performance-based decisions
    switch (state.performanceMode) {
      case 'low':
        return priority === 'high';
      case 'balanced':
        return priority !== 'low';
      case 'high':
        return true;
      default:
        return true;
    }
  };

  const registerAnimation = () => {
    dispatch({ type: 'INCREMENT_ANIMATION_COUNT' });
  };

  const unregisterAnimation = () => {
    dispatch({ type: 'DECREMENT_ANIMATION_COUNT' });
  };

  const contextValue: AnimationContextType = {
    state,
    dispatch,
    shouldAnimate,
    registerAnimation,
    unregisterAnimation
  };

  return (
    <AnimationContext.Provider value={contextValue}>
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimationContext = (): AnimationContextType => {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error('useAnimationContext must be used within an AnimationProvider');
  }
  return context;
};

// Performance monitoring hook
export const useAnimationPerformance = () => {
  const { state, dispatch } = useAnimationContext();
  
  return {
    frameRate: state.frameRate,
    animationCount: state.animationCount,
    performanceMode: state.performanceMode,
    setPerformanceMode: (mode: 'high' | 'balanced' | 'low') => {
      dispatch({ type: 'SET_PERFORMANCE_MODE', payload: mode });
    }
  };
};

// Accessibility hook
export const useAnimationAccessibility = () => {
  const { state, dispatch } = useAnimationContext();
  
  return {
    isReducedMotion: state.isReducedMotion,
    globalAnimationsEnabled: state.globalAnimationsEnabled,
    toggleGlobalAnimations: () => {
      dispatch({ type: 'SET_GLOBAL_ANIMATIONS', payload: !state.globalAnimationsEnabled });
    }
  };
};
