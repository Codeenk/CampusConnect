const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

/**
 * WebSocket Server for Real-Time Messaging
 * Optimized for low-resource environments
 */
class MessageWebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/messages',
      clientTracking: true,
      maxPayload: 16 * 1024, // 16KB limit for low-end devices
    });
    
    this.clients = new Map(); // userId -> WebSocket connection
    this.roomClients = new Map(); // conversationId -> Set of userIds
    
    this.setupWebSocketServer();
    this.setupCleanup();
    
    console.log('🚀 WebSocket server initialized for real-time messaging');
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      console.log('📱 New WebSocket connection attempt');
      
      // Extract token from query params or headers
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token') || req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        console.log('❌ WebSocket connection rejected - No token');
        ws.close(1008, 'Authentication required');
        return;
      }

      try {
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        
        console.log(`✅ WebSocket authenticated for user: ${userId}`);
        
        // Store client connection
        ws.userId = userId;
        ws.isAlive = true;
        ws.lastPing = Date.now();
        
        this.clients.set(userId, ws);
        
        // Setup connection handlers
        this.setupConnectionHandlers(ws, userId);
        
        // Send connection confirmation
        ws.send(JSON.stringify({
          type: 'connection_established',
          userId: userId,
          timestamp: new Date().toISOString()
        }));
        
      } catch (error) {
        console.log('❌ WebSocket authentication failed:', error.message);
        ws.close(1008, 'Invalid token');
      }
    });
  }

  setupConnectionHandlers(ws, userId) {
    // Handle incoming messages
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await this.handleMessage(ws, userId, message);
      } catch (error) {
        console.error('Message handling error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    // Handle connection close
    ws.on('close', () => {
      console.log(`📱 WebSocket disconnected for user: ${userId}`);
      this.clients.delete(userId);
      this.removeFromAllRooms(userId);
    });

    // Handle ping/pong for connection health
    ws.on('pong', () => {
      ws.isAlive = true;
      ws.lastPing = Date.now();
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
      this.clients.delete(userId);
    });

    // Send initial ping
    ws.ping();
  }

  async handleMessage(ws, userId, message) {
    const { type, data } = message;

    switch (type) {
      case 'join_conversation':
        await this.handleJoinConversation(userId, data.conversationId);
        break;
        
      case 'leave_conversation':
        await this.handleLeaveConversation(userId, data.conversationId);
        break;
        
      case 'send_message':
        await this.handleSendMessage(userId, data);
        break;
        
      case 'typing_start':
        await this.handleTypingIndicator(userId, data.conversationId, true);
        break;
        
      case 'typing_stop':
        await this.handleTypingIndicator(userId, data.conversationId, false);
        break;
        
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
        
      default:
        console.log(`Unknown message type: ${type}`);
    }
  }

  async handleJoinConversation(userId, conversationId) {
    if (!this.roomClients.has(conversationId)) {
      this.roomClients.set(conversationId, new Set());
    }
    
    this.roomClients.get(conversationId).add(userId);
    console.log(`User ${userId} joined conversation ${conversationId}`);
  }

  async handleLeaveConversation(userId, conversationId) {
    if (this.roomClients.has(conversationId)) {
      this.roomClients.get(conversationId).delete(userId);
      
      // Clean up empty rooms
      if (this.roomClients.get(conversationId).size === 0) {
        this.roomClients.delete(conversationId);
      }
    }
    
    console.log(`User ${userId} left conversation ${conversationId}`);
  }

  async handleSendMessage(userId, messageData) {
    try {
      // Store message in database
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          sender_id: userId,
          receiver_id: messageData.receiver_id,
          conversation_id: messageData.conversation_id,
          content: messageData.content,
          message_type: messageData.message_type || 'text',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return;
      }

      // Broadcast to conversation participants
      await this.broadcastToConversation(messageData.conversation_id, {
        type: 'new_message',
        data: message
      });
      
      // Send to specific receiver if they're online but not in conversation
      if (messageData.receiver_id && this.clients.has(messageData.receiver_id)) {
        const receiverWs = this.clients.get(messageData.receiver_id);
        receiverWs.send(JSON.stringify({
          type: 'new_message',
          data: message
        }));
      }

    } catch (error) {
      console.error('Send message error:', error);
    }
  }

  async handleTypingIndicator(userId, conversationId, isTyping) {
    // Broadcast typing indicator to other participants
    await this.broadcastToConversation(conversationId, {
      type: isTyping ? 'user_typing' : 'user_stopped_typing',
      data: {
        userId: userId,
        conversationId: conversationId,
        timestamp: Date.now()
      }
    }, userId); // Exclude the sender
  }

  async broadcastToConversation(conversationId, message, excludeUserId = null) {
    if (!this.roomClients.has(conversationId)) {
      return;
    }

    const participants = this.roomClients.get(conversationId);
    const messageStr = JSON.stringify(message);

    participants.forEach(participantId => {
      if (participantId !== excludeUserId && this.clients.has(participantId)) {
        const ws = this.clients.get(participantId);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      }
    });
  }

  removeFromAllRooms(userId) {
    this.roomClients.forEach((participants, conversationId) => {
      participants.delete(userId);
      if (participants.size === 0) {
        this.roomClients.delete(conversationId);
      }
    });
  }

  setupCleanup() {
    // Ping clients periodically to detect disconnections
    const pingInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (!ws.isAlive) {
          console.log(`Terminating dead connection for user: ${ws.userId}`);
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // Every 30 seconds

    // Cleanup on server shutdown
    process.on('SIGINT', () => {
      console.log('Shutting down WebSocket server...');
      clearInterval(pingInterval);
      
      this.wss.clients.forEach((ws) => {
        ws.close(1001, 'Server shutting down');
      });
      
      this.wss.close();
    });
  }

  // Get server statistics
  getStats() {
    return {
      totalConnections: this.clients.size,
      activeConversations: this.roomClients.size,
      serverUptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }

  // Force disconnect a user (admin function)
  disconnectUser(userId) {
    if (this.clients.has(userId)) {
      const ws = this.clients.get(userId);
      ws.close(1000, 'Disconnected by admin');
      this.clients.delete(userId);
      this.removeFromAllRooms(userId);
      return true;
    }
    return false;
  }

  // Broadcast system message to all connected users
  broadcastSystemMessage(message) {
    const messageStr = JSON.stringify({
      type: 'system_message',
      data: message
    });

    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }
}

module.exports = MessageWebSocketServer;