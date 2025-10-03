import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { Heart, MessageCircle, Share, Plus, Award, Calendar, User } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Frontend validation
    if (formData.title.trim().length < 5 || formData.title.trim().length > 200) {
      alert('Title must be between 5 and 200 characters')
      return
    }
    
    if (formData.description.trim().length < 10 || formData.description.trim().length > 2000) {
      alert('Description must be between 10 and 2000 characters')
      return
    }
    
    setLoading(true)

    try {
      const postData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      }

      console.log('Sending post data:', postData)
      console.log('Title length:', postData.title.length)
      console.log('Description length:', postData.description.length)
      
      const response = await api.post('/posts/create', postData)
      console.log('Post created successfully:', response.data)
      onPostCreated()
      onClose()
      setFormData({ title: '', description: '', tags: '' })
    } catch (error) {
      console.error('Error creating post:', error)
      console.error('Error response:', error.response?.data)
      
      // Show user-friendly error message
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to create post'
      alert(`Error: ${errorMessage}`)
    }

    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 lg:p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-4 lg:p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Create New Post</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="Enter your project title"
            />
          </div>

                    <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-xs text-gray-500">({formData.title.length}/200 characters, min 5)</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="Give your post a title..."
              maxLength={200}
            />
            {formData.title.length > 0 && formData.title.length < 5 && (
              <p className="text-red-500 text-xs mt-1">Title must be at least 5 characters</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-xs text-gray-500">({formData.description.length}/2000 characters, min 10)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="input-field resize-none"
              placeholder="Share your thoughts, projects, or ask questions..."
              maxLength={2000}
            />
            {formData.description.length > 0 && formData.description.length < 10 && (
              <p className="text-red-500 text-xs mt-1">Description must be at least 10 characters</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="input-field"
              placeholder="e.g., React, Node.js, Machine Learning"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formData.title.trim().length < 5 || formData.description.trim().length < 10}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const PostCard = ({ post, onLike, onComment }) => {
  const [showComments, setShowComments] = useState(false)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLike = async () => {
    try {
      await onLike(post.id)
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return

    setLoading(true)
    try {
      await onComment(post.id, comment)
      setComment('')
    } catch (error) {
      console.error('Error commenting:', error)
    }
    setLoading(false)
  }

  return (
    <div className="card p-6 mb-6">
      {/* Post Header */}
      <div className="flex items-start space-x-4 mb-4">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold">
            {post.creator?.name?.charAt(0) || 'U'}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-900">{post.creator?.name || 'Unknown User'}</h3>
            <span className="text-sm text-gray-500 capitalize">• {post.creator?.role || 'Student'}</span>
            {post.creator?.role === 'faculty' && (
              <Award className="w-4 h-4 text-yellow-500" />
            )}
          </div>
          <p className="text-sm text-gray-500">{post.creator?.department}</p>
          <div className="flex items-center space-x-1 text-xs text-gray-400 mt-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
        <p className="text-gray-700 leading-relaxed">{post.description}</p>
        
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              post.isLikedByUser
                ? 'text-red-600 bg-red-50 hover:bg-red-100'
                : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
            }`}
          >
            <Heart className={`w-5 h-5 ${post.isLikedByUser ? 'fill-current' : ''}`} />
            <span>{post.likes_count || 0}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{post.comments_count || 0}</span>
          </button>

          <button className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors">
            <Share className="w-5 h-5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <form onSubmit={handleComment} className="flex space-x-3 mb-4">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading || !comment.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Comment'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

const Feed = () => {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchPosts = async () => {
    try {
      const response = await api.get('/posts/feed')
      setPosts(response.data.data.posts)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleLike = async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/like`)
      const liked = response.data.data.liked

      setPosts(posts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLikedByUser: liked,
              likes_count: liked ? (post.likes_count || 0) + 1 : (post.likes_count || 1) - 1
            }
          : post
      ))
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const handleComment = async (postId, comment) => {
    try {
      await api.post(`/posts/${postId}/comment`, { comment })
      
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, comments_count: (post.comments_count || 0) + 1 }
          : post
      ))
    } catch (error) {
      console.error('Error commenting:', error)
    }
  }

  const handlePostCreated = () => {
    fetchPosts()
  }

  if (loading) {
    return <LoadingSpinner text="Loading feed..." />
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Welcome Header */}
      <div className="card p-4 lg:p-6 mb-4 lg:mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
          <div className="flex-1">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
              Welcome back, {user?.profile?.name || 'User'}! 👋
            </h1>
            <p className="text-sm lg:text-base text-gray-600 mt-1">
              Share your projects and connect with your campus community
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="hidden lg:flex btn-primary items-center justify-center space-x-2 w-full lg:w-auto text-sm lg:text-base"
          >
            <Plus className="w-4 lg:w-5 h-4 lg:h-5" />
            <span>Create Post</span>
          </button>
        </div>
      </div>

      {/* Posts Feed */}
      {posts.length === 0 ? (
        <div className="card p-8 lg:p-12 text-center">
          <div className="w-12 lg:w-16 h-12 lg:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-6 lg:w-8 h-6 lg:h-8 text-gray-400" />
          </div>
          <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
          <p className="text-sm lg:text-base text-gray-600 mb-4">
            Be the first to share a project with your campus community!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="hidden lg:inline-flex btn-primary text-sm lg:text-base"
          >
            Create Your First Post
          </button>
          <p className="lg:hidden text-sm text-gray-500 mt-2">
            Use the + button in the bottom navigation to create your first post!
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={handleLike}
            onComment={handleComment}
          />
        ))
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  )
}

export default Feed