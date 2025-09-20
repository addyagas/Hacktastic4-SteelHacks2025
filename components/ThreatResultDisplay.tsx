
import React from 'react';
import { ThreatResult } from '../types';

interface ThreatMeterProps {
    result: ThreatResult;
}

const ThreatResultDisplay: React.FC<ThreatMeterProps> = ({ result }) => {
    const score = result.score;
    const meterColor = score > 66 ? 'text-red-500' : score > 33 ? 'text-yellow-500' : 'text-green-500';

    return (
        <div className="w-full flex flex-col items-center space-y-8">
            <div className="relative w-52 h-52 sm:w-64 sm:h-64">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                        className="text-gray-200"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                    />
                    <path
                        className={meterColor}
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${score}, 100`}
                        strokeLinecap="round"
                        transform="rotate(-90 18 18)"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-6xl sm:text-7xl font-bold ${meterColor}`}>{score}</span>
                    <span className="text-xl sm:text-2xl text-gray-500">%</span>
                    <span className="text-lg sm:text-xl font-semibold text-gray-600">Threat</span>
                </div>
            </div>
            {result.keywordsFound.length > 0 && (
                <div className="w-full bg-gray-100 p-4 rounded-xl">
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">Keywords Detected:</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                        {result.keywordsFound.map((keyword) => (
                            <span key={keyword} className="bg-red-100 text-red-800 text-lg font-medium px-4 py-1 rounded-full">
                                {keyword}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThreatResultDisplay;
