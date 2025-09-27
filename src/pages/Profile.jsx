import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { CreditCard as Edit, MapPin, Calendar, Github, Award, Download, Mail, Building, GraduationCap, Star, Code, Trophy } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const Profile = () => {
  const { userId } = useParams()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [endorsements, setEndorsements] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('about')

  const isOwnProfile = !userId || userId === currentUser?.id

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let profileResponse
        if (isOwnProfile) {
          profileResponse = await api.get('/profile/me')
          setProfile(profileResponse.data.data.profile)
        } else {
          profileResponse = await api.get(`/profile/${userId}`)
          setProfile(profileResponse.data.data.profile)
        }

        // Fetch user's posts
        const postsResponse = await api.get(`/posts/feed?author=${userId || currentUser.id}`)
        setPosts(postsResponse.data.data.posts || [])

        // Fetch endorsements if it's a student
        if (profileResponse.data.data.profile.role === 'student') {
          try {
            const endorsementsResponse = await api.get(`/endorse/student/${userId || currentUser.id}`)
            setEndorsements(endorsementsResponse.data.data.endorsements || [])
          } catch (error) {
            console.error('Error fetching endorsements:', error)
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId, currentUser?.id, isOwnProfile])

  const handleDownloadResume = async () => {
    try {
      const response = await api.get(`/resume/${userId || currentUser.id}`, {
        responseType: 'blob'
      })
      
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${profile.name}_Resume.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading resume:', error)
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

  const completionPercentage = Math.round(
    ((profile.name ? 1 : 0) +
     (profile.bio ? 1 : 0) +
     (profile.skills?.length > 0 ? 1 : 0) +
     (profile.github_url ? 1 : 0) +
     (profile.achievements?.length > 0 ? 1 : 0)) / 5 * 100
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="card p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
          {/* Avatar */}
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {profile.name?.charAt(0) || 'U'}
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                <div className="flex items-center space-x-4 mt-2 text-gray-600">
                  <div className="flex items-center space-x-1">
                    <GraduationCap className="w-4 h-4" />
                    <span className="capitalize">{profile.role}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Building className="w-4 h-4" />
                    <span>{profile.department}</span>
                  </div>
                  {profile.year && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Year {profile.year}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-1 mt-1 text-gray-500">
                  <Mail className="w-4 h-4" />
                  <span>{profile.email}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 mt-4 md:mt-0">
                {isOwnProfile ? (
                  <>
                    <Link to="/edit-profile" className="btn-primary flex items-center space-x-2">
                      <Edit className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </Link>
                    {profile.role === 'student' && (
                      <button
                        onClick={handleDownloadResume}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Resume</span>
                      </button>
                    )}
                  </>
                ) : (
                  <button className="btn-primary">
                    Send Message
                  </button>
                )}
              </div>
            </div>

            {/* Profile Completion (only for own profile) */}
            {isOwnProfile && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">Profile Completion</span>
                  <span className="text-sm font-bold text-blue-900">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
                {completionPercentage < 100 && (
                  <p className="text-xs text-blue-700 mt-2">
                    Complete your profile to increase visibility and opportunities!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {['about', 'projects', 'endorsements'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
                {tab === 'projects' && posts.length > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                    {posts.length}
                  </span>
                )}
                {tab === 'endorsements' && endorsements.length > 0 && (
                  <span className="ml-2 bg-yellow-100 text-yellow-600 py-1 px-2 rounded-full text-xs">
                    {endorsements.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              {/* Bio */}
              {profile.bio && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                  <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Code className="w-5 h-5 mr-2" />
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* GitHub */}
              {profile.github_url && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Github className="w-5 h-5 mr-2" />
                    GitHub
                  </h3>
                  <a
                    href={profile.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    {profile.github_url}
                  </a>
                </div>
              )}

              {/* Achievements */}
              {profile.achievements && profile.achievements.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Trophy className="w-5 h-5 mr-2" />
                    Achievements
                  </h3>
                  <ul className="space-y-2">
                    {profile.achievements.map((achievement, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
                  <p className="text-gray-600">
                    {isOwnProfile ? 'Share your first project!' : 'No projects shared yet.'}
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="border border-gray-200 rounded-lg p-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h4>
                    <p className="text-gray-700 mb-4">{post.description}</p>
                    
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      <div className="flex items-center space-x-4">
                        <span>{post.likes_count || 0} likes</span>
                        <span>{post.comments_count || 0} comments</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Endorsements Tab */}
          {activeTab === 'endorsements' && (
            <div className="space-y-4">
              {endorsements.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No endorsements yet</h3>
                  <p className="text-gray-600">
                    Faculty endorsements will appear here when you receive them.
                  </p>
                </div>
              ) : (
                endorsements.map((endorsement) => (
                  <div key={endorsement.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-6">
                    <div className="flex items-start space-x-4">
                      <Award className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {endorsement.faculty?.name}
                          </h4>
                          <span className="text-sm text-gray-500">
                            • {endorsement.faculty?.department}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Endorsed: <strong>{endorsement.project?.title}</strong>
                        </p>
                        {endorsement.endorsement_text && (
                          <p className="text-gray-700 italic">"{endorsement.endorsement_text}"</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(endorsement.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile