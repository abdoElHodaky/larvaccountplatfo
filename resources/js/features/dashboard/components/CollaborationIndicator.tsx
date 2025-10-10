/**
 * Collaboration Indicator Component
 * Shows active users and collaboration status
 */

import React from 'react';

interface ActiveUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: Date;
}

interface CollaborationIndicatorProps {
  activeUsers?: ActiveUser[];
  currentUserId?: string;
  showUserCount?: boolean;
  maxVisibleUsers?: number;
  className?: string;
  onUserClick?: (user: ActiveUser) => void;
}

export const CollaborationIndicator: React.FC<CollaborationIndicatorProps> = ({
  activeUsers = [],
  currentUserId,
  showUserCount = true,
  maxVisibleUsers = 5,
  className = '',
  onUserClick
}) => {
  // Filter out current user and sort by status
  const otherUsers = activeUsers
    .filter(user => user.id !== currentUserId)
    .sort((a, b) => {
      const statusOrder = { online: 0, away: 1, offline: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });

  const visibleUsers = otherUsers.slice(0, maxVisibleUsers);
  const hiddenCount = Math.max(0, otherUsers.length - maxVisibleUsers);

  if (otherUsers.length === 0) {
    return (
      <div className={`collaboration-indicator empty ${className}`}>
        <span className="no-users-indicator">👤</span>
        <span className="no-users-text">Working alone</span>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return '🟢';
      case 'away': return '🟡';
      case 'offline': return '⚫';
      default: return '⚫';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`collaboration-indicator ${className}`}>
      <div className="active-users">
        {visibleUsers.map((user) => (
          <div
            key={user.id}
            className={`user-avatar ${user.status}`}
            onClick={() => onUserClick?.(user)}
            title={`${user.name} (${user.status})`}
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <div className="avatar-initials">
                {getInitials(user.name)}
              </div>
            )}
            <span className="status-indicator">
              {getStatusIcon(user.status)}
            </span>
          </div>
        ))}
        
        {hiddenCount > 0 && (
          <div className="hidden-users-count" title={`${hiddenCount} more users`}>
            +{hiddenCount}
          </div>
        )}
      </div>

      {showUserCount && (
        <div className="user-count">
          <span className="count-text">
            {otherUsers.length} {otherUsers.length === 1 ? 'user' : 'users'} active
          </span>
        </div>
      )}
    </div>
  );
};

export default CollaborationIndicator;
