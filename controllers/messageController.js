const { validationResult } = require('express-validator');
const supabase = require('../config/supabase');

/**
 * Send a message to another user
 */
const sendMessage = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { receiverId, message } = req.body;
    const senderId = req.user.id;

    // Prevent sending message to self
    if (senderId === receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to yourself'
      });
    }

    // Verify receiver exists
    const { data: receiver, error: receiverError } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('user_id', receiverId)
      .single();

    if (receiverError || !receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Create message
    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        message: message.trim()
      })
      .select(`
        *,
        sender:profiles!sender_id (
          name,
          role
        ),
        receiver:profiles!receiver_id (
          name,
          role
        )
      `)
      .single();

    if (error) {
      console.error('Message creation error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to send message',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message: newMessage
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get conversation between current user and another user
 */
const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Get messages between the two users
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id (
          name,
          role
        ),
        receiver:profiles!receiver_id (
          name,
          role
        )
      `)
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Get conversation error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch conversation',
        error: error.message
      });
    }

    // Mark messages as read (messages received by current user)
    const unreadMessageIds = messages
      .filter(msg => msg.receiver_id === currentUserId && !msg.is_read)
      .map(msg => msg.id);

    if (unreadMessageIds.length > 0) {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', unreadMessageIds);
    }

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Return in chronological order
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: messages.length === parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get all conversations for current user (list of people they've messaged with)
 */
const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Get latest message with each person
    const { data: conversations, error } = await supabase
      .rpc('get_user_conversations', { user_id: currentUserId });

    if (error) {
      console.error('Get conversations error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch conversations',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: {
        conversations: conversations || []
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);

    // Fallback method if RPC doesn't exist
    try {
      const { data: messages, error: fallbackError } = await supabase
        .from('messages')
        .select(`
          id,
          message,
          created_at,
          is_read,
          sender_id,
          receiver_id,
          sender:profiles!sender_id (
            name,
            role
          ),
          receiver:profiles!receiver_id (
            name,
            role
          )
        `)
        .or(`sender_id.eq.${req.user.id},receiver_id.eq.${req.user.id}`)
        .order('created_at', { ascending: false });

      if (fallbackError) {
        throw fallbackError;
      }

      // Group by conversation partner
      const conversationMap = new Map();
      
      messages.forEach(message => {
        const partnerId = message.sender_id === req.user.id ? message.receiver_id : message.sender_id;
        const partner = message.sender_id === req.user.id ? message.receiver : message.sender;
        
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            partner_id: partnerId,
            partner_name: partner.name,
            partner_role: partner.role,
            last_message: message.message,
            last_message_time: message.created_at,
            unread_count: 0
          });
        }
      });

      const conversations = Array.from(conversationMap.values());

      res.json({
        success: true,
        data: {
          conversations
        }
      });
    } catch (fallbackError) {
      console.error('Fallback get conversations error:', fallbackError);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: fallbackError.message
      });
    }
  }
};

/**
 * Get unread message count for current user
 */
const getUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', currentUserId)
      .eq('is_read', false);

    if (error) {
      console.error('Get unread count error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch unread count',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: {
        unread_count: count || 0
      }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Mark conversation as read
 */
const markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', userId)
      .eq('receiver_id', currentUserId);

    if (error) {
      console.error('Mark as read error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to mark messages as read',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  getConversations,
  getUnreadCount,
  markAsRead
};