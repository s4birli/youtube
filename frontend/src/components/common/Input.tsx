import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, fullWidth = false, className = '', ...props }, ref) => {
        const baseClasses = 'px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out';
        const errorClasses = error ? 'border-red-500' : 'border-gray-300';
        const widthClass = fullWidth ? 'w-full' : '';

        return (
            <div className={`mb-4 ${widthClass}`}>
                {label && (
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`${baseClasses} ${errorClasses} ${className}`}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-sm text-red-600">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input; 