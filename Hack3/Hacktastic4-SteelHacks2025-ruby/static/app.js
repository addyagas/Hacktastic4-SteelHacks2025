document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const connectionStatus = document.getElementById('statusBadge');
    const interimTranscription = document.getElementById('interimTranscription');
    const finalTranscription = document.getElementById('finalTranscription');
    const statusBadge          = document.getElementById('statusBadge');
    const toggleButton         = document.getElementById('toggleButton');
    const notificationsContainer = document.getElementById('notificationsContainer');
    const gaugeForeground      = document.getElementById('gaugeForeground');
    const gaugeIcon            = document.getElementById('gaugeIcon');
    const percentageText       = document.getElementById('percentage');
    const micIcon              = document.getElementById('micIcon');
    const aiSummary = document.getElementById('aiSummary');
    
    // --- Constants & State ---
    const threatColors = {
      low:    '#725def',
      medium: '#ffb00d',
      high:   '#dd217d',
    };

    let threatScore = 0;
    let notifInterval = null;
    let autoStopTimeout = null;
    let micStream = null;

    // Variables
    let socket;
    let audioContext;
    let sourceNode;
    let processorNode;
    let stream;
    let isRecording = false;
    let isListening = false; // keep only ONE isListening
    let detectedKeywords = new Set();

    // --- SOCKET CONNECTION ---
    function connectSocket() {
            socket = io();

            socket.on('connect', () => {
                console.log("✅ Socket connected");
                connectionStatus.textContent = 'Connected';
                connectionStatus.style.color = 'green';
            });

            socket.on('disconnect', () => {
                console.log("⚠️ Socket disconnected");
                connectionStatus.textContent = 'Disconnected';
                connectionStatus.style.color = 'red';
                stopTranscription();
            });

            socket.on('connection_success', (data) => {
                console.log('Connected with client ID:', data.client_id);
            });

            socket.on('transcription_started', (data) => {
                isListening = true;
            });

            socket.on('transcription_stopped', (data) => {
                isListening = false;
            });

            socket.on('transcription_result', (data) => {
                // Debug logging to see what we're receiving
                console.log('Received transcription_result:', data);
                if (data.threat_analysis) {
                    console.log('Threat analysis:', data.threat_analysis);
                    console.log('Score percentage:', data.threat_analysis.score_percentage);
                }
                
                if (data.is_final) {
                    const p = document.createElement('p');
                    p.textContent = data.transcript;
                    finalTranscription.appendChild(p);
                    finalTranscription.scrollTop = finalTranscription.scrollHeight;
                    interimTranscription.textContent = '';

                    if (data.threat_analysis && data.threat_analysis.newly_found_keywords.length > 0) {
                        p.innerHTML = highlightKeywords(data.transcript, data.threat_analysis.newly_found_keywords, data.threat_analysis.risk_level);
                    }

                    // Update threat score with actual percentage from analysis
                    if (data.threat_analysis && typeof data.threat_analysis.score_percentage === 'number') {
                        console.log('Updating threat score to:', data.threat_analysis.score_percentage);
                        threatScore = data.threat_analysis.score_percentage;
                        updateGauge();
                        
                        // Add notification for new threats
                        if (data.threat_analysis.newly_found_keywords.length > 0) {
                            const message = `${data.threat_analysis.risk_level.toUpperCase()} risk detected: ${data.threat_analysis.newly_found_keywords.join(', ')}`;
                            addNotification(data.threat_analysis.risk_level, message);
                        }

                        // Update AI summary if available
                        if (data.threat_analysis.ai_summary && data.threat_analysis.ai_summary.trim()) {
                            aiSummary.textContent = data.threat_analysis.ai_summary;
                        }
                    } else {
                        console.log('No valid score_percentage found in threat_analysis');
                    }
                } else {
                    interimTranscription.textContent = data.transcript;
                    
                    // Update threat score for interim results as well
                    if (data.threat_analysis && typeof data.threat_analysis.score_percentage === 'number') {
                        console.log('Updating interim threat score to:', data.threat_analysis.score_percentage);
                        threatScore = data.threat_analysis.score_percentage;
                        updateGauge();
                    }
                }
            });

            socket.on('transcription_error', (data) => {
                console.error('❌ Transcription error:', data.error);
            });

            socket.on('transcription_end', (data) => {
                console.log('🛑 Transcription ended:', data);
                
                // Update final threat analysis if available
                if (data.final_threat_analysis) {
                    threatScore = data.final_threat_analysis.score_percentage || 0;
                    updateGauge();
                    
                    // Update AI summary with final analysis
                    if (data.final_threat_analysis.ai_summary) {
                        aiSummary.textContent = data.final_threat_analysis.ai_summary;
                    }
                    
                    // Add final notification if there were threats detected
                    if (data.final_threat_analysis.found_keywords && data.final_threat_analysis.found_keywords.length > 0) {
                        const finalMessage = `Final Analysis: ${data.final_threat_analysis.risk_level.toUpperCase()} risk (${data.final_threat_analysis.score_percentage}%)`;
                        addNotification(data.final_threat_analysis.risk_level, finalMessage);
                    }
                }
            });

            socket.on('connection_ready', (data) => {
                console.log("🔄 Server ready, starting recording...");
                startRecording();
            });
        }

    // --- AUDIO INIT ---
    async function initAudio() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000
                }
            });

            audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 16000
            });

            sourceNode = audioContext.createMediaStreamSource(stream);

            const bufferSize = 2048;
            processorNode = audioContext.createScriptProcessor(bufferSize, 1, 1);

            processorNode.onaudioprocess = function(e) {
                if (!isRecording) return;
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmData = convertFloat32ToInt16(inputData);
                if (socket && socket.connected) {
                    socket.emit('audio_data', { audio: pcmData });
                }
            };

            sourceNode.connect(processorNode);
            processorNode.connect(audioContext.destination);

            console.log('🎙️ Audio initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing audio:', error);
            return false;
        }
    }

    function convertFloat32ToInt16(float32Array) {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return int16Array.buffer;
    }

    // --- TRANSCRIPTION CONTROL ---
    async function startTranscription() {
        console.log("▶️ Starting transcription...");
        if (!audioContext) {
            const success = await initAudio();
            if (!success) return;
        }
        if (!socket || !socket.connected) {
            connectSocket(); // ✅ wait for server to be ready
        }
        socket.emit('start_transcription');
    }

    function startRecording() {
        if (isRecording) return;
        isRecording = true;
        if (socket && socket.connected) {
            console.log('🎤 Started recording');
        }
    }

    function stopTranscription() {
        isRecording = false;
        if (socket && socket.connected) {
            socket.emit('stop_transcription');
        }

        isListening = false;

        if (processorNode) processorNode.disconnect();
        if (sourceNode) sourceNode.disconnect();
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        console.log('🛑 Stopped recording and transcription');
    }

        // Function to highlight keywords in text
    function highlightKeywords(text, keywords, risk) {
        let highlightedText = text;
        console.log(keywords.length)
        let risk_level='risk-low';
        if(keywords.length>4){
            risk_level = 'risk-high';
        } else if(keywords.length>2){
            risk_level = 'risk-medium';
        } else {
            risk_level = 'risk-low';
        }
        keywords.forEach(keyword => {
            const regex = new RegExp('\\b(' + keyword + ')\\b', 'gi');
            highlightedText = highlightedText.replace(regex, `<span class="${risk_level}">$1</span>`);
        });
        return highlightedText;
    }
    
    // Reset the threat display
    function resetThreatDisplay() {
        percentageText.textContent = '0%';
        detectedKeywords.clear();
    }

    ///////////////////

    // --- Color helpers ---
    const hexToRgb = hex => {
      const bigint = parseInt(hex.slice(1), 16);
      return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    };

    const rgbToHex = ([r,g,b]) =>
      '#' + ((1 << 24) + (r<<16) + (g<<8) + b).toString(16).slice(1);

    const mixRgb = (a, b, t) => [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t)
    ];

    const getGaugeColor = score => {
      const pct = Math.max(0, Math.min(100, score));
      const stops = [threatColors.low, threatColors.medium, threatColors.high].map(hexToRgb);
      const t = pct <= 50 ? pct/50 : (pct - 50)/50;
      const [c0, c1] = pct <= 50 ? [stops[0], stops[1]] : [stops[1], stops[2]];
      return rgbToHex(mixRgb(c0, c1, t));
    };

    // --- UI Updaters ---
    function updateGauge() {
      const color     = threatScore === 0 ? 'transparent' : getGaugeColor(threatScore);
      const dashOffset = 251 - (threatScore/100)*251;
      gaugeForeground.setAttribute('stroke', color);
      gaugeForeground.setAttribute('stroke-dashoffset', dashOffset);
      gaugeIcon.setAttribute('fill', color);
      percentageText.textContent = threatScore + '%';
    }

    function updateStatus(text) {
      statusBadge.textContent = text;
    }

    function addNotification(level, message) {
      const div = document.createElement('div');
      div.className = 'notification-item p-3 rounded-lg shadow border';
      div.style.backgroundColor = '#1F2937';
      div.style.color           = threatColors[level];
      div.style.borderColor     = threatColors[level];
      div.textContent = message;
      notificationsContainer.prepend(div);
    }

    // --- Monitoring Logic ---
    function startIntervals() {
      // Disabled: Using real threat analysis instead of fake notifications
      // notifInterval = setInterval(() => {
      //   const levels = ['low','medium','high'];
      //   const lvl    = levels[Math.floor(Math.random()*levels.length)];
      //   addNotification(lvl, `${lvl.toUpperCase()} threat detected: 1234567`);
      //   threatScore = Math.min(100, threatScore + 15);
      //   updateGauge();
      // }, 2000);
    }

    function clearTimers() {
      if (notifInterval)    { clearInterval(notifInterval);     notifInterval = null; }
      if (autoStopTimeout)  { clearTimeout(autoStopTimeout);    autoStopTimeout = null; }
    }

    function stopMonitoring(finalStatus = 'Ready to protect') {
      isListening = false;
      if (micStream) {
        micStream.getTracks().forEach(t => t.stop());
        micStream = null;
      }
      updateStatus(finalStatus);
      toggleButton.textContent = '🎧 Start Listening';
      toggleButton.classList.replace('bg-red-600','bg-cyan-600');
      toggleButton.classList.replace('hover:bg-red-700','hover:bg-cyan-700');
      micIcon.classList.remove('animate-pulse');
      stopTranscription();
    }

    async function startMonitoring() {
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        isListening = true;
        updateStatus('🎤 Listening for threats...');
        threatScore = 0;
        updateGauge();
        toggleButton.textContent = '🛑 Stop Listening';
        toggleButton.classList.replace('bg-cyan-600','bg-red-600');
        toggleButton.classList.replace('hover:bg-cyan-700','hover:bg-red-700');
        micIcon.classList.add('animate-pulse');
        await startTranscription();
      } catch {
        updateStatus('🚫 Microphone access required');
      }
    }

    function toggleListening() {
      isListening ? stopMonitoring() : startMonitoring();
    }

    // --- Initialization ---
    toggleButton.addEventListener('click', toggleListening);
    window.addEventListener('beforeunload', () => stopMonitoring());
    updateGauge();
});
