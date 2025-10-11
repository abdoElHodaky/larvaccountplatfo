import { useState, useMemo, useRef } from 'react';
import { useMemoizedCallback, useDebounce } from '@/shared/hooks';

/**
 * Form Validation Hook
 * Performance-optimized form validation with async support
 */

export interface ValidationRule {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    email?: boolean;
    url?: boolean;
    currency?: boolean;
    percentage?: boolean;
    custom?: (value: any) => string | null | Promise<string | null>;
    message?: string;
}

export interface ValidationRules {
    [fieldName: string]: ValidationRule | ValidationRule[];
}

export interface FormErrors {
    [fieldName: string]: string | string[];
}

export interface FormTouched {
    [fieldName: string]: boolean;
}

export interface UseFormValidationOptions {
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    debounceMs?: number;
    stopOnFirstError?: boolean;
}

export interface UseFormValidationReturn {
    errors: FormErrors;
    touched: FormTouched;
    isValid: boolean;
    isValidating: boolean;
    validate: (fieldName?: string) => Promise<boolean>;
    validateField: (fieldName: string, value: any) => Promise<string | string[] | null>;
    setFieldError: (fieldName: string, error: string | string[] | null) => void;
    setFieldTouched: (fieldName: string, touched?: boolean) => void;
    clearErrors: (fieldName?: string) => void;
    reset: () => void;
}

export function useFormValidation(
    rules: ValidationRules,
    values: Record<string, any>,
    options: UseFormValidationOptions = {}
): UseFormValidationReturn {
    const { validateOnChange = true, debounceMs = 300, stopOnFirstError = false } = options;

    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<FormTouched>({});
    const [isValidating, setIsValidating] = useState(false);

    const validationTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const abortControllers = useRef<Map<string, AbortController>>(new Map());

    // Debounced values for validation
    const debouncedValues = useDebounce(values, debounceMs);

    // Memoized validation functions
    const validateSingleRule = useMemoizedCallback(
        async (
            value: any,
            rule: ValidationRule,
            fieldName: string,
            signal?: AbortSignal
        ): Promise<string | null> => {
            // Required validation
            if (rule.required && (value === undefined || value === null || value === '')) {
                return rule.message || `${fieldName} is required`;
            }

            // Skip other validations if value is empty and not required
            if (!rule.required && (value === undefined || value === null || value === '')) {
                return null;
            }

            const stringValue = String(value);

            // Length validations
            if (rule.minLength && stringValue.length < rule.minLength) {
                return rule.message || `${fieldName} must be at least ${rule.minLength} characters`;
            }

            if (rule.maxLength && stringValue.length > rule.maxLength) {
                return (
                    rule.message || `${fieldName} must be no more than ${rule.maxLength} characters`
                );
            }

            // Numeric validations
            const numericValue = Number(value);
            if (!isNaN(numericValue)) {
                if (rule.min !== undefined && numericValue < rule.min) {
                    return rule.message || `${fieldName} must be at least ${rule.min}`;
                }

                if (rule.max !== undefined && numericValue > rule.max) {
                    return rule.message || `${fieldName} must be no more than ${rule.max}`;
                }
            }

            // Pattern validation
            if (rule.pattern && !rule.pattern.test(stringValue)) {
                return rule.message || `${fieldName} format is invalid`;
            }

            // Email validation
            if (rule.email) {
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(stringValue)) {
                    return rule.message || `${fieldName} must be a valid email address`;
                }
            }

            // URL validation
            if (rule.url) {
                try {
                    new URL(stringValue);
                } catch {
                    return rule.message || `${fieldName} must be a valid URL`;
                }
            }

            // Currency validation
            if (rule.currency) {
                const currencyPattern = /^\$?[\d,]+\.?\d{0,2}$/;
                if (!currencyPattern.test(stringValue.replace(/\s/g, ''))) {
                    return rule.message || `${fieldName} must be a valid currency amount`;
                }
            }

            // Percentage validation
            if (rule.percentage) {
                const percentagePattern = /^\d+\.?\d{0,2}%?$/;
                if (!percentagePattern.test(stringValue.replace(/\s/g, ''))) {
                    return rule.message || `${fieldName} must be a valid percentage`;
                }
            }

            // Custom validation
            if (rule.custom) {
                if (signal?.aborted) return null;

                try {
                    const result = await rule.custom(value);
                    return result;
                } catch (error) {
                    if (signal?.aborted) return null;
                    return rule.message || `${fieldName} validation failed`;
                }
            }

            return null;
        },
        []
    );

    // Validate a single field
    const validateField = useMemoizedCallback(
        async (fieldName: string, value: any): Promise<string | string[] | null> => {
            const fieldRules = rules[fieldName];
            if (!fieldRules) return null;

            // Cancel previous validation for this field
            const existingController = abortControllers.current.get(fieldName);
            if (existingController) {
                existingController.abort();
            }

            // Create new abort controller
            const controller = new AbortController();
            abortControllers.current.set(fieldName, controller);

            try {
                const rulesToValidate = Array.isArray(fieldRules) ? fieldRules : [fieldRules];
                const validationPromises = rulesToValidate.map((rule) =>
                    validateSingleRule(value, rule, fieldName, controller.signal)
                );

                const results = await Promise.all(validationPromises);

                if (controller.signal.aborted) return null;

                const errors = results.filter(Boolean) as string[];

                if (stopOnFirstError && errors.length > 0) {
                    return errors[0];
                }

                return errors.length > 0 ? (errors.length === 1 ? errors[0] : errors) : null;
            } catch (error) {
                if (controller.signal.aborted) return null;
                throw error;
            } finally {
                abortControllers.current.delete(fieldName);
            }
        },
        [rules, validateSingleRule, stopOnFirstError]
    );

    // Validate all fields or a specific field
    const validate = useMemoizedCallback(
        async (fieldName?: string): Promise<boolean> => {
            setIsValidating(true);

            try {
                const fieldsToValidate = fieldName ? [fieldName] : Object.keys(rules);
                const validationPromises = fieldsToValidate.map(async (field) => {
                    const error = await validateField(field, values[field]);
                    return { field, error };
                });

                const results = await Promise.all(validationPromises);

                const newErrors: FormErrors = { ...errors };
                let hasErrors = false;

                results.forEach(({ field, error }) => {
                    if (error) {
                        newErrors[field] = error;
                        hasErrors = true;
                    } else {
                        delete newErrors[field];
                    }
                });

                setErrors(newErrors);
                return !hasErrors;
            } finally {
                setIsValidating(false);
            }
        },
        [rules, values, errors, validateField]
    );

    // Set field error manually
    const setFieldError = useMemoizedCallback(
        (fieldName: string, error: string | string[] | null) => {
            setErrors((prev) => {
                const newErrors = { ...prev };
                if (error) {
                    newErrors[fieldName] = error;
                } else {
                    delete newErrors[fieldName];
                }
                return newErrors;
            });
        },
        []
    );

    // Set field touched state
    const setFieldTouched = useMemoizedCallback((fieldName: string, isTouched: boolean = true) => {
        setTouched((prev) => ({
            ...prev,
            [fieldName]: isTouched,
        }));
    }, []);

    // Clear errors
    const clearErrors = useMemoizedCallback((fieldName?: string) => {
        if (fieldName) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        } else {
            setErrors({});
        }
    }, []);

    // Reset validation state
    const reset = useMemoizedCallback(() => {
        setErrors({});
        setTouched({});
        setIsValidating(false);

        // Cancel all pending validations
        abortControllers.current.forEach((controller) => controller.abort());
        abortControllers.current.clear();

        // Clear all timeouts
        validationTimeouts.current.forEach((timeout) => clearTimeout(timeout));
        validationTimeouts.current.clear();
    }, []);

    // Auto-validate on value changes
    useMemoizedCallback(() => {
        if (!validateOnChange) return;

        Object.keys(debouncedValues).forEach((fieldName) => {
            if (touched[fieldName] && rules[fieldName]) {
                const timeout = validationTimeouts.current.get(fieldName);
                if (timeout) {
                    clearTimeout(timeout);
                }

                const newTimeout = setTimeout(() => {
                    validateField(fieldName, debouncedValues[fieldName]).then((error) => {
                        setFieldError(fieldName, error);
                    });
                }, 100);

                validationTimeouts.current.set(fieldName, newTimeout);
            }
        });
    }, [debouncedValues, touched, rules, validateOnChange, validateField, setFieldError]);

    // Memoized computed values
    const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

    return {
        errors,
        touched,
        isValid,
        isValidating,
        validate,
        validateField,
        setFieldError,
        setFieldTouched,
        clearErrors,
        reset,
    };
}

export default useFormValidation;
