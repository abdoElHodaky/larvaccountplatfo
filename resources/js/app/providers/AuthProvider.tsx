/**
 * Authentication Provider - Unified Auth Management
 * Phase 9: Centralized Authentication State
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAlovaInstance } from './DataProvider';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  organizationId?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setOrganization: (organizationId: string) => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Auth Actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'SET_ORGANIZATION'; payload: string };

// Auth Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'SET_ORGANIZATION':
      return {
        ...state,
        user: state.user ? {
          ...state.user,
          organizationId: action.payload,
        } : null,
      };
    default:
      return state;
  }
};

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Context
const AuthContext = createContext<AuthContextType | null>(null);

// Auth Provider Component
const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const alova = useAlovaInstance();
  
  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        dispatch({ type: 'AUTH_ERROR', payload: 'No token found' });
        return;
      }
      
      try {
        dispatch({ type: 'AUTH_START' });
        
        // Verify token and get user data
        const response = await alova.Get('/auth/me').send() as { user: any };
        
        dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth_token');
        dispatch({ type: 'AUTH_ERROR', payload: 'Authentication failed' });
      }
    };
    
    checkAuth();
  }, [alova]);
  
  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await alova.Post('/auth/login', {
        email,
        password,
      }).send() as { token: string; user: any };
      
      // Store token
      localStorage.setItem('auth_token', response.token);
      
      // Store user data
      dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };
  
  // Logout function
  const logout = (): void => {
    try {
      // Call logout endpoint (fire and forget)
      alova.Post('/auth/logout').send().catch(console.error);
    } catch (error) {
      console.error('Logout request failed:', error);
    }
    
    // Clear local storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_organization_id');
    
    // Update state
    dispatch({ type: 'AUTH_LOGOUT' });
  };
  
  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await alova.Get('/auth/me').send() as { user: any };
      
      dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
    } catch (error) {
      console.error('User refresh failed:', error);
      dispatch({ type: 'AUTH_ERROR', payload: 'Failed to refresh user data' });
    }
  };
  
  // Set organization
  const setOrganization = (organizationId: string): void => {
    localStorage.setItem('current_organization_id', organizationId);
    dispatch({ type: 'SET_ORGANIZATION', payload: organizationId });
  };
  
  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshUser,
    setOrganization,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Convenience hooks
export const useUser = () => {
  const { user } = useAuth();
  return user;
};

export const useIsAuthenticated = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

export const useAuthLoading = () => {
  const { isLoading } = useAuth();
  return isLoading;
};

export default AuthProvider;
