
import React from 'react';

interface ActionButtonProps {
    onClick: () => void;
    label: string;
    color: 'green' | 'red' | 'blue';
    disabled?: boolean;
    icon?: React.ReactNode;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, label, color, disabled = false, icon }) => {
    const colorClasses = {
        green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full text-white font-bold py-6 px-8 rounded-full shadow-lg transform transition-transform duration-150 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center space-x-4 ${colorClasses[color]}`}
        >
            {icon && <span className="w-8 h-8">{icon}</span>}
            <span className="text-3xl sm:text-4xl">{label}</span>
        </button>
    );
};

export default ActionButton;
