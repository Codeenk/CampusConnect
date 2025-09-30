import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          // Set authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          // Verify token and get user data
          const response = await api.get('/auth/me')
          
          if (response.data.success) {
            setUser(response.data.data.user)
          } else {
            // Token is invalid
            localStorage.removeItem('token')
            delete api.defaults.headers.common['Authorization']
          }
        } catch (error) {
          console.error('Auth initialization failed:', error)
          localStorage.removeItem('token')
          delete api.defaults.headers.common['Authorization']
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const register = async (userData) => {
    try {
      setLoading(true)
      console.log('Attempting registration with:', { ...userData, password: '[HIDDEN]' })
      
      const response = await api.post('/auth/register', userData)
      
      if (response.data.success) {
        const { user, token } = response.data.data
        
        // Store token and set auth headers
        localStorage.setItem('token', token)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        // Update state
        setUser(user)
        
        console.log('Registration successful:', user)
        return { success: true, user }
      } else {
        return { 
          success: false, 
          error: response.data.message || 'Registration failed',
          action: response.data.action || null
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
      const errorData = error.response?.data
      const errorMessage = errorData?.message || 
                          errorData?.error || 
                          'Registration failed. Please try again.'
      return { 
        success: false, 
        error: errorMessage,
        action: errorData?.action || null
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      setLoading(true)
      console.log('Attempting login for:', email)
      
      const response = await api.post('/auth/login', { 
        email: email.toLowerCase().trim(), 
        password 
      })
      
      if (response.data.success) {
        const { user, token } = response.data.data
        
        // Store token and set auth headers
        localStorage.setItem('token', token)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        // Update state
        setUser(user)
        
        console.log('Login successful:', user)
        return { success: true, user }
      } else {
        return { success: false, error: response.data.message || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Login failed. Please check your credentials.'
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      // Call logout endpoint (optional)
      await api.post('/auth/logout').catch(() => {
        // Ignore errors for logout API call
      })
    } catch (error) {
      console.warn('Logout API call failed:', error)
    } finally {
      // Clear local storage and state regardless
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      setUser(null)
    }
  }

  const updateUser = (updatedUserData) => {
    setUser(prevUser => {
      if (!prevUser) return null
      
      return {
        ...prevUser,
        ...updatedUserData,
        profile: {
          ...prevUser.profile,
          ...updatedUserData.profile
        }
      }
    })
  }

  const refreshUserData = async () => {
    try {
      const response = await api.get('/auth/me')
      if (response.data.success) {
        setUser(response.data.data.user)
        return { success: true, user: response.data.data.user }
      }
      return { success: false, error: 'Failed to refresh user data' }
    } catch (error) {
      console.error('Refresh user data failed:', error)
      return { success: false, error: 'Failed to refresh user data' }
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    refreshUserData,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isFaculty: user?.role === 'faculty' || user?.role === 'admin',
    isStudent: user?.role === 'student'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}