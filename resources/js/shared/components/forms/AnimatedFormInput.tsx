/**
 * Phase 10A: Animated Form Input Component
 * Enhanced form input with integrated animations and Fragment optimization
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFormAnimation } from '../../hooks/useAnimation';
import { useAnimationContext } from '../animations/AnimationProvider';

interface AnimatedFormInputProps {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  isRequired?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  className?: string;
  autoFocus?: boolean;
}

export const AnimatedFormInput: React.FC<AnimatedFormInputProps> = ({
  label,
  value,
  onChange,
  error,
  placeholder,
  type = 'text',
  isRequired = false,
  disabled = false,
  multiline = false,
  rows = 3,
  className = '',
  autoFocus = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const { shouldAnimate } = useAnimationContext();
  const { variants } = useFormAnimation();

  useEffect(() => {
    setHasValue(!!value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    onChange(newValue);
    setHasValue(!!e.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  // Animation variants for different states
  const labelVariants = {
    default: {
      top: '50%',
      fontSize: '1rem',
      color: '#6B7280',
      transform: 'translateY(-50%)'
    },
    focused: {
      top: '0.5rem',
      fontSize: '0.75rem',
      color: error ? '#EF4444' : '#3B82F6',
      transform: 'translateY(0)'
    },
    filled: {
      top: '0.5rem',
      fontSize: '0.75rem',
      color: '#6B7280',
      transform: 'translateY(0)'
    }
  };

  const inputVariants = {
    default: {
      borderColor: '#D1D5DB',
      boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
    },
    focused: {
      borderColor: error ? '#EF4444' : '#3B82F6',
      boxShadow: error 
        ? '0 0 0 3px rgb(239 68 68 / 0.1)' 
        : '0 0 0 3px rgb(59 130 246 / 0.1)'
    },
    error: {
      borderColor: '#EF4444',
      boxShadow: '0 0 0 3px rgb(239 68 68 / 0.1)'
    }
  };

  const errorVariants = {
    hidden: { opacity: 0, y: -10, height: 0 },
    visible: { opacity: 1, y: 0, height: 'auto' }
  };

  const getLabelState = () => {
    if (error) return 'focused';
    if (isFocused || hasValue) return 'focused';
    if (hasValue) return 'filled';
    return 'default';
  };

  const getInputState = () => {
    if (error) return 'error';
    if (isFocused) return 'focused';
    return 'default';
  };

  const baseInputClasses = `
    w-full px-3 py-3 pt-6 pb-2 text-base border rounded-md 
    transition-colors duration-200 ease-in-out
    focus:outline-none focus:ring-0
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    ${error ? 'border-red-300' : 'border-gray-300'}
    ${className}
  `;

  const InputComponent = multiline ? motion.textarea : motion.input;

  if (!shouldAnimate('medium')) {
    // Fallback without animations
    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={baseInputClasses}
            autoFocus={autoFocus}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={type}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={baseInputClasses}
            autoFocus={autoFocus}
          />
        )}
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  return (
    <motion.div 
      className="relative"
      initial="initial"
      animate="animate"
      variants={variants}
    >
      {/* Floating Label */}
      <motion.label
        className="absolute left-3 pointer-events-none z-10 bg-white px-1"
        variants={labelVariants}
        animate={getLabelState()}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </motion.label>

      {/* Input Field */}
      <InputComponent
        ref={inputRef}
        type={multiline ? undefined : type}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={isFocused ? placeholder : ''}
        disabled={disabled}
        rows={multiline ? rows : undefined}
        className={baseInputClasses}
        variants={inputVariants}
        animate={getInputState()}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        autoFocus={autoFocus}
      />

      {/* Error Message */}
      <motion.div
        variants={errorVariants}
        animate={error ? 'visible' : 'hidden'}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="overflow-hidden"
      >
        {error && (
          <motion.p 
            className="mt-1 text-sm text-red-600"
            initial={{ x: -5 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
};
