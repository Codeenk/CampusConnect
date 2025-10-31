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

    const { receiverId, message, message_type = 'text', attachments = [] } = req.body;
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
        message: message.trim(),
        message_type: message_type,
        attachments: Array.isArray(attachments) ? attachments : [],
        status: 'sent'
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
    console.log('Fetching conversations for user:', currentUserId);

    // Use direct query instead of RPC function to avoid dependency issues
    const { data: messages, error } = await supabase
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
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch conversations',
        error: error.message
      });
    }

    console.log('Found messages:', messages?.length || 0);

    // Group by conversation partner and get latest message
    const conversationMap = new Map();
    
    messages.forEach(message => {
      const partnerId = message.sender_id === currentUserId ? message.receiver_id : message.sender_id;
      const partner = message.sender_id === currentUserId ? message.receiver : message.sender;
      
      if (!conversationMap.has(partnerId)) {
        // Count unread messages for this partner
        const unreadCount = messages.filter(m => 
          m.sender_id === partnerId && 
          m.receiver_id === currentUserId && 
          !m.is_read
        ).length;

        conversationMap.set(partnerId, {
          partner_id: partnerId,
          partner_name: partner.name,
          partner_role: partner.role,
          last_message: message.message,
          last_message_time: message.created_at,
          unread_count: unreadCount
        });
      }
    });

    const conversations = Array.from(conversationMap.values());
    console.log('Processed conversations:', conversations.length);

    res.json({
      success: true,
      data: {
        conversations
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
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