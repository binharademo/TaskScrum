import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Avatar,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material';
import {
  Google as GoogleIcon,
  AccountCircle,
  CloudSync,
  FolderShared,
  ExitToApp,
  PlayArrow as PlayIcon
} from '@mui/icons-material';
import googleAuth from '../services/googleAuth';
import googleSheets from '../services/googleSheets';

const GoogleAuthComponent = ({ onAuthSuccess, onAuthError, onBackToLocal, onDemoMode }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projectInfo, setProjectInfo] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setInitializing(true);
      setError(null);
      
      // Verificar se as configurações estão presentes
      if (!process.env.REACT_APP_GOOGLE_CLIENT_ID || 
          process.env.REACT_APP_GOOGLE_CLIENT_ID === 'seu-client-id-aqui' ||
          process.env.REACT_APP_GOOGLE_CLIENT_ID === 'configure-seu-client-id-aqui') {
        setError('Google OAuth não configurado. Configure o REACT_APP_GOOGLE_CLIENT_ID no arquivo .env para usar o Google Sheets.');
        return;
      }
      
      
      await googleAuth.initialize();
      
      if (googleAuth.isSignedIn()) {
        const currentUser = googleAuth.getCurrentUser();
        setUser(currentUser);
        await loadOrCreateProject(currentUser);
      }
    } catch (error) {
      console.error('Erro na inicialização:', error);
      setError(`Erro na inicialização: ${error.message}`);
    } finally {
      setInitializing(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = await googleAuth.signIn();
      setUser(user);
      
      await loadOrCreateProject(user);
      
    } catch (error) {
      console.error('Erro no login:', error);
      
      let errorMessage = 'Falha no login com Google';
      if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      if (onAuthError) onAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await googleAuth.signOut();
      setUser(null);
      setProjectInfo(null);
      localStorage.removeItem('tasktracker_project');
    } catch (error) {
      console.error('Erro no logout:', error);
      setError('Falha no logout');
    } finally {
      setLoading(false);
    }
  };

  const loadOrCreateProject = async (user) => {
    try {
      setLoading(true);
      
      // Verificar se projeto existe
      const hasProject = await googleSheets.hasUserProject();
      
      if (!hasProject) {
        // Criar novo projeto
        const project = await googleSheets.createUserProject(user.email);
        setProjectInfo(project);
        if (onAuthSuccess) onAuthSuccess(user, project);
      } else {
        // Carregar projeto existente
        const project = await googleSheets.loadUserProject();
        setProjectInfo(project);
        if (onAuthSuccess) onAuthSuccess(user, project);
      }
      
    } catch (error) {
      console.error('Erro ao carregar/criar projeto:', error);
      setError('Erro ao configurar projeto');
      if (onAuthError) onAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const recreateProject = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Limpar projeto existente
      localStorage.removeItem('tasktracker_project');
      
      // Criar novo projeto
      const project = await googleSheets.createUserProject(user.email);
      setProjectInfo(project);
      
      if (onAuthSuccess) onAuthSuccess(user, project);
      
    } catch (error) {
      console.error('Erro ao recriar projeto:', error);
      setError('Erro ao recriar projeto');
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Inicializando sistema...</Typography>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Paper elevation={3} sx={{ p: 4, maxWidth: 400, textAlign: 'center' }}>
          <GoogleIcon sx={{ fontSize: 48, color: '#4285f4', mb: 2 }} />
          
          <Typography variant="h5" gutterBottom>
            TaskTracker
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Escolha como deseja usar o TaskTracker:
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <GoogleIcon />}
            onClick={handleSignIn}
            disabled={loading || error}
            sx={{
              backgroundColor: '#4285f4',
              '&:hover': { backgroundColor: '#3367d6' },
              textTransform: 'none',
              py: 1.5,
              mb: 2,
              width: '100%'
            }}
          >
            {loading ? 'Conectando...' : 'Entrar com Google'}
          </Button>
          
          <Button
            variant="outlined"
            onClick={onBackToLocal}
            sx={{
              textTransform: 'none',
              py: 1.5,
              mb: 2,
              width: '100%'
            }}
          >
            Usar Modo Local (sem Google)
          </Button>
          
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={onDemoMode}
            sx={{
              backgroundColor: '#4caf50',
              '&:hover': { backgroundColor: '#45a049' },
              textTransform: 'none',
              py: 1.5,
              mb: 2,
              width: '100%'
            }}
          >
            Modo Demo (com dados de exemplo)
          </Button>
          
          <Typography variant="caption" display="block" sx={{ color: 'text.secondary', textAlign: 'center' }}>
            • <strong>Google:</strong> Dados sincronizados e compartilháveis<br/>
            • <strong>Local:</strong> Dados salvos apenas no seu navegador<br/>
            • <strong>Demo:</strong> Dados de exemplo para demonstração
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Card elevation={2}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <Avatar src={user.imageUrl} sx={{ mr: 2 }} />
            <Box flex={1}>
              <Typography variant="h6">{user.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ExitToApp />}
              onClick={handleSignOut}
              disabled={loading}
            >
              Sair
            </Button>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          {projectInfo && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                📁 Projeto: {projectInfo.projectName}
              </Typography>
              
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                {Object.entries(projectInfo.spreadsheets).map(([key, sheet]) => (
                  <Chip
                    key={key}
                    label={sheet.title}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
              
              <Typography variant="caption" color="text.secondary">
                Criado em: {new Date(projectInfo.createdAt).toLocaleString()}
              </Typography>
              
              {projectInfo.lastSync && (
                <Typography variant="caption" display="block" color="text.secondary">
                  Última sincronização: {new Date(projectInfo.lastSync).toLocaleString()}
                </Typography>
              )}
            </Box>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          
          {loading && (
            <Box display="flex" alignItems="center" justifyContent="center" mt={2}>
              <CircularProgress size={20} />
              <Typography sx={{ ml: 1 }}>Configurando projeto...</Typography>
            </Box>
          )}
          
          <Box display="flex" gap={1} mt={2}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CloudSync />}
              onClick={() => loadOrCreateProject(user)}
              disabled={loading}
            >
              Sincronizar
            </Button>
            
            <Button
              variant="outlined"
              size="small"
              startIcon={<FolderShared />}
              onClick={recreateProject}
              disabled={loading}
            >
              Recriar Projeto
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default GoogleAuthComponent;