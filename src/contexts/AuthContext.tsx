import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

// User interface for our app
interface AppUser {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  is_active: boolean;
  cw_stamp?: string;
}

interface AuthContextType {
  user: AppUser | null;
  login: (username: string, password: string) => Promise<void>;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in using localStorage
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const storedSession = localStorage.getItem('user_session');
      if (storedSession) {
        const session = JSON.parse(storedSession);
        // Verify the stored token is still valid
        try {
          const response = await apiClient.verifyToken(session.token);
          if (response.valid) {
            setUser(response.user);
          } else {
            localStorage.removeItem('user_session');
          }
        } catch (error) {
          localStorage.removeItem('user_session');
        }
      }
    } catch (error) {
      console.error('Error checking user session:', error);
      localStorage.removeItem('user_session');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);

      // Use PHP API to authenticate
      const response = await apiClient.login(username, password);
      
      if (!response.success) {
        throw new Error('Invalid credentials');
      }

      // Set the auth token for future requests
      apiClient.setToken(response.token);

      // Get user profile from token verification
      const userResponse = await apiClient.verifyToken(response.token);
      
      if (!userResponse.valid) {
        throw new Error('Failed to load user profile');
      }

      setUser(userResponse.user);

      // Store session data
      localStorage.setItem('user_session', JSON.stringify({
        token: response.token,
        user: userResponse.user
      }));

    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // End any active scan sessions for this technician before logging out
      if (user?.id) {
        try {
          const activeSession = await apiClient.getActiveSession(user.id);
          if (activeSession) {
            await apiClient.deactivateSession(activeSession.session_id);
          }
        } catch (error) {
          console.error('Error ending scan session:', error);
        }
      }

      // Clear auth token and user data
      apiClient.removeToken();
      localStorage.removeItem('user_session');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user state even if logout fails
      apiClient.removeToken();
      localStorage.removeItem('user_session');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export type { AppUser as User };