// App.tsx
import React, { useState, useEffect, useRef } from 'react';

type ThreatLevel = 'low' | 'medium' | 'high';

interface Notification {
  id: number;
  message: string;
  level: ThreatLevel;
}

const threatColors: Record<ThreatLevel, string> = {
  low: '#725def',
  medium: '#ffb00d',
  high: '#dd217d',
};

const hexToRgb = (hex: string): [number, number, number] => {
  const bigint = parseInt(hex.slice(1), 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
};

const rgbToHex = ([r, g, b]: [number, number, number]): string =>
  `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

const mixRgb = (
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

const getGaugeColor = (score: number): string => {
  const pct = Math.max(0, Math.min(100, score));
  const stops = [threatColors.low, threatColors.medium, threatColors.high].map(hexToRgb);
  const t = pct <= 50 ? pct / 50 : (pct - 50) / 50;
  const [c0, c1] = pct <= 50 ? [stops[0], stops[1]] : [stops[1], stops[2]];
  return rgbToHex(mixRgb(c0, c1, t));
};

const App: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [threatScore, setThreatScore] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('Ready to protect');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const notifIntervalRef = useRef<number | null>(null);
  const autoStopTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [notifications]);

  useEffect(() => () => stopMonitoring('Ready to protect'), []);

  const startIntervals = () => {
    notifIntervalRef.current = window.setInterval(() => {
      const levels: ThreatLevel[] = ['low', 'medium', 'high'];
      const lvl = levels[Math.floor(Math.random() * levels.length)];
      setNotifications(prev => [
        {
          id: Date.now(),
          message: `${lvl.toUpperCase()} threat: 123456789`,
          level: lvl,
        },
        ...prev,
      ]);
      setThreatScore(prev => Math.min(100, prev + 15));
    }, 2000);
  };

  const clearTimers = () => {
    if (notifIntervalRef.current !== null) {
      window.clearInterval(notifIntervalRef.current);
      notifIntervalRef.current = null;
    }
    if (autoStopTimeoutRef.current !== null) {
      window.clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
  };

  const stopMonitoring = (finalStatus?: string) => {
    setIsListening(false);
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    micStreamRef.current = null;
    clearTimers();
    if (finalStatus) setStatus(finalStatus);
  };

  const startMonitoring = async () => {
    try {
      micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsListening(true);
      setStatus('🎤 Listening for threats...');
      setThreatScore(0);
      startIntervals();
      autoStopTimeoutRef.current = window.setTimeout(
        () => stopMonitoring('✅ Analysis complete — No threats detected'),
        10000
      );
    } catch {
      setStatus('🚫 Microphone access required');
    }
  };

  const toggleListening = () =>
    isListening ? stopMonitoring('Ready to protect') : startMonitoring();

  return (
    <div
      className="min-h-screen bg-gray-900 text-white flex flex-col pt-4 px-4 relative pb-32 overflow-hidden"
      style={{ fontFamily: "'Share Tech Mono', monospace" }}
    >
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c&family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Reggae+One&family=Stick&display=swap');

          html, body { 
            overflow: hidden; 
            height: 100%; 
            font-family: 'Share Tech Mono', monospace; 
          }
          @keyframes slideInLeft {
            from { transform: translateX(-20px); opacity: 0; }
            to   { transform: translateX(0);     opacity: 1; }
          }
          .notification-item { animation: slideInLeft 0.4s ease-out; }
          .scroll-container::-webkit-scrollbar { display: none; }
        `}
      </style>

      {/* Header: top-left */}
      <header className="absolute top-4 left-4 flex items-center space-x-4 z-20">
        <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
          <svg
            className={`w-10 h-10 text-white ${isListening ? 'animate-pulse' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l9 4-3 10a9 9 0 01-12 0L3 6l9-4z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-wide">Cyber Sentinel</h1>
          <p className="text-sm text-gray-400">Real-Time Threat Intelligence</p>
          <span className="mt-1 inline-block px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-cyan-300 text-xs">
            {status}
          </span>
        </div>
      </header>

      {/* Gauge: absolute top-center */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <svg viewBox="0 0 240 140" className="w-[380px] max-w-[90vw] overflow-visible">
          <path
            d="M 40 120 A 80 80 0 0 1 200 120"
            fill="none"
            stroke="#374151"
            strokeWidth="20"
            strokeLinecap="round"
          />
          <path
            d="M 40 120 A 80 80 0 0 1 200 120"
            fill="none"
            stroke={threatScore === 0 ? 'transparent' : getGaugeColor(threatScore)}
            strokeWidth="20"
            strokeLinecap="round"
            strokeDasharray="251"
            strokeDashoffset={251 - (threatScore / 100) * 251}
            style={{ transition: 'stroke 0.5s, stroke-dashoffset 0.5s' }}
          />
          <circle cx="120" cy="120" r="35" fill="#111827" stroke="#4B5563" strokeWidth="2" />
          <svg x="100" y="100" width="40" height="40" viewBox="0 0 24 24">
            <path
              fill={getGaugeColor(threatScore)}
              d="M12 2l9 4-3 10a9 9 0 01-12 0L3 6l9-4z"
            />
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
            {threatScore}%
          </text>
        </svg>
      </div>

      {/* Main content wrapper (adds top space so content sits below the gauge) */}
      <div className="w-full mt-40">
        <div className="flex flex-row w-full h-full">
          {/* Notifications: lower and less tall */}
          <div
            ref={containerRef}
            className="scroll-container flex flex-col space-y-2 pr-2"
            style={{
              width: '26%',
              maxWidth: '300px',
              overflowY: 'auto',
              paddingLeft: '0px',
              marginTop: '0px',
              maxHeight: '500px',
            }}
          >
            {notifications.map(n => (
              <div
                key={n.id}
                className="notification-item p-3 rounded-lg shadow border"
                style={{
                  backgroundColor: '#1F2937',
                  color: threatColors[n.level],
                  borderColor: threatColors[n.level],
                }}
              >
                {n.message}
              </div>
            ))}
          </div>

          {/* Right spacer to keep layout balanced under the centered gauge */}
          <div className="flex-1" />
        </div>
      </div>

      {/* Toggle button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
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