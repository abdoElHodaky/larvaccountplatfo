/**
 * PWA Install Prompt Component
 * Simple placeholder component for PWA installation prompts
 */

import React from 'react';

export interface PWAInstallPromptProps {
  className?: string;
}

/**
 * PWA Install Prompt Component
 * Placeholder component for PWA installation functionality
 */
export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ className }) => {
  return (
    <div className={className} style={{ display: 'none' }}>
      {/* PWA Install Prompt - Hidden for now */}
    </div>
  );
};

export default PWAInstallPrompt;
