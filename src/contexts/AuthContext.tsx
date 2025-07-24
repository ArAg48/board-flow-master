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
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        
        if (session?.user) {
          // Create or get user profile
          await createUserProfile(session.user);
        } else {
          setUser(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        createUserProfile(session.user);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const createUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (profile) {
        // Profile exists, use it
        const userProfile: User = {
          id: profile.id,
          username: profile.username || 'anonymous',
          role: profile.role || 'manager',
          firstName: profile.full_name?.split(' ')[0] || 'Anonymous',
          lastName: profile.full_name?.split(' ')[1] || 'User',
          email: `${profile.username}@ptl.local`,
          createdAt: profile.created_at,
        };
        setUser(userProfile);
      } else {
        // Create new profile for anonymous user
        const { error } = await supabase
          .from('profiles')
          .insert([
            {
              id: supabaseUser.id,
              full_name: 'Anonymous User',
              username: 'anonymous',
              password: 'anonymous123',
              role: 'manager', // Default to manager for testing
            }
          ]);

        if (!error) {
          const userProfile: User = {
            id: supabaseUser.id,
            username: 'Anonymous User',
            role: 'manager',
            firstName: 'Anonymous',
            lastName: 'User',
            email: supabaseUser.email || 'anonymous@ptl.local',
            createdAt: new Date().toISOString(),
          };
          setUser(userProfile);
        }
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // First sign in anonymously to get a Supabase session
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
      
      if (authError) {
        console.error('Anonymous sign in error:', authError);
        throw authError;
      }

      // Then use database function to authenticate credentials
      const { data, error } = await supabase
        .rpc('authenticate_user', {
          input_username: username,
          input_password: password
        });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const { user_id, user_role } = data[0];
        
        // Create user profile in state
        const userProfile: User = {
          id: user_id,
          username: username,
          role: user_role,
          firstName: username === 'manager' ? 'Manager' : 'Tech',
          lastName: 'User',
          email: username === 'manager' ? 'manager@ptl.local' : 'tech@ptl.local',
          createdAt: new Date().toISOString(),
        };
        setUser(userProfile);
        return true;
      }
      
      // If authentication fails, sign out the anonymous session
      await supabase.auth.signOut();
      return false;
    } catch (error) {
      console.error('Login error:', error);
      await supabase.auth.signOut();
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