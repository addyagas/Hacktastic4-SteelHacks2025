import React from 'react';

const App: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">Senior Guard</h1>
                <p className="text-xl text-gray-600 mb-6">Your Personal Scam Detector</p>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                    Test Button
                </button>
            </div>
        </div>
    );
};

export default App;