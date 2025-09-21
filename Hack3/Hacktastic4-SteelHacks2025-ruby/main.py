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
YOUR_API_KEY = "e8f7002b0f854a4dbb208d297e29aa74" # Replace with your actual AssemblyAI API key current one is invalid

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
                    # Minimum length for analyzing interim transcripts (approximately 5+ words)
                    MIN_INTERIM_LENGTH = 15
                    
                    if formatted:
                        # For final transcripts, always analyze the complete turn
                        analysis_result = self.analyzer.update_transcript(transcript)
                        send_analysis = True
                    else:
                        # For interim results, only analyze if:
                        # 1. The transcript is long enough to be meaningful (not just one or two words)
                        # 2. It contains potential keywords or patterns
                        if len(transcript) >= MIN_INTERIM_LENGTH:
                            # Do a quick check but don't update the full transcript
                            temp_analysis = self.analyzer.analyze_text(transcript, is_interim=True)
                            analysis_result = temp_analysis
                            
                            # Only send analysis if there are keywords found or risk score > 0
                            has_keywords = len(temp_analysis.get('foundKeywords', [])) > 0
                            has_score = temp_analysis.get('scamAnalysis', {}).get('percentageScore', 0) > 0
                            send_analysis = has_keywords or has_score
                        else:
                            # Too short to analyze meaningfully
                            send_analysis = False
                    
                    # Send transcription data with or without analysis
                    if send_analysis:
                        # For interim results, don't include AI summary to prevent it from being shown during recording
                        ai_summary = analysis_result.get('aiSummary', '') if formatted else ''
                        
                        socketio.emit('transcription_result', {
                            'transcript': transcript,
                            'is_final': formatted,
                            'threat_analysis': {
                                'found_keywords': analysis_result.get('foundKeywords', []),
                                'newly_found_keywords': analysis_result.get('newlyFoundKeywords', []),
                                'risk_level': analysis_result.get('scamAnalysis', {}).get('riskLevel', 'unknown'),
                                'score_percentage': analysis_result.get('scamAnalysis', {}).get('percentageScore', 0),
                                'description': analysis_result.get('scamAnalysis', {}).get('description', ''),
                                'ai_summary': ai_summary,
                                'is_final_analysis': formatted  # Only mark as final if it's a formatted result
                            }
                        }, room=self.client_id)
                    else:
                        # Send transcription data without analysis
                        socketio.emit('transcription_result', {
                            'transcript': transcript,
                            'is_final': formatted
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
                            'ai_summary': final_analysis.get('aiSummary', ''),
                            'is_final_analysis': True  # Flag to indicate this is the final analysis
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
        # Get final analysis before stopping
        session = client_sessions[client_id]
        final_analysis_data = None
        
        # Only get final analysis if there's transcript content
        if session.analyzer.current_transcript.strip():
            final_analysis = session.analyzer.get_final_analysis()
            # Add flag for final analysis
            if final_analysis:
                final_analysis_data = {
                    'found_keywords': final_analysis.get('foundKeywords', []),
                    'risk_level': final_analysis.get('scamAnalysis', {}).get('riskLevel', 'unknown'),
                    'score_percentage': final_analysis.get('scamAnalysis', {}).get('percentageScore', 0),
                    'description': final_analysis.get('scamAnalysis', {}).get('description', ''),
                    'ai_summary': final_analysis.get('aiSummary', ''),
                    'is_final_analysis': True
                }
            
        # Stop the session
        session.stop()
        del client_sessions[client_id]
        
        # Send response with final analysis if available
        if final_analysis_data:
            emit('transcription_stopped', {
                'status': 'stopped',
                'final_analysis': final_analysis_data
            })
        else:
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
    # Start the Flask application with SocketIO
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)

if __name__ == "__main__":
    run()