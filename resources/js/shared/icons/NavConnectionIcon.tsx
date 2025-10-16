import React from 'react';

interface NavConnectionIconProps {
  className?: string;
  size?: number;
}

export const NavConnectionIcon: React.FC<NavConnectionIconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13 16H21L19 18M19 18L21 20M19 18V14M8 8H16M8 12H16M8 16H11M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default NavConnectionIcon;
