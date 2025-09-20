
import React, { useState } from 'react';

const App: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [status, setStatus] = useState('Ready to protect');

    const handleStartMonitoring = () => {
        // Request microphone access
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
                setIsListening(true);
                setStatus('Listening for threats...');
                
                // Simulate stopping after 10 seconds for demo
                setTimeout(() => {
                    setIsListening(false);
                    setStatus('Analysis complete - No threats detected');
                }, 10000);
            })
            .catch(() => {
                setStatus('Microphone access required');
            });
    };

    const handleReset = () => {
        setIsListening(false);
        setStatus('Ready to protect');
    };

    return (
        <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
            <div className="card max-w-md w-full text-center animate-fade-in">
                <div className="mb-6">
                    <div className="w-20 h-20 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.917l9 3 9-3a12.02 12.02 0 00-2.382-9.971z" />
                        </svg>
                    </div>
                    <h1 className="heading-primary text-5xl">Senior Guard</h1>
                    <p className="text-body text-xl">Your Personal Scam Detector</p>
                </div>
                
                <div className="space-y-4">
                    {!isListening && status === 'Ready to protect' && (
                        <button 
                            className="btn-primary w-full text-lg py-4"
                            onClick={handleStartMonitoring}
                        >
                            🎤 Start Monitoring
                        </button>
                    )}
                    
                    {isListening && (
                        <button 
                            className="btn-secondary w-full text-lg py-4"
                            disabled
                        >
                            🎤 Listening...
                        </button>
                    )}
                    
                    {!isListening && status !== 'Ready to protect' && (
                        <button 
                            className="btn-primary w-full text-lg py-4"
                            onClick={handleReset}
                        >
                            🎤 Start New Scan
                        </button>
                    )}
                    
                    <button className="btn-secondary w-full text-lg py-4">
                        📊 View Analysis
                    </button>
                </div>
                
                <div className="mt-8 p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <p className="text-sm text-gray-600">
                        <span className="font-semibold text-secondary">Status:</span> {status}
                    </p>
                </div>
                
                <div className="mt-8 p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <p className="text-sm text-gray-600">
                        <span className="font-semibold text-secondary">Protect yourself</span> from phone scams with AI-powered detection
                    </p>
                </div>
            </div>
        </div>
    );
};

export default App;
