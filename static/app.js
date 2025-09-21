
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const status = document.getElementById('status');
    const connectionStatus = document.getElementById('connectionStatus');
    const interimTranscription = document.getElementById('interimTranscription');
    const finalTranscription = document.getElementById('finalTranscription');
    
    // Variables
    let socket;
    let mediaRecorder;
    let audioContext;
    let sourceNode;
    let processorNode;
    let stream;
    let isRecording = false;
    
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
            status.textContent = 'Transcription started';
            startButton.disabled = true;
            stopButton.disabled = false;
        });
        
        socket.on('transcription_stopped', (data) => {
            status.textContent = 'Transcription stopped';
            startButton.disabled = false;
            stopButton.disabled = true;
        });
        
        socket.on('transcription_result', (data) => {
            if (data.is_final) {
                // This is a final transcript
                const p = document.createElement('p');
                p.textContent = data.transcript;
                finalTranscription.appendChild(p);
                finalTranscription.scrollTop = finalTranscription.scrollHeight;
                interimTranscription.textContent = '';
            } else {
                // This is an interim result
                interimTranscription.textContent = data.transcript;
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
        });
        
        socket.on('connection_ready', (data) => {
            status.textContent = 'Ready to transcribe';
            startRecording();
        });
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
        startButton.disabled = false;
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
    