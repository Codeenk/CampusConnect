import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
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
  const pollingRef = useRef(null)
  const abortCtrlRef = useRef(null)
  const inFlightRef = useRef(false)
  const disabledRef = useRef(false)
  const failureCountRef = useRef(0)
  const currentIntervalRef = useRef(10000) // start with 10s

  // Fetch unread messages count
  const fetchUnreadCount = async () => {
    if (!user || disabledRef.current) return

    // prevent overlapping requests
    if (inFlightRef.current) return
    inFlightRef.current = true

    // Abort previous if any
    if (abortCtrlRef.current) {
      try { abortCtrlRef.current.abort() } catch (e) {}
    }
    const controller = new AbortController()
    abortCtrlRef.current = controller

    try {
      const response = await api.get('/messages/unread-count', { signal: controller.signal })
      if (response?.data?.success) {
        setUnreadCount(response.data.data.unread_count || 0)
        // reset failure/backoff on success
        failureCountRef.current = 0
        currentIntervalRef.current = 10000
      } else {
        // treat non-success as a soft failure
        failureCountRef.current += 1
      }
    } catch (error) {
      // If endpoint truly doesn't exist, stop polling to avoid hammering server
      const status = error?.response?.status
      if (status === 404) {
        console.warn('Messages unread-count endpoint not found (404). Disabling polling to avoid load.')
        disabledRef.current = true
        inFlightRef.current = false
        return
      }

      // Abort errors are expected on cleanup; ignore them
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        inFlightRef.current = false
        return
      }

      console.warn('Error fetching unread count (backoff will increase):', error?.message || error)
      failureCountRef.current += 1
      // exponential backoff: double interval up to 2 minutes
      currentIntervalRef.current = Math.min(currentIntervalRef.current * 2, 120000)
    } finally {
      inFlightRef.current = false
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

  // Adaptive polling: recursive setTimeout so we can adjust interval/backoff dynamically,
  // pause when tab is hidden and stop polling after repeated 404s.
  useEffect(() => {
    let mounted = true

    const startPolling = () => {
      // don't start if disabled or no user
      if (!mounted || !user || disabledRef.current) return

      // schedule next poll using currentIntervalRef
      pollingRef.current = setTimeout(async () => {
        try {
          await fetchUnreadCount()
        } catch (e) {
          // fetchUnreadCount already logs
        }

        // If document is hidden, pause polling and retry later with a long interval
        if (document && document.hidden) {
          currentIntervalRef.current = Math.max(currentIntervalRef.current, 30000)
        } else {
          // when visible, prefer a reasonable default (10s)
          currentIntervalRef.current = Math.max(10000, currentIntervalRef.current)
        }

        // Continue polling unless disabled
        if (!disabledRef.current && mounted) startPolling()
      }, currentIntervalRef.current)
    }

    const handleVisibility = () => {
      // If tab becomes visible, trigger an immediate fetch and reset interval
      if (!document.hidden) {
        currentIntervalRef.current = 10000
        fetchUnreadCount()
      }
    }

    if (user) {
      // initial fetch
      fetchUnreadCount()
      startPolling()
      document.addEventListener('visibilitychange', handleVisibility)
    }

    return () => {
      mounted = false
      document.removeEventListener('visibilitychange', handleVisibility)
      if (pollingRef.current) clearTimeout(pollingRef.current)
      if (abortCtrlRef.current) {
        try { abortCtrlRef.current.abort() } catch (e) {}
      }
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