import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api';

export interface User {
  id: string;
  username: string;
  role: 'manager' | 'technician';
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  cw_stamp: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
    // Check for existing token on mount
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Verify token and get user data
      verifyToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await apiClient.verifyToken(token);
      if (response.success) {
        setUser(response.user);
      } else {
        localStorage.removeItem('auth_token');
        apiClient.removeToken();
      }
    } catch (error) {
      console.error('Token verification error:', error);
      localStorage.removeItem('auth_token');
      apiClient.removeToken();
    } finally {
      setIsLoading(false);
    }
  };

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
      
      // Use PHP backend to authenticate
      const response = await apiClient.login(username.trim(), password);

      if (response.success && response.user) {
        setUser(response.user);
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
    
    apiClient.removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};