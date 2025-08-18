import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { apiClient } from '@/lib/api';

// User interface for our app (derived from Supabase user + our profile)
interface AppUser {
  id: string;
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  role?: string; // 'manager' | 'technician'
  is_active?: boolean;
  cw_stamp?: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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

  // Load the user's profile from Supabase public.profiles
  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, role, is_active, cw_stamp')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setUser((prev) => ({
          id: userId,
          email: prev?.email,
          username: data.username ?? undefined,
          full_name: data.full_name ?? undefined,
          role: (data.role as string) ?? 'technician',
          is_active: data.is_active ?? true,
          cw_stamp: data.cw_stamp ?? null,
        }));
      } else {
        // Fallback minimal user if profile not found
        setUser((prev) => ({ id: userId, email: prev?.email, role: 'technician', is_active: true }));
      }
    } catch (e) {
      // Silent fail – keep minimal user
      setUser((prev) => (prev ? prev : null));
    }
  };

  useEffect(() => {
    // 1) Subscribe to auth state changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const sUser = session?.user ?? null;
      if (sUser) {
        // Set minimal user synchronously
        setUser({ id: sUser.id, email: sUser.email ?? undefined });
        // Fetch profile deferred to avoid deadlocks
        setTimeout(() => loadUserProfile(sUser.id), 0);
      } else {
        setUser(null);
      }
    });

    // 2) Then check for an existing session
    supabase.auth.getSession().then(({ data }) => {
      const sUser = data.session?.user ?? null;
      if (sUser) {
        setUser({ id: sUser.id, email: sUser.email ?? undefined });
        setTimeout(() => loadUserProfile(sUser.id), 0);
      }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // The auth state listener will populate the user and profile
    } catch (err) {
      console.error('Login error:', err);
      throw err;
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
    } finally {
      // Sign out from Supabase regardless
      await supabase.auth.signOut();
      // Clean up any legacy storage
      localStorage.removeItem('user_session');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export type { AppUser as User };
