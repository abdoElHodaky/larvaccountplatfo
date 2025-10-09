import React from 'react';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
    disabled?: boolean;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
}

function PrimaryButton({ 
    className = '', 
    disabled = false, 
    children, 
    variant = 'primary',
    size = 'md',
    loading = false,
    ...props 
}: PrimaryButtonProps) {
    const baseClasses = 'inline-flex items-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition ease-in-out duration-150';
    
    const variantClasses = {
        primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white border border-transparent',
        secondary: 'bg-white hover:bg-gray-50 focus:ring-blue-500 text-gray-700 border border-gray-300',
        danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white border border-transparent',
        success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white border border-transparent',
    };

    const sizeClasses = {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    const disabledClasses = disabled || loading 
        ? 'opacity-50 cursor-not-allowed' 
        : '';

    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`;

    return (
        <button 
            {...props} 
            className={classes}
            disabled={disabled || loading}
        >
            {loading && (
                <svg 
                    className="animate-spin -ml-1 mr-3 h-5 w-5" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                >
                    <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                    />
                    <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}
            {children}
        </button>
    );
}

export { PrimaryButton };
export default PrimaryButton;
