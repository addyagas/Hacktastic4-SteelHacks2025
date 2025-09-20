import React from 'react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="card max-w-md w-full text-center animate-fade-in">
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.917l9 3 9-3a12.02 12.02 0 00-2.382-9.971z"
              />
            </svg>
          </div>
          <h1 className="heading-primary text-5xl text-gray-900">Senior Guard</h1>
          <p className="text-body text-xl text-gray-600">
            Your Personal Scam Detector
          </p>
        </div>

        <div className="space-y-4">
          <button className="w-full text-lg py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors duration-200">
            🎤 Start Monitoring
          </button>
          <button className="w-full text-lg py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow transition-colors duration-200">
            📊 View Analysis
          </button>
        </div>

        <div className="mt-8 p-4 bg-orange-50 rounded-xl border border-orange-200">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-blue-600">Protect yourself</span> from phone scams with AI-powered detection
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;