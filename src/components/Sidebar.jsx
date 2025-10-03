import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useMessages } from '../contexts/MessagesContext'
import api from '../services/api'
import { 
  Hop as Home, 
  Users, 
  MessageCircle, 
  User, 
  Settings, 
  LogOut, 
  Shield, 
  GraduationCap,
  Search,
  X,
  MapPin,
  UserPlus,
  Mail,
  Plus,
  Save
} from 'lucide-react'

const SearchOverlay = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])

  const searchProfiles = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const response = await api.get(`/profile/all?search=${encodeURIComponent(query)}&limit=20`)
      if (response.data.success) {
        setSearchResults(response.data.data.profiles || [])
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchProfiles(searchQuery)
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [searchQuery])

  const handleProfileClick = (profile) => {
    // Add to recent searches
    const updatedRecent = [profile, ...recentSearches.filter(p => p.id !== profile.id)].slice(0, 5)
    setRecentSearches(updatedRecent)
    
    // Navigate to read-only profile view
    window.location.href = `/profile/${profile.user_id}?view=readonly`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Search Panel - Responsive Width */}
      <div className="relative w-full lg:w-1/2 h-full bg-white shadow-2xl overflow-hidden lg:ml-auto">
        {/* Search Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Search Campus</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-50 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for classmates, faculty, friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : searchQuery ? (
            searchResults.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Search Results ({searchResults.length})
                </h3>
                {searchResults.map((profile) => (
                  <div
                    key={profile.id}
                    onClick={() => handleProfileClick(profile)}
                    className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-all duration-200 hover:shadow-md group"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold">
                        {profile.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    
                    {/* Profile Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-900 truncate">{profile.name}</h4>
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                          View Only
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-gray-600 capitalize">{profile.role}</span>
                        {profile.department && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-600">{profile.department}</span>
                          </>
                        )}
                        {profile.year && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-xs text-gray-500">Year {profile.year}</span>
                          </>
                        )}
                      </div>
                      {profile.bio && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 truncate">
                          {profile.bio}
                        </p>
                      )}
                      {profile.skills && profile.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {profile.skills.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded"
                            >
                              {skill}
                            </span>
                          ))}
                          {profile.skills.length > 3 && (
                            <span className="text-xs text-gray-500">+{profile.skills.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Indicators */}
                    <div className="flex flex-col items-center space-y-1">
                      <div className="p-2 text-blue-600 group-hover:bg-blue-50 rounded-lg transition-colors">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="text-xs text-gray-500">View Profile</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">
                  Try searching with different keywords or check the spelling.
                </p>
              </div>
            )
          ) : (
            <div>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                    Recent Searches
                  </h3>
                  <div className="space-y-2">
                    {recentSearches.map((profile) => (
                      <div
                        key={profile.id}
                        onClick={() => handleProfileClick(profile)}
                        className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {profile.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{profile.name}</p>
                          <p className="text-sm text-gray-600 capitalize">{profile.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Suggestions */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Suggestions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Classmates', icon: GraduationCap, query: 'student' },
                    { label: 'Faculty', icon: Shield, query: 'faculty' },
                    { label: 'Computer Science', icon: Users, query: 'computer science' },
                    { label: 'Engineering', icon: Settings, query: 'engineering' }
                  ].map((suggestion) => (
                    <button
                      key={suggestion.label}
                      onClick={() => setSearchQuery(suggestion.query)}
                      className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <suggestion.icon className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">{suggestion.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

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
      
      const response = await api.post('/posts/create', postData)
      if (onPostCreated) onPostCreated()
      onClose()
      setFormData({ title: '', description: '', tags: '' })
      
      // Navigate to feed to see the new post
      window.location.href = '/feed'
    } catch (error) {
      console.error('Error creating post:', error)
      
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Create New Post</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-xs text-gray-500">({formData.title.length}/200 characters, min 5)</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., React, Node.js, Machine Learning"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formData.title.trim().length < 5 || formData.description.trim().length < 10}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Creating...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Create Post</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const Sidebar = () => {
  const { user, logout } = useAuth()
  const { unreadCount } = useMessages()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [createPostOpen, setCreatePostOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/feed', icon: Home, label: 'Feed', shortLabel: 'Feed' },
    { to: '/profile', icon: User, label: 'Profile', shortLabel: 'Profile' },
    { type: 'action', icon: Plus, label: 'Create Post', shortLabel: 'Create', action: () => setCreatePostOpen(true), className: 'create-post-btn' },
    { to: '/messages', icon: MessageCircle, label: 'Messages', shortLabel: 'Messages', badge: unreadCount > 0 ? unreadCount : null },
    ...(user?.role === 'admin' ? [{ to: '/admin', icon: Shield, label: 'Admin Panel', shortLabel: 'Admin' }] : []),
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-white shadow-lg border-r border-gray-200 flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 gradient-bg rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">Campus Connect</h1>
              <p className="text-xs text-gray-500">College Network</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.profile?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.profile?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role || 'Student'}
              </p>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-all duration-200 group"
          >
            <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Search Campus</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 relative ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {item.badge && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-medium shadow-lg">
                    {item.badge > 99 ? '99+' : item.badge}
                  </div>
                )}
              </div>
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <NavLink
            to="/settings"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </NavLink>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">Campus Connect</h1>
            </div>
          </div>

          {/* Mobile Header Actions */}
          <div className="flex items-center space-x-2">
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            
            {/* User Avatar / Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-xs">
                  {user?.profile?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full right-0 w-64 bg-white shadow-lg border border-gray-200 rounded-bl-lg">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user?.profile?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.profile?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role || 'Student'}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-2">
              <NavLink
                to="/settings"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </NavLink>
              <button
                onClick={() => {
                  handleLogout()
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white shadow-lg border-t border-gray-200">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item, index) => {
            if (item.type === 'action') {
              return (
                <button
                  key={index}
                  onClick={item.action}
                  className="flex flex-col items-center py-2 px-3 min-w-0 relative text-white"
                >
                  <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-2 shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium truncate max-w-[60px] text-gray-600 mt-1">{item.shortLabel}</span>
                </button>
              )
            }
            
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center py-2 px-3 min-w-0 relative ${
                    isActive
                      ? 'text-blue-600'
                      : 'text-gray-600'
                  }`
                }
              >
                <div className="relative">
                  <item.icon className="w-6 h-6 mb-1" />
                  {item.badge && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-[16px] flex items-center justify-center font-medium">
                      {item.badge > 99 ? '99+' : item.badge}
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium truncate max-w-[60px]">{item.shortLabel}</span>
              </NavLink>
            )
          })}
        </div>
      </div>

      {/* Search Overlay */}
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      
      {/* Create Post Modal */}
      <CreatePostModal 
        isOpen={createPostOpen} 
        onClose={() => setCreatePostOpen(false)}
        onPostCreated={() => {
          // Refresh the page to show new posts if we're on the feed
          if (window.location.pathname === '/feed') {
            window.location.reload()
          }
        }}
      />
    </>
  )
}

export default Sidebar