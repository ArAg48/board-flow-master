import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api';

export interface User {
  id: string;
  username: string;
  role: 'manager' | 'technician';
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on app start
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Verify token with backend
      apiClient.verifyToken(token)
        .then((response) => {
          if (response.success && response.user) {
            setUser({
              id: response.user.id,
              username: response.user.username,
              role: response.user.role,
              firstName: response.user.first_name,
              lastName: response.user.last_name,
              email: response.user.email || `${response.user.username}@ckt-works.com`,
              createdAt: response.user.created_at || new Date().toISOString(),
            });
          }
        })
        .catch((error) => {
          console.error('Token verification failed:', error);
          localStorage.removeItem('auth_token');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Input validation
      if (!username?.trim() || !password?.trim()) {
        console.error('Username and password are required');
        setIsLoading(false);
        return false;
      }
      
      if (username.trim().length < 3) {
        console.error('Username must be at least 3 characters');
        setIsLoading(false);
        return false;
      }
      
      // Authenticate with PHP backend
      const response = await apiClient.login(username.trim(), password);

      if (response.success && response.user) {
        // Create user profile from backend response
        const userProfile: User = {
          id: response.user.id,
          username: response.user.username,
          role: response.user.role,
          firstName: response.user.first_name,
          lastName: response.user.last_name,
          email: response.user.email || `${response.user.username}@ckt-works.com`,
          createdAt: response.user.created_at || new Date().toISOString(),
        };
        setUser(userProfile);
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    // Deactivate any active sessions before logging out
    if (user?.id) {
      try {
        await apiClient.deactivateSession(user.id);
      } catch (error) {
        console.error('Error during session cleanup:', error);
      }
    }
    
    // Remove token and clear user state
    apiClient.removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};