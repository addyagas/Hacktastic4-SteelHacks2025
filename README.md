# VishNet - Voice Threat Detection System

![VishNet Logo](Hack3/Hacktastic4-SteelHacks2025-ruby/templates/assets/VishnetCircularLogo.png)

## Overview

VishNet is a real-time voice threat detection system designed to identify potential scams, phishing attempts, and social engineering tactics in verbal communications. Built during SteelHacks 2025, this application leverages AI-powered speech transcription and advanced pattern recognition to protect users from voice phishing (vishing) attacks.

## Key Features

- **Real-time Voice Transcription**: Captures and transcribes phone conversations as they happen
- **Threat Pattern Detection**: Identifies over 100 different scam indicators and suspicious keywords
- **Risk Level Assessment**: Calculates and displays a threat percentage score from 0-100%
- **AI Summary Analysis**: Provides context and explanation of detected threats
- **User-friendly Interface**: Clean, intuitive design with real-time visual feedback

## How It Works

1. **Start the Listening Session**: Place your phone near the speaker during a suspicious call
2. **Real-time Transcription**: Your conversation is transcribed in real-time
3. **Continuous Analysis**: The system analyzes the transcribed text for suspicious patterns and keywords
4. **Threat Highlighting**: Potential threats are highlighted and categorized by risk level
5. **Threat Gauge**: The visual gauge at the top shows the overall risk level
6. **AI Analysis**: The AI Summary panel provides context and analysis of detected threats

## Technical Implementation

VishNet is built with:

- **Backend**: Python, Flask, Flask-SocketIO for real-time communication
- **Frontend**: HTML, CSS, JavaScript, TailwindCSS
- **Speech Processing**: AssemblyAI API for real-time speech-to-text
- **Analysis Engine**: Custom rule-based pattern detection system with weighted risk assessment

The system uses a sophisticated analysis engine to detect various threat patterns:

- Urgency and time pressure indicators
- Payment and money transfer requests
- Authority impersonation
- Sensitive information requests
- Technical support scams
- Phishing techniques
- And many more

## Running the Application

### Prerequisites
- Python 3.10+ 
- An AssemblyAI API key (replace the placeholder in `main.py`)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/addyagas/Hacktastic4-SteelHacks2025.git
   cd Hacktastic4-SteelHacks2025/Hack3/Hacktastic4-SteelHacks2025-ruby
   ```

2. Install dependencies:
   ```bash
   pip install flask flask-socketio websocket-client
   ```

3. Update the AssemblyAI API key in `main.py`:
   ```python
   YOUR_API_KEY = "your_assemblyai_api_key_here"
   ```

4. Run the application:
   ```bash
   python main.py
   ```

5. Open a web browser and navigate to:
   ```
   http://localhost:5000
   ```

## Project Structure

- `main.py`: Flask application and WebSocket handling
- `live_transcript_analyzer.py`: Real-time transcript analysis engine
- `constants.py`: Threat keywords and pattern definitions
- `rules.py`: Rule-based scoring system for threat detection
- `templates/`: HTML templates for the web interface
- `static/`: CSS and JavaScript files for the frontend

## Use Cases

- **Vulnerable Individuals**: Helps elderly or less tech-savvy individuals detect scam calls
- **Financial Institutions**: Assists customer service in identifying potential scam victims
- **Consumer Protection**: Empowers consumers to verify suspicious calls in real-time
- **Security Education**: Provides feedback to help users learn about scam tactics

## Future Enhancements

- Call recording functionality
- Automatic reporting to authorities
- Integration with phone apps
- Expanded language support
- Machine learning model to improve detection accuracy over time

## Acknowledgments

Developed as part of SteelHacks 2025 by Team Hacktastic4.

## License

[MIT License](LICENSE)