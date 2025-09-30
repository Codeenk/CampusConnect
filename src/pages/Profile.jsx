import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { 
  Edit3, 
  MapPin, 
  Calendar, 
  Github, 
  Linkedin,
  Globe,
  Mail,
  Building,
  GraduationCap,
  Plus,
  Save,
  X,
  Camera,
  Briefcase,
  Code2,
  Award,
  User,
  MessageCircle,
  Phone,
  BookOpen,
  Target,
  Star,
  Trophy,
  Zap
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

// Editable Field Component for inline editing
const EditableField = ({ label, value, field, type = 'text', canEdit, onSave, placeholder, options, inputProps = {} }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setEditValue(value || '')
  }, [value])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(editValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value || '')
    setIsEditing(false)
  }

  if (!canEdit) {
    // Read-only mode
    return (
      <div className="space-y-1">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <div className="px-3 py-2 border border-gray-200 rounded-md bg-gray-50">
          <span className="text-gray-900">{value || 'Not set'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      
      {isEditing ? (
        <div className="space-y-2">
          {type === 'select' ? (
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={saving}
            >
              {options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={saving}
              {...inputProps}
            />
          )}
          
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1"
            >
              {saving ? <LoadingSpinner /> : <Save className="w-3 h-3" />}
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 disabled:opacity-50 flex items-center space-x-1"
            >
              <X className="w-3 h-3" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => setIsEditing(true)}
          className="px-3 py-2 border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors group"
        >
          <div className="flex justify-between items-center">
            <span className="text-gray-900">{value || placeholder}</span>
            <Edit3 className="w-3 h-3 text-gray-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      )}
    </div>
  )
}

const Profile = () => {
  const { userId } = useParams()
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingSection, setEditingSection] = useState(null)
  const [editingData, setEditingData] = useState({})
  const [inlineEditing, setInlineEditing] = useState({})

  // Check for read-only mode from URL parameters
  const urlParams = new URLSearchParams(window.location.search)
  const isReadOnlyMode = urlParams.get('view') === 'readonly'
  const isOwnProfile = !userId || userId === currentUser?.id
  const canEdit = isOwnProfile && !isReadOnlyMode

  useEffect(() => {
    fetchProfile()
  }, [userId, currentUser?.id])

  // Helper functions for experience and projects (still stored in achievements)
  const getExperienceFromAchievements = (achievements) => {
    return achievements?.filter(item => item.type === 'experience').map(item => item.value) || []
  }
  
  const getProjectsFromAchievements = (achievements) => {
    return achievements?.filter(item => item.type === 'project').map(item => item.value) || []
  }

  // Handle individual field save
  const handleFieldSave = async (field, value) => {
    try {
      const updateData = { [field]: value }
      
      // Handle special field conversions
      if (field === 'year' && value) {
        updateData[field] = parseInt(value)
      }
      if (field === 'graduation_year' && value) {
        updateData[field] = parseInt(value)
      }
      if (field === 'gpa' && value) {
        updateData[field] = parseFloat(value)
      }
      
      const response = await api.put('/profile/me', updateData)
      
      if (response.data.success) {
        // Update local profile state
        setProfile(prev => ({
          ...prev,
          [field]: value
        }))
        
        // Show success feedback
        // You could add a toast notification here
      }
    } catch (error) {
      console.error('Failed to update field:', error)
      alert('Failed to update. Please try again.')
    }
  }

  const fetchProfile = async () => {
    try {
      setLoading(true)
      let profileResponse
      
      if (isOwnProfile && !isReadOnlyMode) {
        // Fetch own profile with full access
        console.log('Fetching own profile')
        profileResponse = await api.get('/profile/me')
      } else {
        // Fetch other user's profile or own profile in read-only mode
        const targetUserId = userId || currentUser?.id
        console.log('Fetching profile for user:', targetUserId)
        profileResponse = await api.get(`/profile/${targetUserId}`)
      }
      
      console.log('Profile response:', profileResponse.data)
      
      // Check if response has the expected structure
      if (!profileResponse.data || !profileResponse.data.success) {
        throw new Error('Invalid profile response structure')
      }
      
      const profileData = profileResponse.data.data?.profile
      if (!profileData) {
        throw new Error('No profile data found')
      }
      
      // Initialize profile with ALL database fields
      setProfile({
        // Basic Info
        user_id: profileData.user_id,
        name: profileData.name || '',
        email: profileData.email || '',
        role: profileData.role || 'student',
        bio: profileData.bio || '',
        avatar_url: profileData.avatar_url || '',
        headline: profileData.headline || '',
        location: profileData.location || '',
        
        // Academic Info
        department: profileData.department || '',
        major: profileData.major || '',
        minor: profileData.minor || '',
        year: profileData.year || null,
        graduation_year: profileData.graduation_year || null,
        gpa: profileData.gpa || null,
        student_id: profileData.student_id || '',
        hometown: profileData.hometown || '',
        
        // Contact Info
        phone_number: profileData.phone_number || '',
        github_url: profileData.github_url || '',
        linkedin_url: profileData.linkedin_url || '',
        portfolio_url: profileData.portfolio_url || '',
        
        // Arrays (safely handle)
        skills: Array.isArray(profileData.skills) ? profileData.skills : [],
        interests: Array.isArray(profileData.interests) ? profileData.interests : [],
        achievements: Array.isArray(profileData.achievements) ? profileData.achievements : [],
        
        // System fields
        is_verified: profileData.is_verified || false,
        is_active: profileData.is_active !== undefined ? profileData.is_active : true,
        created_at: profileData.created_at,
        updated_at: profileData.updated_at,
        
        // Custom fields for display (experience and projects from achievements)
        experience: getExperienceFromAchievements(profileData.achievements),
        projects: getProjectsFromAchievements(profileData.achievements),
        
        // UI state
        isReadOnly: !canEdit
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      // Set a comprehensive fallback profile structure
      setProfile({
        user_id: userId || currentUser?.id || '',
        name: 'Unknown User',
        email: '',
        role: 'student',
        bio: 'Profile not available',
        avatar_url: '',
        headline: '',
        location: '',
        department: '',
        major: '',
        minor: '',
        year: null,
        graduation_year: null,
        gpa: null,
        student_id: '',
        hometown: '',
        phone_number: '',
        github_url: '',
        linkedin_url: '',
        portfolio_url: '',
        skills: [],
        interests: [],
        achievements: [],
        is_verified: false,
        is_active: true,
        headline: '',
        location: '',
        experience: [],
        projects: [],
        isReadOnly: true
      })
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (section, data = {}) => {
    setEditingSection(section)
    setEditingData(data)
  }

  const cancelEditing = () => {
    setEditingSection(null)
    setEditingData({})
  }

  const startMessage = () => {
    // Navigate to Messages page with a query parameter to start a conversation
    navigate(`/messages?startChat=${profile.user_id}&name=${encodeURIComponent(profile.name)}`)
  }

  const saveSection = async (section, data) => {
    try {
      let updateData = {}
      
      console.log('Saving section:', section, 'with data:', data)
      
      if (section === 'basic') {
        // Send ALL fields that exist in the database - no more achievements workaround
        updateData = {
          name: data.name || '',
          bio: data.bio || '',
          department: data.department || '',
          major: data.major || '',
          minor: data.minor || '',
          headline: data.headline || '',
          location: data.location || '',
          hometown: data.hometown || '',
          student_id: data.student_id || ''
        }
        
        // Only add numeric fields if they have values
        if (data.year && data.year !== '') {
          updateData.year = parseInt(data.year)
        }
        
        if (data.graduation_year && data.graduation_year !== '') {
          updateData.graduation_year = parseInt(data.graduation_year)
        }
        
        if (data.gpa && data.gpa !== '') {
          updateData.gpa = parseFloat(data.gpa)
        }
        
            } else if (section === 'contact') {
        updateData = {
          portfolio_url: data.portfolio_url || '',
          linkedin_url: data.linkedin_url || '',
          github_url: data.github_url || '',
          phone_number: data.phone_number || ''
        }
      } else if (section === 'skills') {
        updateData = { 
          skills: Array.isArray(data.skills) ? data.skills : [],
          interests: Array.isArray(data.interests) ? data.interests : []
        }
      } else if (section === 'experience') {
        // Store experience in achievements with type 'experience'
        const currentAchievements = profile.achievements || []
        const nonExpAchievements = currentAchievements.filter(item => !item.type || item.type !== 'experience')
        
        const updatedExperience = [...(getExperienceFromAchievements(profile.achievements) || [])]
        if (data.id) {
          // Update existing
          const index = updatedExperience.findIndex(exp => exp.id === data.id)
          if (index >= 0) {
            updatedExperience[index] = data
          }
        } else {
          // Add new
          updatedExperience.push({ ...data, id: Date.now().toString() })
        }
        
        // Store back in achievements
        const expAchievements = updatedExperience.map(exp => ({
          type: 'experience',
          value: exp
        }))
        
        updateData = { achievements: [...nonExpAchievements, ...expAchievements] }
        
      } else if (section === 'projects') {
        // Store projects in achievements with type 'project'
        const currentAchievements = profile.achievements || []
        const nonProjAchievements = currentAchievements.filter(item => !item.type || item.type !== 'project')
        
        const updatedProjects = [...(getProjectsFromAchievements(profile.achievements) || [])]
        if (data.id) {
          // Update existing
          const index = updatedProjects.findIndex(proj => proj.id === data.id)
          if (index >= 0) {
            updatedProjects[index] = data
          }
        } else {
          // Add new
          updatedProjects.push({ ...data, id: Date.now().toString() })
        }
        
        // Store back in achievements
        const projAchievements = updatedProjects.map(proj => ({
          type: 'project',
          value: proj
        }))
        
        updateData = { achievements: [...nonProjAchievements, ...projAchievements] }
      }

      console.log('Final update data being sent:', updateData)
      const response = await api.put('/profile/me', updateData)
      
      if (response.data.success) {
        // Fetch fresh profile data to ensure UI is in sync
        await fetchProfile()
        setEditingSection(null)
        setEditingData({})
        
        // Show success message
        alert('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      console.error('Error response:', error.response?.data)
      
      // Show user-friendly error message with details
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to save changes'
      alert(`Error: ${errorMessage}`)
    }
  }

  const deleteExperience = async (expId) => {
    try {
      const currentExperience = getExperienceFromAchievements(profile.achievements)
      const updatedExperience = currentExperience.filter(exp => exp.id !== expId)
      
      // Update achievements array
      const currentAchievements = profile.achievements || []
      const nonExpAchievements = currentAchievements.filter(item => !item.type || item.type !== 'experience')
      const expAchievements = updatedExperience.map(exp => ({
        type: 'experience',
        value: exp
      }))
      
      const response = await api.put('/profile/me', { achievements: [...nonExpAchievements, ...expAchievements] })
      
      if (response.data.success) {
        setProfile(prev => ({ ...prev, experience: updatedExperience, achievements: [...nonExpAchievements, ...expAchievements] }))
      }
    } catch (error) {
      console.error('Error deleting experience:', error)
    }
  }

  const deleteProject = async (projId) => {
    try {
      const currentProjects = getProjectsFromAchievements(profile.achievements)
      const updatedProjects = currentProjects.filter(proj => proj.id !== projId)
      
      // Update achievements array
      const currentAchievements = profile.achievements || []
      const nonProjAchievements = currentAchievements.filter(item => !item.type || item.type !== 'project')
      const projAchievements = updatedProjects.map(proj => ({
        type: 'project',
        value: proj
      }))
      
      const response = await api.put('/profile/me', { achievements: [...nonProjAchievements, ...projAchievements] })
      
      if (response.data.success) {
        setProfile(prev => ({ ...prev, projects: updatedProjects, achievements: [...nonProjAchievements, ...projAchievements] }))
      }
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading profile..." />
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Profile not found</h2>
        <p className="text-gray-600 mt-2">The user you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Read-Only Mode Banner */}
      {isReadOnlyMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900">
              Viewing {profile?.name || 'User'}'s Profile
            </h3>
            <p className="text-sm text-blue-700">
              You're viewing this profile in read-only mode. You can browse their information but cannot make changes.
            </p>
          </div>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Cover Photo Area */}
        <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600"></div>
        
        {/* Profile Info */}
        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="relative -mt-16 mb-4">
            <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-300 flex items-center justify-center text-4xl font-bold text-gray-600 shadow-lg">
              {profile.name?.charAt(0) || 'U'}
            </div>
            {isOwnProfile && (
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700">
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Basic Info Section */}
          {editingSection === 'basic' ? (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={editingData.name || profile.name || ''}
                      onChange={(e) => setEditingData({...editingData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={editingData.location || profile.location || ''}
                      onChange={(e) => setEditingData({...editingData, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="City, State, Country"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Professional Headline *</label>
                  <input
                    type="text"
                    value={editingData.headline || profile.headline || ''}
                    onChange={(e) => setEditingData({...editingData, headline: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Computer Science Student | Full Stack Developer | AI Enthusiast"
                  />
                  <p className="text-xs text-gray-500 mt-1">This headline will be shown instead of your generic role description</p>
                </div>
              </div>

              {/* Academic Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Academic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={editingData.department || profile.department || ''}
                      onChange={(e) => setEditingData({...editingData, department: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Computer Science, Engineering"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Major/Specialization</label>
                    <input
                      type="text"
                      value={editingData.major || profile.major || ''}
                      onChange={(e) => setEditingData({...editingData, major: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Software Engineering, Data Science"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Year</label>
                    <select
                      value={editingData.year || profile.year || ''}
                      onChange={(e) => setEditingData({...editingData, year: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                      <option value="5">5th Year (Masters)</option>
                      <option value="6">6th Year (PhD)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Graduation</label>
                    <input
                      type="number"
                      value={editingData.graduation_year || profile.graduation_year || ''}
                      onChange={(e) => setEditingData({...editingData, graduation_year: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="2025"
                      min="2020"
                      max="2050"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minor</label>
                    <input
                      type="text"
                      value={editingData.minor || profile.minor || ''}
                      onChange={(e) => setEditingData({...editingData, minor: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Mathematics, Business"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.00"
                      max="4.00"
                      value={editingData.gpa || profile.gpa || ''}
                      onChange={(e) => setEditingData({...editingData, gpa: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="3.75"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hometown</label>
                    <input
                      type="text"
                      value={editingData.hometown || profile.hometown || ''}
                      onChange={(e) => setEditingData({...editingData, hometown: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Mumbai, India"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                    <input
                      type="text"
                      value={editingData.student_id || profile.student_id || ''}
                      onChange={(e) => setEditingData({...editingData, student_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your student ID (optional)"
                    />
                  </div>
                </div>
              </div>

              {/* About Section */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  About You
                </h3>
                <textarea
                  rows="5"
                  value={editingData.bio || profile.bio || ''}
                  onChange={(e) => setEditingData({...editingData, bio: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tell us about yourself, your interests, goals, and what you're passionate about..."
                  maxLength="1000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(editingData.bio || profile.bio || '').length}/1000 characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => saveSection('basic', editingData)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2 font-medium"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={cancelEditing}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center space-x-2 font-medium"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{profile?.name || 'Unknown User'}</h1>
                  {/* Show custom headline if available */}
                  {profile?.headline ? (
                    <div>
                      <p className="text-lg text-gray-700 mt-1 font-medium">
                        {profile.headline}
                      </p>
                      {/* Show academic info as supplementary if we have department or major */}
                      {(profile?.department || profile?.major) && (
                        <p className="text-md text-gray-600 mt-1">
                          {profile?.role === 'faculty' 
                            ? `Faculty at ${profile?.department || 'University'}`
                            : `Student pursuing ${profile?.major || profile?.department || 'Computer Science'}`
                          }
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Fallback to generic role description */
                    <p className="text-lg text-gray-700 mt-1">
                      {profile?.role === 'faculty' 
                        ? `Faculty at ${profile?.department || 'University'}`
                        : `Student pursuing ${profile?.major || profile?.department || 'Computer Science'}`
                      }
                    </p>
                  )}
                  {profile.location && (
                    <div className="flex items-center space-x-1 mt-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                </div>
                {canEdit && (
                  <button
                    onClick={() => startEditing('basic', {
                      name: profile.name,
                      headline: profile.headline,
                      location: profile.location,
                      bio: profile.bio,
                      department: profile.department,
                      major: profile.major,
                      minor: profile.minor,
                      year: profile.year,
                      graduation_year: profile.graduation_year,
                      gpa: profile.gpa,
                      hometown: profile.hometown,
                      student_id: profile.student_id
                    })}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-3">
                {isOwnProfile && (
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700">
                    Open To Work
                  </button>
                )}
                
                {!isOwnProfile && (
                  <button 
                    onClick={startMessage}
                    className="flex items-center space-x-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-full font-medium hover:bg-blue-50 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Send Message</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* About Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">About</h2>
          {canEdit && editingSection !== 'basic' && (
            <button
              onClick={() => startEditing('basic', {
                name: profile?.name || '',
                headline: profile?.headline || '',
                location: profile?.location || '',
                bio: profile?.bio || '',
                department: profile?.department || '',
                major: profile?.major || '',
                minor: profile?.minor || '',
                year: profile?.year || '',
                graduation_year: profile?.graduation_year || '',
                gpa: profile?.gpa || '',
                hometown: profile?.hometown || '',
                student_id: profile?.student_id || ''
              })}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-gray-700 whitespace-pre-wrap">
          {profile?.bio || 'No description available.'}
        </p>
      </div>

      {/* Academic & Personal Information Section - Fully Editable */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <GraduationCap className="w-5 h-5 mr-2" />
            Academic & Personal Information
          </h2>
          {canEdit && (
            <span className="text-sm text-blue-600">✏️ All fields are editable - click to edit</span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Academic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-2">
              <BookOpen className="w-4 h-4 mr-2" />
              Academic Details
            </h3>
            
            {/* Department Field */}
            <EditableField 
              label="Department"
              value={profile?.department}
              field="department"
              canEdit={canEdit}
              onSave={(value) => handleFieldSave('department', value)}
              placeholder="e.g., Computer Science, Engineering"
            />
            
            {/* Major Field */}
            <EditableField 
              label="Major/Specialization"
              value={profile?.major}
              field="major"
              canEdit={canEdit}
              onSave={(value) => handleFieldSave('major', value)}
              placeholder="e.g., Software Engineering, Data Science"
            />
            
            {/* Minor Field */}
            <EditableField 
              label="Minor"
              value={profile?.minor}
              field="minor"
              canEdit={canEdit}
              onSave={(value) => handleFieldSave('minor', value)}
              placeholder="e.g., Mathematics, Business"
            />
            
            {/* Year Field */}
            <EditableField 
              label="Current Year"
              value={profile?.year ? `${profile.year}${profile.year === 1 ? 'st' : profile.year === 2 ? 'nd' : profile.year === 3 ? 'rd' : 'th'} Year` : ''}
              field="year"
              type="select"
              canEdit={canEdit}
              onSave={(value) => handleFieldSave('year', value)}
              options={[
                { value: '', label: 'Select Year' },
                { value: '1', label: '1st Year' },
                { value: '2', label: '2nd Year' },
                { value: '3', label: '3rd Year' },
                { value: '4', label: '4th Year' },
                { value: '5', label: '5th Year (Masters)' },
                { value: '6', label: '6th Year (PhD)' }
              ]}
            />
            
            {/* Graduation Year Field */}
            <EditableField 
              label="Expected Graduation"
              value={profile?.graduation_year}
              field="graduation_year"
              type="number"
              canEdit={canEdit}
              onSave={(value) => handleFieldSave('graduation_year', value)}
              placeholder="2025"
              inputProps={{ min: 2020, max: 2050 }}
            />
            
            {/* GPA Field */}
            <EditableField 
              label="GPA"
              value={profile?.gpa ? `${profile.gpa}/4.0` : ''}
              field="gpa"
              type="number"
              canEdit={canEdit}
              onSave={(value) => handleFieldSave('gpa', value)}
              placeholder="3.75"
              inputProps={{ min: 0, max: 4, step: 0.01 }}
            />
            
            {/* Student ID Field */}
            <EditableField 
              label="Student ID"
              value={profile?.student_id}
              field="student_id"
              canEdit={canEdit}
              onSave={(value) => handleFieldSave('student_id', value)}
              placeholder="Your student ID"
            />
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-2">
              <User className="w-4 h-4 mr-2" />
              Personal Details
            </h3>
            
            {/* Headline Field */}
            <EditableField 
              label="Professional Headline"
              value={profile?.headline}
              field="headline"
              canEdit={canEdit}
              onSave={(value) => handleFieldSave('headline', value)}
              placeholder="e.g., Full Stack Developer | AI Enthusiast"
            />
            
            {/* Location Field */}
            <EditableField 
              label="Current Location"
              value={profile?.location}
              field="location"
              canEdit={canEdit}
              onSave={(value) => handleFieldSave('location', value)}
              placeholder="e.g., Mumbai, India"
            />
            
            {/* Hometown Field */}
            <EditableField 
              label="Hometown"
              value={profile?.hometown}
              field="hometown"
              canEdit={canEdit}
              onSave={(value) => handleFieldSave('hometown', value)}
              placeholder="e.g., Delhi, India"
            />
            
            {/* Role Field - Read Only */}
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-600">Role</span>
              <div className="px-3 py-2 border border-gray-200 rounded-md bg-gray-50">
                <span className="text-gray-900 capitalize">{profile?.role || 'Student'}</span>
                <span className="text-xs text-gray-500 ml-2">(Contact admin to change)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Contact Information
          </h2>
          {canEdit && editingSection !== 'contact' && (
            <button
              onClick={() => startEditing('contact', {
                phone_number: profile?.phone_number || '',
                portfolio_url: profile?.portfolio_url || '',
                linkedin_url: profile?.linkedin_url || '',
                github_url: profile?.github_url || ''
              })}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>

        {editingSection === 'contact' || true ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editingData.phone_number || ''}
                  onChange={(e) => setEditingData({...editingData, phone_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio Website</label>
                <input
                  type="url"
                  value={editingData.portfolio_url || ''}
                  onChange={(e) => setEditingData({...editingData, portfolio_url: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://yourportfolio.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile</label>
                <input
                  type="url"
                  value={editingData.linkedin_url || ''}
                  onChange={(e) => setEditingData({...editingData, linkedin_url: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Profile</label>
                <input
                  type="url"
                  value={editingData.github_url || ''}
                  onChange={(e) => setEditingData({...editingData, github_url: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://github.com/username"
                />
              </div>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => saveSection('contact', editingData)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-1"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                onClick={cancelEditing}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center space-x-1"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile?.phone_number && (
              <div className="flex items-center space-x-3 text-gray-700">
                <Phone className="w-4 h-4" />
                <span>{profile.phone_number}</span>
              </div>
            )}
            {profile?.portfolio_url && (
              <div className="flex items-center space-x-3 text-gray-700">
                <Globe className="w-4 h-4" />
                <a 
                  href={profile.portfolio_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Portfolio
                </a>
              </div>
            )}
            {profile?.linkedin_url && (
              <div className="flex items-center space-x-3 text-gray-700">
                <Linkedin className="w-4 h-4" />
                <a 
                  href={profile.linkedin_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  LinkedIn
                </a>
              </div>
            )}
            {profile?.github_url && (
              <div className="flex items-center space-x-3 text-gray-700">
                <Github className="w-4 h-4" />
                <a 
                  href={profile.github_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  GitHub
                </a>
              </div>
            )}
            {(!profile?.phone_number && !profile?.portfolio_url && !profile?.linkedin_url && !profile?.github_url) && (
              <p className="text-gray-500 col-span-2">No contact information available.</p>
            )}
          </div>
        )}
      </div>

      {/* Experience Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Experience</h2>
          {canEdit && (
            <button
              onClick={() => startEditing('experience', {})}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {editingSection === 'experience' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  value={editingData.position || ''}
                  onChange={(e) => setEditingData({...editingData, position: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Summer Intern"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={editingData.company || ''}
                  onChange={(e) => setEditingData({...editingData, company: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ABC TECH"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="text"
                  value={editingData.start_date || ''}
                  onChange={(e) => setEditingData({...editingData, start_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="June 2023"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="text"
                  value={editingData.end_date || ''}
                  onChange={(e) => setEditingData({...editingData, end_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="August 2023"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={editingData.exp_location || ''}
                onChange={(e) => setEditingData({...editingData, exp_location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="San Francisco, California"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows="3"
                value={editingData.description || ''}
                onChange={(e) => setEditingData({...editingData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe your role and achievements..."
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => saveSection('experience', editingData)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-1"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                onClick={cancelEditing}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center space-x-1"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {profile?.experience && profile.experience.length > 0 ? (
            profile.experience.map((exp, index) => (
              <div key={exp.id || index} className="flex space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{exp.position || 'Position'}</h3>
                      <p className="text-gray-700 font-medium">{exp.company || 'Company'}</p>
                      <p className="text-gray-600 text-sm">
                        {exp.start_date || 'Start Date'} - {exp.end_date || 'End Date'}
                      </p>
                      {exp.exp_location && (
                        <p className="text-gray-600 text-sm">{exp.exp_location}</p>
                      )}
                      {exp.description && (
                        <p className="text-gray-700 mt-2 whitespace-pre-wrap">{exp.description}</p>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => startEditing('experience', exp)}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteExperience(exp.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No experience added yet.</p>
          )}
        </div>
      </div>

      {/* Projects Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
          {canEdit && (
            <button
              onClick={() => startEditing('projects', {})}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {editingSection === 'projects' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  value={editingData.name || ''}
                  onChange={(e) => setEditingData({...editingData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Library Management System"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Technologies</label>
                <input
                  type="text"
                  value={editingData.technologies || ''}
                  onChange={(e) => setEditingData({...editingData, technologies: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="React, Node.js, MongoDB"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows="3"
                value={editingData.proj_description || ''}
                onChange={(e) => setEditingData({...editingData, proj_description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe your project..."
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
              <input
                type="url"
                value={editingData.github_url || ''}
                onChange={(e) => setEditingData({...editingData, github_url: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://github.com/..."
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => saveSection('projects', editingData)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-1"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                onClick={cancelEditing}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center space-x-1"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {profile?.projects && profile.projects.length > 0 ? (
            profile.projects.map((project, index) => (
              <div key={project.id || index} className="flex space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                  <Code2 className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{project.name || 'Project'}</h3>
                      {project.technologies && (
                        <p className="text-gray-600 text-sm mb-2">{project.technologies}</p>
                      )}
                      {project.proj_description && (
                        <p className="text-gray-700 whitespace-pre-wrap">{project.proj_description}</p>
                      )}
                      {project.github_url && (
                        <a
                          href={project.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 mt-2"
                        >
                          <Github className="w-4 h-4" />
                          <span>View on GitHub</span>
                        </a>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => startEditing('projects', project)}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No projects added yet.</p>
          )}
        </div>
      </div>

      {/* Skills & Interests Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Skills & Interests
          </h2>
          {canEdit && (
            <button
              onClick={() => startEditing('skills', { 
                skills: profile?.skills || [],
                interests: profile?.interests || []
              })}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>

        {editingSection === 'skills' ? (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-md font-semibold text-gray-800 mb-2 flex items-center">
                <Code2 className="w-4 h-4 mr-2" />
                Technical Skills
              </h3>
              <input
                type="text"
                value={editingData.skills ? editingData.skills.join(', ') : ''}
                onChange={(e) => setEditingData({
                  ...editingData, 
                  skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="JavaScript, React, Node.js, Python, Java, Machine Learning, Data Science..."
              />
              <p className="text-xs text-gray-500 mt-1">Add your technical skills separated by commas</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-md font-semibold text-gray-800 mb-2 flex items-center">
                <Star className="w-4 h-4 mr-2" />
                Interests & Hobbies
              </h3>
              <input
                type="text"
                value={editingData.interests ? editingData.interests.join(', ') : ''}
                onChange={(e) => setEditingData({
                  ...editingData, 
                  interests: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Photography, Gaming, Music, Sports, Reading, Travel, Cooking..."
              />
              <p className="text-xs text-gray-500 mt-1">Add your interests and hobbies separated by commas</p>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => saveSection('skills', editingData)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-1"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                onClick={cancelEditing}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center space-x-1"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Technical Skills */}
            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                <Code2 className="w-4 h-4 mr-2" />
                Technical Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile?.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No technical skills added yet.</p>
                )}
              </div>
            </div>
            
            {/* Interests */}
            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                <Star className="w-4 h-4 mr-2" />
                Interests & Hobbies
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile?.interests && profile.interests.length > 0 ? (
                  profile.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                    >
                      {interest}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No interests added yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile