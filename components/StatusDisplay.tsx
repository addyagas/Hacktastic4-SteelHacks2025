
import React from 'react';
import { AppState } from '../types';
import { ShieldCheckIcon, ShieldExclamationIcon, MicrophoneIcon, MagnifyingGlassIcon, ExclamationCircleIcon } from './Icons';

interface StatusDisplayProps {
    state: AppState;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ state }) => {
    const statusConfig = {
        [AppState.IDLE]: {
            text: 'Ready to Protect',
            color: 'text-gray-500',
            icon: <ShieldCheckIcon className="w-16 h-16" />,
        },
        [AppState.LISTENING]: {
            text: 'Listening...',
            color: 'text-blue-600',
            icon: <MicrophoneIcon className="w-16 h-16 animate-pulse" />,
        },
        [AppState.ANALYZING]: {
            text: 'Analyzing Conversation...',
            color: 'text-purple-600',
            icon: <MagnifyingGlassIcon className="w-16 h-16 animate-spin" />,
        },
        [AppState.THREAT_DETECTED]: {
            text: 'Threat Detected!',
            color: 'text-red-600',
            icon: <ShieldExclamationIcon className="w-16 h-16" />,
        },
        [AppState.SAFE]: {
            text: 'Conversation Seems Safe',
            color: 'text-green-600',
            icon: <ShieldCheckIcon className="w-16 h-16" />,
        },
        [AppState.ERROR]: {
            text: 'An Error Occurred',
            color: 'text-red-700',
            icon: <ExclamationCircleIcon className="w-16 h-16" />,
        },
    };

    const config = statusConfig[state];

    return (
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className={`transition-colors duration-300 ${config.color}`}>
                {config.icon}
            </div>
            <p className={`text-3xl sm:text-4xl font-bold transition-colors duration-300 ${config.color}`}>{config.text}</p>
        </div>
    );
};

export default StatusDisplay;
