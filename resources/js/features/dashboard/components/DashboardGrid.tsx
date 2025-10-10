/**
 * Dashboard Grid Component
 * Responsive grid layout for dashboard widgets
 */

import React, { useCallback, useMemo } from 'react';

// Types
interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  size: {
    width: number;
    height: number;
  };
  position: {
    x: number;
    y: number;
  };
}

interface DashboardGridProps {
  widgets: DashboardWidget[];
  onWidgetMove?: (widgetId: string, newPosition: { x: number; y: number }) => void;
  onWidgetResize?: (widgetId: string, newSize: { width: number; height: number }) => void;
  onWidgetRemove?: (widgetId: string) => void;
  isEditable?: boolean;
  className?: string;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  widgets,
  onWidgetMove: _onWidgetMove,
  onWidgetResize: _onWidgetResize,
  onWidgetRemove,
  isEditable = false,
  className = ''
}) => {
  // Sort widgets by position for consistent rendering
  const sortedWidgets = useMemo(() => {
    return [...widgets].sort((a, b) => {
      if (a.position.y !== b.position.y) {
        return a.position.y - b.position.y;
      }
      return a.position.x - b.position.x;
    });
  }, [widgets]);

  // Render widget content
  const renderWidget = useCallback((widget: DashboardWidget, _index: number) => {
    const WidgetComponent = widget.component;
    
    return (
      <div
        key={widget.id}
        className="dashboard-widget"
        style={{
          gridColumn: `span ${widget.size.width}`,
          gridRow: `span ${widget.size.height}`,
        }}
      >
        {isEditable && (
          <div className="widget-controls">
            <div className="drag-handle" title="Drag to move">
              ⋮⋮
            </div>
            {onWidgetRemove && (
              <button
                onClick={() => onWidgetRemove(widget.id)}
                className="remove-widget"
                title="Remove widget"
              >
                ×
              </button>
            )}
          </div>
        )}
        
        <div className="widget-content">
          <h3 className="widget-title">{widget.title}</h3>
          <div className="widget-body">
            <WidgetComponent {...(widget.props || {})} />
          </div>
        </div>
      </div>
    );
  }, [isEditable, onWidgetRemove]);

  // Simple grid layout
  return (
    <div className={`dashboard-grid ${isEditable ? 'editable' : 'static'} ${className}`}>
      {sortedWidgets.map((widget, index) => renderWidget(widget, index))}
    </div>
  );
};

export default DashboardGrid;
