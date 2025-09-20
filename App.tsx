
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, ThreatResult } from './types';
import { THREAT_KEYWORDS, SIMULATED_TRANSCRIPT_PARTS } from './constants';
import { getThreatExplanation } from './services/geminiService';
import StatusDisplay from './components/StatusDisplay';
import ActionButton from './components/ActionButton';
import ThreatResultDisplay from './components/ThreatResultDisplay';
import AlertModal from './components/AlertModal';
import { ShieldCheckIcon, ShieldExclamationIcon, MicrophoneIcon, StopCircleIcon } from './components/Icons';


const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>(AppState.IDLE);
    const [threatResult, setThreatResult] = useState<ThreatResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const transcriptRef = useRef<string>('');
    const simulationIntervalRef = useRef<number | null>(null);

    const resetState = () => {
        setAppState(AppState.IDLE);
        setThreatResult(null);
        setError(null);
        setIsModalOpen(false);
        transcriptRef.current = '';
        if (simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
            simulationIntervalRef.current = null;
        }
    };

    const handleAnalysis = useCallback(async (transcript: string) => {
        setAppState(AppState.ANALYZING);
        try {
            const words = transcript.toLowerCase().split(/\s+/);
            const foundKeywords = THREAT_KEYWORDS.filter(keyword => words.includes(keyword.toLowerCase()));
            const uniqueKeywords = [...new Set(foundKeywords)];

            if (uniqueKeywords.length > 0) {
                const score = Math.min(100, Math.round((uniqueKeywords.length / 7) * 100));
                
                const explanation = await getThreatExplanation(uniqueKeywords);
                
                setThreatResult({
                    score,
                    keywordsFound: uniqueKeywords,
                    explanation,
                });
                setAppState(AppState.THREAT_DETECTED);
                setIsModalOpen(true);
            } else {
                setThreatResult({
                    score: 0,
                    keywordsFound: [],
                    explanation: 'No concerning keywords were detected. The conversation appears to be safe.',
                });
                setAppState(AppState.SAFE);
            }
        } catch (err) {
            console.error('Analysis Error:', err);
            setError('Could not analyze the conversation. Please try again.');
            setAppState(AppState.ERROR);
        }
    }, []);

    const startListening = () => {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
                resetState();
                setAppState(AppState.LISTENING);
                simulationIntervalRef.current = window.setInterval(() => {
                    const part = SIMULATED_TRANSCRIPT_PARTS[Math.floor(Math.random() * SIMULATED_TRANSCRIPT_PARTS.length)];
                    transcriptRef.current += part + ' ';
                }, 3000);
            })
            .catch(err => {
                console.error('Microphone access denied:', err);
                setError('Microphone access is required. Please enable it in your browser settings.');
                setAppState(AppState.ERROR);
            });
    };

    const stopListening = () => {
        if (simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
            simulationIntervalRef.current = null;
        }
        handleAnalysis(transcriptRef.current);
    };


    return (
        <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-sans">
            <header className="text-center mb-8">
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-800">Senior Guard</h1>
                <p className="text-xl sm:text-2xl text-gray-500 mt-2">Your Personal Scam Detector</p>
            </header>

            <main className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 sm:p-12 text-center flex flex-col items-center transition-all duration-500">
                <StatusDisplay state={appState} />
                
                <div className="my-10 w-full">
                    {appState === AppState.IDLE || appState === AppState.LISTENING ? (
                        <div className="space-y-6">
                           {appState === AppState.IDLE && (
                                <ActionButton
                                    onClick={startListening}
                                    label="Start Monitoring"
                                    color="green"
                                    icon={<MicrophoneIcon />}
                                />
                            )}
                             {appState === AppState.LISTENING && (
                                <ActionButton
                                    onClick={stopListening}
                                    label="Stop & Analyze"
                                    color="red"
                                    icon={<StopCircleIcon />}
                                />
                            )}
                        </div>
                    ) : (
                        threatResult && (
                            <div className="flex flex-col items-center space-y-8 animate-fade-in">
                                <ThreatResultDisplay result={threatResult} />
                                 <ActionButton
                                    onClick={resetState}
                                    label="Start New Scan"
                                    color="blue"
                                    icon={<MicrophoneIcon />}
                                />
                            </div>
                        )
                    )}
                </div>

                {error && (
                    <div className="mt-6 text-red-600 text-xl bg-red-100 p-4 rounded-lg">
                        <strong>Error:</strong> {error}
                    </div>
                )}

            </main>

            <footer className="mt-8 text-gray-500 text-center">
                <p>Stay safe and secure.</p>
            </footer>

            {isModalOpen && threatResult && threatResult.score > 0 && (
                <AlertModal
                    result={threatResult}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default App;
