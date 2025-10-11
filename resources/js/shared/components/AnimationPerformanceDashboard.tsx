/**
 * Animation Performance Dashboard - Phase 11 Integration
 * Real-time monitoring of animation performance metrics
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAnimation } from '../providers/AnimationProvider';

interface PerformanceData {
  timestamp: number;
  animationCount: number;
  averageFrameTime: number;
  droppedFrames: number;
  memoryUsage: number;
}

interface AnimationPerformanceDashboardProps {
  isVisible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  updateInterval?: number;
}

export const AnimationPerformanceDashboard: React.FC<AnimationPerformanceDashboardProps> = ({
  isVisible = false,
  position = 'bottom-right',
  updateInterval = 1000
}) => {
  const { getPerformanceMetrics } = useAnimation();
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceData[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  // Update performance metrics
  const updateMetrics = useCallback(() => {
    const metrics = getPerformanceMetrics();
    const newData: PerformanceData = {
      timestamp: Date.now(),
      ...metrics
    };

    setPerformanceHistory(prev => {
      const updated = [...prev, newData];
      // Keep only last 60 data points (1 minute at 1s intervals)
      return updated.slice(-60);
    });
  }, [getPerformanceMetrics]);

  // Set up performance monitoring interval
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(updateMetrics, updateInterval);
    return () => clearInterval(interval);
  }, [isVisible, updateInterval, updateMetrics]);

  // Calculate performance statistics
  const getStats = useCallback(() => {
    if (performanceHistory.length === 0) {
      return {
        avgFrameTime: 0,
        maxFrameTime: 0,
        totalAnimations: 0,
        totalDroppedFrames: 0,
        currentMemory: 0
      };
    }

    const latest = performanceHistory[performanceHistory.length - 1];
    const frameTimes = performanceHistory.map(d => d.averageFrameTime);
    
    return {
      avgFrameTime: frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length,
      maxFrameTime: Math.max(...frameTimes),
      totalAnimations: latest.animationCount,
      totalDroppedFrames: latest.droppedFrames,
      currentMemory: latest.memoryUsage
    };
  }, [performanceHistory]);

  // Performance status indicator
  const getPerformanceStatus = useCallback(() => {
    const stats = getStats();
    
    if (stats.avgFrameTime > 16.67) { // 60fps = 16.67ms per frame
      return { status: 'poor', color: 'bg-red-500', text: 'Poor' };
    } else if (stats.avgFrameTime > 8.33) { // 120fps = 8.33ms per frame
      return { status: 'good', color: 'bg-yellow-500', text: 'Good' };
    } else {
      return { status: 'excellent', color: 'bg-green-500', text: 'Excellent' };
    }
  }, [getStats]);

  if (!isVisible) return null;

  const stats = getStats();
  const performanceStatus = getPerformanceStatus();

  return (
    <div className={`fixed ${positionClasses[position]} z-50 font-mono text-xs`}>
      <div className="bg-black bg-opacity-80 text-white rounded-lg shadow-lg">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-2 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${performanceStatus.color}`} />
            <span className="font-semibold">Animation Performance</span>
          </div>
          <div className="text-gray-400">
            {isExpanded ? '▼' : '▶'}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-3 border-t border-gray-600 space-y-2">
            {/* Performance Status */}
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={`font-semibold ${
                performanceStatus.status === 'excellent' ? 'text-green-400' :
                performanceStatus.status === 'good' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {performanceStatus.text}
              </span>
            </div>

            {/* Frame Time */}
            <div className="flex justify-between">
              <span>Avg Frame Time:</span>
              <span>{stats.avgFrameTime.toFixed(2)}ms</span>
            </div>

            <div className="flex justify-between">
              <span>Max Frame Time:</span>
              <span>{stats.maxFrameTime.toFixed(2)}ms</span>
            </div>

            {/* Animation Count */}
            <div className="flex justify-between">
              <span>Total Animations:</span>
              <span>{stats.totalAnimations}</span>
            </div>

            {/* Dropped Frames */}
            <div className="flex justify-between">
              <span>Dropped Frames:</span>
              <span className={stats.totalDroppedFrames > 0 ? 'text-red-400' : 'text-green-400'}>
                {stats.totalDroppedFrames}
              </span>
            </div>

            {/* Memory Usage */}
            <div className="flex justify-between">
              <span>Memory:</span>
              <span>{(stats.currentMemory / 1024 / 1024).toFixed(1)}MB</span>
            </div>

            {/* Performance Graph */}
            {performanceHistory.length > 1 && (
              <div className="mt-3">
                <div className="text-gray-400 mb-1">Frame Time History (ms)</div>
                <div className="h-16 bg-gray-800 rounded relative overflow-hidden">
                  <svg width="100%" height="100%" className="absolute inset-0">
                    <polyline
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1"
                      points={performanceHistory.map((data, index) => {
                        const x = (index / (performanceHistory.length - 1)) * 100;
                        const y = 100 - ((data.averageFrameTime / 33.33) * 100); // Scale to 30fps max
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                    {/* 60fps line */}
                    <line
                      x1="0"
                      y1="50"
                      x2="100%"
                      y2="50"
                      stroke="#ef4444"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                      opacity="0.5"
                    />
                  </svg>
                  <div className="absolute bottom-0 right-1 text-xs text-gray-500">
                    60fps
                  </div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-600">
              <button
                onClick={() => setPerformanceHistory([])}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Clear History
              </button>
              <div className="text-xs text-gray-500">
                {performanceHistory.length}/60 samples
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimationPerformanceDashboard;
