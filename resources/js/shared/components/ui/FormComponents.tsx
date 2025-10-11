/**
 * Form Components
 * Comprehensive form system with validation and accessibility
 * Built with HeadlessUI and unified design patterns
 */

import React, { forwardRef, useState, useRef, ReactNode } from 'react';
import { Switch } from '@headlessui/react';
import { 
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  DocumentIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/20/solid';
import { cn, getSizeClasses, getValidationClasses, getTransitionClasses } from './utils';
import { InputProps, FormFieldProps, Size } from './types';

// =============================================================================
// FORM FIELD WRAPPER
// =============================================================================

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ 
    label, 
    description, 
    error, 
    required, 
    optional, 
    children, 
    className,
    ...props 
  }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
            {optional && <span className="text-gray-400 ml-1">(optional)</span>}
          </label>
        )}
        
        {children}
        
        {description && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
        
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

// =============================================================================
// INPUT COMPONENT
// =============================================================================

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    size = 'md',
    label,
    description,
    error,
    required,
    optional,
    leftIcon,
    rightIcon,
    leftElement,
    rightElement,
    className,
    ...props 
  }, ref) => {
    const sizeStyles = getSizeClasses(size);
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = props.type === 'password';
    
    const inputClasses = cn(
      'block w-full rounded-md border shadow-sm',
      'placeholder-gray-400 dark:placeholder-gray-500',
      'bg-white dark:bg-gray-800',
      'text-gray-900 dark:text-gray-100',
      sizeStyles.text,
      sizeStyles.padding,
      sizeStyles.height,
      getValidationClasses(error),
      getTransitionClasses('colors'),
      leftIcon || leftElement ? 'pl-10' : '',
      rightIcon || rightElement || isPassword ? 'pr-10' : '',
      props.disabled && 'opacity-50 cursor-not-allowed',
      className
    );

    const input = (
      <div className="relative">
        {(leftIcon || leftElement) && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftElement || (
              leftIcon && React.cloneElement(leftIcon as React.ReactElement, {
                className: cn(sizeStyles.icon, 'text-gray-400')
              })
            )}
          </div>
        )}
        
        <input
          ref={ref}
          type={isPassword ? (showPassword ? 'text' : 'password') : props.type}
          className={inputClasses}
          {...props}
        />
        
        {(rightIcon || rightElement || isPassword) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {isPassword ? (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? (
                  <EyeSlashIcon className={sizeStyles.icon} />
                ) : (
                  <EyeIcon className={sizeStyles.icon} />
                )}
              </button>
            ) : (
              rightElement || (
                rightIcon && React.cloneElement(rightIcon as React.ReactElement, {
                  className: cn(sizeStyles.icon, 'text-gray-400')
                })
              )
            )}
          </div>
        )}
      </div>
    );

    if (label || description || error) {
      return (
        <FormField
          label={label}
          description={description}
          error={error}
          required={required}
          optional={optional}
        >
          {input}
        </FormField>
      );
    }

    return input;
  }
);

Input.displayName = 'Input';

// =============================================================================
// NUMBER INPUT COMPONENT
// =============================================================================

interface NumberInputProps extends Omit<InputProps, 'type' | 'onChange'> {
  value?: number;
  onChange?: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  format?: 'decimal' | 'integer' | 'percentage';
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ 
    value,
    onChange,
    min,
    max,
    step = 1,
    precision = 2,
    format = 'decimal',
    ...props 
  }, ref) => {
    const [displayValue, setDisplayValue] = useState(
      value !== undefined ? formatNumber(value, format, precision) : ''
    );

    function formatNumber(num: number, fmt: string, prec: number): string {
      switch (fmt) {
        case 'percentage':
          return (num * 100).toFixed(prec) + '%';
        case 'integer':
          return Math.round(num).toString();
        case 'decimal':
        default:
          return num.toFixed(prec);
      }
    }

    function parseNumber(str: string, fmt: string): number | undefined {
      const cleaned = str.replace(/[^\d.-]/g, '');
      const num = parseFloat(cleaned);
      
      if (isNaN(num)) return undefined;
      
      return fmt === 'percentage' ? num / 100 : num;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setDisplayValue(inputValue);
      
      const numericValue = parseNumber(inputValue, format);
      onChange?.(numericValue);
    };

    const handleBlur = () => {
      if (value !== undefined) {
        setDisplayValue(formatNumber(value, format, precision));
      }
    };

    return (
      <Input
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        inputMode="decimal"
        {...props}
      />
    );
  }
);

NumberInput.displayName = 'NumberInput';

// =============================================================================
// CURRENCY INPUT COMPONENT
// =============================================================================

interface CurrencyInputProps extends Omit<NumberInputProps, 'format'> {
  currency?: string;
  locale?: string;
  showSymbol?: boolean;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ 
    currency = 'USD',
    locale = 'en-US',
    showSymbol = true,
    value,
    onChange,
    ...props 
  }, ref) => {
    const currencySymbol = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).formatToParts(0).find(part => part.type === 'currency')?.value || '$';

    return (
      <NumberInput
        ref={ref}
        value={value}
        onChange={onChange}
        leftElement={
          showSymbol ? (
            <span className="text-gray-500 text-sm font-medium">
              {currencySymbol}
            </span>
          ) : undefined
        }
        precision={2}
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

// =============================================================================
// TEXTAREA COMPONENT
// =============================================================================

interface TextAreaProps extends FormFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  rows?: number;
  autoResize?: boolean;
  maxLength?: number;
  size?: Size;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ 
    size = 'md',
    label,
    description,
    error,
    required,
    optional,
    value,
    onChange,
    rows = 3,
    autoResize = false,
    maxLength,
    className,
    ...props 
  }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const sizeStyles = getSizeClasses(size);

    React.useImperativeHandle(ref, () => textareaRef.current!);

    const adjustHeight = () => {
      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      }
    };

    React.useEffect(() => {
      adjustHeight();
    }, [value, autoResize]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e.target.value);
      adjustHeight();
    };

    const textareaClasses = cn(
      'block w-full rounded-md border shadow-sm resize-none',
      'placeholder-gray-400 dark:placeholder-gray-500',
      'bg-white dark:bg-gray-800',
      'text-gray-900 dark:text-gray-100',
      sizeStyles.text,
      sizeStyles.padding,
      getValidationClasses(error),
      getTransitionClasses('colors'),
      props.disabled && 'opacity-50 cursor-not-allowed',
      className
    );

    const textarea = (
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          rows={autoResize ? 1 : rows}
          className={textareaClasses}
          {...props}
        />
        {maxLength && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {value?.length || 0}/{maxLength}
          </div>
        )}
      </div>
    );

    if (label || description || error) {
      return (
        <FormField
          label={label}
          description={description}
          error={error}
          required={required}
          optional={optional}
        >
          {textarea}
        </FormField>
      );
    }

    return textarea;
  }
);

TextArea.displayName = 'TextArea';

// =============================================================================
// CHECKBOX COMPONENT
// =============================================================================

interface CheckboxProps extends FormFieldProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  indeterminate?: boolean;
  size?: Size;
  disabled?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ 
    size = 'md',
    label,
    description,
    error,
    checked,
    onChange,
    indeterminate,
    disabled,
    className,
    ...props 
  }, ref) => {
    const sizeStyles = getSizeClasses(size);
    const checkboxRef = useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => checkboxRef.current!);

    React.useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.indeterminate = indeterminate || false;
      }
    }, [indeterminate]);

    const checkboxClasses = cn(
      'rounded border-gray-300 text-primary-600 shadow-sm',
      'focus:border-primary-500 focus:ring-primary-500',
      'dark:border-gray-600 dark:bg-gray-800',
      sizeStyles.icon,
      disabled && 'opacity-50 cursor-not-allowed',
      error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
      className
    );

    const checkbox = (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={checkboxRef}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange?.(e.target.checked)}
            disabled={disabled}
            className={checkboxClasses}
            {...props}
          />
        </div>
        {label && (
          <div className="ml-3 text-sm">
            <label className="font-medium text-gray-700 dark:text-gray-300">
              {label}
            </label>
            {description && (
              <p className="text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
        )}
      </div>
    );

    if (error) {
      return (
        <FormField error={error}>
          {checkbox}
        </FormField>
      );
    }

    return checkbox;
  }
);

Checkbox.displayName = 'Checkbox';

// =============================================================================
// DATE PICKER COMPONENT
// =============================================================================

interface DatePickerProps extends FormFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  min?: string;
  max?: string;
  size?: Size;
  disabled?: boolean;
  placeholder?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ 
    size = 'md',
    label,
    description,
    error,
    required,
    optional,
    value,
    onChange,
    placeholder = 'Select date',
    ...props 
  }, ref) => {
    return (
      <Input
        ref={ref}
        type="date"
        size={size}
        label={label}
        description={description}
        error={error}
        required={required}
        optional={optional}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        leftIcon={<CalendarIcon />}
        {...props}
      />
    );
  }
);

DatePicker.displayName = 'DatePicker';

// =============================================================================
// TIME PICKER COMPONENT
// =============================================================================

interface TimePickerProps extends FormFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  size?: Size;
  disabled?: boolean;
  placeholder?: string;
}

export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
  ({ 
    size = 'md',
    label,
    description,
    error,
    required,
    optional,
    value,
    onChange,
    placeholder = 'Select time',
    ...props 
  }, ref) => {
    return (
      <Input
        ref={ref}
        type="time"
        size={size}
        label={label}
        description={description}
        error={error}
        required={required}
        optional={optional}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        leftIcon={<ClockIcon />}
        {...props}
      />
    );
  }
);

TimePicker.displayName = 'TimePicker';

// =============================================================================
// FILE UPLOAD COMPONENT
// =============================================================================

interface FileUploadProps extends FormFieldProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  onFileSelect?: (files: File[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  disabled?: boolean;
  dragAndDrop?: boolean;
}

export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  ({ 
    label,
    description,
    error,
    required,
    optional,
    accept,
    multiple,
    maxSize,
    onFileSelect,
    onUpload,
    disabled,
    dragAndDrop = true,
    className,
    ...props 
  }, ref) => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => fileInputRef.current!);

    const handleFileSelect = (files: FileList | null) => {
      if (!files) return;
      
      const fileArray = Array.from(files);
      
      // Validate file size
      if (maxSize) {
        const oversizedFiles = fileArray.filter(file => file.size > maxSize);
        if (oversizedFiles.length > 0) {
          // Handle error - could emit error event or show toast
          return;
        }
      }
      
      onFileSelect?.(fileArray);
      
      if (onUpload) {
        handleUpload(fileArray);
      }
    };

    const handleUpload = async (files: File[]) => {
      setUploading(true);
      setUploadProgress(0);
      
      try {
        await onUpload(files);
        setUploadProgress(100);
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setUploading(false);
        setTimeout(() => setUploadProgress(0), 1000);
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      if (disabled) return;
      
      handleFileSelect(e.dataTransfer.files);
    };

    const uploadArea = (
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 text-center',
          'transition-colors duration-200',
          isDragging 
            ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20' 
            : 'border-gray-300 dark:border-gray-600',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800',
          className
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
          className="sr-only"
          {...props}
        />
        
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        
        <div className="mt-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            Choose files
          </button>
          {dragAndDrop && (
            <span className="text-gray-500"> or drag and drop</span>
          )}
        </div>
        
        {accept && (
          <p className="mt-2 text-xs text-gray-500">
            Accepted formats: {accept}
          </p>
        )}
        
        {maxSize && (
          <p className="text-xs text-gray-500">
            Max size: {(maxSize / 1024 / 1024).toFixed(1)}MB
          </p>
        )}
        
        {uploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}
      </div>
    );

    if (label || description || error) {
      return (
        <FormField
          label={label}
          description={description}
          error={error}
          required={required}
          optional={optional}
        >
          {uploadArea}
        </FormField>
      );
    }

    return uploadArea;
  }
);

FileUpload.displayName = 'FileUpload';

// =============================================================================
// EXPORTS
// =============================================================================

export {
  FormField,
  Input,
  NumberInput,
  CurrencyInput,
  TextArea,
  Checkbox,
  DatePicker,
  TimePicker,
  FileUpload,
};

// Export types
export type {
  NumberInputProps,
  CurrencyInputProps,
  TextAreaProps,
  CheckboxProps,
  DatePickerProps,
  TimePickerProps,
  FileUploadProps,
};
