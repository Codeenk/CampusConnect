import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useMessages } from '../contexts/MessagesContext'
import api from '../services/api'
import { messagingService, CONNECTION_STATES } from '../services/realtimeMessaging'
import { Send, Search, MessageCircle, User, Plus, X, Wifi, WifiOff } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const Messages = () => {
  const { user } = useAuth()
  const { updateUnreadCount, decrementUnreadCount } = useMessages()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false)
  const [newMessageAlert, setNewMessageAlert] = useState(false)
  const [lastMessageCount, setLastMessageCount] = useState(0)
  const [connectionState, setConnectionState] = useState(CONNECTION_STATES.DISCONNECTED)
  const [pollingRate, setPollingRate] = useState(250) // Default to optimized 250ms
  const messagesEndRef = useRef(null)
  const lastFetchTime = useRef(Date.now())
  const conversationPollingRef = useRef(null)
  const messagePollingRef = useRef(null)

  useEffect(() => {
    // Initialize ultra-fast messaging system
    fetchConversations(false)
    
    // Start industry-grade real-time conversation polling
    const conversationFetcher = () => fetchConversations(true)
    messagingService.start(conversationFetcher)
    
    // Monitor connection state at lightning speed
    const connectionMonitor = setInterval(() => {
      const info = messagingService.getConnectionInfo()
      setConnectionState(info.state)
      setPollingRate(info.pollingRate)
    }, 500) // Monitor every 500ms for real-time status
    
    // Cleanup on unmount
    return () => {
      messagingService.stop()
      clearInterval(connectionMonitor)
    }
  }, [])

  useEffect(() => {
    // Check if we need to start a chat with someone from URL params
    const urlParams = new URLSearchParams(window.location.search)
    const startChatUserId = urlParams.get('startChat')
    const userName = urlParams.get('name')
    
    if (startChatUserId && userName) {
      // Wait for conversations to load, then check
      if (conversations.length > 0) {
        const existingConversation = conversations.find(
          conv => conv.partner_id === startChatUserId
        )

        if (existingConversation) {
          setSelectedConversation(existingConversation)
        } else {
          fetchUserForNewChat(startChatUserId, userName)
        }
        
        // Clean up URL
        window.history.replaceState({}, document.title, '/messages')
      } else if (!loading) {
        // If no conversations loaded and not loading, create new chat
        fetchUserForNewChat(startChatUserId, userName)
        window.history.replaceState({}, document.title, '/messages')
      }
    }
  }, [conversations, loading])

  useEffect(() => {
    if (selectedConversation) {
      // Fetch messages immediately
      fetchMessages(selectedConversation.partner_id, false)
      
      // Create LIGHTNING-FAST message polling service for active conversation
      const messageService = new (messagingService.constructor)()
      messageService.minPollingRate = 100 // FAST for active chat - 100ms
      messageService.basePollingRate = 250 // 250ms standard rate
      
      const messageFetcher = () => fetchMessages(selectedConversation.partner_id, true)
      messageService.start(messageFetcher)
      
      messagePollingRef.current = messageService
      
      console.log(`⚡ LIGHTNING-FAST 50ms message polling started for ${selectedConversation.partner_name} - INSTANT MESSAGING! ⚡`)
    } else {
      // Stop message polling when no conversation selected
      if (messagePollingRef.current) {
        messagePollingRef.current.stop()
        messagePollingRef.current = null
      }
    }
    
    // Cleanup on conversation change
    return () => {
      if (messagePollingRef.current) {
        messagePollingRef.current.stop()
        messagePollingRef.current = null
      }
    }
  }, [selectedConversation])

  // Debounce user search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (userSearchQuery) {
        searchUsers(userSearchQuery)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [userSearchQuery])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const fetchConversations = async (isAutoRefresh = false) => {
    try {
      const response = await api.get('/messages/conversations')
      const fetchedConversations = response.data.data.conversations || []
      
      // Check if we have changes in conversations to prevent unnecessary updates
      if (isAutoRefresh && conversations.length > 0) {
        const hasChanges = fetchedConversations.length !== conversations.length ||
          fetchedConversations.some((conv, index) => {
            const existingConv = conversations[index]
            return !existingConv || 
              conv.partner_id !== existingConv.partner_id || 
              conv.last_message !== existingConv.last_message ||
              conv.last_message_time !== existingConv.last_message_time
          })
        
        if (!hasChanges) {
          return // No changes, skip update
        }
      }
      
      setConversations(fetchedConversations)
    } catch (error) {
      console.error('Error fetching conversations:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      
      // For now, set empty conversations to avoid crash
      if (!isAutoRefresh) {
        setConversations([])
      }
    } finally {
      if (!isAutoRefresh) {
        setLoading(false)
      }
    }
  }

  const fetchUserForNewChat = async (userId, userName) => {
    try {
      const response = await api.get(`/profile/${userId}`)
      const userProfile = response.data.data?.profile
      
      if (userProfile) {
        const newConversation = {
          partner_id: userProfile.user_id,
          partner_name: userProfile.name,
          partner_role: userProfile.role,
          last_message: '',
          last_message_time: null,
          unread_count: 0
        }
        setSelectedConversation(newConversation)
        setMessages([])
      }
    } catch (error) {
      console.error('Error fetching user for new chat:', error)
      // Fallback with URL parameters
      const newConversation = {
        partner_id: userId,
        partner_name: decodeURIComponent(userName),
        partner_role: 'student', // Default role
        last_message: '',
        last_message_time: null,
        unread_count: 0
      }
      setSelectedConversation(newConversation)
      setMessages([])
    }
  }

  const fetchMessages = async (userId, isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        setIsAutoRefreshing(true)
      }
      
      const response = await api.get(`/messages/conversation/${userId}`)
      const fetchedMessages = response.data.data.messages || []
      
      // Enhanced new message detection for ultra-fast updates
      if (isAutoRefresh && messages.length > 0) {
        // Check for new messages by comparing lengths and latest message IDs
        const hasNewMessages = fetchedMessages.length > messages.length ||
          (fetchedMessages.length > 0 && messages.length > 0 && 
           fetchedMessages[fetchedMessages.length - 1].id !== messages[messages.length - 1].id) ||
          fetchedMessages.some((msg, index) => {
            const existingMsg = messages[index]
            return !existingMsg || msg.id !== existingMsg.id || msg.is_read !== existingMsg.is_read
          })
        
        if (!hasNewMessages) {
          // Still show brief loading indicator to show system is active
          setTimeout(() => setIsAutoRefreshing(false), 200)
          return
        }
        
        // Trigger new message animation and sound
        if (fetchedMessages.length > messages.length) {
          console.log('⚡ INSTANT MESSAGE DELIVERY - Faster than blink! ⚡')
          setNewMessageAlert(true)
          
          // Play subtle notification sound (optional)
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCCWS4/PSgCkFMYjN9NuOOwgZaLvt559NEAxBPh9JCUkJRTtlORUFEYfQ9NyNPAgXYbbn7qBOCQpKJQRECEEJOjVjsqEbc6fw')
            audio.volume = 0.1
            audio.play().catch(() => {})
          } catch (e) {}
          
          // Clear animation after short time
          setTimeout(() => setNewMessageAlert(false), 2000)
        }
      }
      
      setMessages(fetchedMessages)
      setLastMessageCount(fetchedMessages.length)
      
      // Count unread messages for this conversation and update global count
      const unreadMessagesCount = fetchedMessages.filter(
        msg => msg.receiver_id === user.id && !msg.is_read
      ).length
      
      if (unreadMessagesCount > 0) {
        // Decrement global unread count by the number of messages we just read
        decrementUnreadCount(unreadMessagesCount)
      }
      
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      if (isAutoRefresh) {
        // Update performance tracking
        lastFetchTime.current = Date.now()
        
        // Show indicator briefly, then hide with smooth transition
        setTimeout(() => setIsAutoRefreshing(false), 300)
      }
    }
  }

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setSearchingUsers(true)
    try {
      const response = await api.get('/profile/all')
      const allUsers = response.data.data.profiles || []
      
      // Filter users by name or email, exclude current user
      const filtered = allUsers.filter(profile => 
        profile.user_id !== user.id &&
        (profile.name.toLowerCase().includes(query.toLowerCase()) ||
         profile.email.toLowerCase().includes(query.toLowerCase()))
      )
      
      setSearchResults(filtered)
    } catch (error) {
      console.error('Error searching users:', error)
      setSearchResults([])
    } finally {
      setSearchingUsers(false)
    }
  }

  const startConversationWith = (selectedUser) => {
    // Check if conversation already exists
    const existingConversation = conversations.find(
      conv => conv.partner_id === selectedUser.user_id
    )

    if (existingConversation) {
      setSelectedConversation(existingConversation)
    } else {
      // Create new conversation object
      const newConversation = {
        partner_id: selectedUser.user_id,
        partner_name: selectedUser.name,
        partner_role: selectedUser.role,
        last_message: '',
        last_message_time: null,
        unread_count: 0
      }
      setSelectedConversation(newConversation)
      setMessages([])
      
      // Don't add to conversations list yet - wait until first message is sent
    }
    
    setShowNewMessage(false)
    setUserSearchQuery('')
    setSearchResults([])
  }

  // Force immediate refresh on user interaction
  const forceRefresh = () => {
    messagingService.forceCheck()
    if (messagePollingRef.current) {
      messagePollingRef.current.forceCheck()
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    const messageText = newMessage.trim()
    const tempId = `temp-${Date.now()}`
    
    // INSTANT UI UPDATE - Add optimistic message immediately for ultra-fast UX
    const optimisticMessage = {
      id: tempId,
      sender_id: user.id,
      receiver_id: selectedConversation.partner_id,
      message: messageText,
      created_at: new Date().toISOString(),
      is_read: false,
      sending: true // Flag to show it's being sent
    }
    
    // Update UI instantly
    setMessages(prev => [...prev, optimisticMessage])
    setNewMessage('')
    setSendingMessage(true)

    try {
      const response = await api.post('/messages/send', {
        receiverId: selectedConversation.partner_id,
        message: messageText
      })

      // Replace optimistic message with real message from server
      const sentMessage = response.data.data.message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? { ...sentMessage, sending: false } : msg
        )
      )

      // Update conversation list with ultra-fast sync
      const updatedConversation = {
        partner_id: selectedConversation.partner_id,
        partner_name: selectedConversation.partner_name,
        partner_role: selectedConversation.partner_role,
        last_message: messageText,
        last_message_time: sentMessage.created_at,
        unread_count: 0
      }

      setConversations(prev => {
        const filtered = prev.filter(conv => conv.partner_id !== selectedConversation.partner_id)
        return [updatedConversation, ...filtered]
      })

      setSelectedConversation(updatedConversation)
      
      // Force immediate refresh to sync with server ultra-fast
      forceRefresh()

    } catch (error) {
      console.error('Error sending message:', error)
      
      // Remove optimistic message on error and show error state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? { ...msg, error: true, sending: false } : msg
        )
      )
      
      alert('Failed to send message. Please try again.')
    } finally {
      setSendingMessage(false)
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.partner_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <LoadingSpinner text="Loading messages..." />
  }

  return (
    <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)] flex bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Conversations Sidebar */}
      <div className={`${selectedConversation ? 'hidden lg:flex' : 'flex'} w-full lg:w-1/3 border-r border-gray-200 flex-col`}>
        {/* Header */}
        <div className="p-3 lg:p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h2 className="text-lg lg:text-xl font-bold text-gray-900">Messages</h2>
            <button
              onClick={() => setShowNewMessage(true)}
              className="btn-primary flex items-center space-x-1 lg:space-x-2 px-2 lg:px-3 py-1 lg:py-2 text-sm lg:text-base"
            >
              <Plus className="w-3 lg:w-4 h-3 lg:h-4" />
              <span>New</span>
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 lg:p-8 text-center">
              <MessageCircle className="w-10 lg:w-12 h-10 lg:h-12 text-gray-400 mx-auto mb-3 lg:mb-4" />
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
              <p className="text-gray-600 text-xs lg:text-sm px-2">
                Start a conversation by visiting someone's profile and clicking "Send Message"
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.partner_id}
                onClick={() => {
                  setSelectedConversation(conversation)
                  forceRefresh() // Immediate sync on conversation switch
                }}
                className={`p-3 lg:p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.partner_id === conversation.partner_id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 lg:w-10 h-8 lg:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-xs lg:text-sm">
                      {conversation.partner_name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 truncate text-sm lg:text-base">
                        {conversation.partner_name}
                      </h3>
                      <span className="text-xs text-gray-500 capitalize ml-2">
                        {conversation.partner_role}
                      </span>
                    </div>
                    <p className="text-xs lg:text-sm text-gray-600 truncate">
                      {conversation.last_message}
                    </p>
                    {conversation.unread_count > 0 && (
                      <span className="inline-block bg-blue-500 text-white text-xs rounded-full px-2 py-1 mt-1">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className={`${selectedConversation ? 'flex' : 'hidden lg:flex'} flex-1 flex-col`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-3 lg:p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Back button for mobile */}
                  <button 
                    onClick={() => setSelectedConversation(null)}
                    className="lg:hidden p-1 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="w-8 lg:w-10 h-8 lg:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xs lg:text-sm">
                      {selectedConversation.partner_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm lg:text-base">
                      {selectedConversation.partner_name}
                    </h3>
                    <p className="text-xs lg:text-sm text-gray-600">
                      {selectedConversation.partner_role}
                    </p>
                  </div>
                </div>
                
                {/* Advanced Real-time Status */}
                <div className="flex items-center space-x-2">
                  {/* Lightning-Fast Connection State Indicator */}
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border-2 ${
                    connectionState === CONNECTION_STATES.CONNECTED ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-green-300 animate-pulse' :
                    connectionState === CONNECTION_STATES.CONNECTING ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-300 animate-bounce' :
                    connectionState === CONNECTION_STATES.ERROR ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white border-red-300 animate-pulse' :
                    'bg-gray-100 text-gray-700 border-gray-300'
                  }`}>
                    {connectionState === CONNECTION_STATES.CONNECTED ? (
                      <><Wifi className="w-3 h-3" /><span>Live</span></>
                    ) : connectionState === CONNECTION_STATES.CONNECTING ? (
                      <><div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div><span>Sync</span></>
                    ) : connectionState === CONNECTION_STATES.ERROR ? (
                      <><WifiOff className="w-3 h-3" /><span>Error</span></>
                    ) : (
                      <><WifiOff className="w-3 h-3" /><span>Off</span></>
                    )}
                  </div>
                  
                  {/* Performance Indicator */}
                  <button
                    onClick={forceRefresh}
                    className="text-xs text-white font-mono bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-2 py-1 rounded transition-all cursor-pointer animate-pulse"
                    title={`LIGHTNING-FAST polling every ${pollingRate}ms - Faster than blink! Click to force refresh`}
                  >
                    ⚡{pollingRate}ms
                  </button>
                  
                  {/* Activity Indicators */}
                  {isAutoRefreshing && (
                    <div className="flex items-center space-x-1 bg-blue-100 px-2 py-1 rounded-full animate-pulse">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-xs text-blue-700 font-medium">Sync</span>
                    </div>
                  )}
                  
                  {newMessageAlert && (
                    <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full animate-bounce">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                      <span className="text-xs text-green-700 font-medium">New!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className={`flex-1 overflow-y-auto p-2 lg:p-4 space-y-3 lg:space-y-4 transition-all duration-300 ${
              newMessageAlert ? 'bg-blue-50' : ''
            }`}>
              {messages.length === 0 ? (
                <div className="text-center py-6 lg:py-8">
                  <p className="text-gray-500 text-sm lg:text-base">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] lg:max-w-xs xl:max-w-md px-3 lg:px-4 py-2 rounded-lg relative ${
                        message.sender_id === user.id
                          ? message.error ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-900'
                      } ${message.sending ? 'opacity-70' : ''}`}
                    >
                      <p className="text-sm lg:text-sm break-words">{message.message}</p>
                      <div className={`flex items-center justify-between mt-1`}>
                        <p className={`text-xs ${
                          message.sender_id === user.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.created_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                        {message.sender_id === user.id && (
                          <div className="flex items-center space-x-1">
                            {message.sending && (
                              <div className="flex items-center space-x-1">
                                <div className="w-1 h-1 bg-blue-100 rounded-full animate-pulse"></div>
                                <span className="text-xs text-blue-100">Sending...</span>
                              </div>
                            )}
                            {message.error && (
                              <span className="text-xs text-red-100">Failed</span>
                            )}
                            {!message.sending && !message.error && (
                              <div className="w-1 h-1 bg-blue-100 rounded-full"></div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {/* Auto-scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-3 lg:p-4 border-t border-gray-200">
              <form onSubmit={sendMessage} className="flex space-x-2 lg:space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !newMessage.trim()}
                  className="btn-primary flex items-center space-x-1 lg:space-x-2 px-3 lg:px-4 py-2 disabled:opacity-50 text-sm lg:text-base"
                >
                  {sendingMessage ? (
                    <div className="spinner"></div>
                  ) : (
                    <Send className="w-3 lg:w-4 h-3 lg:h-4" />
                  )}
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <MessageCircle className="w-12 lg:w-16 h-12 lg:h-16 text-gray-400 mx-auto mb-3 lg:mb-4" />
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-600 text-sm lg:text-base px-4">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Message Modal */}
      {showNewMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-sm lg:max-w-md">
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <h3 className="text-base lg:text-lg font-semibold text-gray-900">New Message</h3>
              <button
                onClick={() => {
                  setShowNewMessage(false)
                  setUserSearchQuery('')
                  setSearchResults([])
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Search */}
            <div className="mb-3 lg:mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value)
                    searchUsers(e.target.value)
                  }}
                  className="w-full pl-10 pr-4 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Search Results */}
            <div className="max-h-48 lg:max-h-60 overflow-y-auto">
              {searchingUsers ? (
                <div className="flex items-center justify-center py-6 lg:py-8">
                  <LoadingSpinner text="Searching users..." />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-6 lg:py-8">
                  <User className="w-10 lg:w-12 h-10 lg:h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-xs lg:text-sm">
                    {userSearchQuery ? 'No users found' : 'Start typing to search for users'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1 lg:space-y-2">
                  {searchResults.map((profile) => (
                    <div
                      key={profile.user_id}
                      onClick={() => startConversationWith(profile)}
                      className="p-2 lg:p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 lg:w-10 h-8 lg:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-xs lg:text-sm">
                            {profile.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm lg:text-base truncate">{profile.name}</h4>
                          <p className="text-xs lg:text-sm text-gray-600 capitalize truncate">{profile.role}</p>
                          {profile.department && (
                            <p className="text-xs text-gray-500 truncate">{profile.department}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Messages