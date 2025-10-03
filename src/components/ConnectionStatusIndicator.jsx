import React from 'react';
import { useMessages } from '../contexts/MessagesContext';
import { Wifi, WifiOff, Smartphone, Battery, Zap } from 'lucide-react';

const ConnectionStatusIndicator = () => {
  const { connectionStatus, getConnectionInfo } = useMessages();
  
  const connectionInfo = getConnectionInfo();
  
  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'polling':
        return <Smartphone className="w-4 h-4 text-blue-500" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Real-time';
      case 'polling':
        return `Polling (${Math.round(connectionInfo.interval / 1000)}s)`;
      case 'disconnected':
        return 'Offline';
      default:
        return 'Connecting...';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'polling':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'disconnected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getBatteryIcon = () => {
    if (connectionInfo.batteryLevel >= 0.8) return 'text-green-500';
    if (connectionInfo.batteryLevel >= 0.5) return 'text-yellow-500';
    if (connectionInfo.batteryLevel >= 0.2) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-sm ${getStatusColor()}`}>
      {getStatusIcon()}
      <span className="font-medium">{getStatusText()}</span>
      
      {/* Performance indicators */}
      {connectionInfo.strategy === 'polling-aggressive' && (
        <div className="flex items-center space-x-1">
          <Zap className="w-3 h-3" />
          <span className="text-xs">Power Save</span>
        </div>
      )}
      
      {connectionInfo.batteryLevel < 1 && (
        <Battery className={`w-3 h-3 ${getBatteryIcon()}`} />
      )}
      
      {connectionInfo.queuedMessages > 0 && (
        <div className="bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded text-xs">
          {connectionInfo.queuedMessages} queued
        </div>
      )}
    </div>
  );
};

export default ConnectionStatusIndicator;