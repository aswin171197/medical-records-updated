// src/components/ChatHistory.jsx
import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Typography,
  Paper, List, ListItem, ListItemText, ListItemAvatar, Avatar, CircularProgress, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  SmartToy as AssistantIcon, Person as PersonIcon, Delete as DeleteIcon, Summarize as SummaryIcon
} from '@mui/icons-material';

import apiService from '../services/apiService';

const ChatHistory = ({ user }) => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionMessages, setSessionMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, sessionId: null });
  const [summaryDialog, setSummaryDialog] = useState({ open: false, sessionId: null, summary: '', loading: false });
  const messagesEndRef = useRef(null);

  // Fetch chat sessions on mount
  useEffect(() => {
    fetchChatSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchChatSessions = async () => {
    console.log('apiService.get type:', typeof apiService.get);
    setLoading(true);
    try {
      const response = await apiService.get('/chat-history/sessions');
      // Defensive: handle axios-like and fetch-like responses
      const data = response?.data ?? response ?? [];
      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch chat sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionMessages = async (sessionId) => {
    setLoading(true);
    try {
      const response = await apiService.get(`/chat-history/session/${sessionId}`);
      const data = response?.data ?? response ?? [];
      // Normalize into array
      setSessionMessages(Array.isArray(data) ? data : []);
      setSelectedSession(sessionId);
    } catch (error) {
      console.error('Failed to fetch session messages:', error);
      setSessionMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = (sessionId) => {
    fetchSessionMessages(sessionId);
  };

  const handleBackToSessions = () => {
    setSelectedSession(null);
    setSessionMessages([]);
  };

  const handleDeleteHistory = () => {
    setDeleteDialog({ open: true, type: 'all', sessionId: null });
  };

  const handleDeleteSession = (sessionId) => {
    setDeleteDialog({ open: true, type: 'session', sessionId });
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      if (deleteDialog.type === 'all') {
        await apiService.delete('/chat-history');
        setSessions([]);
        setSessionMessages([]);
        setSelectedSession(null);
      } else if (deleteDialog.type === 'session') {
        await apiService.delete(`/chat-history/session/${deleteDialog.sessionId}`);
        // Refresh the sessions list
        await fetchChatSessions();
        // If the deleted session was currently selected, go back to sessions list
        if (selectedSession === deleteDialog.sessionId) {
          setSelectedSession(null);
          setSessionMessages([]);
        }
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setLoading(false);
      setDeleteDialog({ open: false, type: null, sessionId: null });
    }
  };

  const cancelDelete = () => {
    setDeleteDialog({ open: false, type: null, sessionId: null });
  };

  const generateChatSummary = async (sessionId) => {
    setSummaryDialog({ open: true, sessionId, summary: '', loading: true });
    
    try {
      const response = await apiService.get(`/chat-history/session/${sessionId}`);
      const messages = response?.data ?? response ?? [];
      
      if (messages.length === 0) {
        setSummaryDialog(prev => ({ ...prev, summary: 'No messages found in this session.', loading: false }));
        return;
      }
      
      // Generate summary client-side
      const userMessages = messages.filter(msg => msg.role === 'user');
      
      const summary = `**Key Discussion Points:**\n\n` +
        userMessages.map((msg, i) => 
          `${i + 1}. ${(msg.message ?? msg.text ?? msg.body ?? '').substring(0, 150)}...`
        ).join('\n\n');
      
      setSummaryDialog(prev => ({ ...prev, summary, loading: false }));
      
    } catch (error) {
      console.error('Failed to generate chat summary:', error);
      setSummaryDialog(prev => ({ 
        ...prev, 
        summary: 'Failed to load session messages. Please try again later.', 
        loading: false 
      }));
    }
  };

  const closeSummaryDialog = () => {
    setSummaryDialog({ open: false, sessionId: null, summary: '', loading: false });
  };

  // scroll to bottom when session messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionMessages]);

  return (
    <Box sx={{
      p: 4,
      maxWidth: '900px',
      mx: 'auto',
      backgroundColor: 'background.paper',
      borderRadius: 3,
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
          {selectedSession ? 'Chat Session' : 'Chat History'}
        </Typography>
        {!selectedSession && sessions.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteHistory}
            disabled={loading}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Delete All History
          </Button>
        )}
      </Box>

      {selectedSession && (
        <Button
          onClick={handleBackToSessions}
          sx={{
            mb: 3,
            textTransform: 'none',
            fontWeight: 600,
            color: 'primary.main'
          }}
          startIcon={<Typography sx={{ fontSize: '1.2em' }}>←</Typography>}
        >
          Back to Sessions
        </Button>
      )}

      {loading ? (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '300px',
          gap: 2
        }}>
          <CircularProgress size={50} sx={{ color: 'primary.main' }} />
          <Typography variant="body1" color="text.secondary">
            Loading...
          </Typography>
        </Box>
      ) : selectedSession ? (
        // Show messages for selected session
        <Box sx={{ maxHeight: '600px', overflow: 'auto', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <List sx={{ p: 0 }}>
            {sessionMessages.map((message, index) => {
              const role = message.role;
              const label = role === 'assistant' ? 'Health Assistant' : (role === 'system' ? 'System' : 'You');

              // Ensure timestamp works if it's numeric or string
              const timeNum = message.timestamp ? Number(message.timestamp) : (message.time ? Number(message.time) : null);
              const time = timeNum ? new Date(timeNum).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              }) : (message.timestamp ? new Date(message.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              }) : '');

              const text = message.message ?? message.text ?? message.body ?? '';

              return (
                <ListItem key={message.id ?? `${selectedSession}_${index}`} sx={{
                  alignItems: 'flex-start',
                  px: 3,
                  py: 2,
                  borderBottom: index < sessionMessages.length - 1 ? '1px solid' : 'none',
                  borderBottomColor: 'divider',
                  '&:hover': { backgroundColor: 'grey.50' }
                }}>
                  <ListItemAvatar>
                    <Avatar sx={{
                      bgcolor: role === 'assistant' ? 'primary.main' : 'secondary.main',
                      width: 40,
                      height: 40,
                      mt: 0.5
                    }}>
                      {role === 'assistant' ? <AssistantIcon /> : <PersonIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          {label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {time}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Paper elevation={0} sx={{
                        p: 2,
                        backgroundColor: role === 'assistant' ? 'grey.50' : 'primary.light',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: role === 'assistant' ? 'grey.200' : 'primary.light'
                      }}>
                        <Typography variant="body1" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                          {text}
                        </Typography>
                      </Paper>
                    }
                  />
                </ListItem>
              );
            })}
            <div ref={messagesEndRef} />
          </List>
        </Box>
      ) : (
        // Show sessions as boxes
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 3,
          px: 1
        }}>
          {sessions.map((session, index) => {
            const sid = session.sessionId ?? session.id ?? `session-${index}`;
            const lastMsg = session.lastMessage ?? session.lastMessageAt ?? session.lastMessageTimestamp ?? session.updatedAt ?? session.last_seen ?? '';
            const lastMsgTime = lastMsg ? (Number(lastMsg) ? new Date(Number(lastMsg)).toLocaleString() : new Date(lastMsg).toLocaleString()) : '';

            return (
              <Paper
                key={sid}
                elevation={1}
                sx={{
                  p: 3,
                  cursor: 'pointer',
                  position: 'relative',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    elevation: 4,
                    backgroundColor: 'grey.50',
                    borderColor: 'primary.light',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                  }
                }}
                onClick={() => handleSessionClick(sid)}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 0.5 }}>
                      Session {index + 1}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(lastMsg).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(sid);
                    }}
                    sx={{
                      color: 'grey.400',
                      opacity: 0.7,
                      '&:hover': {
                        backgroundColor: 'error.light',
                        color: 'error.main',
                        opacity: 1
                      }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                    {session.messageCount ?? session.count ?? '0'} messages
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    {new Date(lastMsg).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<SummaryIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      generateChatSummary(sid);
                    }}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      py: 0.5,
                      borderRadius: '8px'
                    }}
                  >
                    Chat Summary
                  </Button>
                </Box>
              </Paper>
            );
          })}
          {sessions.length === 0 && !loading && (
            <Box sx={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              py: 8,
              px: 4
            }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
                No Chat Sessions Yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start a conversation with the AI Health Assistant to see your chat history here.
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={cancelDelete}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
            Confirm Deletion
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Typography variant="body1">
            {deleteDialog.type === 'all'
              ? 'Are you sure you want to delete all chat history? This action cannot be undone.'
              : 'Are you sure you want to delete this chat session? This action cannot be undone.'
            }
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={cancelDelete}
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            color="error"
            disabled={loading}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Chat Summary Dialog */}
      <Dialog
        open={summaryDialog.open}
        onClose={closeSummaryDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Chat Summary
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          {summaryDialog.loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4 }}>
              <CircularProgress size={24} />
              <Typography>Generating summary...</Typography>
            </Box>
          ) : (
            <Typography variant="body1" sx={{ lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {summaryDialog.summary}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={closeSummaryDialog}
            variant="contained"
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatHistory;
