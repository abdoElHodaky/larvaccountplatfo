import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    className?: string;
    isFocused?: boolean;
    hasError?: boolean;
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
    { type = 'text', className = '', isFocused = false, hasError = false, ...props },
    ref
) {
    const input = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => input.current!);

    useEffect(() => {
        if (isFocused) {
            input.current?.focus();
        }
    }, [isFocused]);

    const baseClasses =
        'block w-full rounded-md shadow-sm transition duration-150 ease-in-out sm:text-sm';

    const stateClasses = hasError
        ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500'
        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500';

    const classes = `${baseClasses} ${stateClasses} ${className}`;

    return <input {...props} type={type} className={classes} ref={input} />;
});

export { TextInput };
export default TextInput;
