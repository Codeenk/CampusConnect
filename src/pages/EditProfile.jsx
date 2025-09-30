import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { Save, X, Plus } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const EditProfile = () => {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    department: '',
    major: '',
    minor: '',
    year: '',
    graduation_year: '',
    student_id: '',
    headline: '',
    location: '',
    hometown: '',
    gpa: '',
    phone_number: '',
    profile_image_url: '',
    skills: [],
    interests: [],
    github_url: '',
    linkedin_url: '',
    portfolio_url: '',
    achievements: []
  })
  const [newSkill, setNewSkill] = useState('')
  const [newAchievement, setNewAchievement] = useState('')

  useEffect(() => {
    if (user?.profile) {
      setFormData({
        name: user.profile.name || '',
        bio: user.profile.bio || '',
        department: user.profile.department || '',
        major: user.profile.major || '',
        minor: user.profile.minor || '',
        year: user.profile.year || '',
        graduation_year: user.profile.graduation_year || '',
        student_id: user.profile.student_id || '',
        headline: user.profile.headline || '',
        location: user.profile.location || '',
        hometown: user.profile.hometown || '',
        gpa: user.profile.gpa || '',
        phone_number: user.profile.phone_number || '',
        profile_image_url: user.profile.profile_image_url || '',
        skills: user.profile.skills || [],
        interests: user.profile.interests || [],
        github_url: user.profile.github_url || '',
        linkedin_url: user.profile.linkedin_url || '',
        portfolio_url: user.profile.portfolio_url || '',
        achievements: user.profile.achievements || []
      })
    }
  }, [user])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()]
      })
      setNewSkill('')
    }
  }

  const removeSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    })
  }

  const addAchievement = () => {
    if (newAchievement.trim() && !formData.achievements.includes(newAchievement.trim())) {
      setFormData({
        ...formData,
        achievements: [...formData.achievements, newAchievement.trim()]
      })
      setNewAchievement('')
    }
  }

  const removeAchievement = (achievementToRemove) => {
    setFormData({
      ...formData,
      achievements: formData.achievements.filter(achievement => achievement !== achievementToRemove)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const updateData = {
        ...formData,
        year: formData.year ? parseInt(formData.year) : null
      }

      const response = await api.put('/profile/update', updateData)
      
      // Update user context
      updateUser({
        profile: response.data.data.profile
      })

      navigate('/profile')
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-gray-600 mt-1">Update your information and showcase your skills</p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="btn-secondary flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Basic Information
            </h2>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                value={formData.bio}
                onChange={handleChange}
                className="input-field resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Computer Science"
                />
              </div>

              {user?.role === 'student' && (
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                    Year of Study
                  </label>
                  <select
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                    <option value="5">5th Year</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="github_url" className="block text-sm font-medium text-gray-700 mb-2">
                GitHub URL
              </label>
              <input
                type="url"
                id="github_url"
                name="github_url"
                value={formData.github_url}
                onChange={handleChange}
                className="input-field"
                placeholder="https://github.com/yourusername"
              />
            </div>
          </div>

          {/* Skills Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Skills
            </h2>

            <div className="flex space-x-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                className="flex-1 input-field"
                placeholder="Add a skill (e.g., React, Python, Machine Learning)"
              />
              <button
                type="button"
                onClick={addSkill}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Achievements Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Achievements
            </h2>

            <div className="flex space-x-2">
              <input
                type="text"
                value={newAchievement}
                onChange={(e) => setNewAchievement(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAchievement())}
                className="flex-1 input-field"
                placeholder="Add an achievement (e.g., Won hackathon, Published paper)"
              />
              <button
                type="button"
                onClick={addAchievement}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            {formData.achievements.length > 0 && (
              <div className="space-y-2">
                {formData.achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <span className="text-gray-700">{achievement}</span>
                    <button
                      type="button"
                      onClick={() => removeAchievement(achievement)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProfile