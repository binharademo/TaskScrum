import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  IconButton,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  Close as CloseIcon,
  Login as LoginIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { useRoom } from '../../contexts/RoomContext';

const RoomJoiner = ({ open, onClose }) => {
  const { joinRoom, loading } = useRoom();
  
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (open) {
      setRoomCode('');
      setError('');
      setSuccess('');
    }
  }, [open]);

  const handleInputChange = (event) => {
    let value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Limit to 8 characters (room code length)
    if (value.length > 8) {
      value = value.substring(0, 8);
    }
    
    setRoomCode(value);
    setError('');
  };

  const validateForm = () => {
    if (!roomCode.trim()) {
      setError('Código da sala é obrigatório');
      return false;
    }

    if (roomCode.length !== 8) {
      setError('Código deve ter exatamente 8 caracteres');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) return;

    setError('');
    setSuccess('');

    try {
      const room = await joinRoom(roomCode);

      setSuccess(`Entrada realizada com sucesso na sala "${room.name}"!`);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      if (err.message.includes('não encontrada')) {
        setError('Código inválido. Verifique se digitou corretamente.');
      } else if (err.message.includes('acesso')) {
        setError('Você já tem acesso a esta sala.');
      } else {
        setError(err.message || 'Erro ao entrar na sala');
      }
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleanCode = text.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8);
      
      if (cleanCode) {
        setRoomCode(cleanCode);
        setError('');
      }
    } catch (err) {
      // Clipboard not available or permission denied
      console.log('Could not access clipboard');
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LoginIcon color="primary" />
            <Typography variant="h5" component="div">
              Entrar em Sala
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3 }}>
        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          {/* Room Code Input */}
          <TextField
            label="Código da Sala"
            value={roomCode}
            onChange={handleInputChange}
            required
            fullWidth
            autoFocus
            placeholder="Ex: ABC12345"
            helperText="Digite o código de 8 caracteres da sala"
            sx={{ mb: 2 }}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handlePasteFromClipboard}
                    edge="end"
                    size="small"
                    disabled={loading}
                    title="Colar da área de transferência"
                  >
                    <CopyIcon />
                  </IconButton>
                </InputAdornment>
              ),
              style: {
                fontFamily: 'monospace',
                fontSize: '1.2rem',
                letterSpacing: '0.1em'
              }
            }}
          />

          {/* Info Boxes */}
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Como obter o código:</strong>
            </Typography>
            <Typography variant="body2" component="ul" sx={{ mt: 1, mb: 0 }}>
              <li>Peça para o <strong>proprietário da sala</strong> te enviar</li>
              <li>O código aparece nas <strong>configurações da sala</strong></li>
              <li>Códigos têm <strong>8 caracteres</strong> (letras e números)</li>
            </Typography>
          </Alert>

          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Importante:</strong> Ao entrar na sala, você terá acesso de <strong>membro</strong> 
              e poderá visualizar e editar todas as tarefas da sala.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          color="inherit"
        >
          Cancelar
        </Button>
        
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !roomCode}
          startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
        >
          {loading ? 'Entrando...' : 'Entrar na Sala'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoomJoiner;