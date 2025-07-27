import React, { useState, useEffect } from 'react';
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
  Tabs,
  Tab,
  Divider,
  Card,
  CardContent,
  Chip,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Settings as SettingsIcon,
  ContentCopy as CopyIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Delete as DeleteIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { useRoom } from '../../contexts/RoomContext';

const RoomSettings = ({ open, onClose, room }) => {
  const { 
    updateRoom, 
    isRoomOwner, 
    canEditRoom, 
    canManageMembers,
    loading 
  } = useRoom();
  
  const [currentTab, setCurrentTab] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Initialize form data when room changes
  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name || '',
        description: room.description || '',
        is_public: room.is_public || false
      });
    }
  }, [room]);

  // Reset messages when modal opens/closes
  useEffect(() => {
    if (open) {
      setError('');
      setSuccess('');
      setCopySuccess(false);
      setCurrentTab(0);
    }
  }, [open]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleInputChange = (field) => (event) => {
    const value = field === 'is_public' ? event.target.checked : event.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleSaveBasicInfo = async () => {
    if (!canEditRoom(room)) {
      setError('Você não tem permissão para editar esta sala');
      return;
    }

    if (!formData.name.trim()) {
      setError('Nome da sala é obrigatório');
      return;
    }

    setError('');
    setSuccess('');

    try {
      await updateRoom(room.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        is_public: formData.is_public
      });

      setSuccess('Informações da sala atualizadas com sucesso!');
    } catch (err) {
      setError(err.message || 'Erro ao atualizar sala');
    }
  };

  const handleCopyRoomCode = async () => {
    if (!room?.room_code) return;

    try {
      await navigator.clipboard.writeText(room.room_code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      setError('Erro ao copiar código');
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!room) {
    return null;
  }

  const isOwner = isRoomOwner(room);
  const canEdit = canEditRoom(room);
  const canManage = canManageMembers(room);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, height: '80vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon color="primary" />
            <Typography variant="h5" component="div">
              Configurações da Sala
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="Informações Gerais" />
          <Tab label="Membros" disabled={!canManage} />
          <Tab label="Compartilhamento" />
          {isOwner && <Tab label="Zona de Perigo" />}
        </Tabs>
      </Box>

      <DialogContent sx={{ px: 3, flex: 1, overflow: 'auto' }}>
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

        {/* Tab 0: General Information */}
        {currentTab === 0 && (
          <Box sx={{ mt: 2 }}>
            {/* Room Code Card */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Código da Sala
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontFamily: 'monospace',
                      letterSpacing: '0.2em',
                      color: 'primary.main',
                      fontWeight: 'bold'
                    }}
                  >
                    {room.room_code}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CopyIcon />}
                    onClick={handleCopyRoomCode}
                    color={copySuccess ? 'success' : 'primary'}
                  >
                    {copySuccess ? 'Copiado!' : 'Copiar'}
                  </Button>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Compartilhe este código para que outros usuários possam entrar na sala
                </Typography>
              </CardContent>
            </Card>

            {/* Basic Information Form */}
            <Typography variant="h6" gutterBottom>
              Informações Básicas
            </Typography>

            <TextField
              label="Nome da Sala"
              value={formData.name}
              onChange={handleInputChange('name')}
              required
              fullWidth
              sx={{ mb: 2 }}
              disabled={!canEdit || loading}
            />

            <TextField
              label="Descrição"
              value={formData.description}
              onChange={handleInputChange('description')}
              fullWidth
              multiline
              rows={3}
              sx={{ mb: 2 }}
              disabled={!canEdit || loading}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_public}
                  onChange={handleInputChange('is_public')}
                  disabled={!canEdit || loading}
                />
              }
              label="Sala Pública"
              sx={{ mb: 1 }}
            />
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, ml: 4 }}>
              {formData.is_public 
                ? "Qualquer usuário pode visualizar as tarefas (somente leitura)"
                : "Apenas membros convidados podem acessar"
              }
            </Typography>

            {canEdit && (
              <Button
                variant="contained"
                onClick={handleSaveBasicInfo}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            )}
          </Box>
        )}

        {/* Tab 1: Members */}
        {currentTab === 1 && canManage && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Membros da Sala
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Funcionalidade de gerenciamento de membros será implementada em breve.
                Por enquanto, os usuários podem entrar na sala usando o código.
              </Typography>
            </Alert>

            {/* Placeholder for members list */}
            <List>
              <ListItem>
                <Avatar sx={{ mr: 2 }}>
                  {room.owner_name?.charAt(0) || 'O'}
                </Avatar>
                <ListItemText
                  primary="Proprietário"
                  secondary="Você (proprietário da sala)"
                />
                <ListItemSecondaryAction>
                  <Chip label="Owner" color="primary" size="small" />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Box>
        )}

        {/* Tab 2: Sharing */}
        {currentTab === 2 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Compartilhamento
            </Typography>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <ShareIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Código de Convite
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <TextField
                    value={room.room_code}
                    fullWidth
                    InputProps={{
                      readOnly: true,
                      style: {
                        fontFamily: 'monospace',
                        fontSize: '1.2rem',
                        letterSpacing: '0.1em'
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<CopyIcon />}
                    onClick={handleCopyRoomCode}
                    color={copySuccess ? 'success' : 'primary'}
                  >
                    {copySuccess ? 'Copiado!' : 'Copiar'}
                  </Button>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  Envie este código para outros usuários entrarem na sala
                </Typography>
              </CardContent>
            </Card>

            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Como compartilhar:</strong>
              </Typography>
              <Typography variant="body2" component="ul" sx={{ mt: 1, mb: 0 }}>
                <li>Copie o código acima</li>
                <li>Envie para os usuários que devem ter acesso</li>
                <li>Eles usarão o botão "Entrar em Sala" para acessar</li>
                <li>Novos membros terão permissão de edição</li>
              </Typography>
            </Alert>
          </Box>
        )}

        {/* Tab 3: Danger Zone (Owner only) */}
        {currentTab === 3 && isOwner && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom color="error">
              Zona de Perigo
            </Typography>

            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Atenção:</strong> As ações abaixo são irreversíveis e afetarão todos os membros da sala.
              </Typography>
            </Alert>

            <Card sx={{ border: '1px solid', borderColor: 'error.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <DeleteIcon color="error" />
                  <Typography variant="subtitle1" fontWeight="bold" color="error">
                    Excluir Sala
                  </Typography>
                </Box>
                
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Excluir a sala removerá permanentemente:
                </Typography>
                
                <Typography variant="body2" component="ul" sx={{ mb: 2 }}>
                  <li>Todas as tarefas da sala</li>
                  <li>Configurações e histórico</li>
                  <li>Acesso de todos os membros</li>
                  <li>Esta ação não pode ser desfeita</li>
                </Typography>

                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  disabled={true} // Disabled for now - would need confirmation dialog
                >
                  Excluir Sala (Em breve)
                </Button>
              </CardContent>
            </Card>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoomSettings;