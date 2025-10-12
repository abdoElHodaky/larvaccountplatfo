/**
 * Action Icons - Phase 5
 * Animated action and interactive icons with feedback
 */

import React from 'react';
import {
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ShareIcon,
  HeartIcon,
  BookmarkIcon,
  StarIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,

  PaperAirplaneIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  PrinterIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { createLiveIcon, type LiveIconProps } from './APIENDPOINTS';

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
} as const;

// Basic action icons
export const LiveEditIcon = createLiveIcon(PencilIcon, 'bounce');
export const LiveDeleteIcon = createLiveIcon(TrashIcon, 'shake');
export const LiveCopyIcon = createLiveIcon(DocumentDuplicateIcon, 'pulse');
export const LiveShareIcon = createLiveIcon(ShareIcon, 'bounce');
export const LiveDownloadIcon = createLiveIcon(ArrowDownTrayIcon, 'bounce');
export const LiveUploadIcon = createLiveIcon(ArrowUpTrayIcon, 'bounce');
export const LivePrintIcon = createLiveIcon(PrinterIcon, 'pulse');
export const LiveSettingsIcon = createLiveIcon(Cog6ToothIcon, 'rotate');

// Interactive action icons with state
export const LikeIcon: React.FC<LiveIconProps & {
  isLiked: boolean;
  onToggle: () => void;
  count?: number;
}> = ({ isLiked, onToggle, count, size = 'md', className = '', ...props }) => {
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

  const LiveIcon = createLiveIcon(HeartIcon);

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
export const BookmarkIcon: React.FC<LiveIconProps & {
  isBookmarked: boolean;
  onToggle: () => void;
}> = ({ isBookmarked, onToggle, size = 'md', className = '', ...props }) => {
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

  const LiveIcon = createLiveIcon(BookmarkIcon);

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
export const StarRating: React.FC<LiveIconProps & {
  rating: number;
  maxRating?: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
}> = ({ 
  rating, 
  maxRating = 5, 
  onRate, 
  readonly = false,
  size = 'md',
  className = '',
  ...props 
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);
  const LiveIcon = createLiveIcon(StarIcon);

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {Array.from({ length: maxRating }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= (hoverRating || rating);
        
        return (
          <LiveIcon
            key={index}
            size={size}
            color={isFilled ? 'warning' : 'gray'}
            trigger="hover"
            onClick={() => !readonly && onRate?.(starValue)}
            onMouseEnter={() => !readonly && setHoverRating(starValue)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            className={`
              ${!readonly ? 'cursor-pointer' : ''}
              ${isFilled ? 'fill-current' : ''}
            `}
            {...props}
          />
        );
      })}
    </div>
  );
};

// Thumbs up/down component
export const ThumbsVote: React.FC<LiveIconProps & {
  vote: 'up' | 'down' | null;
  onVote: (vote: 'up' | 'down') => void;
  upCount?: number;
  downCount?: number;
}> = ({ vote, onVote, upCount, downCount, size = 'md', className = '', ...props }) => {
  const LiveThumbUpIcon = createLiveIcon(HandThumbUpIcon);
  const LiveThumbDownIcon = createLiveIcon(HandThumbDownIcon);

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
export const SendIcon: React.FC<LiveIconProps & {
  onSend: () => void;
  disabled?: boolean;
}> = ({ onSend, disabled = false, size = 'md', className = '', ...props }) => {
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

  const LiveIcon = createLiveIcon(PaperAirplaneIcon);

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
export const ActionButton: React.FC<LiveIconProps & {
  icon: React.ComponentType<LiveIconProps>;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
}> = ({ 
  icon: Icon, 
  label, 
  onClick, 
  variant = 'secondary',
  disabled = false,
  size = 'md',
  className = '',
  ...props 
}) => {
  const variantStyles = {
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
