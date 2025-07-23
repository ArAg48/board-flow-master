import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
    // Check for existing session
    const savedUser = localStorage.getItem('ptl_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // TODO: Replace with actual API call to your backend
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('ptl_user', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      
      // Demo mode - temporary hardcoded users for development
      if (username === 'manager' && password === 'manager123') {
        const demoUser: User = {
          id: '1',
          username: 'manager',
          role: 'manager',
          firstName: 'John',
          lastName: 'Manager',
          email: 'manager@ptl.com',
          createdAt: new Date().toISOString(),
        };
        setUser(demoUser);
        localStorage.setItem('ptl_user', JSON.stringify(demoUser));
        return true;
      }
      
      if (username === 'tech' && password === 'tech123') {
        const demoUser: User = {
          id: '2',
          username: 'tech',
          role: 'technician',
          firstName: 'Jane',
          lastName: 'Technician',
          email: 'tech@ptl.com',
          createdAt: new Date().toISOString(),
        };
        setUser(demoUser);
        localStorage.setItem('ptl_user', JSON.stringify(demoUser));
        return true;
      }
      
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ptl_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};