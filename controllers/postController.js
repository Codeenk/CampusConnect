const { validationResult } = require('express-validator');
const supabase = require('../config/supabase');

/**
 * Create a new post
 */
const createPost = async (req, res) => {
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

    const { title, description, tags } = req.body;
    const userId = req.user.id;

    // Create post
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        title,
        description,
        tags: Array.isArray(tags) ? tags : [tags].filter(Boolean),
        created_by: userId
      })
      .select(`
        *
      `)
      .single();

    if (error) {
      console.error('Post creation error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to create post',
        error: error.message
      });
    }

    // Add creator info manually for mock
    post.creator = {
      name: req.user.profile?.name || 'Test User',
      role: req.user.role,
      department: req.user.profile?.department || 'Computer Science'
    };
    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        post
      }
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get post feed with pagination
 */
const getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10, tag, author } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('posts')
      .select(`
        *
      `)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    // Apply filters
    if (tag) {
      query = query.contains('tags', [tag]);
    }
    if (author) {
      query = query.eq('created_by', author);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('Get feed error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch posts',
        error: error.message
      });
    }

    // Add mock creator info and like status
    const postsWithLikeStatus = (posts || []).map(post => ({
      ...post,
      creator: {
        name: 'Test User',
        role: 'student',
        department: 'Computer Science'
      },
      isLikedByUser: false,
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0
    }));

    res.json({
      success: true,
      data: {
        posts: postsWithLikeStatus,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: posts.length === parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get single post by ID
 */
const getPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        creator:profiles!created_by (
          name,
          role,
          department
        ),
        post_comments (
          id,
          comment,
          created_at,
          user:profiles!user_id (
            name,
            role
          )
        ),
        post_likes (
          user_id
        )
      `)
      .eq('id', postId)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if current user liked the post
    const isLikedByUser = post.post_likes?.some(like => like.user_id === req.user.id) || false;

    res.json({
      success: true,
      data: {
        post: {
          ...post,
          isLikedByUser,
          post_likes: undefined // Remove detailed likes data
        }
      }
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update post (only by owner)
 */
const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, description, tags } = req.body;
    const userId = req.user.id;

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Update post
    const { data: post, error } = await supabase
      .from('posts')
      .update({
        title,
        description,
        tags: Array.isArray(tags) ? tags : [tags].filter(Boolean),
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .eq('created_by', userId) // Ensure user owns the post
      .select(`
        *,
        creator:profiles!created_by (
          name,
          role,
          department
        )
      `)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or unauthorized'
      });
    }

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: {
        post
      }
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Delete post (only by owner)
 */
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('created_by', userId); // Ensure user owns the post

    if (error) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or unauthorized'
      });
    }

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Like/unlike a post
 */
const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Check if user already liked the post
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      // Unlike the post
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        message: 'Post unliked successfully',
        data: {
          liked: false
        }
      });
    } else {
      // Like the post
      const { error } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: userId
        });

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        message: 'Post liked successfully',
        data: {
          liked: true
        }
      });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Add comment to post
 */
const commentPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    // Add comment
    const { data: newComment, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: userId,
        comment: comment.trim()
      })
      .select(`
        *,
        user:profiles!user_id (
          name,
          role
        )
      `)
      .single();

    if (error) {
      console.error('Comment creation error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to add comment',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comment: newComment
      }
    });
  } catch (error) {
    console.error('Comment post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createPost,
  getFeed,
  getPost,
  updatePost,
  deletePost,
  likePost,
  commentPost
};