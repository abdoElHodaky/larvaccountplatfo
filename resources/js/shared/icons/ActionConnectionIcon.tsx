/**
 * Action Connection Icons
 * Action icons for the application
 */

import React from 'react';
import { 
  HeartIcon,
  BookmarkIcon as HeroBookmarkIcon,
  StarIcon,
  HandThumbUpIcon,
  PaperAirplaneIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  ClipboardIcon
} from '@heroicons/react/24/outline';

export interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

export const LikeIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <HeartIcon className={className} {...props} />
);

export const BookmarkIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <HeroBookmarkIcon className={className} {...props} />
);

export const StarRating: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <StarIcon className={className} {...props} />
);

export const ThumbsVote: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <HandThumbUpIcon className={className} {...props} />
);

export const SendIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <PaperAirplaneIcon className={className} {...props} />
);

export const ActionButton: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <PaperAirplaneIcon className={className} {...props} />
);

export const LiveEditIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <PencilIcon className={className} {...props} />
);

export const LiveDeleteIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <TrashIcon className={className} {...props} />
);

export const LiveShareIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <ShareIcon className={className} {...props} />
);

export const LiveCopyIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <ClipboardIcon className={className} {...props} />
);
