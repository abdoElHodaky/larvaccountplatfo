/**
 * Animation Demo Page - Phase 11 Integration
 * Demonstrates the animation system capabilities
 */

import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { AnimatedButton } from '../../shared/components/AnimatedButton';
import { AnimationPerformanceDashboard } from '../../shared/components/AnimationPerformanceDashboard';
import { useAnimation } from '../../shared/providers/AnimationProvider';

interface AnimationDemoProps {
  // Add any props from Laravel controller
}

export default function AnimationDemo(props: AnimationDemoProps) {
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);
  const [animationCount, setAnimationCount] = useState(0);
  const { isReducedMotion } = useAnimation();

  const handleButtonClick = () => {
    setAnimationCount(prev => prev + 1);
  };

  return (
    <>
      <Head title="Animation System Demo - Phase 11" />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🎬 Phase 11 Animation System
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Comprehensive animation framework with performance monitoring
            </p>
            
            {/* Status Indicators */}
            <div className="flex justify-center space-x-6 mb-8">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isReducedMotion ? 'bg-yellow-500' : 'bg-green-500'}`} />
                <span className="text-sm text-gray-700">
                  {isReducedMotion ? 'Reduced Motion Mode' : 'Full Animation Mode'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-700">
                  Animations Triggered: {animationCount}
                </span>
              </div>
            </div>
          </div>

          {/* Animation Showcase Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            
            {/* Button Animations */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Button Animations</h3>
              <div className="space-y-4">
                <AnimatedButton
                  variant="primary"
                  animationType="scale"
                  onClick={handleButtonClick}
                >
                  Scale Animation
                </AnimatedButton>
                
                <AnimatedButton
                  variant="success"
                  animationType="bounce"
                  onClick={handleButtonClick}
                >
                  Bounce Animation
                </AnimatedButton>
                
                <AnimatedButton
                  variant="info"
                  animationType="slide"
                  onClick={handleButtonClick}
                >
                  Slide Animation
                </AnimatedButton>
                
                <AnimatedButton
                  variant="warning"
                  animationType="fade"
                  onClick={handleButtonClick}
                >
                  Fade Animation
                </AnimatedButton>
              </div>
            </div>

            {/* Button Variants */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Button Variants</h3>
              <div className="space-y-4">
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  onClick={handleButtonClick}
                >
                  Small Primary
                </AnimatedButton>
                
                <AnimatedButton
                  variant="secondary"
                  size="md"
                  onClick={handleButtonClick}
                >
                  Medium Secondary
                </AnimatedButton>
                
                <AnimatedButton
                  variant="danger"
                  size="lg"
                  onClick={handleButtonClick}
                >
                  Large Danger
                </AnimatedButton>
                
                <AnimatedButton
                  variant="primary"
                  loading={false}
                  onClick={handleButtonClick}
                >
                  Normal State
                </AnimatedButton>
              </div>
            </div>

            {/* Performance Controls */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Monitoring</h3>
              <div className="space-y-4">
                <AnimatedButton
                  variant={showPerformanceDashboard ? "danger" : "success"}
                  onClick={() => setShowPerformanceDashboard(!showPerformanceDashboard)}
                >
                  {showPerformanceDashboard ? "Hide Dashboard" : "Show Dashboard"}
                </AnimatedButton>
                
                <div className="text-sm text-gray-600">
                  <p className="mb-2">
                    The performance dashboard provides real-time metrics:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Frame time monitoring</li>
                    <li>Animation count tracking</li>
                    <li>Memory usage analysis</li>
                    <li>Performance history graph</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Animation Features */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Animation Features</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Reduced motion support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Performance monitoring</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Multiple animation types</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Accessibility compliant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Error handling</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>TypeScript support</span>
                </div>
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Specs</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <div><strong>Target FPS:</strong> 60fps (16.67ms per frame)</div>
                <div><strong>Animation Engine:</strong> Web Animations API</div>
                <div><strong>Fallback:</strong> CSS Transitions</div>
                <div><strong>Performance:</strong> Real-time monitoring</div>
                <div><strong>Memory:</strong> Optimized cleanup</div>
                <div><strong>Accessibility:</strong> WCAG 2.1 AA compliant</div>
              </div>
            </div>

            {/* Integration Status */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Animation Provider</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✅ Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Performance Monitor</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✅ Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Component Library</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">🚀 Ready</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Dashboard Integration</span>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">⏳ Pending</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm">
            <p>Phase 11 Animation System - Laravel Accounting Platform</p>
            <p className="mt-1">Built with React, TypeScript, and Web Animations API</p>
          </div>
        </div>
      </div>

      {/* Performance Dashboard */}
      <AnimationPerformanceDashboard
        isVisible={showPerformanceDashboard}
        position="bottom-right"
        updateInterval={1000}
      />
    </>
  );
}
