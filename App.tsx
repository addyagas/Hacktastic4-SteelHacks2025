import React, { useState, useRef } from 'react';
import { transcribeAudio } from './services/assemblyAIService';

const App: React.FC = () => {

    const [isListening, setIsListening] = useState(false);
    const [status, setStatus] = useState('Ready to protect');
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioURL, setAudioURL] = useState<string | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [transcript, setTranscript] = useState<string | null>(null);
    const audioChunks = useRef<Blob[]>([]);


    const handleStartMonitoring = () => {
        setTranscript(null);
        setAudioURL(null);
        setAudioBlob(null);
        audioChunks.current = [];
        setStatus('Requesting microphone access...');
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                const recorder = new MediaRecorder(stream);
                setMediaRecorder(recorder);
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


    const handleReset = () => {
        setIsListening(false);
        setStatus('Ready to protect');
        setAudioURL(null);
        setAudioBlob(null);
        setTranscript(null);
    };

    // Real implementation using AssemblyAI Speech-to-Text API
    const handleTranscribe = async () => {
        if (!audioBlob) return;
        setStatus('Transcribing with AssemblyAI...');
        
        try {
            const result = await transcribeAudio(audioBlob);
            setTranscript(result);
            setStatus('Transcription complete.');
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
                        <button 
                            className="btn-primary w-full text-lg py-4"
                            onClick={handleStartMonitoring}
                        >
                            Start Monitoring (Record Audio)
                        </button>
                    )}

                    {isListening && (
                        <button 
                            className="btn-secondary w-full text-lg py-4"
                            disabled
                        >
                            Listening & Recording...
                        </button>
                    )}

                    {audioURL && !isListening && (
                        <div className="flex flex-col items-center space-y-2">
                            <audio controls src={audioURL} className="w-full" />
                            <button 
                                className="btn-primary w-full text-lg py-2"
                                onClick={handleTranscribe}
                            >
                                Transcribe Audio
                            </button>
                        </div>
                    )}

                    {!isListening && status !== 'Ready to protect' && (
                        <button 
                            className="btn-primary w-full text-lg py-4"
                            onClick={handleReset}
                        >
                            Start New Scan
                        </button>
                    )}
                </div>

                {transcript && (
                    <div className="mt-8 p-4 bg-green-50 rounded-xl border border-green-200">
                        <p className="text-sm text-gray-800">
                            <span className="font-semibold text-green-700">Transcript:</span> {transcript}
                        </p>
                    </div>
                )}

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
