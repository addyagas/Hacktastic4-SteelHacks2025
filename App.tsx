import React, { useState, useEffect, useRef } from 'react';

interface Notification {
  id: number;
  message: string;
}

const App: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [threatLevel, setThreatLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('Ready to protect');

  const lastNotificationRef = useRef<HTMLDivElement | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const notifIntervalRef = useRef<number | null>(null);
  const threatIntervalRef = useRef<number | null>(null);
  const autoStopTimeoutRef = useRef<number | null>(null);

  // Auto-scroll to the newest notification
  useEffect(() => {
    if (lastNotificationRef.current) {
      lastNotificationRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [notifications]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopMonitoring('Ready to protect');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getThreatColor = () => {
    const hue = 120 - threatLevel * 1.2; // green → red
    return `hsl(${hue}, 100%, 50%)`;
  };

  const startIntervals = () => {
    // Notifications while listening
    notifIntervalRef.current = window.setInterval(() => {
      const newNotification: Notification = {
        id: Date.now(),
        message: `⚠️ Threat detected at ${new Date().toLocaleTimeString()}`
      };
      setNotifications((prev) => [...prev, newNotification]);
    }, 5000);

    // Threat level animation while listening
    threatIntervalRef.current = window.setInterval(() => {
      setThreatLevel((prev) => Math.min(100, prev + 7));
    }, 1000);
  };

  const clearIntervalsAndTimeouts = () => {
    if (notifIntervalRef.current) {
      clearInterval(notifIntervalRef.current);
      notifIntervalRef.current = null;
    }
    if (threatIntervalRef.current) {
      clearInterval(threatIntervalRef.current);
      threatIntervalRef.current = null;
    }
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
  };

  const stopMonitoring = (finalStatus?: string) => {
    setIsListening(false);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    clearIntervalsAndTimeouts();
    if (finalStatus) setStatus(finalStatus);
  };

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setIsListening(true);
      setStatus('🎤 Listening for threats...');

      // Reset threat level at start of a new session
      setThreatLevel(0);

      startIntervals();

      // Demo auto-stop after 10 seconds (from second code)
      autoStopTimeoutRef.current = window.setTimeout(() => {
        stopMonitoring('✅ Analysis complete — No threats detected');
      }, 10000);
    } catch {
      setStatus('🚫 Microphone access required');
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopMonitoring('Ready to protect');
    } else {
      startMonitoring();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center pt-16 px-4 relative">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="w-28 h-28 bg-gradient-to-r from-cyan-500 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
          <svg
            className={`w-16 h-16 text-white ${isListening ? 'animate-pulse' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2l9 4-3 10a9 9 0 01-12 0L3 6l9-4z"
            />
          </svg>
        </div>
        <h1 className="text-4xl font-bold tracking-wide">Cyber Sentinel</h1>
        <p className="text-lg text-gray-400">Real-Time Threat Intelligence</p>

        {/* Status */}
        <div className="mt-4 text-sm">
          <span className="px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-cyan-300">
            {status}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-row gap-8 w-full max-w-5xl items-start mt-8">
        {/* Notifications */}
        <div
          className="flex-1 flex flex-col space-y-2 overflow-y-auto pr-2"
          style={{
            maxHeight: '300px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <style>
            {`
              div::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>
          {notifications.map((n, index) => {
            const isLast = index === notifications.length - 1;
            return (
              <div
                key={n.id}
                ref={isLast ? lastNotificationRef : null}
                className="p-3 rounded-lg shadow bg-gray-800 text-cyan-300 transition-opacity duration-500 border border-cyan-600"
                style={{
                  opacity: Math.min(1, 0.3 + index * 0.13)
                }}
              >
                {n.message}
              </div>
            );
          })}
        </div>

        {/* Threat Gauge */}
        <div className="flex-1 flex items-center justify-center overflow-visible">
          <svg viewBox="0 0 240 140" className="w-full max-w-sm overflow-visible">
            {/* Background arc */}
            <path
              d="M 40 120 A 80 80 0 0 1 200 120"
              fill="none"
              stroke="#374151"
              strokeWidth="20"
              strokeLinecap="round"
            />
            {/* Foreground arc */}
            <path
              d="M 40 120 A 80 80 0 0 1 200 120"
              fill="none"
              stroke={threatLevel === 0 ? 'transparent' : getThreatColor()}
              strokeWidth="20"
              strokeLinecap="round"
              strokeDasharray="251"
              strokeDashoffset={251 - (threatLevel / 100) * 251}
              style={{ transition: 'stroke 0.5s, stroke-dashoffset 0.5s' }}
            />
            <circle cx="120" cy="120" r="35" fill="#111827" stroke="#4B5563" strokeWidth="2" />
            <svg x="100" y="100" width="40" height="40" viewBox="0 0 24 24">
              <path fill={getThreatColor()} d="M12 2l9 4-3 10a9 9 0 01-12 0L3 6l9-4z" />
            </svg>
            <text
              x="120"
              y="128"
              textAnchor="middle"
              fontSize="24"
              fill="#00FFFF"
              fontWeight="bold"
              style={{ textShadow: '0 0 4px #00FFFF' }}
            >
              {threatLevel}%
            </text>
          </svg>
        </div>
      </div>

      {/* Listening Button */}
      <div className="fixed bottom-8">
        <button
          onClick={toggleListening}
          className={`${
            isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-cyan-600 hover:bg-cyan-700'
          } text-white text-xl font-semibold py-4 px-8 rounded-full shadow-lg transition duration-300`}
        >
          {isListening ? '🛑 Stop Listening' : '🎧 Start Listening'}
        </button>
      </div>
    </div>
  );
};

export default App;