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
  Chip,
  Link
} from '@mui/material';
import {
  Google as GoogleIcon,
  ExitToApp,
  PlayArrow as PlayIcon,
  OpenInNew as OpenIcon,
  CloudDone as CloudIcon
} from '@mui/icons-material';

const SimpleGoogleAuth = ({ onAuthSuccess, onAuthError, onBackToLocal, onDemoMode }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    loadGoogleAPI();
    
    // Verificar se já tem dados salvos
    const savedUser = localStorage.getItem('simpleGoogleUser');
    const savedSheet = localStorage.getItem('userSpreadsheetUrl');
    
    if (savedUser && savedSheet) {
      setUser(JSON.parse(savedUser));
      setSpreadsheetUrl(savedSheet);
    }
  }, []);

  const loadGoogleAPI = () => {
    if (window.gapi) {
      initializeGAPI();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = initializeGAPI;
    document.head.appendChild(script);
  };

  const initializeGAPI = () => {
    // Versão simplificada - usar Google Picker API que é mais simples
    window.gapi.load('auth2:picker', async () => {
      try {
        // Inicializar com configurações mínimas
        await window.gapi.auth2.init({
          client_id: '721950351218-9k8krhljrv9cq5vt2d6tj8fh3ammu0n3.apps.googleusercontent.com'
        });
        
        setInitialized(true);
        setError(null);
        
        // Verificar se já está logado
        const authInstance = window.gapi.auth2.getAuthInstance();
        if (authInstance && authInstance.isSignedIn.get()) {
          const currentUser = authInstance.currentUser.get();
          handleUserData(currentUser);
        }
      } catch (error) {
        console.error('Erro na inicialização:', error);
        setError('Google API não disponível. Tente usar o Modo Local.');
      }
    });
  };

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!initialized) {
        setError('Google API ainda não foi carregada. Tente novamente em alguns segundos.');
        return;
      }

      const authInstance = window.gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn();
      
      await handleUserData(user);
      
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Falha no login. Verifique se os pop-ups estão habilitados.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserData = async (googleUser) => {
    const profile = googleUser.getBasicProfile();
    const userData = {
      id: profile.getId(),
      name: profile.getName(),
      email: profile.getEmail(),
      imageUrl: profile.getImageUrl()
    };
    
    setUser(userData);
    localStorage.setItem('simpleGoogleUser', JSON.stringify(userData));
    
    // Criar ou encontrar planilha do usuário
    await setupUserSpreadsheet(googleUser);
  };

  const setupUserSpreadsheet = async (googleUser) => {
    try {
      // Criar nova planilha automaticamente
      const spreadsheet = await window.gapi.client.sheets.spreadsheets.create({
        properties: {
          title: `TaskTracker - ${user?.name || 'Usuário'} - ${new Date().toLocaleDateString()}`
        },
        sheets: [
          {
            properties: {
              title: 'Tarefas'
            }
          }
        ]
      });

      const spreadsheetId = spreadsheet.result.spreadsheetId;
      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
      
      setSpreadsheetUrl(spreadsheetUrl);
      localStorage.setItem('userSpreadsheetUrl', spreadsheetUrl);
      localStorage.setItem('userSpreadsheetId', spreadsheetId);

      // Configurar cabeçalhos da planilha
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: 'Tarefas!A1:Z1',
        valueInputOption: 'RAW',
        resource: {
          values: [[
            'ID', 'Épico', 'User Story', 'Atividade', 'Estimativa', 
            'Desenvolvedor', 'Sprint', 'Status', 'Prioridade', 
            'Dia1', 'Dia2', 'Dia3', 'Dia4', 'Dia5', 
            'Dia6', 'Dia7', 'Dia8', 'Dia9', 'Dia10',
            'Tempo Gasto', 'Taxa Erro', 'Criado em', 'Atualizado em'
          ]]
        }
      });

      if (onAuthSuccess) {
        onAuthSuccess(userData, { spreadsheetId, spreadsheetUrl });
      }

    } catch (error) {
      console.error('Erro ao criar planilha:', error);
      setError('Erro ao criar planilha. Verifique as permissões.');
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      
      setUser(null);
      setSpreadsheetUrl(null);
      localStorage.removeItem('simpleGoogleUser');
      localStorage.removeItem('userSpreadsheetUrl');
      localStorage.removeItem('userSpreadsheetId');
      
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Paper elevation={3} sx={{ p: 4, maxWidth: 450, textAlign: 'center' }}>
          <GoogleIcon sx={{ fontSize: 48, color: '#4285f4', mb: 2 }} />
          
          <Typography variant="h5" gutterBottom>
            TaskTracker + Google Sheets
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Salve seus dados diretamente no Google Sheets da sua conta
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body2">
              ✅ <strong>Plug-and-Play:</strong> Sem configuração<br/>
              ✅ <strong>Seus dados:</strong> Na sua conta Google<br/>
              ✅ <strong>Compartilhamento:</strong> Compartilhe a planilha com a equipe<br/>
              ✅ <strong>Backup automático:</strong> Dados sempre seguros
            </Typography>
          </Alert>
          
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <GoogleIcon />}
            onClick={handleSignIn}
            disabled={loading || !initialized}
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
            Modo Demo (dados de exemplo)
          </Button>
          
          <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
            Funciona sem configuração! Cria planilha automaticamente na sua conta.
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
          
          {spreadsheetUrl && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                📊 Sua Planilha TaskTracker
              </Typography>
              
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  ✅ Planilha criada com sucesso!<br/>
                  Todos os dados serão salvos automaticamente no Google Sheets.
                </Typography>
              </Alert>
              
              <Box display="flex" gap={1} mb={2}>
                <Button
                  variant="contained"
                  startIcon={<OpenIcon />}
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ textTransform: 'none' }}
                >
                  Abrir Planilha
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<CloudIcon />}
                  onClick={() => onAuthSuccess && onAuthSuccess(user, { spreadsheetUrl })}
                  sx={{ textTransform: 'none' }}
                >
                  Continuar
                </Button>
              </Box>
              
              <Typography variant="caption" color="text.secondary">
                💡 <strong>Dica:</strong> Compartilhe esta planilha com sua equipe para trabalharem juntos!
              </Typography>
            </Box>
          )}
          
          {loading && (
            <Box display="flex" alignItems="center" justifyContent="center" mt={2}>
              <CircularProgress size={20} />
              <Typography sx={{ ml: 1 }}>Configurando planilha...</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SimpleGoogleAuth;