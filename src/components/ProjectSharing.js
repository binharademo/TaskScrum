import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Share as ShareIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Email as EmailIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import googleSheets from '../services/googleSheets';

const ProjectSharing = ({ projectInfo, onUpdate }) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [newCollaboratorRole, setNewCollaboratorRole] = useState('writer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (projectInfo) {
      loadCollaborators();
    }
  }, [projectInfo]);

  const loadCollaborators = async () => {
    try {
      const data = await googleSheets.readSheet('collaborators');
      setCollaborators(data);
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
    }
  };

  const handleInviteCollaborator = async () => {
    if (!newCollaboratorEmail.trim()) {
      setError('Email é obrigatório');
      return;
    }

    if (!isValidEmail(newCollaboratorEmail)) {
      setError('Email inválido');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Verificar se já existe
      const existingCollaborator = collaborators.find(
        c => c.Email.toLowerCase() === newCollaboratorEmail.toLowerCase()
      );
      
      if (existingCollaborator) {
        setError('Este email já foi convidado');
        return;
      }

      // Compartilhar projeto
      const results = await googleSheets.shareProject(newCollaboratorEmail, newCollaboratorRole);
      
      // Verificar se todos os compartilhamentos foram bem-sucedidos
      const failedShares = results.filter(r => !r.success);
      if (failedShares.length > 0) {
        setError(`Erro ao compartilhar algumas planilhas: ${failedShares.map(f => f.sheet).join(', ')}`);
      } else {
        setSuccess(`Convite enviado para ${newCollaboratorEmail}`);
        setNewCollaboratorEmail('');
        setNewCollaboratorRole('writer');
        
        // Recarregar colaboradores
        await loadCollaborators();
      }
      
    } catch (error) {
      console.error('Erro ao convidar colaborador:', error);
      setError('Erro ao enviar convite');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCollaborator = async (email) => {
    try {
      setLoading(true);
      setError(null);
      
      // Remover acesso das planilhas
      // (Implementação depende da API do Google Drive)
      
      // Atualizar lista de colaboradores
      const updatedCollaborators = collaborators.filter(c => c.Email !== email);
      setCollaborators(updatedCollaborators);
      
      // Atualizar planilha de colaboradores
      await googleSheets.writeSheet('collaborators', updatedCollaborators);
      
      setSuccess(`Colaborador ${email} removido`);
      
    } catch (error) {
      console.error('Erro ao remover colaborador:', error);
      setError('Erro ao remover colaborador');
    } finally {
      setLoading(false);
    }
  };

  const copyProjectLink = () => {
    const link = `${window.location.origin}?project=${projectInfo?.projectName}`;
    navigator.clipboard.writeText(link);
    setSuccess('Link copiado para a área de transferência');
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner': return 'error';
      case 'writer': return 'primary';
      case 'reader': return 'default';
      default: return 'default';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'owner': return 'Proprietário';
      case 'writer': return 'Editor';
      case 'reader': return 'Visualizador';
      default: return role;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ativo': return 'success';
      case 'convidado': return 'warning';
      case 'removido': return 'error';
      default: return 'default';
    }
  };

  if (!projectInfo) {
    return (
      <Alert severity="info">
        Faça login para acessar as opções de compartilhamento
      </Alert>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <GroupIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              Compartilhamento do Projeto
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Gerencie quem pode acessar e editar seu projeto
          </Typography>
          
          <Box display="flex" gap={1} mb={2}>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setShareDialogOpen(true)}
              disabled={loading}
            >
              Convidar Colaborador
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<CopyIcon />}
              onClick={copyProjectLink}
            >
              Copiar Link
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" gutterBottom>
            Colaboradores ({collaborators.length})
          </Typography>

          {collaborators.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Nenhum colaborador foi convidado ainda
            </Typography>
          ) : (
            <List>
              {collaborators.map((collaborator, index) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={collaborator.Email}
                    secondary={
                      <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                        <Chip
                          label={getRoleLabel(collaborator.Role)}
                          size="small"
                          color={getRoleColor(collaborator.Role)}
                        />
                        <Chip
                          label={collaborator.Status}
                          size="small"
                          color={getStatusColor(collaborator.Status)}
                          variant="outlined"
                        />
                        {collaborator.DataConvite && (
                          <Typography variant="caption" color="text.secondary">
                            Convidado em: {new Date(collaborator.DataConvite).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="remover"
                      onClick={() => handleRemoveCollaborator(collaborator.Email)}
                      disabled={loading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Convite */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <EmailIcon sx={{ mr: 1 }} />
            Convidar Colaborador
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Email do colaborador"
              value={newCollaboratorEmail}
              onChange={(e) => setNewCollaboratorEmail(e.target.value)}
              type="email"
              margin="normal"
              helperText="Digite o email da pessoa que você quer convidar"
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Nível de acesso</InputLabel>
              <Select
                value={newCollaboratorRole}
                onChange={(e) => setNewCollaboratorRole(e.target.value)}
                label="Nível de acesso"
              >
                <MenuItem value="reader">Visualizador - Apenas leitura</MenuItem>
                <MenuItem value="writer">Editor - Pode editar e criar</MenuItem>
              </Select>
            </FormControl>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              O colaborador receberá acesso a todas as planilhas do projeto e poderá visualizar/editar os dados diretamente no Google Sheets.
            </Alert>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleInviteCollaborator}
            variant="contained"
            disabled={loading || !newCollaboratorEmail.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : <PersonAddIcon />}
          >
            {loading ? 'Enviando...' : 'Enviar Convite'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectSharing;