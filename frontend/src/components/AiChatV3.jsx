// Aiv3chat.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
// Assuming io is not needed here as it's handled by useGeminiRealtime
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AssistantIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Mic as MicIcon,
  Stop as StopIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
// NOTE: Make sure this path is correct relative to where you place this file.
import useGeminiRealtime from '../hooks/useGeminiRealtime';
import audioService from '../services/audioService';
import apiService from '../services/apiService';

// ------- helpers (from the previous context) -------

/**
 * repairBrokenChunk: Repairs fragmented chunks like "H e l l o" -> "Hello".
 */
const repairBrokenChunk = (s) => {
  if (!s || typeof s !== 'string') return s;
  const tokens = s.split(/\s+/).filter(Boolean);
  if (tokens.length < 3) return s;
  const singleLetters = tokens.filter(t => t.length === 1).length;
  if (singleLetters / tokens.length > 0.6) {
    return tokens.join('');
  }
  return s;
};

/**
 * sanitizeMedicalData: clean medical data for safe transmission
 */
const sanitizeMedicalData = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  let s = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\x80-\x9F]/g, '');
  s = s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return s;
};

/**
 * normalizeWhitespace: collapse multiple spaces into one, trim.
 */
const normalizeWhitespace = (s) => (s ? s.replace(/\s+/g, ' ').trim() : s);

/**
 * fixTranscriptionSpacing: simple spacing fix
 */
const fixTranscriptionSpacing = (text) => {
  if (!text || typeof text !== 'string') return text;
  // Just normalize whitespace - don't do complex word analysis
  return normalizeWhitespace(text);
};

// ------- END helpers -------


const Aiv3chat = ({ open, onClose, medicalData: propMedicalData }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "Hello! I'm your AI Health Assistant. I can help you with medical questions and analyze your health data. Start a session to begin voice interaction.",
      timestamp: new Date(),
      role: 'assistant'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Audio states
  const [isRecording, setIsRecording] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [isListening, setIsListening] = useState(false);

  // Session state
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const processedMessageIds = useRef(new Set());
  const transcriptionBuffer = useRef(''); // Buffer for user transcription

  // Use the Gemini realtime service hook
  const {
    status: connectionStatus,
    messages: serviceMessages,
    audioMessages,
    startSession,
    endSession,
    sendAudioChunk,
    sendTextPart,
    disconnect
  } = useGeminiRealtime();

  // State for medical data
  const [medicalData, setMedicalData] = useState('');

  // Buffer for accumulating assistant message before saving
  const assistantMessageBuffer = useRef('');
  const assistantMessageStartTime = useRef(null);

  // Function to save message to backend
  const saveMessageToHistory = async (message, role, timestamp) => {
    try {
      if (!currentSessionId) {
        console.warn('No session ID available, skipping message save');
        return;
      }
      
      const payload = {
        message: message.trim(),
        role,
        timestamp: timestamp.toISOString(),
        sessionId: currentSessionId,
      };
      
      console.log('Saving message to history:', payload);
      
      const response = await apiService.post('/chat-history', payload);
      console.log('Message saved successfully:', response);
    } catch (error) {
      console.error('Failed to save message to history:', error);
      // Store locally as fallback
      const localHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
      localHistory.push({
        id: Date.now(),
        message: message.trim(),
        role,
        timestamp: timestamp.toISOString(),
        sessionId: currentSessionId,
        saved: false
      });
      localStorage.setItem('chatHistory', JSON.stringify(localHistory));
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load medical data from approved records when component mounts (Your existing logic)
  useEffect(() => {
    const loadApprovedMedicalData = () => {
      try {
        const records = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
        const approvedRecords = records.filter(record => record.isApproved);
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');

        if (approvedRecords.length > 0) {
          const buildContextString = (records, patient) => {
            let context = "--- Approved Patient Medical Record Context ---\n\n";
            
            // Add patient information
            if (patient && (patient.name || patient.email || patient.age || patient.gender)) {
              context += "### PATIENT INFORMATION:\n";
              if (patient.name) context += `- Name: ${patient.name}\n`;
              if (patient.email) context += `- Email: ${patient.email}\n`;
              if (patient.age) context += `- Age: ${patient.age}\n`;
              if (patient.gender) context += `- Gender: ${patient.gender}\n`;
              if (patient.phone) context += `- Phone: ${patient.phone}\n`;
              if (patient.address) context += `- Address: ${patient.address}\n`;
              context += "\n";
            }
            
            if (!records || records.length === 0) return context + "No approved medical records found.";

            records.forEach((record, index) => {
              context += `### FILE ${index + 1}: ${record.title || 'Untitled'}\n`;
              const extraction = record.extractedData?.[0]?.extraction;
              if (!extraction) return;

              if (extraction.imaging_radiology_reports?.length) {
                context += "#### 1. Imaging & Radiology Reports:\n";
                extraction.imaging_radiology_reports.forEach(report => {
                  context += `- Date: ${report.result_timestamp || 'N/A'}\n  - Report: ${report.impression || report.report_text || 'No impression text'}\n`;
                });
                context += "\n";
              }

              if (extraction.investigations?.length) {
                context += "#### 2. Laboratory Investigation Results:\n";
                extraction.investigations.forEach(investigation => {
                  const flag = investigation.flag === 'Normal' ? '' : ` (${investigation.flag})`;
                  context += `- ${investigation.investigation_name}: ${investigation.result} ${investigation.unit}${flag} [Range: ${investigation.reference_range}]\n`;
                });
                context += "\n";
              }

              if (extraction.other_clinical_data) {
                context += "#### 3. Other Clinical Data:\n";
                context += `${extraction.other_clinical_data}\n\n`;
              }

              if (extraction.notes) {
                context += "#### 4. Additional Notes:\n";
                context += `${extraction.notes}\n\n`;
              }
            });
            context += "--- END OF CONTEXT ---\n";
            return context;
          };

          const fullContext = buildContextString(approvedRecords, userInfo);
          if (fullContext.trim()) {
            setMedicalData(fullContext);
          }
        }
      } catch (error) {
        console.error('Error loading approved medical data:', error);
      }
    };

    loadApprovedMedicalData();
  }, []);


  // Update medical data when prop changes
  useEffect(() => {
    if (propMedicalData) {
      setMedicalData(propMedicalData);
    }
  }, [propMedicalData]);


  // Helper to replace the last user message (FIXED TRANSCRIPTION DISPLAY)
  const updateLastUserMessage = useCallback((newContent) => {
    setMessages(prev => {
        const lastUserIndex = prev.length - 1;
        const lastMessage = prev[lastUserIndex];
        
        if (lastMessage && lastMessage.role === 'user') {
            const updatedMessage = {
                ...lastMessage,
                content: newContent,
                text: newContent,
            };
            
            const newMessages = [...prev];
            newMessages[lastUserIndex] = updatedMessage;
            return newMessages;
        }
        return [...prev, { 
            id: Date.now(), 
            role: 'user', 
            type: 'user', 
            content: newContent, 
            timestamp: new Date() 
        }];
    });
  }, []);
  
  // Helper to accumulate bot messages - NO SPACING MANIPULATION
  const accumulateBotMessage = useCallback((incomingText) => {
    setMessages(prev => {
        const lastIndex = prev.length - 1;
        const lastMessage = prev[lastIndex];

        const newChunk = String(incomingText);
        if (!newChunk) return prev;

        // Check if the last message is a bot response
        if (lastMessage && (lastMessage.role === 'assistant' || lastMessage.type === 'assistant')) {
            const accumulated = (lastMessage.content || '') + newChunk;

            const replaced = {
                ...lastMessage,
                content: accumulated,
                text: accumulated,
                timestamp: new Date()
            };
            return [...prev.slice(0, -1), replaced];
        }

        // Start new message
        return [...prev, {
            id: Date.now(),
            role: 'assistant',
            type: 'assistant',
            content: newChunk,
            text: newChunk,
            timestamp: new Date()
        }];
    });
  }, []);


  // Handle service messages (text messages) - SIMPLIFIED AND CORRECTED LOGIC
  useEffect(() => {
    serviceMessages.forEach((msg) => {
      const messageId = msg?.id ?? `${msg?.type || 'unknown'}-${msg?.user || 'unknown'}-${JSON.stringify(msg?.payload || msg).slice(0, 100)}`;

      if (processedMessageIds.current.has(messageId)) return;
      processedMessageIds.current.add(messageId);

      if (processedMessageIds.current.size > 200) {
        processedMessageIds.current = new Set(Array.from(processedMessageIds.current).slice(-100));
      }

      const rawText = msg?.payload?.text ?? msg?.payload ?? msg?.text ?? msg?.content ?? (typeof msg === 'string' ? msg : '');
      const user = msg?.role ?? msg?.user ?? (msg?.type === 'user' ? 'user' : (msg?.type === 'assistant' ? 'bot' : (msg?.payload?.user ?? 'bot')));
      
      if (!rawText) return;

      // Skip control messages and reset buffers on turn completion
      if (rawText.includes('(turn-complete)') || rawText.includes('(turn-interrupted)') || rawText === 'turn-complete' || rawText === 'turn-interrupted') {
          setIsTyping(false);
          setIsListening(false);
          transcriptionBuffer.current = '';

          // Save the accumulated assistant message to history when turn completes
          if (assistantMessageBuffer.current.trim()) {
              saveMessageToHistory(assistantMessageBuffer.current.trim(), 'assistant', assistantMessageStartTime.current || new Date());
              assistantMessageBuffer.current = ''; // Clear the buffer
              assistantMessageStartTime.current = null; // Clear the start time
          }
          return;
      }
      
      // 1. Handle User Transcription (updates last user message) - CORRECTED
      if (user === 'user') {
          let cleanedChunk = rawText.replace(/<noise>/g, '').trim();
          cleanedChunk = repairBrokenChunk(cleanedChunk);

          if (!cleanedChunk) return; // Skip empty chunks

          // Decide if we need a space before appending the new chunk
          let separator = '';
          const currentBuffer = transcriptionBuffer.current;

          if (currentBuffer.length > 0) {
              const lastChar = currentBuffer[currentBuffer.length - 1];
              const firstChar = cleanedChunk[0];

              // Add space if both characters are word characters (letters/numbers)
              const isWordChar = (char) => /[a-zA-Z0-9]/.test(char);

              if (isWordChar(lastChar) && isWordChar(firstChar)) {
                  separator = ' ';
              }
              // If the previous buffer already ends with a space, don't add another one.
              if (currentBuffer.endsWith(' ')) {
                  separator = '';
              }
          }

          // Append to buffer with the determined separator
          transcriptionBuffer.current += separator + cleanedChunk;

          // Apply full spacing fix on the entire buffer for display
          const finalTranscription = fixTranscriptionSpacing(transcriptionBuffer.current);

          if (finalTranscription) {
              updateLastUserMessage(finalTranscription);
          }
      }
      
      // 2. Handle Bot Response (accumulate chunks and save only on turn completion)
      else if (user === 'bot' || user === 'assistant') {
           setIsTyping(true);

           const newChunk = rawText.trim();

           if (newChunk) {
               // Set the start time for the assistant message if this is the first chunk
               if (!assistantMessageBuffer.current) {
                   assistantMessageStartTime.current = new Date(msg?.timestamp || Date.now());
               }
               // Accumulate the chunk in the buffer for later saving - direct concatenation
               assistantMessageBuffer.current += newChunk;
               // Pass the new chunk to the UI accumulator
               accumulateBotMessage(newChunk);
           }
       }
    });

    scrollToBottom();
  }, [serviceMessages, updateLastUserMessage, accumulateBotMessage]);


  // Handle audio messages (play audio only)
  useEffect(() => {
    audioMessages.forEach((msg) => {
      const audioId = msg?.id ?? `audio-${JSON.stringify(msg?.audio || msg).slice(0, 100)}`;

      if (processedMessageIds.current.has(audioId)) return;
      processedMessageIds.current.add(audioId);

      const audioPayload = msg.audio?.data ? msg.audio : msg.payload;
      if (audioPayload && audioPayload.data) {
        audioService.playAudioFromBase64(audioPayload.data, { mimeHint: audioPayload.mimeType })
          .catch((error) => {
            console.error('Failed to play audio:', error);
            setAudioError('Failed to play audio response');
          });
      }
    });
  }, [audioMessages]);


  // Audio recording functions
  const handleStartRecording = async () => {
    if (connectionStatus !== 'session-active') {
      alert('Please start a session first!');
      return;
    }

    try {
      setIsRecording(true);
      setAudioError(null);
      setIsListening(true);
      transcriptionBuffer.current = ''; // Clear buffer for new turn

      // Add listening placeholder message
      setMessages(prev => {
        const last = prev[prev.length - 1];
        const lastVals = [last?.content, last?.text, last?.payload].filter(Boolean);
        const alreadyListening = lastVals.some(v => v === '...(Listening)' || v === '...(listening)');
        if (alreadyListening) return prev;

        return [...prev, {
          id: Date.now(),
          role: 'user',
          type: 'user',
          content: '...(Listening)',
          timestamp: new Date()
        }];
      });

      setIsTyping(true); // Indicate activity

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true }
      });
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });

      if (audioContext.state === 'suspended') await audioContext.resume();

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer;
        const pcmFloat = inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(pcmFloat.length);

        for (let i = 0; i < pcmFloat.length; i++) {
          const sample = Math.max(-1, Math.min(1, pcmFloat[i]));
          pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }

        const buffer = pcm16.buffer;
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const slice = bytes.subarray(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, slice);
        }
        const base64PCM = btoa(binary);

        try {
          sendAudioChunk({ mimeType: 'audio/pcm;rate=16000', data: base64PCM });
        } catch (error) {
          console.error('Error sending audio chunk:', error);
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      window.audioContext = audioContext;
      window.audioSource = source;
      window.audioProcessor = processor;
      window.audioStream = stream;
    } catch (error) {
      console.error('Failed to start recording:', error);
      setAudioError(`Failed to start recording: ${error.message}. Please check microphone permissions.`);
      setIsRecording(false);
      setIsListening(false);
      setIsTyping(false);
    }
  };

  const handleStopRecording = () => {
    try {
      if (window.audioProcessor) { window.audioProcessor.disconnect(); window.audioProcessor = null; }
      if (window.audioSource) { window.audioSource.disconnect(); window.audioSource = null; }
      if (window.audioContext) { window.audioContext.close(); window.audioContext = null; }
      if (window.audioStream) { window.audioStream.getTracks().forEach(track => track.stop()); window.audioStream = null; }

      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const handleConnect = async () => {
    // Generate a new session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentSessionId(sessionId);

    if (isRecording) handleStopRecording();
    setAudioError(null);
    setIsListening(false);
    processedMessageIds.current.clear();
    assistantMessageBuffer.current = ''; // Clear assistant message buffer for new session
    assistantMessageStartTime.current = null; // Clear assistant message start time for new session

    try {
      const safeMedicalData = sanitizeMedicalData(medicalData);
      const sessionData = safeMedicalData ? { medicalData: safeMedicalData } : {};
      await startSession(sessionData);
    } catch (error) {
      setAudioError('Failed to start session: ' + (error?.message || String(error)));
    }
  };

  const handleDisconnect = async () => {
    try {
      if (isRecording) handleStopRecording();

      setIsRecording(false);
      setIsListening(false);
      setAudioError(null);
      setIsTyping(false);
      processedMessageIds.current.clear();

      await endSession();
      disconnect(); 
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input,
      timestamp: new Date(),
      role: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    // Save user message to history
    saveMessageToHistory(input, 'user', new Date());
    setInput('');
    setIsTyping(true);

    if (connectionStatus === 'session-active') {
      sendTextPart(input);
    } else {
      // Fallback response
      setTimeout(() => {
        const responses = ["Thank you for your message. I am currently disconnected from the real-time AI service, but I can still chat with you if you start a session.", "Please press 'Start Session' to begin the voice interaction."];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const assistantMessage = {
          id: Date.now(),
          type: 'assistant',
          content: randomResponse,
          timestamp: new Date(),
          role: 'assistant'
        };
        setMessages(prev => [...prev, assistantMessage]);
        // Save fallback assistant message to history
        saveMessageToHistory(randomResponse, 'assistant', new Date());
        setIsTyping(false);
      }, 1500 + Math.random() * 1000);
    }
  };


  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          height: '600px',
          maxHeight: '80vh',
          borderRadius: 2,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          backgroundColor: 'primary.main',
          color: 'white',
          minHeight: 'auto'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <Avatar sx={{ bgcolor: 'white', color: 'primary.main' }}>
            <AssistantIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
              AI Health Assistant
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Voice-powered medical assistant
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: 'white',
            backgroundColor: 'rgba(255,255,255,0.1)',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
            ml: 1
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Control Buttons Row */}
      <Box sx={{
        display: 'flex',
        gap: 1,
        alignItems: 'center',
        p: 2,
        backgroundColor: 'primary.light',
        borderBottom: '1px solid',
        borderColor: 'divider',
        flexWrap: 'wrap'
      }}>
        <Button
          size="small"
          variant="contained"
          onClick={handleConnect}
          disabled={connectionStatus === 'session-active' || connectionStatus === 'connecting'}
          startIcon={<PlayArrowIcon />}
          sx={{ backgroundColor: 'white', color: 'primary.main', '&:hover': { backgroundColor: 'grey.100' } }}
        >
          {connectionStatus === 'connecting' ? <CircularProgress size={16} color="primary" sx={{ mr: 1 }} /> : (connectionStatus === 'session-active' ? 'Session Active' : 'Start Session')}
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={connectionStatus !== 'session-active'}
          startIcon={isRecording ? <StopIcon /> : <MicIcon />}
          color={isRecording ? 'error' : 'primary'}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={handleDisconnect}
          disabled={connectionStatus === 'disconnected' || connectionStatus === 'connecting'}
          startIcon={<StopIcon />}
          color="secondary"
        >
          {'End Session'}
        </Button>
        <Chip
          label={`Status: ${connectionStatus}`}
          size="small"
          color={connectionStatus === 'session-active' ? 'success' : (connectionStatus === 'disconnected' ? 'error' : 'warning')}
          sx={{ ml: 'auto', fontWeight: 'bold' }}
        />
        
        {audioError && (
          <Typography variant="caption" color="error" sx={{ width: '100%', mt: 1 }}>
            Audio Error: {audioError}
          </Typography>
        )}
      </Box>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '500px' }}>
            {/* Messages Area */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              <List>
                {messages.map((message) => (
                  <ListItem key={message.id} sx={{ alignItems: 'flex-start', px: 1 }}>
                    <ListItemAvatar>
                      <Avatar sx={{
                        bgcolor: message.type === 'assistant' ? 'primary.main' : 'secondary.main',
                        width: 36,
                        height: 36
                      }}>
                        {message.type === 'assistant' ? <AssistantIcon /> : <PersonIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {message.type === 'assistant' ? 'Health Assistant' : 'You'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {message.timestamp.toLocaleTimeString()}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Paper
                          elevation={1}
                          sx={{
                            p: 2,
                            mt: 1,
                            backgroundColor: message.type === 'assistant' ? 'grey.50' : 'primary.light',
                            borderRadius: 2,
                            whiteSpace: 'pre-wrap'
                          }}
                        >
                          <Typography variant="body2">
                            {message.content}
                          </Typography>
                        </Paper>
                      }
                    />
                  </ListItem>
                ))}
                {isTyping && (
                  <ListItem sx={{ alignItems: 'flex-start', px: 1 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                        <AssistantIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          Health Assistant
                        </Typography>
                      }
                      secondary={
                        <Paper elevation={1} sx={{ p: 2, mt: 1, backgroundColor: 'grey.50', borderRadius: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={16} />
                            <Typography variant="body2" color="text.secondary">
                              Thinking...
                            </Typography>
                          </Box>
                        </Paper>
                      }
                    />
                  </ListItem>
                )}
                <div ref={messagesEndRef} />
              </List>
            </Box>


            {/* Input Area */}
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <TextField
                fullWidth
                placeholder="Type your message or use voice commands..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                variant="outlined"
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping || connectionStatus !== 'session-active'}
                        color="primary"
                      >
                        <SendIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
        </DialogContent>
    </Dialog>
  );
};

export default Aiv3chat; // Exporting with the requested name