import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Moon, 
  Sun, 
  Globe, 
  Download, 
  Trash2, 
  AlertTriangle,
  Save,
  User,
  Mail,
  Lock,
  LogOut
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const Settings = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      messages: true,
      posts: false,
      endorsements: true
    },
    privacy: {
      profileVisible: true,
      contactVisible: false,
      showOnlineStatus: true
    },
    theme: 'light', // light, dark, system
    language: 'en'
  })

  const handleNotificationChange = (key) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }))
  }

  const handlePrivacyChange = (key) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: !prev.privacy[key]
      }
    }))
  }

  const saveSettings = async () => {
    try {
      setLoading(true)
      // Here you would save settings to your backend
      // await api.post('/settings', settings)
      
      // For now, just show success
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      setLoading(true)
      
      // Call delete account API
      await api.delete('/auth/account')
      
      // Logout and redirect
      logout()
      navigate('/login')
    } catch (error) {
      console.error('Failed to delete account:', error)
      alert('Failed to delete account. Please contact support.')
      setLoading(false)
    }
  }

  const downloadData = async () => {
    try {
      setLoading(true)
      
      // Call data export API
      const response = await api.get('/auth/export-data')
      
      // Create download
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `campus-connect-data-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Failed to export data:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-4xl mx-auto space-y-4 lg:space-y-6 px-4 lg:px-0">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center">
          <SettingsIcon className="w-5 lg:w-6 h-5 lg:h-6 mr-2 lg:mr-3" />
          Account Settings
        </h1>
        <p className="text-gray-600 mt-2 text-sm lg:text-base">
          Manage your account preferences, privacy settings, and more.
        </p>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3 lg:mb-4 flex items-center">
          <User className="w-4 lg:w-5 h-4 lg:h-5 mr-2" />
          Account Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <div className="px-3 py-2 text-sm lg:text-base border border-gray-300 rounded-md bg-gray-50">
              {user?.profile?.name || 'Not set'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="px-3 py-2 text-sm lg:text-base border border-gray-300 rounded-md bg-gray-50">
              {user?.email || 'Not set'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <div className="px-3 py-2 text-sm lg:text-base border border-gray-300 rounded-md bg-gray-50 capitalize">
              {user?.profile?.role || 'Student'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Member since</label>
            <div className="px-3 py-2 text-sm lg:text-base border border-gray-300 rounded-md bg-gray-50">
              {user?.profile?.created_at ? new Date(user.profile.created_at).toLocaleDateString() : 'Unknown'}
            </div>
          </div>
        </div>
        <p className="text-xs lg:text-sm text-blue-600 mt-3">
          To edit your profile information, go to <button 
            onClick={() => navigate('/profile')} 
            className="underline hover:text-blue-800"
          >
            My Profile
          </button>
        </p>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3 lg:mb-4 flex items-center">
          <Bell className="w-4 lg:w-5 h-4 lg:h-5 mr-2" />
          Notification Preferences
        </h2>
        <div className="space-y-3 lg:space-y-4">
          {Object.entries({
            email: 'Email notifications',
            push: 'Browser push notifications',
            messages: 'New message notifications',
            posts: 'New post notifications',
            endorsements: 'Endorsement notifications'
          }).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-gray-700 text-sm lg:text-base pr-2">{label}</span>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={settings.notifications[key]}
                  onChange={() => handleNotificationChange(key)}
                  className="sr-only peer"
                />
                <div className="w-10 lg:w-11 h-5 lg:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 lg:after:h-5 lg:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3 lg:mb-4 flex items-center">
          <Shield className="w-4 lg:w-5 h-4 lg:h-5 mr-2" />
          Privacy Settings
        </h2>
        <div className="space-y-3 lg:space-y-4">
          {Object.entries({
            profileVisible: 'Make my profile visible to other users',
            contactVisible: 'Show my contact information',
            showOnlineStatus: 'Show when I\'m online'
          }).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-gray-700 text-sm lg:text-base pr-2">{label}</span>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={settings.privacy[key]}
                  onChange={() => handlePrivacyChange(key)}
                  className="sr-only peer"
                />
                <div className="w-10 lg:w-11 h-5 lg:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 lg:after:h-5 lg:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Theme Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3 lg:mb-4 flex items-center">
          <Sun className="w-4 lg:w-5 h-4 lg:h-5 mr-2" />
          Appearance
        </h2>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
            <span className="text-gray-700 text-sm lg:text-base">Theme:</span>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              {[
                { key: 'light', label: 'Light', icon: Sun },
                { key: 'dark', label: 'Dark', icon: Moon },
                { key: 'system', label: 'System', icon: Globe }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setSettings(prev => ({ ...prev, theme: key }))}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md border text-sm lg:text-base ${
                    settings.theme === key
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3 lg:mb-4 flex items-center">
          <Download className="w-4 lg:w-5 h-4 lg:h-5 mr-2" />
          Data Management
        </h2>
        <div className="space-y-3 lg:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex-1">
              <p className="font-medium text-gray-700 text-sm lg:text-base">Download your data</p>
              <p className="text-xs lg:text-sm text-gray-500">Get a copy of all your profile data</p>
            </div>
            <button
              onClick={downloadData}
              className="px-3 lg:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2 text-sm lg:text-base"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* Save Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
        <button
          onClick={saveSettings}
          disabled={loading}
          className="w-full sm:w-auto px-4 lg:px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center space-x-2 font-medium disabled:opacity-50 text-sm lg:text-base"
        >
          <Save className="w-4 h-4" />
          <span>Save All Settings</span>
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4 lg:p-6">
        <h2 className="text-lg lg:text-xl font-semibold text-red-900 mb-3 lg:mb-4 flex items-center">
          <AlertTriangle className="w-4 lg:w-5 h-4 lg:h-5 mr-2" />
          Danger Zone
        </h2>
        <div className="space-y-3 lg:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex-1">
              <p className="font-medium text-gray-700 text-sm lg:text-base">Delete Account</p>
              <p className="text-xs lg:text-sm text-gray-500">Permanently delete your account and all data</p>
            </div>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="px-3 lg:px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center space-x-2 text-sm lg:text-base"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 lg:p-6 max-w-sm lg:max-w-md w-full">
            <h3 className="text-base lg:text-lg font-semibold text-red-900 mb-3 lg:mb-4 flex items-center">
              <AlertTriangle className="w-4 lg:w-5 h-4 lg:h-5 mr-2" />
              Delete Account
            </h3>
            <p className="text-gray-700 mb-4 lg:mb-6 text-sm lg:text-base">
              Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.
            </p>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={handleDeleteAccount}
                className="flex-1 bg-red-600 text-white px-3 lg:px-4 py-2 rounded-md hover:bg-red-700 text-sm lg:text-base"
              >
                Yes, Delete My Account
              </button>
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-3 lg:px-4 py-2 rounded-md hover:bg-gray-400 text-sm lg:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings