/**
 * Authentication Hook
 * Provides easy access to authentication state and actions
 */

import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import type { RootState, Dispatch } from '../stores';
import webSocketService from '../services/realtime/websocket';

export const useAuth = () => {
  const dispatch = useDispatch<Dispatch>();
  const authState = useSelector((state: RootState) => state.auth);

  // Initialize authentication on mount
  useEffect(() => {
    if (authState.isAuthenticated && authState.token) {
      dispatch.auth.initializeAuth();
    }
  }, []);

  // Update WebSocket connection when auth state changes
  useEffect(() => {
    if (authState.isAuthenticated && authState.token) {
      webSocketService.updateAuthentication();
    } else {
      webSocketService.disconnect();
    }
  }, [authState.isAuthenticated, authState.token]);

  const login = async (credentials: { email: string; password: string; tenantId?: string }) => {
    try {
      const result = await dispatch.auth.login(credentials);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await dispatch.auth.logoutUser();
      webSocketService.disconnect();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const switchTenant = async (tenantId: string) => {
    try {
      const result = await dispatch.auth.switchTenant(tenantId);
      webSocketService.updateTenantContext();
      return result;
    } catch (error) {
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      return await dispatch.auth.refreshToken();
    } catch (error) {
      throw error;
    }
  };

  const updateUserPreferences = (preferences: Partial<typeof authState.user.preferences>) => {
    dispatch.auth.updateUserPreferences(preferences);
  };

  const checkSession = () => {
    return dispatch.auth.checkSession();
  };

  return {
    // State
    ...authState,
    
    // Computed
    isLoggedIn: authState.isAuthenticated && !!authState.token,
    hasMultipleTenants: authState.availableTenants.length > 1,
    canSwitchTenant: authState.availableTenants.length > 0,
    
    // Actions
    login,
    logout,
    switchTenant,
    refreshToken,
    updateUserPreferences,
    checkSession,
  };
};
