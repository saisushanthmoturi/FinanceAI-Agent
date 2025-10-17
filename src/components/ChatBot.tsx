import React, { useState, useEffect, useRef } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Close,
  Send,
  Mic,
  MicOff,
  // VolumeUp, // Removed - audio output disabled
} from '@mui/icons-material';
import { useAppStore } from '../store/useAppStore';
import { chatService } from '../services/chat';
import type { ChatSession } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ChatBot: React.FC<Props> = ({ open, onClose }) => {
  const { user, language, currentChatSession, setCurrentChatSession } = useAppStore();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  // Audio output removed as per user request
  // const [speaking, setSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChatSession?.messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      
      // Set language based on user preference
      const langMap: Record<string, string> = {
        en: 'en-US',
        hi: 'hi-IN',
        te: 'te-IN',
        ta: 'ta-IN',
        ml: 'ml-IN',
      };
      recognitionInstance.lang = langMap[language] || 'en-US';

      recognitionInstance.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setMessage(transcript);
      };

      recognitionInstance.onend = () => {
        setListening(false);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (listening) {
      recognition.stop();
      setListening(false);
    } else {
      recognition.start();
      setListening(true);
    }
  };

  // Audio output removed as per user request
  // const speakResponse = (text: string) => {
  //   // Functionality disabled
  // };

  const handleSend = async () => {
    if (!message.trim() || !user) return;

    setLoading(true);
    try {
      const { session } = await chatService.sendMessage(
        user.id,
        message,
        language,
        currentChatSession?.id
      );
      setCurrentChatSession(session);
      
      // Audio output removed - no longer speaking responses
      // const latestMessage = session.messages[session.messages.length - 1];
      // if (latestMessage && latestMessage.role === 'assistant') {
      //   speakResponse(latestMessage.content);
      // }
      
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Even if there's an error, provide a fallback response in the UI
      // This ensures the chatbot always responds
      const fallbackResponse = language === 'hi'
        ? '⚠️ क्षमा करें, एक तकनीकी त्रुटि हुई। कृपया फिर से प्रयास करें या अपना प्रश्न दोबारा पूछें। मैं बिना API के भी बुनियादी वित्तीय सलाह दे सकता हूं।'
        : '⚠️ Sorry, a technical error occurred. Please try again or rephrase your question. I can still provide basic financial advice without API access.';
      
      // Create a temporary session with the error message if none exists
      if (!currentChatSession) {
        const tempSession: ChatSession = {
          id: 'temp-' + Date.now(),
          userId: user.id,
          messages: [
            {
              id: 'user-' + Date.now(),
              role: 'user',
              content: message,
              timestamp: new Date(),
              language,
            },
            {
              id: 'assistant-' + Date.now(),
              role: 'assistant',
              content: fallbackResponse,
              timestamp: new Date(),
              language,
            },
          ],
          startedAt: new Date(),
          lastMessageAt: new Date(),
          language,
        };
        setCurrentChatSession(tempSession);
      }
      
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    'What is my current net worth?',
    'Can I retire in 10 years?',
    'How can I save more money?',
    'What are my biggest expenses?',
  ];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 400 },
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight="bold">
              AI Financial Advisor
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ask me anything in {language === 'en' ? 'English' : language === 'hi' ? 'Hindi' : language}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>

        {/* Messages */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: 2,
            bgcolor: 'background.default',
          }}
        >
          {!currentChatSession || currentChatSession.messages.length === 0 ? (
            <Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                👋 Hello! I'm your AI financial advisor. Ask me anything about:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                {suggestedQuestions.map((q, idx) => (
                  <Chip
                    key={idx}
                    label={q}
                    onClick={() => setMessage(q)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>
          ) : (
            currentChatSession.messages.map((msg) => (
              <Box
                key={msg.id}
                sx={{
                  mb: 2,
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    maxWidth: '80%',
                    bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                    color: msg.role === 'user' ? 'white' : 'text.primary',
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      opacity: 0.7,
                    }}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </Typography>
                </Paper>
              </Box>
            ))
          )}
          {loading && (
            <Box display="flex" justifyContent="center" py={2}>
              <CircularProgress size={24} />
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Type your message in ${language === 'en' ? 'English' : 'Hindi'}...`}
              disabled={loading}
              variant="outlined"
              size="small"
            />
            <IconButton
              color="primary"
              onClick={toggleListening}
              disabled={loading}
              sx={{
                bgcolor: listening ? 'error.main' : 'transparent',
                color: listening ? 'white' : 'inherit',
                '&:hover': {
                  bgcolor: listening ? 'error.dark' : 'action.hover',
                },
              }}
            >
              {listening ? <MicOff /> : <Mic />}
            </IconButton>
            {/* Audio output removed - VolumeUp button disabled */}
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={loading || !message.trim()}
            >
              <Send />
            </IconButton>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Powered by Google Gemini AI
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default ChatBot;
