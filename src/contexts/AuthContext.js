import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, authConfig } from '../config/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('local'); // 'local' | 'supabase'
  const [error, setError] = useState(null);

  // Initialize auth state
  useEffect(() => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setError(error.message);
        } else if (session) {
          setSession(session);
          setUser(session.user);
          setAuthMode('supabase');
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session) {
          setAuthMode('supabase');
        } else if (event === 'SIGNED_OUT') {
          setAuthMode('local');
        }
        
        setLoading(false);
        setError(null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Auth methods
  const signUp = async (email, password, options = {}) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          ...options,
          ...authConfig
        }
      });

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        data,
        needsConfirmation: !data.session 
      };
    } catch (err) {
      const errorMessage = err.message || 'Erro ao criar conta';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      const errorMessage = err.message || 'Erro ao fazer login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = async (provider) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: authConfig.providers[provider] || {}
      });

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      const errorMessage = err.message || `Erro ao fazer login com ${provider}`;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      return { success: true };
    }

    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      // Clear local state
      setUser(null);
      setSession(null);
      setAuthMode('local');

      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Erro ao fazer logout';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Erro ao enviar email de recuperação';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateProfile = async (updates) => {
    if (!isSupabaseConfigured() || !user) {
      throw new Error('User not authenticated');
    }

    setError(null);

    try {
      const { data, error } = await supabase.auth.updateUser(updates);

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      const errorMessage = err.message || 'Erro ao atualizar perfil';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Mode switching
  const switchToSupabase = () => {
    if (isSupabaseConfigured()) {
      setAuthMode('supabase');
    }
  };

  const switchToLocal = () => {
    setAuthMode('local');
  };

  // Computed values
  const isAuthenticated = !!user && authMode === 'supabase';
  const isLocalMode = authMode === 'local' || !isSupabaseConfigured();
  const canUseSupabase = isSupabaseConfigured();

  const value = {
    // Auth state
    user,
    session,
    loading,
    error,
    authMode,

    // Auth methods
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    resetPassword,
    updateProfile,

    // Mode switching
    switchToSupabase,
    switchToLocal,

    // Computed values
    isAuthenticated,
    isLocalMode,
    canUseSupabase,

    // Utilities
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;