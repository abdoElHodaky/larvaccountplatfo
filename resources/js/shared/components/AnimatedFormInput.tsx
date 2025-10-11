/**
 * Animated Form Input Component - Phase 2 Integration
 * Enhanced form input with smooth animations and validation states
 */

import React, { useRef, useCallback, forwardRef, InputHTMLAttributes, useState, useEffect } from 'react';
import { useAnimation } from '../providers/AnimationProvider';

interface AnimatedFormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  loading?: boolean;
  animationType?: 'focus' | 'slide' | 'glow' | 'bounce';
  variant?: 'default' | 'search' | 'password' | 'email';
  helperText?: string;
}

const AnimatedFormInput = forwardRef<HTMLInputElement, AnimatedFormInputProps>(({
  label,
  error,
  success = false,
  loading = false,
  animationType = 'focus',
  variant = 'default',
  helperText,
  className = '',
  onFocus,
  onBlur,
  onChange,
  ...props
}, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const labelRef = useRef<HTMLLabelElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const { animate, presets, isReducedMotion } = useAnimation();

  // Check if input has value
  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      setHasValue(input.value.length > 0);
    }
  }, [props.value, props.defaultValue]);

  // Base classes
  const baseInputClasses = 'block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-all duration-200';
  
  // State-based classes
  const stateClasses = {
    default: 'focus:ring-blue-600',
    error: 'ring-red-300 focus:ring-red-600',
    success: 'ring-green-300 focus:ring-green-600',
    loading: 'bg-gray-50'
  };

  // Variant-specific classes
  const variantClasses = {
    default: '',
    search: 'pl-10',
    password: 'pr-10',
    email: ''
  };

  // Animation handlers
  const handleFocus = useCallback(async (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    
    if (!isReducedMotion && !loading) {
      const input = inputRef.current;
      const label = labelRef.current;
      
      if (input && label) {
        try {
          switch (animationType) {
            case 'focus':
              await Promise.all([
                animate(input, [
                  { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' },
                  { transform: 'scale(1.02)', boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)' }
                ], { ...presets.fast, fill: 'forwards' }),
                animate(label, [
                  { transform: 'translateY(0) scale(1)', color: '#6b7280' },
                  { transform: 'translateY(-20px) scale(0.85)', color: '#3b82f6' }
                ], { ...presets.fast, fill: 'forwards' })
              ]);
              break;
            
            case 'slide':
              await animate(input, [
                { transform: 'translateX(0px)' },
                { transform: 'translateX(2px)' },
                { transform: 'translateX(0px)' }
              ], { ...presets.fast });
              break;
            
            case 'glow':
              await animate(input, [
                { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' },
                { boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.2)' }
              ], { ...presets.normal, fill: 'forwards' });
              break;
            
            case 'bounce':
              await animate(input, [
                { transform: 'scale(1)' },
                { transform: 'scale(1.05)' },
                { transform: 'scale(1)' }
              ], { ...presets.spring });
              break;
          }
        } catch (error) {
          console.warn('Input focus animation failed:', error);
        }
      }
    }
    
    if (onFocus) {
      onFocus(event);
    }
  }, [animate, animationType, presets, isReducedMotion, loading, onFocus]);

  const handleBlur = useCallback(async (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    
    if (!isReducedMotion && !loading) {
      const input = inputRef.current;
      const label = labelRef.current;
      
      if (input && label) {
        try {
          switch (animationType) {
            case 'focus':
              await Promise.all([
                animate(input, [
                  { transform: 'scale(1.02)', boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)' },
                  { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' }
                ], { ...presets.fast, fill: 'forwards' }),
                !hasValue ? animate(label, [
                  { transform: 'translateY(-20px) scale(0.85)', color: '#3b82f6' },
                  { transform: 'translateY(0) scale(1)', color: '#6b7280' }
                ], { ...presets.fast, fill: 'forwards' }) : Promise.resolve()
              ]);
              break;
            
            case 'glow':
              await animate(input, [
                { boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.2)' },
                { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' }
              ], { ...presets.normal, fill: 'forwards' });
              break;
          }
        } catch (error) {
          console.warn('Input blur animation failed:', error);
        }
      }
    }
    
    if (onBlur) {
      onBlur(event);
    }
  }, [animate, animationType, presets, isReducedMotion, loading, hasValue, onBlur]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(event.target.value.length > 0);
    
    if (onChange) {
      onChange(event);
    }
  }, [onChange]);

  // Determine current state
  const currentState = error ? 'error' : success ? 'success' : loading ? 'loading' : 'default';

  // Combine classes
  const inputClasses = [
    baseInputClasses,
    stateClasses[currentState],
    variantClasses[variant],
    className
  ].join(' ');

  return (
    <div className="relative">
      {label && (
        <label
          ref={labelRef}
          className={`absolute left-3 transition-all duration-200 pointer-events-none ${
            isFocused || hasValue 
              ? 'top-0 -translate-y-2 text-xs text-blue-600 bg-white px-1' 
              : 'top-2 text-sm text-gray-500'
          }`}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {variant === 'search' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        )}
        
        <input
          ref={(node) => {
            if (inputRef.current !== node) {
              (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
            }
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref && 'current' in ref) {
              (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
            }
          }}
          className={inputClasses}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          disabled={loading}
          {...props}
        />
        
        {variant === 'password' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        )}
        
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <div className={`mt-1 text-xs ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || helperText}
        </div>
      )}
      
      {success && !error && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
});

AnimatedFormInput.displayName = 'AnimatedFormInput';

export { AnimatedFormInput };
export default AnimatedFormInput;
