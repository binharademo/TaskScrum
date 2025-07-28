import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration missing. Running in local mode only.');
}

// Create Supabase client
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        redirectTo: `${window.location.origin}/auth/callback`,
        autoRefreshToken: true,
        // Desabilitar verificação de email
        debug: false
      }
    })
  : null;

// Auth configuration
export const authConfig = {
  redirectTo: `${window.location.origin}/auth/callback`,
  // Desabilitar verificação de email
  emailRedirectTo: `${window.location.origin}/auth/callback`,
  data: {
    email_confirm: false // Não exigir confirmação de email
  },
  providers: {
    google: {
      redirectTo: `${window.location.origin}/auth/callback`
    },
    github: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  }
};

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabase !== null;
};

export default supabase;