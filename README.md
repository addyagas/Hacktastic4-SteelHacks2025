# Senior Guard - Scam Detector

A React-based application that helps detect potential phone scams using AI-powered analysis.

## Features

- 🎤 Real-time conversation monitoring
- 🤖 AI-powered threat detection using Google Gemini
- 📊 Visual threat level indicators
- 🚨 Alert modals for detected threats
- 📱 Mobile-friendly responsive design

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up API Key
Create a `.env` file in the root directory:
```bash
VITE_API_KEY=your_gemini_api_key_here
```

Get your free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 3. Run Development Server
```bash
npm run dev
```

### 4. Open in Browser
Navigate to `http://localhost:3000`

## How to Use

1. Click "Start Monitoring" to begin listening
2. The app will simulate conversation analysis
3. If threats are detected, you'll see an alert with AI explanation
4. Click "Start New Scan" to analyze another conversation

## Technology Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Google Gemini AI
- Lucide React Icons

## Project Structure

```
├── components/          # React components
├── services/           # API services
├── types.ts           # TypeScript definitions
├── constants.ts       # App constants
├── rules.js          # Phishing detection rules
└── App.tsx           # Main application
```