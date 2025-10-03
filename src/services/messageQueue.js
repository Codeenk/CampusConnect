// Advanced message queue and network optimization service
// Based on techniques used by WhatsApp, Telegram, Signal

class MessageQueueService {
  constructor() {
    this.messageQueue = new Map()
    this.processingQueue = false
    this.networkOptimizer = new NetworkOptimizer()
    this.retryAttempts = new Map()
    this.maxRetries = 3
  }

  // Queue message for ultra-fast processing
  queueMessage(message, priority = 'normal') {
    const queueId = `msg_${Date.now()}_${Math.random()}`
    
    this.messageQueue.set(queueId, {
      ...message,
      queueId,
      priority,
      timestamp: Date.now(),
      attempts: 0
    })

    // Process immediately for ultra-fast UX
    this.processQueue()
    
    return queueId
  }

  // Process message queue with priority handling
  async processQueue() {
    if (this.processingQueue || this.messageQueue.size === 0) {
      return
    }

    this.processingQueue = true

    try {
      // Sort by priority and timestamp
      const sortedMessages = Array.from(this.messageQueue.entries())
        .sort(([, a], [, b]) => {
          const priorityOrder = { high: 3, normal: 2, low: 1 }
          const aPriority = priorityOrder[a.priority] || 2
          const bPriority = priorityOrder[b.priority] || 2
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority
          }
          
          return a.timestamp - b.timestamp
        })

      // Process messages in batches for optimal performance
      const batchSize = 3
      for (let i = 0; i < sortedMessages.length; i += batchSize) {
        const batch = sortedMessages.slice(i, i + batchSize)
        await this.processBatch(batch)
      }

    } catch (error) {
      console.error('Queue processing error:', error)
    } finally {
      this.processingQueue = false
    }
  }

  async processBatch(batch) {
    const promises = batch.map(([queueId, message]) => 
      this.processMessage(queueId, message)
    )

    // Wait for all messages in batch to complete
    await Promise.allSettled(promises)
  }

  async processMessage(queueId, message) {
    try {
      message.attempts++
      
      // Simulate network call - replace with actual API call
      const success = await this.networkOptimizer.sendMessage(message)
      
      if (success) {
        this.messageQueue.delete(queueId)
        this.retryAttempts.delete(queueId)
        console.log(`✅ Message sent successfully: ${queueId}`)
      } else {
        throw new Error('Send failed')
      }
      
    } catch (error) {
      console.error(`❌ Message send failed: ${queueId}`, error)
      
      if (message.attempts < this.maxRetries) {
        // Exponential backoff retry
        const delay = Math.pow(2, message.attempts) * 1000
        setTimeout(() => {
          if (this.messageQueue.has(queueId)) {
            this.processQueue()
          }
        }, delay)
      } else {
        // Max retries reached - mark as failed
        this.messageQueue.delete(queueId)
        this.retryAttempts.delete(queueId)
        console.error(`💀 Message failed permanently: ${queueId}`)
      }
    }
  }

  // Get queue status for monitoring
  getQueueStatus() {
    return {
      queueSize: this.messageQueue.size,
      processing: this.processingQueue,
      networkStatus: this.networkOptimizer.getStatus()
    }
  }
}

class NetworkOptimizer {
  constructor() {
    this.connectionPool = new Map()
    this.requestCache = new Map()
    this.compressionEnabled = true
  }

  async sendMessage(message) {
    // Simulate optimized network call
    return new Promise((resolve) => {
      // Ultra-fast simulation - in real app, this would be actual API call
      setTimeout(() => {
        resolve(Math.random() > 0.1) // 90% success rate
      }, Math.random() * 100 + 50) // 50-150ms response time
    })
  }

  getStatus() {
    return {
      activeConnections: this.connectionPool.size,
      cacheSize: this.requestCache.size,
      compressionEnabled: this.compressionEnabled
    }
  }
}

// Export singleton
export const messageQueue = new MessageQueueService()

// Performance monitoring
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      averageResponseTime: 0,
      connectionUptime: 0,
      errors: 0
    }
    this.startTime = Date.now()
  }

  recordMessageSent() {
    this.metrics.messagesSent++
  }

  recordMessageReceived() {
    this.metrics.messagesReceived++
  }

  recordError() {
    this.metrics.errors++
  }

  recordResponseTime(time) {
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime + time) / 2
  }

  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime,
      messagesPerMinute: this.metrics.messagesSent / ((Date.now() - this.startTime) / 60000),
      errorRate: this.metrics.errors / (this.metrics.messagesSent + this.metrics.messagesReceived)
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()