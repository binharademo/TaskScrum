import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Alert,
  Container 
} from '@mui/material';
import { 
  Lock as LockIcon,
  CloudOff as CloudOffIcon 
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import LoginModal from './LoginModal';

/**
 * AuthGuard - Protege componentes que requerem autenticação
 * 
 * Props:
 * - children: Componentes a serem renderizados se autenticado
 * - requireAuth: Se true, força autenticação (default: false)
 * - fallback: Componente customizado para quando não autenticado
 * - showLocalOption: Se mostra opção de usar modo local (default: true)
 */
const AuthGuard = ({ 
  children, 
  requireAuth = false, 
  fallback,
  showLocalOption = true 
}) => {
  const { 
    isAuthenticated, 
    isLocalMode, 
    loading, 
    canUseSupabase,
    switchToLocal 
  } = useAuth();
  
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Show loading while checking auth state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px'
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Verificando autenticação...
        </Typography>
      </Box>
    );
  }

  // If Supabase is not configured, always allow access
  if (!canUseSupabase) {
    return children;
  }

  // If auth is not required, always render children
  if (!requireAuth) {
    return children;
  }

  // If in local mode and auth is required, show options
  if (isLocalMode && requireAuth) {
    if (fallback) {
      return fallback;
    }

    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper
          elevation={2}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2
          }}
        >
          <LockIcon 
            sx={{ 
              fontSize: 48, 
              color: 'text.secondary', 
              mb: 2 
            }} 
          />
          
          <Typography variant="h5" gutterBottom>
            Autenticação Necessária
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Esta funcionalidade requer que você esteja logado para salvar os dados na nuvem.
          </Typography>

          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body2">
              <strong>Opções disponíveis:</strong>
            </Typography>
            <Typography variant="body2" component="ul" sx={{ mt: 1, mb: 0 }}>
              <li>Fazer login para salvar dados na nuvem</li>
              {showLocalOption && <li>Continuar no modo local (dados no navegador)</li>}
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={() => setLoginModalOpen(true)}
              size="large"
            >
              Fazer Login
            </Button>

            {showLocalOption && (
              <Button
                variant="outlined"
                onClick={switchToLocal}
                startIcon={<CloudOffIcon />}
                size="large"
              >
                Modo Local
              </Button>
            )}
          </Box>

          <LoginModal
            open={loginModalOpen}
            onClose={() => setLoginModalOpen(false)}
          />
        </Paper>
      </Container>
    );
  }

  // If authenticated, render children
  if (isAuthenticated) {
    return children;
  }

  // If not authenticated and auth is required, show login prompt
  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper
        elevation={2}
        sx={{
          p: 4,
          textAlign: 'center',
          borderRadius: 2
        }}
      >
        <LockIcon 
          sx={{ 
            fontSize: 48, 
            color: 'text.secondary', 
            mb: 2 
          }} 
        />
        
        <Typography variant="h5" gutterBottom>
          Acesso Restrito
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Você precisa estar logado para acessar esta área.
        </Typography>

        <Button
          variant="contained"
          onClick={() => setLoginModalOpen(true)}
          size="large"
        >
          Fazer Login
        </Button>

        <LoginModal
          open={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
        />
      </Paper>
    </Container>
  );
};

export default AuthGuard;