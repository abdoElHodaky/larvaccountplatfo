/**
 * Animated Widget Component - Phase 4
 * Unified dashboard widget with resize, data update, and entrance animations
 */

import React, { useRef, useEffect, forwardRef, useState } from 'react';
import { animations, keyframes, animate, type AnimatedComponentProps } from '../animations';

interface WidgetProps extends AnimatedComponentProps {
  title?: string;
  loading?: boolean;
  error?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  resizable?: boolean;
  onResize?: (size: string) => void;
  refreshing?: boolean;
}

export const Widget = forwardRef<HTMLDivElement, WidgetProps>(({
  children,
  title,
  className = '',
  animationType = 'normal',
  loading = false,
  error,
  size = 'md',
  resizable = false,
  disabled = false,
  onResize,
  refreshing = false,
  ...props
}, ref) => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const config = animations[animationType];

  // Size variants
  const sizes = {
    sm: 'w-full h-48',
    md: 'w-full h-64',
    lg: 'w-full h-80',
    xl: 'w-full h-96'
  };

  // Entrance animation on mount
  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget || animate.shouldReduce()) {
      setIsVisible(true);
      return;
    }

    // Intersection observer for entrance animation
    const observer = animate.onVisible(widget, keyframes.widgetEnter, config);
    setIsVisible(true);

    return () => observer.disconnect();
  }, [config]);

  // Data refresh animation
  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget || !refreshing || animate.shouldReduce()) return;

    const refreshAnimation = animate.run(widget, [
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0.7, transform: 'translateY(-5px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], config);

    return () => refreshAnimation.cancel();
  }, [refreshing, config]);

  // Resize animation
  const handleResize = (newSize: string) => {
    if (!onResize || disabled) return;
    
    const widget = widgetRef.current;
    if (widget && !animate.shouldReduce()) {
      animate.run(widget, keyframes.widgetResize, animations.fast);
    }
    
    onResize(newSize);
  };

  const baseClasses = `
    bg-white rounded-lg shadow-sm border border-gray-200 p-4
    ${sizes[size]}
    ${disabled ? 'opacity-50' : ''}
    ${loading ? 'animate-pulse' : ''}
    ${className}
  `.trim();

  return (
    <div
      ref={ref || widgetRef}
      className={baseClasses}
      style={{ opacity: isVisible ? 1 : 0 }}
      {...props}
    >
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {resizable && (
            <div className="flex gap-1">
              {(['sm', 'md', 'lg', 'xl'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => handleResize(s)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    size === s ? 'bg-blue-500' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  disabled={disabled}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="h-full">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
});

Widget.displayName = 'Widget';

