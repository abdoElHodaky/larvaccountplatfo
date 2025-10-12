/**
 * Animated List Component - Phase 4
 * Unified list with stagger, add/remove, and reorder animations
 */

import React, { useRef, useEffect, forwardRef, useState, useCallback } from 'react';
import { animations, keyframes, animate, type AnimatedComponentProps } from '../animations';

interface ListItem {
  id: string | number;
  content: React.ReactNode;
}

interface ListProps extends AnimatedComponentProps {
  items: ListItem[];
  stagger?: boolean;
  staggerDelay?: number;
  onItemAdd?: (item: ListItem) => void;
  onItemRemove?: (id: string | number) => void;
  onItemReorder?: (fromIndex: number, toIndex: number) => void;
  variant?: 'default' | 'cards' | 'compact';
}

export const List = forwardRef<HTMLDivElement, ListProps>(({
  items,
  className = '',
  animationType = 'normal',
  stagger = true,
  staggerDelay = 100,
  disabled = false,
  onItemAdd,
  onItemRemove,
  onItemReorder,
  variant = 'default',
  ...props
}, ref) => {
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string | number, HTMLElement>>(new Map());
  const [visibleItems, setVisibleItems] = useState<Set<string | number>>(new Set());
  const config = animations[animationType];

  // Variant styles
  const variants = {
    default: 'space-y-2',
    cards: 'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    compact: 'space-y-1'
  };

  // Stagger entrance animation
  useEffect(() => {
    if (!stagger || animate.shouldReduce()) {
      setVisibleItems(new Set(items.map(item => item.id)));
      return;
    }

    const elements = items
      .map(item => itemRefs.current.get(item.id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    animate.stagger(elements, keyframes.listEnter, config, staggerDelay)
      .then(() => {
        setVisibleItems(new Set(items.map(item => item.id)));
      });
  }, [items.length, stagger, staggerDelay, config]);

  // Item removal animation
  const handleRemove = useCallback(async (id: string | number) => {
    if (!onItemRemove || disabled) return;

    const element = itemRefs.current.get(id);
    if (element && !animate.shouldReduce()) {
      await animate.run(element, keyframes.listExit, animations.fast).finished;
    }

    onItemRemove(id);
  }, [onItemRemove, disabled]);

  // Item addition animation
  const handleAdd = useCallback((item: ListItem) => {
    if (!onItemAdd || disabled) return;

    onItemAdd(item);

    // Animate new item after it's added to DOM
    setTimeout(() => {
      const element = itemRefs.current.get(item.id);
      if (element && !animate.shouldReduce()) {
        animate.run(element, keyframes.listEnter, config);
      }
    }, 0);
  }, [onItemAdd, disabled, config]);

  // Drag and drop for reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (disabled) return;
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    if (disabled || !onItemReorder) return;
    
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (fromIndex !== toIndex) {
      onItemReorder(fromIndex, toIndex);
    }
  };

  const baseClasses = `
    ${variants[variant]}
    ${disabled ? 'opacity-50' : ''}
    ${className}
  `.trim();

  return (
    <div
      ref={ref || listRef}
      className={baseClasses}
      {...props}
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          ref={(el) => {
            if (el) {
              itemRefs.current.set(item.id, el);
            } else {
              itemRefs.current.delete(item.id);
            }
          }}
          className={`
            transition-all duration-200
            ${visibleItems.has(item.id) ? 'opacity-100' : 'opacity-0'}
            ${onItemReorder && !disabled ? 'cursor-move' : ''}
          `}
          draggable={onItemReorder && !disabled}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
        >
          <div className="relative group">
            {item.content}
            
            {/* Remove button */}
            {onItemRemove && !disabled && (
              <button
                onClick={() => handleRemove(item.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 
                         bg-red-500 text-white rounded-full w-6 h-6 flex items-center 
                         justify-center text-sm hover:bg-red-600 transition-all"
              >
                ×
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

List.displayName = 'List';

