import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Divider,
  Typography,
  Box,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
  Link,
  IconButton
} from '@mui/material';
import {
  Google as GoogleIcon,
  GitHub as GitHubIcon,
  Visibility,
  VisibilityOff,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const LoginModal = ({ open, onClose }) => {
  const { signIn, signUp, signInWithProvider, resetPassword, error, loading, clearError } = useAuth();
  
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'reset'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (open) {
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: ''
      });
      setLocalError('');
      setSuccess('');
      clearError();
    }
  }, [open, clearError]);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setLocalError('');
    clearError();
  };

  const handleModeChange = (event, newMode) => {
    setMode(newMode);
    setLocalError('');
    setSuccess('');
    clearError();
  };

  const validateForm = () => {
    if (!formData.email || !formData.email.includes('@')) {
      setLocalError('Email válido é obrigatório');
      return false;
    }

    if (mode !== 'reset' && (!formData.password || formData.password.length < 6)) {
      setLocalError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (mode === 'signup') {
      if (formData.password !== formData.confirmPassword) {
        setLocalError('Senhas não coincidem');
        return false;
      }
      if (!formData.fullName.trim()) {
        setLocalError('Nome completo é obrigatório');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) return;

    setLocalError('');
    setSuccess('');

    try {
      if (mode === 'login') {
        const result = await signIn(formData.email, formData.password);
        if (result.success) {
          onClose();
        }
      } else if (mode === 'signup') {
        const result = await signUp(formData.email, formData.password, {
          data: {
            full_name: formData.fullName
          }
        });
        
        if (result.success) {
          if (result.needsConfirmation) {
            setSuccess('Verifique seu email para confirmar a conta');
          } else {
            onClose();
          }
        }
      } else if (mode === 'reset') {
        const result = await resetPassword(formData.email);
        if (result.success) {
          setSuccess('Email de recuperação enviado! Verifique sua caixa de entrada.');
        }
      }
    } catch (err) {
      setLocalError(err.message || 'Erro inesperado');
    }
  };

  const handleSocialLogin = async (provider) => {
    setLocalError('');
    clearError();
    
    try {
      const result = await signInWithProvider(provider);
      if (result.success) {
        // OAuth redirect will handle the rest
        onClose();
      }
    } catch (err) {
      setLocalError(err.message || `Erro ao fazer login com ${provider}`);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'signup': return 'Criar Conta';
      case 'reset': return 'Recuperar Senha';
      default: return 'Entrar';
    }
  };

  const getSubmitText = () => {
    switch (mode) {
      case 'signup': return 'Criar Conta';
      case 'reset': return 'Enviar Email';
      default: return 'Entrar';
    }
  };

  const displayError = localError || error;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" component="div">
            {getTitle()}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3 }}>
        {/* Mode Tabs */}
        <Tabs 
          value={mode} 
          onChange={handleModeChange}
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Entrar" value="login" />
          <Tab label="Criar Conta" value="signup" />
          <Tab label="Recuperar" value="reset" />
        </Tabs>

        {/* Error/Success Messages */}
        {displayError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {displayError}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Form */}
        <Stack spacing={2} component="form" onSubmit={handleSubmit}>
          {/* Full Name (signup only) */}
          {mode === 'signup' && (
            <TextField
              label="Nome Completo"
              value={formData.fullName}
              onChange={handleInputChange('fullName')}
              required
              fullWidth
              autoFocus
            />
          )}

          {/* Email */}
          <TextField
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            required
            fullWidth
            autoFocus={mode !== 'signup'}
          />

          {/* Password (not for reset) */}
          {mode !== 'reset' && (
            <TextField
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange('password')}
              required
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                )
              }}
              helperText={mode === 'signup' ? 'Mínimo 6 caracteres' : ''}
            />
          )}

          {/* Confirm Password (signup only) */}
          {mode === 'signup' && (
            <TextField
              label="Confirmar Senha"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              required
              fullWidth
            />
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
            sx={{ mt: 2 }}
          >
            {loading ? 'Aguarde...' : getSubmitText()}
          </Button>
        </Stack>

        {/* Social Login (not for reset) */}
        {mode !== 'reset' && (
          <>
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                OU
              </Typography>
            </Divider>

            <Stack spacing={1}>
              <Button
                variant="outlined"
                size="large"
                startIcon={<GoogleIcon />}
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                fullWidth
              >
                Continuar com Google
              </Button>

              <Button
                variant="outlined"
                size="large"
                startIcon={<GitHubIcon />}
                onClick={() => handleSocialLogin('github')}
                disabled={loading}
                fullWidth
              >
                Continuar com GitHub
              </Button>
            </Stack>
          </>
        )}

        {/* Mode Switch Links */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          {mode === 'login' && (
            <Typography variant="body2">
              Não tem conta?{' '}
              <Link 
                component="button" 
                variant="body2"
                onClick={() => setMode('signup')}
              >
                Criar conta
              </Link>
              {' • '}
              <Link 
                component="button" 
                variant="body2"
                onClick={() => setMode('reset')}
              >
                Esqueci a senha
              </Link>
            </Typography>
          )}
          
          {mode === 'signup' && (
            <Typography variant="body2">
              Já tem conta?{' '}
              <Link 
                component="button" 
                variant="body2"
                onClick={() => setMode('login')}
              >
                Fazer login
              </Link>
            </Typography>
          )}
          
          {mode === 'reset' && (
            <Typography variant="body2">
              <Link 
                component="button" 
                variant="body2"
                onClick={() => setMode('login')}
              >
                Voltar ao login
              </Link>
            </Typography>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;