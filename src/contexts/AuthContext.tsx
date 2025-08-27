import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

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
      const storedSession = localStorage.getItem('supabase_user_session');
      if (storedSession) {
        const session = JSON.parse(storedSession);
        // Load the full profile using the stored session
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.userId)
          .single();

        if (!error && profile) {
          const nameParts = profile.full_name?.split(' ') || [];
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          setUser({
            id: profile.id,
            username: profile.username,
            first_name: firstName,
            last_name: lastName,
            full_name: profile.full_name || '',
            role: profile.role,
            is_active: profile.is_active,
            cw_stamp: profile.cw_stamp
          });
        } else {
          // If profile fetch fails, clear invalid session
          localStorage.removeItem('supabase_user_session');
        }
      }
    } catch (error) {
      console.error('Error checking user session:', error);
      // Clear invalid session on error
      localStorage.removeItem('supabase_user_session');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (authUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      if (profile) {
        // Split full_name into first_name and last_name
        const nameParts = profile.full_name?.split(' ') || [];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        setUser({
          id: profile.id,
          username: profile.username,
          first_name: firstName,
          last_name: lastName,
          full_name: profile.full_name || '',
          role: profile.role,
          is_active: profile.is_active,
          cw_stamp: profile.cw_stamp
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);

      // Use Supabase function to authenticate
      const { data, error } = await supabase.rpc('authenticate_user', {
        input_username: username,
        input_password: password
      });

      if (error || !data || data.length === 0) {
        throw new Error('Invalid credentials');
      }

      const profile = data[0];
      
      // Redirect to appropriate dashboard based on role
      const redirectPath = profile.role === 'customer' ? '/app/board-lookup' : '/app/dashboard';

      // Split full_name into first_name and last_name
      const nameParts = profile.full_name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setUser({
        id: profile.id,
        username: profile.username,
        first_name: firstName,
        last_name: lastName,
        full_name: profile.full_name || '',
        role: profile.role,
        is_active: profile.is_active,
        cw_stamp: profile.cw_stamp
      });

      // Store a simple token for session persistence
      localStorage.setItem('supabase_user_session', JSON.stringify({
        userId: profile.id,
        username: profile.username,
        role: profile.role
      }));

      // Redirect based on role
      if (profile.role === 'customer') {
        window.location.href = '/app/board-lookup';
      } else {
        window.location.href = '/app/dashboard';
      }

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
        const { data: activeSessions, error: sessionsError } = await supabase
          .from('scan_sessions')
          .select('id, start_time, duration_minutes, actual_duration_minutes')
          .eq('technician_id', user.id)
          .eq('is_active', true);

        if (!sessionsError && activeSessions && activeSessions.length > 0) {
          const now = new Date();
          // Finalize each active session properly using the save_session RPC
          await Promise.all(
            activeSessions.map(async (s) => {
              const start = new Date(s.start_time);
              const totalDurationMinutes = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 60000));
              const activeDurationMinutes = s.actual_duration_minutes || 0; // Use existing accumulated active time

              // Mark session completed using the RPC function
              await supabase.rpc('save_session', {
                p_session_id: s.id,
                p_technician_id: user.id,
                p_ptl_order_id: null, // Will be filled by existing session data
                p_session_data: {}, // Will preserve existing session data
                p_status: 'completed',
                p_paused_at: null,
                p_break_started_at: null,
                p_duration_minutes: totalDurationMinutes,
                p_active_duration_minutes: activeDurationMinutes,
                p_session_scanned_count: 0, // Will preserve existing counts
                p_session_pass_count: 0,
                p_session_fail_count: 0,
                p_total_scanned: 0,
                p_pass_count: 0,
                p_fail_count: 0
              });
            })
          );
        }
      }

      localStorage.removeItem('supabase_user_session');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user state even if logout fails
      localStorage.removeItem('supabase_user_session');
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