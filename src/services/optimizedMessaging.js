/**
 * Ultra-Optimized Real-Time Messaging System
 * Designed for low-end devices with intelligent resource management
 */

class OptimizedMessagingService {
  constructor() {
    this.ws = null;
    this.pollingInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.baseReconnectDelay = 1000;
    this.isConnected = false;
    this.messageCallbacks = new Set();
    this.connectionStateCallbacks = new Set();
    
    // Performance monitoring
    this.performanceMetrics = {
      cpuUsage: 'low',
      networkQuality: 'good',
      batteryLevel: 1,
      deviceMemory: navigator.deviceMemory || 4
    };
    
    // Adaptive configuration based on device capabilities
    this.config = this.getOptimalConfig();
    
    // Message queue for offline scenarios
    this.messageQueue = [];
    this.isOnline = navigator.onLine;
    
    // Debounced polling for fallback mode
    this.debouncedPoll = this.debounce(this.pollMessages.bind(this), this.config.pollInterval);
    
    this.init();
  }

  /**
   * Get optimal configuration based on device capabilities
   */
  getOptimalConfig() {
    const deviceMemory = navigator.deviceMemory || 4;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const effectiveType = connection?.effectiveType || 'unknown';
    
    // Ultra-low end device detection
    const isLowEndDevice = deviceMemory <= 2 || effectiveType === 'slow-2g' || effectiveType === '2g';
    const isMidEndDevice = deviceMemory <= 4 || effectiveType === '3g';
    
    if (isLowEndDevice) {
      return {
        strategy: 'polling-aggressive',
        pollInterval: 5000, // 5 seconds for ultra low-end
        maxConnections: 1,
        messageBufferSize: 10,
        enableCompression: true,
        enableBatching: true,
        batchSize: 5,
        enableDebouncing: true
      };
    } else if (isMidEndDevice) {
      return {
        strategy: 'websocket-fallback',
        pollInterval: 3000, // 3 seconds for mid-end
        maxConnections: 1,
        messageBufferSize: 25,
        enableCompression: true,
        enableBatching: true,
        batchSize: 10,
        enableDebouncing: true
      };
    } else {
      return {
        strategy: 'websocket-primary',
        pollInterval: 2000, // 2 seconds fallback for high-end
        maxConnections: 1,
        messageBufferSize: 50,
        enableCompression: false,
        enableBatching: false,
        batchSize: 1,
        enableDebouncing: false
      };
    }
  }

  /**
   * Initialize the messaging service
   */
  async init() {
    // Monitor network and performance changes
    this.setupPerformanceMonitoring();
    
    // Start with the best available connection method
    if (this.config.strategy === 'websocket-primary' || this.config.strategy === 'websocket-fallback') {
      await this.initWebSocket();
    } else {
      this.initPolling();
    }
  }

  /**
   * Setup performance monitoring for adaptive behavior
   */
  setupPerformanceMonitoring() {
    // Network quality monitoring
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        this.adaptToNetworkChange();
      });
    }

    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.reconnect();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.disconnect();
    });

    // Battery level monitoring (if available)
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        this.performanceMetrics.batteryLevel = battery.level;
        
        battery.addEventListener('levelchange', () => {
          this.performanceMetrics.batteryLevel = battery.level;
          this.adaptToBatteryLevel();
        });
      });
    }

    // Page visibility changes (pause when tab is not active)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseMessaging();
      } else {
        this.resumeMessaging();
      }
    });
  }

  /**
   * WebSocket initialization with intelligent fallback
   */
  async initWebSocket() {
    try {
      // Use secure WebSocket in production
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/messages`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected - Real-time messaging active');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyConnectionState('connected');
        this.processMessageQueue();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected - Falling back to polling');
        this.isConnected = false;
        this.notifyConnectionState('disconnected');
        
        // Fallback to polling if WebSocket fails
        if (this.isOnline) {
          this.initPolling();
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
        
        // Immediate fallback for low-end devices
        if (this.config.strategy !== 'websocket-primary') {
          this.initPolling();
        }
      };

    } catch (error) {
      console.error('WebSocket initialization failed:', error);
      // Fallback to polling
      this.initPolling();
    }
  }

  /**
   * Optimized polling for low-end devices
   */
  initPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    // Use adaptive polling interval
    const interval = this.getAdaptivePollingInterval();
    
    this.pollingInterval = setInterval(() => {
      if (this.isOnline && !document.hidden) {
        this.debouncedPoll();
      }
    }, interval);

    console.log(`📡 Polling mode active - Interval: ${interval}ms`);
    this.notifyConnectionState('polling');
  }

  /**
   * Get adaptive polling interval based on current conditions
   */
  getAdaptivePollingInterval() {
    let baseInterval = this.config.pollInterval;
    
    // Increase interval for low battery
    if (this.performanceMetrics.batteryLevel < 0.2) {
      baseInterval *= 3; // Triple the interval for low battery
    } else if (this.performanceMetrics.batteryLevel < 0.4) {
      baseInterval *= 2; // Double for medium battery
    }
    
    // Adjust for network quality
    const connection = navigator.connection;
    if (connection) {
      switch (connection.effectiveType) {
        case 'slow-2g':
        case '2g':
          baseInterval *= 4;
          break;
        case '3g':
          baseInterval *= 2;
          break;
        default:
          // Keep base interval for 4g and above
          break;
      }
    }
    
    // Maximum interval cap (30 seconds)
    return Math.min(baseInterval, 30000);
  }

  /**
   * Debounce utility for performance optimization
   */
  debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * Optimized message polling
   */
  async pollMessages() {
    try {
      const response = await fetch('/api/messages/recent', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        // Add cache control for better performance
        cache: 'no-cache'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          // Process messages in batches for better performance
          this.processBatchedMessages(data.data);
        }
      }
    } catch (error) {
      console.error('Polling error:', error);
      // Increase polling interval on error
      this.adaptToError();
    }
  }

  /**
   * Process messages in batches to reduce UI blocking
   */
  processBatchedMessages(messages) {
    if (!messages.length) return;

    const batchSize = this.config.batchSize;
    
    // Process messages in chunks to avoid blocking UI
    const processBatch = (startIndex) => {
      const batch = messages.slice(startIndex, startIndex + batchSize);
      
      batch.forEach(message => {
        this.handleIncomingMessage(message);
      });
      
      // Process next batch with minimal delay
      if (startIndex + batchSize < messages.length) {
        setTimeout(() => processBatch(startIndex + batchSize), 10);
      }
    };

    processBatch(0);
  }

  /**
   * Handle incoming messages efficiently
   */
  handleIncomingMessage(message) {
    // Notify all registered callbacks with minimal overhead
    this.messageCallbacks.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Message callback error:', error);
      }
    });
  }

  /**
   * Send message with queue support for offline scenarios
   */
  async sendMessage(messageData) {
    const message = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ...messageData
    };

    if (!this.isOnline) {
      // Queue message for later sending
      this.messageQueue.push(message);
      return { success: true, queued: true };
    }

    try {
      if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Send via WebSocket
        this.ws.send(JSON.stringify(message));
        return { success: true, method: 'websocket' };
      } else {
        // Send via HTTP
        const response = await fetch('/api/messages/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(message)
        });

        return { 
          success: response.ok, 
          method: 'http',
          data: await response.json()
        };
      }
    } catch (error) {
      console.error('Send message error:', error);
      // Queue message if sending fails
      this.messageQueue.push(message);
      return { success: false, error: error.message, queued: true };
    }
  }

  /**
   * Process queued messages when connection is restored
   */
  async processMessageQueue() {
    if (this.messageQueue.length === 0) return;

    console.log(`📨 Processing ${this.messageQueue.length} queued messages`);
    
    const queue = [...this.messageQueue];
    this.messageQueue = [];

    for (const message of queue) {
      try {
        await this.sendMessage(message);
        // Small delay between messages to avoid overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Failed to send queued message:', error);
        // Re-queue if it fails again
        this.messageQueue.push(message);
      }
    }
  }

  /**
   * Pause messaging when tab is not visible
   */
  pauseMessaging() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    console.log('⏸️ Messaging paused (tab not visible)');
  }

  /**
   * Resume messaging when tab becomes visible
   */
  resumeMessaging() {
    if (!this.isConnected && this.isOnline) {
      this.initPolling();
      console.log('▶️ Messaging resumed (tab visible)');
    }
  }

  /**
   * Adapt to network changes
   */
  adaptToNetworkChange() {
    // Reconfigure based on new network conditions
    this.config = this.getOptimalConfig();
    
    // Restart connection with new config
    if (this.isOnline) {
      this.disconnect();
      setTimeout(() => this.init(), 1000);
    }
  }

  /**
   * Adapt to battery level changes
   */
  adaptToBatteryLevel() {
    if (this.performanceMetrics.batteryLevel < 0.15) {
      // Ultra power saving mode
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.initPolling(); // Restart with longer intervals
      }
      console.log('🔋 Low battery - Reduced messaging frequency');
    }
  }

  /**
   * Adapt to errors by increasing intervals
   */
  adaptToError() {
    // Temporarily increase polling interval on errors
    this.config.pollInterval = Math.min(this.config.pollInterval * 1.5, 10000);
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.initPolling();
    }
  }

  /**
   * Schedule WebSocket reconnection with exponential backoff
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached');
      return;
    }

    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    setTimeout(() => {
      if (this.isOnline && this.config.strategy !== 'polling-aggressive') {
        console.log(`🔄 Attempting WebSocket reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.initWebSocket();
      }
    }, delay);
  }

  /**
   * Subscribe to message updates
   */
  onMessage(callback) {
    this.messageCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.messageCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionStateChange(callback) {
    this.connectionStateCallbacks.add(callback);
    
    return () => {
      this.connectionStateCallbacks.delete(callback);
    };
  }

  /**
   * Notify connection state changes
   */
  notifyConnectionState(state) {
    this.connectionStateCallbacks.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Connection state callback error:', error);
      }
    });
  }

  /**
   * Force reconnection
   */
  reconnect() {
    this.disconnect();
    setTimeout(() => this.init(), 500);
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    this.isConnected = false;
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      method: this.ws && this.ws.readyState === WebSocket.OPEN ? 'websocket' : 'polling',
      strategy: this.config.strategy,
      interval: this.config.pollInterval,
      queuedMessages: this.messageQueue.length,
      batteryLevel: this.performanceMetrics.batteryLevel,
      isOnline: this.isOnline
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.disconnect();
    this.messageCallbacks.clear();
    this.connectionStateCallbacks.clear();
    this.messageQueue = [];
  }
}

// Export singleton instance
export default new OptimizedMessagingService();