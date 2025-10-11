/**
 * App Providers Composition - Unified Provider Stack
 * Phase 9: Complete Provider Integration
 */

import React, { ReactNode } from 'react';
import { ThemeProvider } from '../../shared/providers/ThemeProvider';
import DataProvider from './DataProvider';
import AuthProvider from './AuthProvider';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Composed App Providers
 * Provides the complete application context stack in the correct order
 */
const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <DataProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </DataProvider>
    </ThemeProvider>
  );
};

export default AppProviders;
