import { createClient } from '@supabase/supabase-js';

// Supabase project configuration
const supabaseUrl = 'https://qjescrzsbjrtofkplyqv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqZXNjcnpzYmpydG9ma3BseXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMTUyNTIsImV4cCI6MjA2ODg5MTI1Mn0.wT-iI7ccKvSfZpoQrWQkdXc1rHxOrrvmNJh6Ima7YUI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
