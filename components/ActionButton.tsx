
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
        green: 'bg-gradient-secondary hover:shadow-xl focus:ring-orange-500',
        red: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:ring-red-500',
        blue: 'bg-gradient-primary hover:shadow-xl focus:ring-blue-500',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full text-white font-semibold py-6 px-8 rounded-2xl shadow-lg transform transition-all duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center space-x-4 ${colorClasses[color]}`}
        >
            {icon && <span className="w-8 h-8">{icon}</span>}
            <span className="text-3xl sm:text-4xl">{label}</span>
        </button>
    );
};

export default ActionButton;
