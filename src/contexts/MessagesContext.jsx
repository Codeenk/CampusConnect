import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import OptimizedMessagingService from '../services/optimizedMessaging';

const MessagesContext = createContext();

export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
};

export const MessagesProvider = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [typingUsers, setTypingUsers] = useState(new Set());

  // Handle incoming messages
  const handleNewMessage = useCallback((message) => {
    if (message.type === 'new_message') {
      const newMsg = message.data;
      
      // Update messages if it's for the active conversation
      if (activeConversation && newMsg.conversation_id === activeConversation.id) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(msg => msg.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
      
      // Update conversations list
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.conversation_id === newMsg.conversation_id) {
            return {
              ...conv,
              last_message: {
                content: newMsg.content,
                created_at: newMsg.created_at,
                message_type: newMsg.message_type,
                sender_id: newMsg.sender_id
              }
            };
          }
          return conv;
        });
        
        // If conversation doesn't exist, fetch updated list
        if (!updated.some(conv => conv.conversation_id === newMsg.conversation_id)) {
          fetchConversations();
        }
        
        return updated;
      });
    } else if (message.type === 'user_typing') {
      setTypingUsers(prev => new Set(prev.add(message.data.userId)));
    } else if (message.type === 'user_stopped_typing') {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(message.data.userId);
        return newSet;
      });
    }
  }, [activeConversation]);

  // Initialize messaging service
  useEffect(() => {
    if (user) {
      console.log('🚀 Initializing optimized messaging system...');
      
      // Subscribe to real-time messages
      const messageUnsubscribe = OptimizedMessagingService.onMessage(handleNewMessage);
      
      // Subscribe to connection state changes
      const connectionUnsubscribe = OptimizedMessagingService.onConnectionStateChange((state) => {
        setConnectionStatus(state);
      });
      
      // Fetch initial data
      fetchConversations();
      
      return () => {
        messageUnsubscribe();
        connectionUnsubscribe();
      };
    }
  }, [user, handleNewMessage]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await api.get('/messages/conversations');
      
      if (response.data.success) {
        setConversations(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/messages/conversation/${conversationId}`);
      
      if (response.data.success) {
        setMessages(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (receiverId, content, messageType = 'text') => {
    if (!user || !receiverId || !content?.trim()) return;

    try {
      // Generate conversation ID
      const conversationId = [user.id, receiverId].sort().join('_');
      
      const messageData = {
        receiver_id: receiverId,
        conversation_id: conversationId,
        content: content.trim(),
        message_type: messageType
      };

      // Send via optimized service
      const result = await OptimizedMessagingService.sendMessage(messageData);
      
      if (result.success) {
        // Optimistically add to local messages if it's for active conversation
        if (activeConversation?.id === conversationId) {
          const optimisticMessage = {
            id: `temp_${Date.now()}`,
            content: content.trim(),
            sender_id: user.id,
            receiver_id: receiverId,
            conversation_id: conversationId,
            message_type: messageType,
            created_at: new Date().toISOString(),
            sender: {
              name: user.name,
              avatar_url: user.avatar_url
            }
          };
          
          setMessages(prev => [...prev, optimisticMessage]);
        }
        
        return result;
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      return { success: false, error: error.message };
    }
  }, [user, activeConversation]);

  // Start conversation
  const startConversation = useCallback(async (userId) => {
    if (!user || !userId) return;
    
    const conversationId = [user.id, userId].sort().join('_');
    
    // Check if conversation already exists
    const existingConv = conversations.find(conv => conv.conversation_id === conversationId);
    
    if (existingConv) {
      setActiveConversation(existingConv);
      await fetchMessages(conversationId);
    } else {
      // Create new conversation object
      const newConversation = {
        conversation_id: conversationId,
        participant: { id: userId }, // Will be populated when first message is sent
        last_message: null
      };
      
      setActiveConversation(newConversation);
      setMessages([]);
    }
  }, [user, conversations, fetchMessages]);

  // Set active conversation
  const setActiveConv = useCallback(async (conversation) => {
    setActiveConversation(conversation);
    if (conversation) {
      await fetchMessages(conversation.conversation_id);
    }
  }, [fetchMessages]);

  // Get connection info
  const getConnectionInfo = useCallback(() => {
    return OptimizedMessagingService.getConnectionStatus();
  }, []);

  // Mark messages as read (placeholder - implement as needed)
  const markAsRead = useCallback(async (conversationId) => {
    // Implementation depends on your read status requirements
    console.log('Mark as read:', conversationId);
  }, []);

  const value = {
    // State
    conversations,
    activeConversation,
    messages,
    loading,
    connectionStatus,
    typingUsers,
    
    // Actions
    sendMessage,
    fetchConversations,
    fetchMessages,
    startConversation,
    setActiveConversation: setActiveConv,
    markAsRead,
    getConnectionInfo,
    
    // Utility
    isConnected: connectionStatus === 'connected',
    connectionMethod: getConnectionInfo().method
  };

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
};

export default MessagesContext;