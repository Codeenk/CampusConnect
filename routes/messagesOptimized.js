const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const supabase = require('../config/supabase');

/**
 * Get recent messages (optimized for polling)
 * Used as fallback when WebSocket is not available
 */
router.get('/recent', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { since, limit = 20 } = req.query;
    
    // Build optimized query
    let query = supabase
      .from('messages')
      .select(`
        id,
        content,
        sender_id,
        receiver_id,
        conversation_id,
        message_type,
        created_at,
        sender:profiles!messages_sender_id_fkey(name, avatar_url)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // Only get messages newer than 'since' timestamp (for efficiency)
    if (since) {
      query = query.gt('created_at', since);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Get recent messages error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch messages',
        error: error.message
      });
    }

    // Return in reverse order (oldest first) for UI
    res.json({
      success: true,
      data: messages.reverse(),
      meta: {
        count: messages.length,
        since: since || null,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Recent messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Send message (HTTP endpoint)
 * Used when WebSocket is not available
 */
router.post('/send', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      receiver_id, 
      conversation_id, 
      content, 
      message_type = 'text' 
    } = req.body;

    // Validate required fields
    if (!receiver_id || !content) {
      return res.status(400).json({
        success: false,
        message: 'receiver_id and content are required'
      });
    }

    // Create or get conversation ID
    let finalConversationId = conversation_id;
    
    if (!finalConversationId) {
      // Generate conversation ID based on user IDs (sorted for consistency)
      const userIds = [userId, receiver_id].sort();
      finalConversationId = `${userIds[0]}_${userIds[1]}`;
    }

    // Insert message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        sender_id: userId,
        receiver_id: receiver_id,
        conversation_id: finalConversationId,
        content: content,
        message_type: message_type,
        created_at: new Date().toISOString()
      })
      .select(`
        id,
        content,
        sender_id,
        receiver_id,
        conversation_id,
        message_type,
        created_at,
        sender:profiles!messages_sender_id_fkey(name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Send message error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to send message',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: message,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get conversations list (optimized)
 */
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get latest message for each conversation
    const { data: conversations, error } = await supabase
      .from('messages')
      .select(`
        conversation_id,
        content,
        created_at,
        sender_id,
        receiver_id,
        message_type,
        sender:profiles!messages_sender_id_fkey(name, avatar_url),
        receiver:profiles!messages_receiver_id_fkey(name, avatar_url)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get conversations error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch conversations',
        error: error.message
      });
    }

    // Group by conversation and get latest message for each
    const conversationMap = new Map();
    
    conversations.forEach(msg => {
      if (!conversationMap.has(msg.conversation_id)) {
        // Determine the other participant
        const otherUser = msg.sender_id === userId ? msg.receiver : msg.sender;
        
        conversationMap.set(msg.conversation_id, {
          conversation_id: msg.conversation_id,
          last_message: {
            content: msg.content,
            created_at: msg.created_at,
            message_type: msg.message_type,
            sender_id: msg.sender_id
          },
          participant: otherUser,
          unread_count: 0 // Will be calculated separately if needed
        });
      }
    });

    const result = Array.from(conversationMap.values());

    res.json({
      success: true,
      data: result,
      meta: {
        total: result.length
      }
    });

  } catch (error) {
    console.error('Conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get messages for a specific conversation
 */
router.get('/conversation/:conversationId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const offset = (page - 1) * limit;

    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        sender_id,
        receiver_id,
        conversation_id,
        message_type,
        created_at,
        sender:profiles!messages_sender_id_fkey(name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Get conversation messages error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch conversation messages',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: messages.reverse(), // Oldest first for display
      meta: {
        conversation_id: conversationId,
        page: parseInt(page),
        limit: parseInt(limit),
        count: messages.length
      }
    });

  } catch (error) {
    console.error('Conversation messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;