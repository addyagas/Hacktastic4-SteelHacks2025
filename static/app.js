
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const status = document.getElementById('status');
    const connectionStatus = document.getElementById('connectionStatus');
    const interimTranscription = document.getElementById('interimTranscription');
    const finalTranscription = document.getElementById('finalTranscription');
    const threatLevel = document.getElementById('threatLevel');
    const threatScore = document.getElementById('threatScore');
    const threatDescription = document.getElementById('threatDescription');
    const keywordsList = document.getElementById('keywordsList');
    const aiSummary = document.getElementById('aiSummary');
    
    // Variables
    let socket;
    let mediaRecorder;
    let audioContext;
    let sourceNode;
    let processorNode;
    let stream;
    let isRecording = false;
    let detectedKeywords = new Set();
    
    // Connect to WebSocket server
    function connectSocket() {
        // Connect to the server
        socket = io();
        
        // Socket event handlers
        socket.on('connect', () => {
            connectionStatus.textContent = 'Connected';
            connectionStatus.style.color = 'green';
            startButton.disabled = false;
        });
        
        socket.on('disconnect', () => {
            connectionStatus.textContent = 'Disconnected';
            connectionStatus.style.color = 'red';
            stopTranscription();
        });
        
        socket.on('connection_success', (data) => {
            console.log('Connected with client ID:', data.client_id);
        });
        
        socket.on('transcription_started', (data) => {
            isRecording = true;
            status.textContent = 'Transcription started';
            startButton.disabled = true;
            stopButton.disabled = false;
            // Reset threat displays
            resetThreatDisplay();
            // Clear previous transcripts
            finalTranscription.innerHTML = '';
            interimTranscription.textContent = '';
        });
        
        socket.on('transcription_stopped', (data) => {
            status.textContent = 'Transcription stopped';
            isRecording = false;
            startButton.disabled = false;
            stopButton.disabled = true;
        });
        
        socket.on('transcription_result', (data) => {
            // Update transcription
            if (data.is_final) {
                // This is a final transcript
                const p = document.createElement('p');
                p.textContent = data.transcript;
                finalTranscription.appendChild(p);
                finalTranscription.scrollTop = finalTranscription.scrollHeight;
                interimTranscription.textContent = '';
                
                // Highlight the latest paragraph if it contains threat keywords
                if (data.threat_analysis && data.threat_analysis.newly_found_keywords.length > 0) {
                    p.innerHTML = highlightKeywords(data.transcript, data.threat_analysis.newly_found_keywords);
                }
            } else {
                // This is an interim result
                interimTranscription.textContent = data.transcript;
            }
            
            // Update threat analysis if available
            if (data.threat_analysis) {
                updateThreatDisplay(data.threat_analysis);
            }
        });
        
        socket.on('transcription_error', (data) => {
            console.error('Transcription error:', data.error);
            status.textContent = `Error: ${data.error}`;
            status.style.color = 'red';
        });
        
        socket.on('transcription_end', (data) => {
            console.log('Transcription ended:', data);
            status.textContent = 'Transcription ended';
            
            // Display final threat analysis if available
            if (data.final_threat_analysis) {
                updateThreatDisplay(data.final_threat_analysis);
                
                // Show a summary alert if risk level is medium or high
                if (['medium', 'high'].includes(data.final_threat_analysis.risk_level)) {
                    alert(`SCAM WARNING: This call has been identified as a ${data.final_threat_analysis.risk_level} risk scam.\n\n${data.final_threat_analysis.ai_summary || data.final_threat_analysis.description}`);
                }
            }
        });
        
        socket.on('connection_ready', (data) => {
            status.textContent = 'Ready to transcribe';
            startRecording();
        });
    }
    
    // Function to highlight keywords in text
    function highlightKeywords(text, keywords) {
        let highlightedText = text;
        keywords.forEach(keyword => {
            const regex = new RegExp('\\b(' + keyword + ')\\b', 'gi');
            highlightedText = highlightedText.replace(regex, '<span class="highlighted">$1</span>');
        });
        return highlightedText;
    }
    
    // Reset the threat display
    function resetThreatDisplay() {
        threatLevel.textContent = 'Unknown';
        threatLevel.className = 'threat-level';
        threatScore.textContent = '0%';
        threatDescription.textContent = 'No threats detected yet';
        keywordsList.textContent = 'None detected';
        aiSummary.textContent = 'No AI analysis available yet';
        detectedKeywords.clear();
    }
    
    // Update the threat display with new analysis
    function updateThreatDisplay(analysis) {
        // Update threat level
        if (analysis.risk_level) {
            threatLevel.textContent = analysis.risk_level.toUpperCase();
            threatLevel.className = 'threat-level ' + analysis.risk_level;
        }
        
        // Update score
        if (analysis.score_percentage !== undefined) {
            threatScore.textContent = analysis.score_percentage + '%';
        }
        
        // Update description
        if (analysis.description) {
            threatDescription.textContent = analysis.description;
        }
        
        // Update AI summary
        if (analysis.ai_summary) {
            aiSummary.textContent = analysis.ai_summary;
            aiSummary.style.fontWeight = 'bold';
            // Add a visual indicator that analysis is complete
            aiSummary.classList.add('analysis-complete');
        } else if (isRecording) {
            // During active recording, show the waiting message
            aiSummary.textContent = 'AI analysis will be available after stopping transcription';
            aiSummary.style.fontWeight = 'normal';
            aiSummary.classList.remove('analysis-complete');
        }
        
        // Update keywords list
        if (analysis.found_keywords && analysis.found_keywords.length > 0) {
            // Add newly found keywords to the set
            analysis.found_keywords.forEach(keyword => detectedKeywords.add(keyword));
            
            // Update the keywords list display
            keywordsList.innerHTML = '';
            detectedKeywords.forEach(keyword => {
                const keywordElement = document.createElement('span');
                keywordElement.className = 'keyword';
                keywordElement.textContent = keyword;
                keywordsList.appendChild(keywordElement);
            });
        }
    }
    
    // Initialize audio processing
    async function initAudio() {
        try {
            // Request microphone access
            stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000
                }
            });
            
            // Create audio context
            audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 16000
            });
            
            // Create source node from microphone stream
            sourceNode = audioContext.createMediaStreamSource(stream);
            
            // Create processor node for audio processing
            const bufferSize = 2048;
            processorNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
            
            processorNode.onaudioprocess = function(e) {
                if (!isRecording) return;
                
                // Get audio data from input buffer
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Convert float32 audio data to Int16 (what AssemblyAI expects)
                const pcmData = convertFloat32ToInt16(inputData);
                
                // Send audio data to server
                if (socket && socket.connected) {
                    socket.emit('audio_data', { audio: pcmData });
                }
            };
            
            // Connect nodes: source -> processor -> destination
            sourceNode.connect(processorNode);
            processorNode.connect(audioContext.destination);
            
            console.log('Audio initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing audio:', error);
            status.textContent = `Error: ${error.message}`;
            status.style.color = 'red';
            return false;
        }
    }
    
    // Convert Float32Array to Int16Array for audio processing
    function convertFloat32ToInt16(float32Array) {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            // Convert float [-1.0, 1.0] to int16 [-32768, 32767]
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return int16Array.buffer;
    }
    
    // Start transcription
    async function startTranscription() {
        status.textContent = 'Initializing...';
        status.style.color = 'black';
        
        // Initialize audio if not already done
        if (!audioContext) {
            const success = await initAudio();
            if (!success) {
                return;
            }
        }
        
        // Make sure we're connected to the server
        if (!socket || !socket.connected) {
            connectSocket();
        }
        
        // Start transcription on the server
        socket.emit('start_transcription');
    }
    
    // Start recording audio
    function startRecording() {
        if (isRecording) return;
        
        isRecording = true;
        status.textContent = 'Recording and transcribing...';
        console.log('Started recording');
        
        // Reset the UI for a new session
        finalTranscription.innerHTML = ''; // Clear previous transcripts
        interimTranscription.textContent = '';
        resetThreatDisplay();
    }
    
    // Stop transcription
    function stopTranscription() {
        isRecording = false;
        
        // Stop transcription on the server
        if (socket && socket.connected) {
            socket.emit('stop_transcription');
        }
        
        // Reset UI
        status.textContent = 'Stopped';
        startButton.disabled = true;
        stopButton.disabled = true;
        
        // Close audio resources
        if (processorNode) {
            processorNode.disconnect();
        }
        
        if (sourceNode) {
            sourceNode.disconnect();
        }
        
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        console.log('Stopped recording and transcription');
    }
    
    // Event listeners
    startButton.addEventListener('click', startTranscription);
    stopButton.addEventListener('click', stopTranscription);
    
    // Connect on page load
    connectSocket();
});
    