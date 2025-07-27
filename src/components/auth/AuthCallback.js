import React, { useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { supabase } from '../../config/supabase';

/**
 * AuthCallback - Handles OAuth redirect callbacks
 * This component should be rendered when the URL contains auth callback
 */
const AuthCallback = () => {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          // Redirect to home with error
          window.location.href = '/?auth_error=' + encodeURIComponent(error.message);
          return;
        }

        // If session exists, redirect to home
        if (data.session) {
          console.log('Auth callback successful:', data.session.user.email);
          window.location.href = '/';
        } else {
          // No session, redirect to home
          window.location.href = '/';
        }
      } catch (err) {
        console.error('Unexpected auth callback error:', err);
        window.location.href = '/?auth_error=' + encodeURIComponent('Erro inesperado durante autenticação');
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2
      }}
    >
      <CircularProgress size={40} />
      <Typography variant="body1" color="text.secondary">
        Finalizando autenticação...
      </Typography>
    </Box>
  );
};

export default AuthCallback;