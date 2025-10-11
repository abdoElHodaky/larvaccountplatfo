import { useForm as useInertiaForm } from '@inertiajs/react';
import { useCallback, useMemo } from 'react';
import { router } from '@inertiajs/react';

export interface InertiaFormOptions {
    onSuccess?: (response?: any) => void;
    onError?: (errors: Record<string, string>) => void;
    onFinish?: () => void;
    preserveState?: boolean;
    preserveScroll?: boolean;
    replace?: boolean;
    only?: string[];
    except?: string[];
}

export interface UseInertiaFormReturn<T> {
    data: T;
    setData: (key: keyof T | Partial<T>, value?: any) => void;
    errors: Record<string, string>;
    hasErrors: boolean;
    processing: boolean;
    progress: { percentage: number } | null;
    wasSuccessful: boolean;
    recentlySuccessful: boolean;
    submit: (
        method: 'get' | 'post' | 'put' | 'patch' | 'delete',
        url: string,
        options?: InertiaFormOptions
    ) => void;
    get: (url: string, options?: InertiaFormOptions) => void;
    post: (url: string, options?: InertiaFormOptions) => void;
    put: (url: string, options?: InertiaFormOptions) => void;
    patch: (url: string, options?: InertiaFormOptions) => void;
    delete: (url: string, options?: InertiaFormOptions) => void;
    reset: (...fields: (keyof T)[]) => void;
    clearErrors: (...fields: string[]) => void;
    setError: (field: string, message: string) => void;
    isDirty: boolean;
    transform: (callback: (data: T) => any) => void;
}

/**
 * Enhanced Inertia.js form hook with additional utilities
 * Provides better TypeScript support and form management
 */
export function useInertiaForm<T extends Record<string, any>>(
    initialData: T
): UseInertiaFormReturn<T> {
    const form = useInertiaForm(initialData);

    // Enhanced setData function with better TypeScript support
    const setData = useCallback(
        (key: keyof T | Partial<T>, value?: any) => {
            if (typeof key === 'object') {
                // Handle partial object updates
                form.setData(key as any);
            } else {
                // Handle single field updates
                form.setData(key as string, value);
            }
        },
        [form]
    );

    // Check if form has any errors
    const hasErrors = useMemo(() => {
        return Object.keys(form.errors).length > 0;
    }, [form.errors]);

    // Check if form data has been modified
    const isDirty = useMemo(() => {
        return JSON.stringify(form.data) !== JSON.stringify(initialData);
    }, [form.data, initialData]);

    // Enhanced submit function with better error handling
    const submit = useCallback(
        (
            method: 'get' | 'post' | 'put' | 'patch' | 'delete',
            url: string,
            options: InertiaFormOptions = {}
        ) => {
            const {
                onSuccess,
                onError,
                onFinish,
                preserveState = true,
                preserveScroll = false,
                replace = false,
                only,
                except,
            } = options;

            form[method](url, {
                preserveState,
                preserveScroll,
                replace,
                only,
                except,
                onSuccess: (response) => {
                    onSuccess?.(response);
                },
                onError: (errors) => {
                    console.error('Form submission errors:', errors);
                    onError?.(errors);
                },
                onFinish: () => {
                    onFinish?.();
                },
            });
        },
        [form]
    );

    // Convenience methods for different HTTP methods
    const get = useCallback(
        (url: string, options?: InertiaFormOptions) => {
            submit('get', url, options);
        },
        [submit]
    );

    const post = useCallback(
        (url: string, options?: InertiaFormOptions) => {
            submit('post', url, options);
        },
        [submit]
    );

    const put = useCallback(
        (url: string, options?: InertiaFormOptions) => {
            submit('put', url, options);
        },
        [submit]
    );

    const patch = useCallback(
        (url: string, options?: InertiaFormOptions) => {
            submit('patch', url, options);
        },
        [submit]
    );

    const deleteMethod = useCallback(
        (url: string, options?: InertiaFormOptions) => {
            submit('delete', url, options);
        },
        [submit]
    );

    // Enhanced reset function
    const reset = useCallback(
        (...fields: (keyof T)[]) => {
            if (fields.length === 0) {
                form.reset();
            } else {
                form.reset(...(fields as string[]));
            }
        },
        [form]
    );

    // Set individual error
    const setError = useCallback(
        (field: string, message: string) => {
            form.setError(field, message);
        },
        [form]
    );

    // Clear specific errors
    const clearErrors = useCallback(
        (...fields: string[]) => {
            if (fields.length === 0) {
                form.clearErrors();
            } else {
                form.clearErrors(...fields);
            }
        },
        [form]
    );

    return {
        data: form.data,
        setData,
        errors: form.errors,
        hasErrors,
        processing: form.processing,
        progress: form.progress,
        wasSuccessful: form.wasSuccessful,
        recentlySuccessful: form.recentlySuccessful,
        submit,
        get,
        post,
        put,
        patch,
        delete: deleteMethod,
        reset,
        clearErrors,
        setError,
        isDirty,
        transform: form.transform,
    };
}

/**
 * Hook for handling file uploads with Inertia.js
 */
export function useInertiaFileUpload<T extends Record<string, any>>(
    initialData: T,
    uploadEndpoint: string
) {
    const form = useInertiaForm(initialData);

    const uploadFiles = useCallback(
        (files: FileList | File[], options: InertiaFormOptions = {}) => {
            const formData = new FormData();

            // Add existing form data
            Object.entries(form.data).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    formData.append(key, value);
                }
            });

            // Add files
            Array.from(files).forEach((file, index) => {
                formData.append(`files[${index}]`, file);
            });

            // Submit with form data
            router.post(uploadEndpoint, formData, {
                forceFormData: true,
                preserveState: options.preserveState ?? true,
                preserveScroll: options.preserveScroll ?? false,
                onSuccess: options.onSuccess,
                onError: options.onError,
                onFinish: options.onFinish,
            });
        },
        [form.data, uploadEndpoint]
    );

    return {
        ...form,
        uploadFiles,
    };
}
