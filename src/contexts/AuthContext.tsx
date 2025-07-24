import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

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
  session: Session | null;
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
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        
        // Don't fetch profile for anonymous sessions - we handle user data differently
        if (!session) {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Use database function to authenticate credentials first
      const { data, error } = await supabase
        .rpc('authenticate_user', {
          input_username: username,
          input_password: password
        });

      if (error) {
        console.error('Authentication error:', error);
        setIsLoading(false);
        return false;
      }
      
      if (data && data.length > 0) {
        const { user_id, user_role } = data[0];
        
        // Sign in anonymously to create a session
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
        
        if (authError) {
          console.error('Session creation error:', authError);
          setIsLoading(false);
          return false;
        }

        // Create user profile in state using the authenticated user data
        const userProfile: User = {
          id: user_id,
          username: username,
          role: user_role,
          firstName: username === 'manager' ? 'Manager' : username.charAt(0).toUpperCase() + username.slice(1),
          lastName: 'User',
          email: `${username}@ptl.local`,
          createdAt: new Date().toISOString(),
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
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};