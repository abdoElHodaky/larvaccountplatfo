import React, { Fragment, memo, useMemo } from 'react';
import {
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  InputLeftAddon,
  InputRightAddon,
  IconButton,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { FormField, FormFieldProps } from './FormField';
import { useMemoizedCallback } from '@/shared/hooks';
import { FinancialPerformanceUtils } from '@/shared/utils/performance';

/**
 * Performance-Optimized Form Input Component
 * Specialized for financial data entry with formatting and validation
 */

export interface FormInputProps extends Omit<FormFieldProps, 'children'> {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'currency' | 'percentage';
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  onChange?: (value: string | number, event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  leftIcon?: React.ReactElement;
  rightIcon?: React.ReactElement;
  leftAddon?: string;
  rightAddon?: string;
  maxLength?: number;
  minLength?: number;
  min?: number;
  max?: number;
  step?: number;
  autoComplete?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
  currency?: string;
  precision?: number;
  showClearButton?: boolean;
  formatOnBlur?: boolean;
  inputProps?: Record<string, any>;
}

export const FormInput: React.FC<FormInputProps> = memo(({
  type = 'text',
  value,
  defaultValue,
  placeholder,
  onChange,
  onBlur,
  onFocus,
  leftIcon,
  rightIcon,
  leftAddon,
  rightAddon,
  maxLength,
  minLength,
  min,
  max,
  step,
  autoComplete,
  autoFocus,
  readOnly,
  currency = 'USD',
  precision: _precision = 2,
  showClearButton = false,
  formatOnBlur = false,
  inputProps = {},
  size = 'md',
  ...fieldProps
}) => {
  // Memoized color values
  const placeholderColor = useColorModeValue('gray.400', 'gray.500');
  const focusBorderColor = useColorModeValue('blue.500', 'blue.300');
  const errorBorderColor = useColorModeValue('red.500', 'red.300');

  // Memoized input type and formatting logic
  const { inputType, formattedValue, inputMode } = useMemo(() => {
    let inputType = type;
    let inputMode: string | undefined;
    let formattedValue = value;

    switch (type) {
      case 'currency':
        inputType = 'text';
        inputMode = 'decimal';
        if (typeof value === 'number' && !isNaN(value)) {
          formattedValue = FinancialPerformanceUtils.formatCurrency(value, currency);
        }
        break;
      case 'percentage':
        inputType = 'text';
        inputMode = 'decimal';
        if (typeof value === 'number' && !isNaN(value)) {
          formattedValue = FinancialPerformanceUtils.formatPercentage(value);
        }
        break;
      case 'number':
        inputMode = 'numeric';
        break;
      case 'tel':
        inputMode = 'tel';
        break;
      case 'email':
        inputMode = 'email';
        break;
      default:
        inputMode = 'text';
    }

    return { inputType, formattedValue, inputMode };
  }, [type, value, currency]);

  // Memoized change handler with formatting
  const handleChange = useMemoizedCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!onChange) return;

    let processedValue: string | number = event.target.value;

    // Process financial input types
    if (type === 'currency') {
      // Remove currency symbols and formatting for processing
      const numericValue = processedValue.replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(numericValue);
      processedValue = isNaN(parsed) ? '' : parsed;
    } else if (type === 'percentage') {
      // Remove percentage symbol for processing
      const numericValue = processedValue.replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(numericValue);
      processedValue = isNaN(parsed) ? '' : parsed;
    } else if (type === 'number') {
      const parsed = parseFloat(processedValue);
      processedValue = isNaN(parsed) ? '' : parsed;
    }

    onChange(processedValue, event);
  }, [onChange, type]);

  // Memoized blur handler with formatting
  const handleBlur = useMemoizedCallback((event: React.FocusEvent<HTMLInputElement>) => {
    if (formatOnBlur && onChange && value) {
      let formattedValue = value;
      
      if (type === 'currency' && typeof value === 'number') {
        formattedValue = FinancialPerformanceUtils.formatCurrency(value, currency);
      } else if (type === 'percentage' && typeof value === 'number') {
        formattedValue = FinancialPerformanceUtils.formatPercentage(value);
      }
      
      if (formattedValue !== value) {
        // Create a synthetic event for consistency
        const syntheticEvent = {
          ...event,
          target: { ...event.target, value: formattedValue }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(formattedValue, syntheticEvent);
      }
    }

    if (onBlur) {
      onBlur(event);
    }
  }, [formatOnBlur, onChange, onBlur, value, type, currency]);

  // Memoized clear handler
  const handleClear = useMemoizedCallback(() => {
    if (onChange) {
      const syntheticEvent = {
        target: { value: '' }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange('', syntheticEvent);
    }
  }, [onChange]);

  // Memoized clear button
  const clearButton = useMemo(() => {
    if (!showClearButton || !value || readOnly) return null;
    
    return (
      <IconButton
        aria-label="Clear input"
        icon={<Text fontSize="lg">×</Text>}
        size="xs"
        variant="ghost"
        onClick={handleClear}
        tabIndex={-1}
      />
    );
  }, [showClearButton, value, readOnly, handleClear]);

  // Memoized input element
  const inputElement = useMemo(() => {
    const baseProps = {
      type: inputType,
      value: formattedValue,
      defaultValue,
      placeholder,
      onChange: handleChange,
      onBlur: handleBlur,
      onFocus,
      maxLength,
      minLength,
      min,
      max,
      step,
      autoComplete,
      autoFocus,
      readOnly,
      size,
      focusBorderColor,
      errorBorderColor,
      _placeholder: { color: placeholderColor },
      fontVariantNumeric: type === 'currency' || type === 'number' || type === 'percentage' 
        ? 'lining-nums tabular-nums' 
        : undefined,
      inputMode: inputMode as any,
      ...inputProps,
    };

    // Wrap in InputGroup if we have addons or icons
    if (leftIcon || rightIcon || leftAddon || rightAddon || clearButton) {
      return (
        <InputGroup size={size}>
          {leftAddon && <InputLeftAddon>{leftAddon}</InputLeftAddon>}
          {leftIcon && <InputLeftElement>{leftIcon}</InputLeftElement>}
          
          <Input {...baseProps} />
          
          {(rightIcon || clearButton) && (
            <InputRightElement>
              <Fragment>
                {clearButton}
                {rightIcon}
              </Fragment>
            </InputRightElement>
          )}
          {rightAddon && <InputRightAddon>{rightAddon}</InputRightAddon>}
        </InputGroup>
      );
    }

    return <Input {...baseProps} />;
  }, [
    inputType,
    formattedValue,
    defaultValue,
    placeholder,
    handleChange,
    handleBlur,
    onFocus,
    maxLength,
    minLength,
    min,
    max,
    step,
    autoComplete,
    autoFocus,
    readOnly,
    size,
    focusBorderColor,
    errorBorderColor,
    placeholderColor,
    inputMode,
    inputProps,
    leftIcon,
    rightIcon,
    leftAddon,
    rightAddon,
    clearButton,
    type,
  ]);

  return (
    <FormField {...fieldProps} size={size}>
      {inputElement}
    </FormField>
  );
});

FormInput.displayName = 'FormInput';

/**
 * Currency Input Component
 */
export const CurrencyInput: React.FC<Omit<FormInputProps, 'type'>> = memo((props) => (
  <FormInput {...props} type="currency" formatOnBlur showClearButton />
));

CurrencyInput.displayName = 'CurrencyInput';

/**
 * Percentage Input Component
 */
export const PercentageInput: React.FC<Omit<FormInputProps, 'type'>> = memo((props) => (
  <FormInput {...props} type="percentage" formatOnBlur showClearButton />
));

PercentageInput.displayName = 'PercentageInput';

/**
 * Number Input Component
 */
export const NumberInput: React.FC<Omit<FormInputProps, 'type'>> = memo((props) => (
  <FormInput {...props} type="number" showClearButton />
));

NumberInput.displayName = 'NumberInput';

export default FormInput;
