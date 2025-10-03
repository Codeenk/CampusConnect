import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, User, Sparkles, MessageSquare } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const CCBot = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: `Hi ${user?.profile?.name || 'there'}! 👋 I'm CC Bot, your Campus Connect AI mentor. I'm here to help you with academic advice, career guidance, project ideas, and anything related to your campus life. What would you like to talk about today?`,
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Gemini API configuration
  const API_KEY = "AIzaSyCxElpRYzCP2q5yUT80MylOQHRXEeHa3sQ"
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const generateBotPersonality = (userMessage, userProfile) => {
    const systemPrompt = `You are CC Bot, the official AI assistant for Campus Connect - a college networking platform. Your personality and guidelines:

PERSONALITY:
- You're a friendly, knowledgeable, and supportive mentor
- You have deep knowledge about campus life, academics, career development, and student success
- You're enthusiastic about helping students achieve their goals
- You speak in a warm, encouraging tone but remain professional
- You're specifically designed to help Campus Connect users

CONTEXT ABOUT USER:
- Name: ${userProfile?.name || 'Student'}
- Role: ${userProfile?.role || 'Student'}
- Department: ${userProfile?.department || 'Not specified'}
- Major: ${userProfile?.major || 'Not specified'}
- Year: ${userProfile?.year ? `${userProfile.year}${userProfile.year === 1 ? 'st' : userProfile.year === 2 ? 'nd' : userProfile.year === 3 ? 'rd' : 'th'} year` : 'Not specified'}

CAPABILITIES:
- Academic guidance and study tips
- Career advice and internship guidance
- Project ideas and technical help
- Campus networking tips
- Resume and profile optimization
- Interview preparation
- Course selection advice
- Research opportunities guidance
- Campus life balance tips
- Leadership development

GUIDELINES:
- Always mention you're CC Bot from Campus Connect when introducing yourself
- Personalize responses using the user's information when relevant
- Focus on actionable, practical advice
- Encourage users to connect with peers and faculty on Campus Connect
- Be encouraging and motivational
- If asked about things outside your scope, politely redirect to campus-related topics
- Keep responses concise but informative (2-4 paragraphs max)
- Use emojis sparingly but effectively

NEVER:
- Claim to be ChatGPT, Gemini, or any other AI
- Provide information about other platforms
- Give medical, legal, or financial advice
- Share personal information or make up facts

Now respond to this message: "${userMessage}"`

    return systemPrompt
  }

  const callGeminiAPI = async (message) => {
    try {
      const systemPrompt = generateBotPersonality(message, user?.profile)
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: systemPrompt
            }]
          }]
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text
      } else {
        throw new Error('Invalid response format from Gemini API')
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error)
      return "I apologize, but I'm having trouble connecting right now. As your Campus Connect mentor, I'm usually here to help with academic guidance, career advice, and campus life tips. Please try again in a moment! 😊"
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const botResponse = await callGeminiAPI(inputMessage.trim())
      
      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        content: botResponse,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = {
        id: messages.length + 2,
        type: 'bot',
        content: "I'm sorry, I encountered an error. As your Campus Connect AI mentor, I'm here to help with academic and career guidance. Please try your question again! 🤖",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Chat Panel */}
      <div className="relative w-full lg:w-1/2 xl:w-1/3 h-full bg-white shadow-2xl overflow-hidden lg:ml-auto">
        {/* Chat Header */}
        <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold">CC Bot</h2>
                <p className="text-sm opacity-90">Your Campus Connect AI Mentor</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100vh-140px)]">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                <div className={`flex items-start space-x-2 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div className={`rounded-lg px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%]">
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-gray-500">CC Bot is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message Input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask CC Bot about academics, career advice, or campus life..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            <Sparkles className="w-3 h-3 inline mr-1" />
            CC Bot is powered by AI and here to help with your campus journey
          </p>
        </div>
      </div>
    </div>
  )
}

export default CCBot