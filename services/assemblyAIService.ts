import { useState, useRef, useCallback, useEffect } from 'react';
import querystring from 'querystring';
import { AssemblyAIWebSocketMessage, WebSocketMessageType } from '../types';

const DEMO_API_KEY = "7c3d4f1c237a47c2937cec20a6312c0e";
const ASSEMBLYAI_API_KEY: string = "e8f7002b0f854a4dbb208d297e29aa74";

interface ConnectionParams {
  sample_rate: number;
  format_turns: boolean;
}

const CONNECTION_PARAMS: ConnectionParams = {
  sample_rate: 16000,
  format_turns: true, // Request formatted final transcripts
};

const API_ENDPOINT_BASE_URL: string = "wss://streaming.assemblyai.com/v3/ws";
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second
const MAX_REQUESTS_PER_MINUTE = 60;
const requestTimes: number[] = [];

const checkRateLimit = () => {
    const now = Date.now();

    // Remove timestamps older than 60 seconds
    while (requestTimes.length > 0 && requestTimes[0] < now - 60000) {
        requestTimes.shift();
    }

    if (requestTimes.length >= MAX_REQUESTS_PER_MINUTE) {
        const waitTime = Math.ceil((requestTimes[0] + 60000 - now) / 1000);
        return { allowed: false, waitTime, reason: 'too many requests per minute' };
    }

    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
        const waitTime = Math.ceil((MIN_REQUEST_INTERVAL - (now - lastRequestTime)) / 1000);
        return { allowed: false, waitTime, reason: 'too soon since last request' };
    }

    return { allowed: true };
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    if (!ASSEMBLYAI_API_KEY || ASSEMBLYAI_API_KEY === 'your_assemblyai_api_key_here') {
        return "⚠️ AssemblyAI API key not configured.";
    }

    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.allowed) {
        return `⏱️ Rate limit: Wait ${rateLimitCheck.waitTime}s (${rateLimitCheck.reason}).`;
    }

    try {
        lastRequestTime = Date.now();
        requestTimes.push(lastRequestTime);

        if (audioBlob.size === 0) {
            return "❌ No audio data recorded.";
        }

        // ✅ Upload raw audio blob
        const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
            method: 'POST',
            headers: {
                'Authorization': ASSEMBLYAI_API_KEY,
                'Content-Type': audioBlob.type || 'audio/webm'
            },
            body: audioBlob
        });

        if (!uploadResponse.ok) {
            return `❌ Error uploading audio file: ${uploadResponse.status} ${uploadResponse.statusText}`;
        }

        const { upload_url } = await uploadResponse.json();

        // ✅ Request transcription
        const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST',
            headers: {
                'Authorization': ASSEMBLYAI_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                audio_url: upload_url,
                language_detection: true,
                punctuate: true,
                format_text: true,
            }),
        });

        if (!transcriptResponse.ok) {
            return `❌ Error requesting transcription: ${transcriptResponse.status} ${transcriptResponse.statusText}`;
        }

        const { id } = await transcriptResponse.json();

        // ✅ Poll for completion
        for (let i = 0; i < 30; i++) {
            await new Promise(res => setTimeout(res, 1000));

            const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
                headers: { 'Authorization': ASSEMBLYAI_API_KEY },
            });

            if (!statusResponse.ok) {
                return `❌ Error checking transcription status: ${statusResponse.status} ${statusResponse.statusText}`;
            }

            const statusData = await statusResponse.json();

            if (statusData.status === 'completed') {
                return statusData.text?.trim() || "🔇 No speech detected.";
            }

            if (statusData.status === 'error') {
                return `❌ Transcription failed: ${statusData.error || 'Unknown error'}`;
            }
        }

        return "⌛ Transcription timed out after 30 seconds.";
    } catch (err: any) {
        return `💥 Unexpected error: ${err.message || err}`;
    }
};