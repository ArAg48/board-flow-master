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
        try {
          const resp = await apiClient.verifyToken(session.token);
          if (resp && resp.success) {
            if (session.user) {
              setUser(session.user);
            } else {
              // Fallback minimal user shape from token payload
              setUser({
                id: resp.user_id,
                username: session.user?.username || '',
                first_name: '',
                last_name: '',
                full_name: session.user?.full_name || '',
                role: resp.role || 'technician',
                is_active: true,
                cw_stamp: session.user?.cw_stamp,
              });
            }
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

      // Use user object from login response directly
      const loggedInUser: AppUser = {
        id: response.user.id,
        username: response.user.username,
        first_name: response.user.first_name || '',
        last_name: response.user.last_name || '',
        full_name: response.user.full_name || '',
        role: response.user.role,
        is_active: response.user.is_active,
        cw_stamp: response.user.cw_stamp,
      };

      setUser(loggedInUser);

      // Store session data
      localStorage.setItem('user_session', JSON.stringify({
        token: response.token,
        user: loggedInUser,
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