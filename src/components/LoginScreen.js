import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  Divider,
  LinearProgress,
  Fade,
  Zoom,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  PersonAdd as SignUpIcon,
  Cloud as CloudIcon,
  Security as SecurityIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

// Integração com autenticação
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../config/supabase';

const LoginScreen = ({ open, onClose, onLoginSuccess, onSignUpSuccess }) => {
  const { signIn, signUp, user } = useAuth();
  const [isLogin, setIsLogin] = useState(true); // true = login, false = cadastro
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Campos do formulário
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });

  // Função para alternar entre login e cadastro
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: ''
    });
  };

  // Função para atualizar campos do formulário
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpar erros quando usuário começar a digitar
    if (error) setError('');
    if (success) setSuccess('');
  };

  // Validações simples
  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('📧 Por favor, digite seu email');
      return false;
    }
    
    if (!formData.email.includes('@')) {
      setError('📧 Email deve ter @ (exemplo: joao@empresa.com)');
      return false;
    }
    
    if (!formData.password.trim()) {
      setError('🔒 Por favor, digite sua senha');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('🔒 Senha deve ter pelo menos 6 caracteres');
      return false;
    }
    
    // Validações específicas para cadastro
    if (!isLogin) {
      if (!formData.name.trim()) {
        setError('👤 Por favor, digite seu nome');
        return false;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setError('🔒 As senhas não coincidem');
        return false;
      }
    }
    
    return true;
  };

  // Função para enviar formulário
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    // Verificar se Supabase está configurado
    if (!isSupabaseConfigured()) {
      setError('❌ Sistema de autenticação não configurado. Usando modo local temporariamente.');
      setTimeout(() => {
        onClose();
      }, 3000);
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      let result;
      
      if (isLogin) {
        // Fazer login
        console.log('🔐 Tentando fazer login:', formData.email);
        result = await signIn(formData.email, formData.password);
        
        if (result.success) {
          setSuccess('✅ Login realizado com sucesso! Bem-vindo de volta!');
          setTimeout(() => {
            onLoginSuccess({
              email: formData.email,
              name: result.data?.user?.user_metadata?.full_name || formData.email.split('@')[0],
              user: result.data?.user
            });
          }, 1500);
        } else {
          // Mensagens de erro mais amigáveis
          let friendlyError = result.error;
          if (result.error.includes('Invalid login credentials')) {
            friendlyError = '❌ Email ou senha incorretos. Verifique seus dados e tente novamente.';
          } else if (result.error.includes('Too many requests')) {
            friendlyError = '⏳ Muitas tentativas. Aguarde alguns minutos e tente novamente.';
          }
          setError(friendlyError);
        }
        
      } else {
        // Criar conta
        console.log('👤 Tentando criar conta:', formData.email);
        result = await signUp(formData.email, formData.password, {
          data: {
            full_name: formData.name,
            display_name: formData.name
          }
        });
        
        if (result.success) {
          // Verificação de email desabilitada - sempre vai direto para o login
          setSuccess('✅ Conta criada com sucesso! Você já está logado!');
          setTimeout(() => {
            onSignUpSuccess({
              email: formData.email,
              name: formData.name,
              user: result.data?.user
            });
          }, 1500);
        } else {
          // Mensagens de erro mais amigáveis
          let friendlyError = result.error;
          if (result.error.includes('User already registered')) {
            friendlyError = '📧 Este email já está em uso. Tente fazer login ou use outro email.';
          } else if (result.error.includes('Password should be at least')) {
            friendlyError = '🔒 Senha muito fraca. Use pelo menos 6 caracteres com letras e números.';
          } else if (result.error.includes('Invalid email')) {
            friendlyError = '📧 Email inválido. Verifique o formato (exemplo: usuario@empresa.com).';
          }
          setError(friendlyError);
        }
      }
      
    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
      setError('❌ Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '60vh'
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Cabeçalho */}
        <Box sx={{ 
          bgcolor: 'primary.main', 
          color: 'white', 
          p: 3, 
          textAlign: 'center',
          position: 'relative'
        }}>
          <CloudIcon sx={{ fontSize: 60, mb: 1 }} />
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {isLogin ? '🔐 Entrar na Sua Conta' : '🎉 Criar Nova Conta'}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            {isLogin ? 
              'Digite suas informações para acessar a nuvem' : 
              'Preencha os dados abaixo para começar'
            }
          </Typography>
          
          {loading && (
            <LinearProgress 
              sx={{ 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                right: 0,
                bgcolor: 'rgba(255,255,255,0.2)'
              }} 
            />
          )}
        </Box>

        {/* Conteúdo Principal */}
        <Box sx={{ p: 4 }}>
          {/* Alertas */}
          {error && (
            <Fade in>
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            </Fade>
          )}
          
          {success && (
            <Fade in>
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            </Fade>
          )}

          {/* Informações importantes */}
          <Card sx={{ mb: 3, bgcolor: 'info.light' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SecurityIcon sx={{ fontSize: 20, mr: 1, color: 'info.main' }} />
                <Typography variant="body2" fontWeight="bold">
                  Por que fazer login?
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                • 💾 Seus dados ficam salvos na nuvem
                <br />
                • 🔄 Acesse de qualquer computador
                <br />
                • 👥 Compartilhe projetos com sua equipe
                <br />
                • 🔒 Dados seguros e com backup automático
              </Typography>
            </CardContent>
          </Card>

          {/* Formulário */}
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            {/* Nome (só no cadastro) */}
            {!isLogin && (
              <Zoom in timeout={300}>
                <TextField
                  fullWidth
                  label="Seu Nome Completo"
                  placeholder="Ex: João Silva"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                  disabled={loading}
                />
              </Zoom>
            )}

            {/* Email */}
            <TextField
              fullWidth
              label="Seu Email"
              type="email"
              placeholder="Ex: joao@empresa.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
              disabled={loading}
            />

            {/* Senha */}
            <TextField
              fullWidth
              label="Sua Senha"
              type={showPassword ? 'text' : 'password'}
              placeholder={isLogin ? "Digite sua senha" : "Crie uma senha (mín. 6 caracteres)"}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="primary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
              disabled={loading}
            />

            {/* Confirmar senha (só no cadastro) */}
            {!isLogin && (
              <Zoom in timeout={500}>
                <TextField
                  fullWidth
                  label="Confirme a Senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite a senha novamente"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CheckIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                  disabled={loading}
                />
              </Zoom>
            )}

            {/* Botão principal */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? null : (isLogin ? <LoginIcon /> : <SignUpIcon />)}
              sx={{ 
                py: 2, 
                fontSize: '1.1rem',
                fontWeight: 'bold',
                mb: 3
              }}
            >
              {loading ? 
                (isLogin ? 'Entrando...' : 'Criando conta...') : 
                (isLogin ? '🔐 Entrar Agora' : '🎉 Criar Minha Conta')
              }
            </Button>

            <Divider sx={{ mb: 3 }}>ou</Divider>

            {/* Alternar entre login e cadastro */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {isLogin ? 
                  'Ainda não tem uma conta?' : 
                  'Já tem uma conta?'
                }
              </Typography>
              
              <Button
                variant="outlined"
                onClick={toggleMode}
                disabled={loading}
                startIcon={isLogin ? <SignUpIcon /> : <LoginIcon />}
                sx={{ mr: 2 }}
              >
                {isLogin ? 'Criar Nova Conta' : 'Fazer Login'}
              </Button>

              <Button
                variant="text"
                onClick={onClose}
                disabled={loading}
                sx={{ color: 'text.secondary' }}
              >
                Cancelar
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default LoginScreen;