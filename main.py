import os
import json
import threading
import time
import base64
import websocket
from urllib.parse import urlencode
from datetime import datetime

from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit

# Import our transcript analyzer
from live_transcript_analyzer import TranscriptAnalyzer

# --- Configuration ---
YOUR_API_KEY = "e8f7002b0f854a4dbb208d297e29aa74" 

CONNECTION_PARAMS = {
    "sample_rate": 16000,
    "format_turns": True,  # Request formatted final transcripts
}
API_ENDPOINT_BASE_URL = "wss://streaming.assemblyai.com/v3/ws"
API_ENDPOINT = f"{API_ENDPOINT_BASE_URL}?{urlencode(CONNECTION_PARAMS)}"

# Audio Configuration
SAMPLE_RATE = CONNECTION_PARAMS["sample_rate"]
CHANNELS = 1

# Create Flask application and SocketIO instance
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'  # Replace with a proper secret key
socketio = SocketIO(app, cors_allowed_origins="*")  # Allow connections from any origin for testing

# Create templates and static directories if they don't exist
os.makedirs('templates', exist_ok=True)
os.makedirs('static', exist_ok=True)

# Dictionary to store client sessions
client_sessions = {}

class TranscriptionSession:
    def __init__(self, client_id):
        self.client_id = client_id
        self.ws_app = None
        self.ws_thread = None
        self.stop_event = threading.Event()
        self.buffer = []
        self.buffer_lock = threading.Lock()
        self.connected = False
        # Add a transcript analyzer to the session
        self.analyzer = TranscriptAnalyzer()
        
    def on_open(self, ws):
        """Called when the WebSocket connection to AssemblyAI is established."""
        print(f"AssemblyAI WebSocket connection opened for client {self.client_id}")
        self.connected = True
        # Notify the client that the connection is ready
        socketio.emit('connection_ready', {'status': 'ready'}, room=self.client_id)
        
    def on_message(self, ws, message):
        """Handle messages from AssemblyAI WebSocket."""
        try:
            data = json.loads(message)
            msg_type = data.get('type')

            if msg_type == "Begin":
                session_id = data.get('id')
                expires_at = data.get('expires_at')
                print(f"\nSession began for client {self.client_id}: ID={session_id}, ExpiresAt={datetime.fromtimestamp(expires_at)}")
                # Send session info to the client
                socketio.emit('transcription_begin', {
                    'session_id': session_id,
                    'expires_at': expires_at
                }, room=self.client_id)
                
            elif msg_type == "Turn":
                transcript = data.get('transcript', '')
                formatted = data.get('turn_is_formatted', False)
                
                # Analyze transcript for threats
                if transcript:
                    if formatted:
                        # For final transcripts, analyze the complete turn
                        analysis_result = self.analyzer.update_transcript(transcript)
                    else:
                        # For interim results, do a quick check but don't update the full transcript
                        # This avoids polluting the transcript with partial results
                        temp_analysis = self.analyzer.analyze_text(transcript)
                        analysis_result = temp_analysis
                
                    # Send transcription data and analysis to the client
                    socketio.emit('transcription_result', {
                        'transcript': transcript,
                        'is_final': formatted,
                        'threat_analysis': {
                            'found_keywords': analysis_result.get('foundKeywords', []),
                            'newly_found_keywords': analysis_result.get('newlyFoundKeywords', []),
                            'risk_level': analysis_result.get('scamAnalysis', {}).get('riskLevel', 'unknown'),
                            'score_percentage': analysis_result.get('scamAnalysis', {}).get('percentageScore', 0),
                            'description': analysis_result.get('scamAnalysis', {}).get('description', ''),
                            'ai_summary': analysis_result.get('aiSummary', '')
                        }
                    }, room=self.client_id)
                else:
                    # Send transcription data without analysis if transcript is empty
                    socketio.emit('transcription_result', {
                        'transcript': transcript,
                        'is_final': formatted
                    }, room=self.client_id)
                
                # For server-side logging
                if formatted:
                    print(f"\nClient {self.client_id} - Final: {transcript}")
                    # Log analysis results for final transcript
                    if transcript:
                        risk_level = analysis_result.get('scamAnalysis', {}).get('riskLevel', 'unknown')
                        score = analysis_result.get('scamAnalysis', {}).get('percentageScore', 0)
                        keywords = ', '.join(analysis_result.get('newlyFoundKeywords', []))
                        print(f"THREAT ANALYSIS: Risk Level: {risk_level} ({score}%)")
                        if keywords:
                            print(f"Keywords Found: {keywords}")
                else:
                    print(f"\rClient {self.client_id} - Interim: {transcript}", end='')
                    
            elif msg_type == "Termination":
                audio_duration = data.get('audio_duration_seconds', 0)
                session_duration = data.get('session_duration_seconds', 0)
                print(f"\nSession Terminated for client {self.client_id}: "
                      f"Audio Duration={audio_duration}s, Session Duration={session_duration}s")
                
                # Get final threat analysis if there's any transcript
                if self.analyzer.current_transcript.strip():
                    final_analysis = self.analyzer.get_final_analysis()
                    
                    # Notify client of session termination with final analysis
                    socketio.emit('transcription_end', {
                        'audio_duration': audio_duration,
                        'session_duration': session_duration,
                        'final_threat_analysis': {
                            'found_keywords': final_analysis.get('foundKeywords', []),
                            'risk_level': final_analysis.get('scamAnalysis', {}).get('riskLevel', 'unknown'),
                            'score_percentage': final_analysis.get('scamAnalysis', {}).get('percentageScore', 0),
                            'description': final_analysis.get('scamAnalysis', {}).get('description', ''),
                            'matches': final_analysis.get('scamAnalysis', {}).get('matches', []),
                            'ai_summary': final_analysis.get('aiSummary', '')
                        }
                    }, room=self.client_id)
                else:
                    # No transcript to analyze
                    socketio.emit('transcription_end', {
                        'audio_duration': audio_duration,
                        'session_duration': session_duration,
                        'final_threat_analysis': None
                    }, room=self.client_id)
                
        except json.JSONDecodeError as e:
            print(f"Error decoding message for client {self.client_id}: {e}")
        except Exception as e:
            print(f"Error handling message for client {self.client_id}: {e}")
            
            
    def on_error(self, ws, error):
        """Handle WebSocket errors."""
        print(f"\nWebSocket Error for client {self.client_id}: {error}")
        socketio.emit('transcription_error', {'error': str(error)}, room=self.client_id)
        self.stop_event.set()
        
    def on_close(self, ws, close_status_code, close_msg):
        """Handle WebSocket connection close."""
        print(f"\nWebSocket Disconnected for client {self.client_id}: Status={close_status_code}, Msg={close_msg}")
        self.connected = False
        socketio.emit('transcription_disconnected', {
            'status_code': close_status_code,
            'message': close_msg
        }, room=self.client_id)
        
    def process_audio_chunk(self, audio_chunk):
        """Process audio data received from the client."""
        if not self.connected or self.stop_event.is_set():
            return False
            
        try:
            # Send the audio data to AssemblyAI
            if self.ws_app and self.ws_app.sock and self.ws_app.sock.connected:
                self.ws_app.send(audio_chunk, websocket.ABNF.OPCODE_BINARY)
                return True
            else:
                print(f"WebSocket not connected for client {self.client_id}")
                return False
        except Exception as e:
            print(f"Error sending audio data for client {self.client_id}: {e}")
            return False
            
    def start(self):
        """Start the transcription session."""
        if self.ws_app:
            print(f"Session already started for client {self.client_id}")
            return
            
        # Create WebSocketApp to connect to AssemblyAI
        self.ws_app = websocket.WebSocketApp(
            API_ENDPOINT,
            header={"Authorization": YOUR_API_KEY},
            on_open=lambda ws: self.on_open(ws),
            on_message=lambda ws, msg: self.on_message(ws, msg),
            on_error=lambda ws, err: self.on_error(ws, err),
            on_close=lambda ws, code, msg: self.on_close(ws, code, msg)
        )
        
        # Run WebSocketApp in a separate thread
        self.ws_thread = threading.Thread(target=self.ws_app.run_forever)
        self.ws_thread.daemon = True
        self.ws_thread.start()
        
        print(f"Started transcription session for client {self.client_id}")
        
    def stop(self):
        """Stop the transcription session."""
        print(f"Stopping transcription session for client {self.client_id}")
        self.stop_event.set()
        
        # Send termination message to AssemblyAI
        if self.ws_app and self.ws_app.sock and self.ws_app.sock.connected:
            try:
                terminate_message = {"type": "Terminate"}
                self.ws_app.send(json.dumps(terminate_message))
                time.sleep(1)  # Give some time for the message to be sent
            except Exception as e:
                print(f"Error sending termination message for client {self.client_id}: {e}")
                
        # Close the WebSocket connection
        if self.ws_app:
            self.ws_app.close()
            
        # Wait for the WebSocket thread to finish
        if self.ws_thread and self.ws_thread.is_alive():
            self.ws_thread.join(timeout=2.0)
            
        print(f"Transcription session stopped for client {self.client_id}")

# --- Flask Routes ---
@app.route('/')
def index():
    """Serve the main page."""
    return render_template('index.html')

@app.route('/static/<path:path>')
def serve_static(path):
    """Serve static files."""
    return send_from_directory('static', path)

# --- SocketIO Event Handlers ---
@socketio.on('connect')
def handle_connect():
    """Handle client connection."""
    client_id = request.sid
    print(f"Client connected: {client_id}")
    emit('connection_success', {'client_id': client_id})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    client_id = request.sid
    print(f"Client disconnected: {client_id}")
    
    # Clean up client session if it exists
    if client_id in client_sessions:
        client_sessions[client_id].stop()
        del client_sessions[client_id]

@socketio.on('start_transcription')
def handle_start_transcription():
    """Start a new transcription session for the client."""
    client_id = request.sid
    print(f"Starting transcription for client: {client_id}")
    
    # Create a new session if it doesn't exist
    if client_id not in client_sessions:
        client_sessions[client_id] = TranscriptionSession(client_id)
        client_sessions[client_id].start()
        emit('transcription_started', {'status': 'started'})
    else:
        emit('transcription_error', {'error': 'Session already exists'})

@socketio.on('stop_transcription')
def handle_stop_transcription():
    """Stop the client's transcription session."""
    client_id = request.sid
    print(f"Stopping transcription for client: {client_id}")
    
    if client_id in client_sessions:
        client_sessions[client_id].stop()
        del client_sessions[client_id]
        emit('transcription_stopped', {'status': 'stopped'})
    else:
        emit('transcription_error', {'error': 'No active session'})

@socketio.on('audio_data')
def handle_audio_data(data):
    """Process audio data from the client."""
    client_id = request.sid
    
    if client_id not in client_sessions:
        emit('transcription_error', {'error': 'No active session'})
        return
        
    try:
        # Extract audio data from the message
        audio_data = data.get('audio')
        if not audio_data:
            return
            
        # Process the audio data
        success = client_sessions[client_id].process_audio_chunk(audio_data)
        if not success:
            emit('transcription_error', {'error': 'Failed to process audio chunk'})
    except Exception as e:
        print(f"Error processing audio data for client {client_id}: {e}")
        emit('transcription_error', {'error': str(e)})

# --- Main Execution ---
def run():
    print("Starting Flask SocketIO server for live transcription...")
    # Create HTML template and JavaScript file before starting the server
    create_frontend_files()
    # Start the Flask application with SocketIO
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)

def create_frontend_files():
    """Create HTML and JavaScript files for the frontend."""
    # Create HTML template
    html_content = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scam Call Detector</title>
    <link rel="stylesheet" href="/static/style.css">
</head>
<body>
    <div class="container">
        <h1>Scam Call Detector</h1>
        
        <div class="controls">
            <button id="startButton" class="button">Start Transcription</button>
            <button id="stopButton" class="button" disabled>Stop Transcription</button>
        </div>
        
        <div class="status-container">
            <div id="status" class="status">Ready</div>
            <div id="connectionStatus" class="connection-status">Disconnected</div>
        </div>
        
        <div class="threat-info">
            <div class="threat-status">
                <div class="threat-level-label">Threat Level:</div>
                <div id="threatLevel" class="threat-level">Unknown</div>
            </div>
            <div class="threat-score">
                <div class="score-label">Score:</div>
                <div id="threatScore" class="score">0%</div>
            </div>
            <div class="threat-description" id="threatDescription">No threats detected yet</div>
            <div class="ai-summary-container">
                <h3>AI Analysis:</h3>
                <div id="aiSummary" class="ai-summary">No AI analysis available yet</div>
            </div>
        </div>
        
        <div class="keywords-container">
            <h3>Detected Keywords</h3>
            <div id="keywordsList" class="keywords-list">None detected</div>
        </div>
        
        <div class="transcription-container">
            <div id="interimTranscription" class="interim-transcription"></div>
            <div id="finalTranscription" class="final-transcription"></div>
        </div>
    </div>
    
    <script src="https://cdn.socket.io/4.4.1/socket.io.min.js"></script>
    <script src="/static/app.js"></script>
</body>
</html>
    """
    
    # Create CSS file
    css_content = """
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f4f4f4;
    padding: 20px;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

h1 {
    text-align: center;
    margin-bottom: 20px;
    color: #333;
}

h3 {
    margin-bottom: 10px;
    color: #444;
}

.controls {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
}

.button {
    padding: 10px 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
}

.button:hover {
    background-color: #45a049;
}

.button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
}

.status-container {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    padding: 10px;
    background-color: #f8f8f8;
    border-radius: 4px;
}

.status, .connection-status {
    font-weight: bold;
}

.threat-info {
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 15px;
    margin-bottom: 20px;
}

.threat-status {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}

.threat-level-label, .score-label {
    font-weight: bold;
    margin-right: 10px;
    min-width: 100px;
}

.threat-level {
    font-weight: bold;
    padding: 5px 10px;
    border-radius: 4px;
    text-transform: uppercase;
}

.threat-level.minimal {
    background-color: #e6f7e6;
    color: #2e7d32;
}

.threat-level.low {
    background-color: #fff9c4;
    color: #f57f17;
}

.threat-level.medium {
    background-color: #ffccbc;
    color: #e64a19;
}

.threat-level.high {
    background-color: #ffcdd2;
    color: #c62828;
}

.threat-score {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}

.score {
    font-weight: bold;
}

.threat-description {
    margin-top: 10px;
    padding: 10px;
    background-color: #f0f0f0;
    border-radius: 4px;
    font-style: italic;
}

.ai-summary-container {
    margin-top: 15px;
    border-top: 1px solid #ddd;
    padding-top: 15px;
}

.ai-summary {
    padding: 10px;
    background-color: #e8f5e9;
    border-radius: 4px;
    border-left: 4px solid #4CAF50;
    font-size: 14px;
    line-height: 1.5;
}

.keywords-container {
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 15px;
    margin-bottom: 20px;
}

.keywords-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.keyword {
    background-color: #ffccbc;
    color: #d84315;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
}

.transcription-container {
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 15px;
    margin-bottom: 20px;
    min-height: 200px;
    max-height: 400px;
    overflow-y: auto;
}

.interim-transcription {
    color: #888;
    font-style: italic;
    margin-bottom: 10px;
    min-height: 20px;
}

.final-transcription {
    color: #333;
    font-weight: 500;
}

.final-transcription p {
    margin-bottom: 10px;
    padding: 5px;
    background-color: #eaf7ea;
    border-radius: 4px;
}

.highlighted {
    background-color: #ffcdd2;
    color: #b71c1c;
    padding: 0 2px;
    border-radius: 2px;
}
    """
    
    # Create JavaScript file
    js_content = """
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
            status.textContent = 'Transcription started';
            startButton.disabled = true;
            stopButton.disabled = false;
            // Reset threat displays
            resetThreatDisplay();
        });
        
        socket.on('transcription_stopped', (data) => {
            status.textContent = 'Transcription stopped';
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
                    alert(`⚠️ SCAM WARNING: This call has been identified as a ${data.final_threat_analysis.risk_level} risk scam.\\n\\n${data.final_threat_analysis.ai_summary || data.final_threat_analysis.description}`);
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
            const regex = new RegExp('\\\\b(' + keyword + ')\\\\b', 'gi');
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
    """
    
    # Write files to disk
    with open('templates/index.html', 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    with open('static/style.css', 'w', encoding='utf-8') as f:
        f.write(css_content)
    
    with open('static/app.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print("Frontend files created successfully")

if __name__ == "__main__":
    run()
