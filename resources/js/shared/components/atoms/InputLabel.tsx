import React from 'react';

interface InputLabelProps {
    value?: string;
    className?: string;
    children?: React.ReactNode;
    htmlFor?: string;
    required?: boolean;
}

function InputLabel({
    value,
    className = '',
    children,
    htmlFor,
    required = false,
    ...props
}: InputLabelProps) {
    return (
        <label
            {...props}
            className={`block text-sm font-medium text-gray-700 ${className}`}
            htmlFor={htmlFor}
        >
            <span className='flex items-center space-x-1'>
                <span>{value ? value : children}</span>
                {required && (
                    <span className='text-red-500' title='Required field'>
                        *
                    </span>
                )}
            </span>
        </label>
    );
}

export { InputLabel };
export default InputLabel;
