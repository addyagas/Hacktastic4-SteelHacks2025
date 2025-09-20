import React from 'react';

const App: React.FC = () => {
  // Handlers for button clicks
  const handleStartMonitoring = () => {
    console.log("Start Monitoring button clicked");
  };

  const handleViewAnalysis = () => {
    console.log("View Analysis button clicked");
  };

  return (
    <main className="min-h-screen bg-gradient-primary flex items-center justify-center p-6">
      <section className="card max-w-md w-full text-center animate-fade-in shadow-lg rounded-2xl bg-white/80 backdrop-blur-md">
        
        {/* Logo / Icon */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.917l9 3 9-3a12.02 12.02 0 00-2.382-9.971z"
              />
            </svg>
          </div>
          <h1 className="heading-primary text-4xl font-bold tracking-tight text-gray-900">
            Senior Guard
          </h1>
          <p className="text-body text-lg text-gray-600 mt-2">
            Your Personal Scam Detector
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleStartMonitoring}
            className="btn-primary w-full text-lg py-3 rounded-lg shadow hover:shadow-md transition-all duration-200"
          >
            🎤 Start Monitoring
          </button>
          <button
            onClick={handleViewAnalysis}
            className="btn-secondary w-full text-lg py-3 rounded-lg shadow hover:shadow-md transition-all duration-200"
          >
            📊 View Analysis
          </button>
        </div>

        {/* Info Banner */}
        <div className="mt-8 p-4 bg-orange-50 rounded-xl border border-orange-200">
          <p className="text-sm text-gray-700 leading-relaxed">
            <span className="font-semibold text-secondary">Protect yourself</span> from phone scams with AI-powered detection.
          </p>
        </div>
      </section>
    </main>
  );
};

export default App;