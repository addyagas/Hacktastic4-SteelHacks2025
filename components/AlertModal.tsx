
import React from 'react';
import { ThreatResult } from '../types';
import { ShieldExclamationIcon } from './Icons';

interface AlertModalProps {
    result: ThreatResult;
    onClose: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({ result, onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 text-center transform transition-all scale-95 hover:scale-100 duration-300 border border-orange-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-secondary mb-6">
                    <ShieldExclamationIcon className="h-16 w-16 text-white" />
                </div>
                <h3 className="text-4xl font-bold text-primary mb-4">Potential Threat Detected!</h3>
                <p className="text-2xl text-gray-700 mb-6">
                    Threat Level: <strong className="text-secondary">{result.score}%</strong>
                </p>
                
                <div className="bg-orange-50 p-6 rounded-2xl text-left border border-orange-200">
                    <h4 className="text-xl font-semibold text-primary mb-3">AI Explanation:</h4>
                    <p className="text-lg text-gray-600 leading-relaxed">{result.explanation}</p>
                </div>
                
                <div className="mt-8">
                    <button
                        onClick={onClose}
                        className="w-full bg-gradient-primary text-white font-semibold py-4 px-6 rounded-2xl text-xl hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-75 transition-all duration-300 transform hover:scale-105"
                    >
                        Okay, I Understand
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertModal;
