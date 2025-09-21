
import React from 'react';

interface ActionButtonProps {
    onClick: () => void;
    label: string;
    variant: 'primary' | 'secondary' | 'danger' | 'warning' | 'success';
    disabled?: boolean;
    icon?: React.ReactNode;
    size?: 'small' | 'medium' | 'large';
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
    onClick, 
    label, 
    variant = 'primary', 
    disabled = false, 
    icon,
    size = 'medium' 
}) => {
    const variantClasses = {
        primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-400',
        danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        warning: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400',
        success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
    };

    const sizeClasses = {
        small: 'py-2 px-4 text-sm',
        medium: 'py-4 px-6 text-base',
        large: 'py-6 px-8 text-lg'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                w-full text-white font-semibold rounded-xl
                shadow-lg transform transition-all duration-300 
                ease-in-out hover:scale-105 hover:shadow-xl 
                focus:outline-none focus:ring-4 focus:ring-opacity-75 
                disabled:opacity-50 disabled:cursor-not-allowed 
                disabled:scale-100 disabled:shadow-none
                flex items-center justify-center space-x-2
                ${variantClasses[variant]}
                ${sizeClasses[size]}
            `}
        >
            {icon && <span className="w-5 h-5">{icon}</span>}
            <span>{label}</span>
        </button>
    );
};

export default ActionButton;
