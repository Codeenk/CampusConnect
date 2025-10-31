const { validationResult } = require('express-validator');
const supabase = require('../config/supabase');

/**
 * Get user notifications
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unread_only = false } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('notifications')
      .select(`
        *,
        related_user:profiles!related_user_id (
          name,
          avatar_url,
          role
        ),
        related_post:posts!related_post_id (
          title
        )
      `)
      .eq('user_id', userId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (unread_only === 'true') {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Get notifications error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch notifications',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: notifications.length
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const { data: notification, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Mark notification as read error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: { notification }
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: notifications, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select();

    if (error) {
      console.error('Mark all notifications as read error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: { count: notifications.length }
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Create notification (helper function)
 */
const createNotification = async (notificationData) => {
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notificationData.user_id,
        type: notificationData.type,
        title: notificationData.title,
        content: notificationData.content,
        related_user_id: notificationData.related_user_id || null,
        related_post_id: notificationData.related_post_id || null,
        related_comment_id: notificationData.related_comment_id || null
      })
      .select()
      .single();

    if (error) {
      console.error('Create notification error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, notification };
  } catch (error) {
    console.error('Create notification error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get unread notification count
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Get unread count error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to get unread count',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: { unread_count: count || 0 }
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

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  getUnreadCount
};