import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert
} from '@mui/material';
import {
  Google as GoogleIcon,
  PlayArrow as PlayIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const GoogleAuthFallback = ({ onBackToLocal, onDemoMode }) => {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
      <Paper elevation={3} sx={{ p: 4, maxWidth: 450, textAlign: 'center' }}>
        <SettingsIcon sx={{ fontSize: 48, color: '#ff9800', mb: 2 }} />
        
        <Typography variant="h5" gutterBottom>
          Google Sheets
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          A integração com Google Sheets requer configuração adicional.
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
          <Typography variant="subtitle2" gutterBottom>
            📋 Para usar o Google Sheets:
          </Typography>
          <Typography variant="body2" component="div">
            1. Configure credenciais OAuth2 no Google Cloud Console<br/>
            2. Adicione REACT_APP_GOOGLE_CLIENT_ID no arquivo .env<br/>
            3. Consulte GOOGLE_SHEETS_SETUP.md para instruções detalhadas
          </Typography>
        </Alert>
        
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
          • <strong>Local:</strong> Dados salvos apenas no seu navegador<br/>
          • <strong>Demo:</strong> Dados de exemplo para demonstração
        </Typography>
      </Paper>
    </Box>
  );
};

export default GoogleAuthFallback;