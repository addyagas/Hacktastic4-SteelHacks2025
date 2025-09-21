import React, { useState, useRef } from 'react';
import { transcribeAudio } from './services/assemblyAIService';
import { generateThreatExplanation } from './services/geminiService';
import { THREAT_KEYWORDS } from './constants';

const App: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [status, setStatus] = useState('Ready to protect');
    const [audioURL, setAudioURL] = useState<string | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [transcript, setTranscript] = useState<string | null>(null);
    const [detectedThreats, setDetectedThreats] = useState<string[]>([]);
    const [threatCount, setThreatCount] = useState(0);
    const [aiExplanation, setAiExplanation] = useState<string | null>(null);
    const [loadingExplanation, setLoadingExplanation] = useState(false);
    const audioChunks = useRef<Blob[]>([]);

    const handleStartMonitoring = () => {
        setTranscript(null);
        setAudioURL(null);
        setAudioBlob(null);
        audioChunks.current = [];
        setStatus('Requesting microphone access...');

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                setIsListening(true);
                setStatus('Listening for threats...');

                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        audioChunks.current.push(e.data);
                    }
                };

                recorder.onstop = () => {
                    const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
                    setAudioBlob(blob);
                    setAudioURL(URL.createObjectURL(blob));
                    setStatus('Recording complete. Ready to transcribe.');
                    setIsListening(false);
                };

                recorder.start();

                // Stop after 10 seconds for demo
                setTimeout(() => {
                    recorder.stop();
                }, 10000);
            })
            .catch(() => {
                setStatus('Microphone access required');
            });
    };

    const analyzeThreats = (text: string): { threats: string[], count: number } => {
        if (!text) return { threats: [], count: 0 };
        
        const lowerText = text.toLowerCase();
        const foundThreats: string[] = [];
        let totalCount = 0;
        
        THREAT_KEYWORDS.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g');
            const matches = lowerText.match(regex);
            if (matches) {
                foundThreats.push(keyword);
                totalCount += matches.length;
            }
        });
        
        return { threats: [...new Set(foundThreats)], count: totalCount };
    };

    const highlightThreats = (text: string): React.ReactElement => {
        if (!text || detectedThreats.length === 0) {
            return <>{text}</>;
        }
        
        let highlightedText = text;
        const regex = new RegExp(`\\b(${detectedThreats.join('|')})\\b`, 'gi');
        
        const parts = highlightedText.split(regex);
        
        return (
            <>
                {parts.map((part, index) => {
                    const isKeyword = detectedThreats.some(threat => 
                        threat.toLowerCase() === part.toLowerCase()
                    );
                    
                    return isKeyword ? (
                        <span key={index} className="bg-red-200 text-red-800 font-semibold px-1 rounded">
                            {part}
                        </span>
                    ) : (
                        <span key={index}>{part}</span>
                    );
                })}
            </>
        );
    };

    const handleReset = () => {
        setIsListening(false);
        setStatus('Ready to protect');
        setAudioURL(null);
        setAudioBlob(null);
        setTranscript(null);
        setDetectedThreats([]);
        setThreatCount(0);
        setAiExplanation(null);
        setLoadingExplanation(false);
    };

    const handleTranscribe = async () => {
        if (!audioBlob) return;
        setStatus('Transcribing with AssemblyAI...');
        setAiExplanation(null);
        
        try {
            const result = await transcribeAudio(audioBlob);
            setTranscript(result);
            
            // Analyze transcript for threats
            const threatAnalysis = analyzeThreats(result);
            setDetectedThreats(threatAnalysis.threats);
            setThreatCount(threatAnalysis.count);
            
            if (threatAnalysis.threats.length > 0) {
                setStatus(`⚠️ ${threatAnalysis.threats.length} threat keywords detected! Be careful.`);
                
                // Generate AI explanation for the threats
                setLoadingExplanation(true);
                try {
                    const explanation = await generateThreatExplanation(threatAnalysis.threats);
                    setAiExplanation(explanation);
                } catch (explanationError) {
                    console.error('Error generating explanation:', explanationError);
                    setAiExplanation("These keywords are commonly used in scam calls to manipulate victims.");
                } finally {
                    setLoadingExplanation(false);
                }
            } else {
                setStatus('✅ No threats detected. Conversation appears safe.');
            }
        } catch (error) {
            console.error('Transcription error:', error);
            setTranscript('Error: Could not transcribe audio');
            setStatus('Transcription failed.');
        }
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
                        <button className="btn-primary w-full text-lg py-4" onClick={handleStartMonitoring}>
                            Start Monitoring (Record Audio)
                        </button>
                    )}

                    {isListening && (
                        <button className="btn-secondary w-full text-lg py-4" disabled>
                            Listening & Recording...
                        </button>
                    )}

                    {audioURL && !isListening && (
                        <div className="flex flex-col items-center space-y-2">
                            <audio controls src={audioURL} className="w-full" />
                            <button className="btn-primary w-full text-lg py-2" onClick={handleTranscribe}>
                                Transcribe Audio
                            </button>
                        </div>
                    )}

                    {!isListening && status !== 'Ready to protect' && (
                        <button className="btn-primary w-full text-lg py-4" onClick={handleReset}>
                            Start New Scan
                        </button>
                    )}
                </div>

                {transcript && (
                    <div className="mt-8 p-4 bg-green-50 rounded-xl border border-green-200">
                        <p className="text-sm text-gray-800">
                            <span className="font-semibold text-green-700">Transcript:</span> {highlightThreats(transcript)}
                        </p>
                    </div>
                )}

                {detectedThreats.length > 0 && (
                    <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-200">
                        <div className="flex items-center mb-2">
                            <span className="text-red-600 text-xl mr-2">⚠️</span>
                            <span className="font-semibold text-red-700">
                                Threat Keywords Detected ({threatCount} total occurrences)
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {detectedThreats.map((threat, index) => (
                                <span 
                                    key={index}
                                    className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium border border-red-300"
                                >
                                    {threat}
                                </span>
                            ))}
                        </div>
                        <p className="text-sm text-red-600 mt-3">
                            <span className="font-semibold">Warning:</span> These keywords are commonly used in scam calls. Be cautious and verify the caller's identity.
                        </p>
                        
                        {/* AI Explanation Section */}
                        <div className="mt-4 p-3 bg-red-100 rounded-lg border-l-4 border-red-500">
                            <div className="flex items-center mb-1">
                                <span className="text-red-700 text-sm mr-1">🤖</span>
                                <span className="font-semibold text-red-700 text-sm">AI Security Analysis:</span>
                            </div>
                            {loadingExplanation ? (
                                <p className="text-sm text-red-600 italic">Analyzing threat patterns...</p>
                            ) : aiExplanation ? (
                                <p className="text-sm text-red-700">{aiExplanation}</p>
                            ) : (
                                <p className="text-sm text-red-600 italic">Generating security analysis...</p>
                            )}
                        </div>
                    </div>
                )}

                {transcript && detectedThreats.length === 0 && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="flex items-center">
                            <span className="text-blue-600 text-xl mr-2">✅</span>
                            <span className="font-semibold text-blue-700">No Threat Keywords Detected</span>
                        </div>
                        <p className="text-sm text-blue-600 mt-2">
                            The conversation appears to be legitimate, but always stay vigilant.
                        </p>
                    </div>
                )}

                <div className="mt-8 p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <p className="text-sm text-gray-600">
                        <span className="font-semibold text-secondary">Status:</span> {status}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default App;