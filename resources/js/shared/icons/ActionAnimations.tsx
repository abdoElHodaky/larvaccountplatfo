/**
 * Action Icons - Phase 5
 * Animated action and interactive icons with feedback
 */

import React from 'react';
import { createLiveIcon } from './CreateLiveIcon';
import type { IconProps } from './ICONSIZES';

// Action-specific animations
export const actionAnimations = {
  edit: [
    { transform: 'rotate(0deg) scale(1)' },
    { transform: 'rotate(-5deg) scale(1.1)' },
    { transform: 'rotate(0deg) scale(1)' }
  ],
  delete: [
    { transform: 'scale(1)' },
    { transform: 'scale(1.2)' },
    { transform: 'scale(0.9)' },
    { transform: 'scale(1)' }
  ],
  copy: [
    { transform: 'translateX(0) translateY(0)' },
    { transform: 'translateX(2px) translateY(-2px)' },
    { transform: 'translateX(0) translateY(0)' }
  ],
  share: [
    { transform: 'scale(1) rotate(0deg)' },
    { transform: 'scale(1.1) rotate(10deg)' },
    { transform: 'scale(1) rotate(0deg)' }
  ],
  like: [
    { transform: 'scale(1)' },
    { transform: 'scale(1.3)' },
    { transform: 'scale(1)' }
  ],
  bookmark: [
    { transform: 'translateY(0)' },
    { transform: 'translateY(-3px)' },
    { transform: 'translateY(0)' }
  ],
  send: [
    { transform: 'translateX(0) rotate(0deg)' },
    { transform: 'translateX(4px) rotate(15deg)' },
    { transform: 'translateX(0) rotate(0deg)' }
  ],
  download: [
    { transform: 'translateY(0)' },
    { transform: 'translateY(3px)' },
    { transform: 'translateY(0)' }
  ],
  upload: [
    { transform: 'translateY(0)' },
    { transform: 'translateY(-3px)' },
    { transform: 'translateY(0)' }
  ]
};

// Basic action icons
export const ActionEditIcon = createLiveIcon('action-edit', 'bounce');
export const ActionDeleteIcon = createLiveIcon('action-delete', 'shake');
export const ActionCopyIcon = createLiveIcon('action-copy', 'pulse');
export const ActionShareIcon = createLiveIcon('action-share', 'bounce');
export const ActionDownloadIcon = createLiveIcon('action-download', 'bounce');
export const ActionUploadIcon = createLiveIcon('action-upload', 'bounce');
export const ActionPrintIcon = createLiveIcon('action-print', 'pulse');
export const ActionSettingsIcon = createLiveIcon('action-settings', 'rotate');

// Additional action icons
export const ActionAddIcon = createLiveIcon('action-add', 'bounce'); // Placeholder - using PencilIcon for now
export const ActionViewIcon = createLiveIcon('action-view', 'bounce'); // Placeholder - using ShareIcon for now

// Live icon aliases (for backward compatibility)
export const LiveEditIcon = ActionEditIcon;
export const LiveDeleteIcon = ActionDeleteIcon;
export const LiveShareIcon = ActionShareIcon;
export const LiveCopyIcon = ActionCopyIcon;

// Interactive action icons with state
export const LikeIcon = ({ isLiked, onToggle, count, size = 'md', className = '', ...props }: IconProps & {
  isLiked: boolean;
  onToggle: () => void;
  count?: number;
}): JSX.Element => {
  const iconRef = React.useRef<SVGSVGElement>(null);

  const handleClick = () => {
    const icon = iconRef.current;
    if (icon) {
      icon.animate(actionAnimations.like, {
        duration: 300,
        easing: 'ease-out'
      });
    }
    onToggle();
  };

  const LiveIcon = createLiveIcon('action-edit'); // Using edit icon as placeholder for like functionality

  return (
    <div className="flex items-center space-x-1">
      <LiveIcon
        ref={iconRef}
        size={size}
        color={isLiked ? 'danger' : 'gray'}
        onClick={handleClick}
        className={`cursor-pointer ${isLiked ? 'fill-current' : ''} ${className}`}
        {...props}
      />
      {count !== undefined && (
        <span className={`text-sm ${isLiked ? 'text-danger-600' : 'text-gray-600'}`}>
          {count}
        </span>
      )}
    </div>
  );
};

// Bookmark toggle icon
export const LocalBookmarkIcon = ({ isBookmarked, onToggle, size = 'md', className = '', ...props }: IconProps & {
  isBookmarked: boolean;
  onToggle: () => void;
}): JSX.Element => {
  const iconRef = React.useRef<SVGSVGElement>(null);

  const handleClick = () => {
    const icon = iconRef.current;
    if (icon) {
      icon.animate(actionAnimations.bookmark, {
        duration: 200,
        easing: 'ease-out'
      });
    }
    onToggle();
  };

  const LiveIcon = createLiveIcon('bookmark');

  return (
    <LiveIcon
      ref={iconRef}
      size={size}
      color={isBookmarked ? 'warning' : 'gray'}
      onClick={handleClick}
      className={`cursor-pointer ${isBookmarked ? 'fill-current' : ''} ${className}`}
      {...props}
    />
  );
};

// Star rating component
export const StarRating = ({
  rating,
  maxRating = 5,
  onRate,
  readonly = false,
  size = 'md',
  className = '',
  ...props
}: IconProps & {
  rating: number;
  maxRating?: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
}): JSX.Element => {
  const [hoverRating, setHoverRating] = React.useState(0);
  const LiveIcon = createLiveIcon('star');

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {Array.from({ length: maxRating }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= (hoverRating || rating);

        return (
          <span
            role="button"
            tabIndex={readonly ? undefined : 0}
            onMouseEnter={() => !readonly && setHoverRating(starValue)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            onClick={() => !readonly && onRate?.(starValue)}
            onKeyDown={(e) => {
              if (!readonly && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onRate?.(starValue);
              }
            }}
            className={!readonly ? 'cursor-pointer' : ''}
          >
            <LiveIcon
              key={index}
              size={size}
              color={isFilled ? 'warning' : 'gray'}
              trigger="hover"
              className={isFilled ? 'fill-current' : ''}
              {...props}
            />
          </span>
        );
      })}
    </div>
  );
};

// Thumbs up/down component
export const ThumbsVote = ({ vote, onVote, upCount, downCount, size = 'md', className = '', ...props }: IconProps & {
  vote: 'up' | 'down' | null;
  onVote: (vote: 'up' | 'down') => void;
  upCount?: number;
  downCount?: number;
}): JSX.Element => {
  const LiveThumbUpIcon = createLiveIcon('hand-thumb-up');
  const LiveThumbDownIcon = createLiveIcon('hand-thumb-down');

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <div className="flex items-center space-x-1">
        <LiveThumbUpIcon
          size={size}
          color={vote === 'up' ? 'success' : 'gray'}
          trigger="click"
          onClick={() => onVote('up')}
          className={`cursor-pointer ${vote === 'up' ? 'fill-current' : ''}`}
          {...props}
        />
        {upCount !== undefined && (
          <span className={`text-sm ${vote === 'up' ? 'text-success-600' : 'text-gray-600'}`}>
            {upCount}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-1">
        <LiveThumbDownIcon
          size={size}
          color={vote === 'down' ? 'danger' : 'gray'}
          trigger="click"
          onClick={() => onVote('down')}
          className={`cursor-pointer ${vote === 'down' ? 'fill-current' : ''}`}
          {...props}
        />
        {downCount !== undefined && (
          <span className={`text-sm ${vote === 'down' ? 'text-danger-600' : 'text-gray-600'}`}>
            {downCount}
          </span>
        )}
      </div>
    </div>
  );
};

// Send message icon with animation
export const SendIcon = ({ onSend, disabled = false, size = 'md', className = '', ...props }: IconProps & {
  onSend: () => void;
  disabled?: boolean;
}): JSX.Element => {
  const iconRef = React.useRef<SVGSVGElement>(null);

  const handleSend = () => {
    if (disabled) return;

    const icon = iconRef.current;
    if (icon) {
      icon.animate(actionAnimations.send, {
        duration: 300,
        easing: 'ease-out'
      });
    }
    onSend();
  };

  const LiveIcon = createLiveIcon('paper-airplane');

  return (
    <LiveIcon
      ref={iconRef}
      size={size}
      color={disabled ? 'gray' : 'primary'}
      onClick={handleSend}
      className={`
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:text-primary-700'}
        ${className}
      `}
      {...props}
    />
  );
};

// Action button with icon and label
export const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  variant = 'secondary',
  disabled = false,
  size = 'md',
  className = '',
  ...props
}: IconProps & {
  icon: React.ComponentType<IconProps>;
  label: string;
  onClick: () => void;
  variant: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
}): JSX.Element => {
  const variantStyles: Record<'primary' | 'secondary' | 'danger' | 'success', string> = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    danger: 'bg-danger-500 hover:bg-danger-600 text-white',
    success: 'bg-success-500 hover:bg-success-600 text-white'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium
        transition-colors duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : variantStyles[variant]}
        ${className}
      `}
    >
      <Icon
        size={size}
        trigger="click"
        animated={!disabled}
        {...props}
      />
      <span>{label}</span>
    </button>
  );
};