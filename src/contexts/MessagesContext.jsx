import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import api from '../services/api'

const MessagesContext = createContext()

export const useMessages = () => {
  const context = useContext(MessagesContext)
  if (!context) {
    throw new Error('useMessages must be used within a MessagesProvider')
  }
  return context
}

export const MessagesProvider = ({ children }) => {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch unread messages count
  const fetchUnreadCount = async () => {
    if (!user) return
    
    try {
      const response = await api.get('/messages/unread-count')
      if (response.data.success) {
        setUnreadCount(response.data.data.unread_count || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
      setUnreadCount(0)
    }
  }

  // Update unread count manually
  const updateUnreadCount = (newCount) => {
    setUnreadCount(newCount)
  }

  // Decrement unread count (when messages are read)
  const decrementUnreadCount = (amount = 1) => {
    setUnreadCount(prev => Math.max(0, prev - amount))
  }

  // Increment unread count (when new messages are received)
  const incrementUnreadCount = (amount = 1) => {
    setUnreadCount(prev => prev + amount)
  }

  // Clear all unread messages
  const clearUnreadCount = () => {
    setUnreadCount(0)
  }

  // Fetch unread count on component mount and continuously for ultra-fast real-time updates
  useEffect(() => {
    if (user) {
      fetchUnreadCount()
      
      // LIGHTNING-FAST polling every 100ms for INSTANT notifications - faster than blink!
      const interval = setInterval(fetchUnreadCount, 100)
      return () => clearInterval(interval)
    }
  }, [user])

  const value = {
    unreadCount,
    fetchUnreadCount,
    updateUnreadCount,
    decrementUnreadCount,
    incrementUnreadCount,
    clearUnreadCount
  }

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  )
}