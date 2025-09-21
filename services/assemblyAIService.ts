// AssemblyAI Streaming Speech-to-Text Service for React

const ASSEMBLYAI_API_KEY = import.meta.env.VITE_ASSEMBLYAI_API_KEY;

// Rate limiting variables
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests
const MAX_REQUESTS_PER_MINUTE = 60; // AssemblyAI allows more requests
const requestTimes: number[] = [];

console.log("AssemblyAI API Key check:", {
    apiKey: !!ASSEMBLYAI_API_KEY,
    apiKeyLength: ASSEMBLYAI_API_KEY?.length,
    isDefault: ASSEMBLYAI_API_KEY === 'your_assemblyai_api_key_here'
});

if (!ASSEMBLYAI_API_KEY || ASSEMBLYAI_API_KEY === 'your_assemblyai_api_key_here') {
    console.warn("AssemblyAI API key is not configured properly.");
}

// Rate limiting check
const checkRateLimit = (): { allowed: boolean; waitTime?: number; reason?: string } => {
    const now = Date.now();
    
    // Remove requests older than 1 minute
    while (requestTimes.length > 0 && requestTimes[0] < now - 60000) {
        requestTimes.shift();
    }
    
    console.log("Rate limit check:", {
        now: new Date(now).toLocaleTimeString(),
        requestsInLastMinute: requestTimes.length,
        maxPerMinute: MAX_REQUESTS_PER_MINUTE,
        lastRequestTime: new Date(lastRequestTime).toLocaleTimeString(),
        timeSinceLastRequest: now - lastRequestTime,
        minInterval: MIN_REQUEST_INTERVAL
    });
    
    // Check if we've exceeded requests per minute
    if (requestTimes.length >= MAX_REQUESTS_PER_MINUTE) {
        const oldestRequest = requestTimes[0];
        const waitTime = Math.ceil((oldestRequest + 60000 - now) / 1000);
        console.log("Rate limit hit: too many requests per minute");
        return { allowed: false, waitTime, reason: 'too many requests per minute' };
    }
    
    // Check minimum interval between requests
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const waitTime = Math.ceil((MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000);
        console.log("Rate limit hit: too soon since last request");
        return { allowed: false, waitTime, reason: 'too soon since last request' };
    }
    
    console.log("Rate limit check passed");
    return { allowed: true };
};

// Convert audio blob to base64 for AssemblyAI API
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result) {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            } else {
                reject(new Error('Failed to convert blob to base64'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

// Upload audio file and get transcription (non-streaming approach for browser)
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    // Check if API key is configured
    if (!ASSEMBLYAI_API_KEY || ASSEMBLYAI_API_KEY === 'your_assemblyai_api_key_here') {
        return "⚠️ AssemblyAI API key not configured. Please add your API key to the .env file as VITE_ASSEMBLYAI_API_KEY=your_key_here";
    }

    // Check rate limits first
    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.allowed) {
        return `⏱️ Rate limit: Please wait ${rateLimitCheck.waitTime} seconds (${rateLimitCheck.reason}). Max ${MAX_REQUESTS_PER_MINUTE}/minute, min 1s between requests.`;
    }

    try {
        const now = Date.now();
        lastRequestTime = now;
        requestTimes.push(now);
        
        console.log("Starting AssemblyAI transcription...");
        
        // Check audio file size (AssemblyAI has generous limits)
        if (audioBlob.size > 100 * 1024 * 1024) { // 100MB limit
            return "❌ Audio file too large (>100MB). Please record shorter segments.";
        }
        
        console.log("Audio file details:", {
            size: `${(audioBlob.size / 1024).toFixed(1)} KB`,
            type: audioBlob.type
        });

        // Step 1: Upload audio file to AssemblyAI
        console.log("Uploading audio file...");
        const uploadFormData = new FormData();
        uploadFormData.append('file', audioBlob, 'recording.webm');

        const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
            method: 'POST',
            headers: {
                'Authorization': ASSEMBLYAI_API_KEY,
            },
            body: uploadFormData,
        });

        if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({ error: 'Upload failed' }));
            console.error("AssemblyAI Upload Error:", errorData);
            
            if (uploadResponse.status === 401) {
                return "🔑 Invalid AssemblyAI API key. Please check your key in the .env file.";
            } else if (uploadResponse.status === 413) {
                return "📁 Audio file too large. Please record shorter segments.";
            }
            
            return "❌ Error uploading audio file. Please try again.";
        }

        const uploadResult = await uploadResponse.json();
        const audioUrl = uploadResult.upload_url;
        console.log("Audio uploaded successfully, URL:", audioUrl);

        // Step 2: Request transcription
        console.log("Requesting transcription...");
        const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ASSEMBLYAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                audio_url: audioUrl,
                language_detection: true,
                punctuate: true,
                format_text: true,
            }),
        });

        if (!transcriptResponse.ok) {
            const errorData = await transcriptResponse.json().catch(() => ({ error: 'Transcription request failed' }));
            console.error("AssemblyAI Transcription Error:", errorData);
            return "❌ Error requesting transcription. Please try again.";
        }

        const transcriptData = await transcriptResponse.json();
        const transcriptId = transcriptData.id;
        console.log("Transcription requested, ID:", transcriptId);

        // Step 3: Poll for completion
        console.log("Waiting for transcription to complete...");
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds max wait time
        
        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            
            const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
                headers: {
                    'Authorization': `Bearer ${ASSEMBLYAI_API_KEY}`,
                },
            });

            if (!statusResponse.ok) {
                console.error("Error checking transcription status");
                break;
            }

            const statusData = await statusResponse.json();
            console.log("Transcription status:", statusData.status);

            if (statusData.status === 'completed') {
                if (statusData.text && statusData.text.trim()) {
                    console.log("Transcription successful, length:", statusData.text.length);
                    return statusData.text;
                } else {
                    return "🔇 No speech detected in the recording";
                }
            } else if (statusData.status === 'error') {
                console.error("Transcription failed:", statusData.error);
                return "❌ Transcription failed. Please try again with a clearer recording.";
            }

            attempts++;
        }

        return "⏱️ Transcription timed out. Please try with a shorter recording.";

    } catch (error) {
        console.error("Error transcribing audio:", error);
        
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                return "⏱️ Request timed out - please try with a shorter recording";
            }
        }
        
        return "❌ Error processing audio - please try again with a shorter recording";
    }
};