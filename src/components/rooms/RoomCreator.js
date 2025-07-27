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
  Switch,
  FormControlLabel,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useRoom } from '../../contexts/RoomContext';

const RoomCreator = ({ open, onClose }) => {
  const { createRoom, loading } = useRoom();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        description: '',
        is_public: false
      });
      setError('');
      setSuccess('');
    }
  }, [open]);

  const handleInputChange = (field) => (event) => {
    const value = field === 'is_public' ? event.target.checked : event.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Nome da sala é obrigatório');
      return false;
    }

    if (formData.name.length < 3) {
      setError('Nome deve ter pelo menos 3 caracteres');
      return false;
    }

    if (formData.name.length > 50) {
      setError('Nome deve ter no máximo 50 caracteres');
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
      const newRoom = await createRoom({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        is_public: formData.is_public
      });

      setSuccess(`Sala "${newRoom.name}" criada com sucesso! Código: ${newRoom.room_code}`);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      setError(err.message || 'Erro ao criar sala');
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
            <AddIcon color="primary" />
            <Typography variant="h5" component="div">
              Criar Nova Sala
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
          {/* Room Name */}
          <TextField
            label="Nome da Sala"
            value={formData.name}
            onChange={handleInputChange('name')}
            required
            fullWidth
            autoFocus
            placeholder="Ex: Sprint Q1 2024"
            helperText="Nome que aparecerá na lista de salas"
            sx={{ mb: 2 }}
            disabled={loading}
          />

          {/* Description */}
          <TextField
            label="Descrição"
            value={formData.description}
            onChange={handleInputChange('description')}
            fullWidth
            multiline
            rows={3}
            placeholder="Descreva o propósito desta sala..."
            helperText="Opcional - ajuda outros usuários a entender o contexto"
            sx={{ mb: 2 }}
            disabled={loading}
          />

          {/* Public Room Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_public}
                onChange={handleInputChange('is_public')}
                disabled={loading}
              />
            }
            label="Sala Pública"
            sx={{ mb: 1 }}
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, ml: 4 }}>
            {formData.is_public 
              ? "✅ Qualquer usuário pode visualizar as tarefas (somente leitura)"
              : "🔒 Apenas membros convidados podem acessar"
            }
          </Typography>

          {/* Info Box */}
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Após criar a sala:</strong>
            </Typography>
            <Typography variant="body2" component="ul" sx={{ mt: 1, mb: 0 }}>
              <li>Um <strong>código único</strong> será gerado automaticamente</li>
              <li>Você será o <strong>proprietário</strong> da sala</li>
              <li>Poderá <strong>convidar outros</strong> usuários pelo código</li>
              <li>A sala ficará <strong>selecionada</strong> automaticamente</li>
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
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
        >
          {loading ? 'Criando...' : 'Criar Sala'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoomCreator;