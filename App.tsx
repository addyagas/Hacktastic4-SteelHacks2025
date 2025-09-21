import React, { useState } from 'react';

const App: React.FC = () => {
    const [status, setStatus] = useState('Ready to protect');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [threatLevel, setThreatLevel] = useState<'safe' | 'warning' | 'danger' | null>(null);

    const handleAnalyze = () => {
        setIsAnalyzing(true);
        setStatus('Analyzing potential threats...');
        
        // Simulated analysis - replace with actual analysis logic
        setTimeout(() => {
            const levels = ['safe', 'warning', 'danger'] as const;
            const result = levels[Math.floor(Math.random() * levels.length)];
            setThreatLevel(result);
            setStatus('Analysis complete');
            setIsAnalyzing(false);
        }, 2000);
    };

    const handleReset = () => {
        setIsAnalyzing(false);
        setStatus('Ready to protect');
        setThreatLevel(null);
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
                    {!isAnalyzing && (
                        <button 
                            className="btn-primary w-full text-lg py-4"
                            onClick={handleAnalyze}
                        >
                            Analyze Potential Threats
                        </button>
                    )}

                    {isAnalyzing && (
                        <button 
                            className="btn-secondary w-full text-lg py-4"
                            disabled
                        >
                            Analyzing...
                        </button>
                    )}

                    {threatLevel && !isAnalyzing && (
                        <div className={`mt-6 p-4 rounded-xl border ${
                            threatLevel === 'safe' ? 'bg-green-50 border-green-200' :
                            threatLevel === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                            'bg-red-50 border-red-200'
                        }`}>
                            <p className="text-lg font-semibold mb-2">
                                {threatLevel === 'safe' ? '✅ Safe' :
                                 threatLevel === 'warning' ? '⚠️ Warning' :
                                 '❌ Danger'}
                            </p>
                            <p className="text-sm text-gray-600">
                                {threatLevel === 'safe' ? 'No threats detected' :
                                 threatLevel === 'warning' ? 'Potential scam detected' :
                                 'High risk of scam detected'}
                            </p>
                            <button 
                                className="btn-primary w-full text-lg py-2 mt-4"
                                onClick={handleReset}
                            >
                                Start New Analysis
                            </button>
                        </div>
                    )}
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
