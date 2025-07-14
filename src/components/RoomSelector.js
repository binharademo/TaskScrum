import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Alert,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Group as GroupIcon,
  VpnKey as KeyIcon
} from '@mui/icons-material';
import {
  getCurrentRoom,
  setCurrentRoom,
  generateRoomCode,
  createRoom,
  roomExists,
  getAvailableRooms,
  loadTasksFromStorage
} from '../utils/storage';
import { loadSampleData } from '../utils/sampleData';

const RoomSelector = ({ open, onRoomSelected }) => {
  const [newRoomCode, setNewRoomCode] = useState('');
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [error, setError] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [currentRoom, setCurrentRoomState] = useState('');

  useEffect(() => {
    if (open) {
      const rooms = getAvailableRooms();
      setAvailableRooms(rooms);
      const current = getCurrentRoom();
      setCurrentRoomState(current || '');
    }
  }, [open]);

  const handleCreateRoom = async () => {
    try {
      setError('');
      
      // Gerar código se não fornecido
      const roomCode = newRoomCode.trim().toUpperCase() || generateRoomCode();
      
      // Verificar se já existe
      if (roomExists(roomCode)) {
        setError(`Sala "${roomCode}" já existe. Escolha outro código.`);
        return;
      }

      // Carregar dados de exemplo para nova sala
      const sampleTasks = await loadSampleData();
      
      // Criar sala com dados de exemplo
      createRoom(roomCode, sampleTasks);
      
      // Fechar modal e notificar
      onRoomSelected(roomCode);
      setNewRoomCode('');
      
    } catch (error) {
      setError('Erro ao criar sala: ' + error.message);
    }
  };

  const handleJoinRoom = () => {
    const roomCode = joinRoomCode.trim().toUpperCase();
    
    if (!roomCode) {
      setError('Digite o código da sala');
      return;
    }

    if (!roomExists(roomCode)) {
      setError(`Sala "${roomCode}" não encontrada`);
      return;
    }

    setCurrentRoom(roomCode);
    onRoomSelected(roomCode);
    setJoinRoomCode('');
    setError('');
  };

  const handleSelectExistingRoom = (roomCode) => {
    setCurrentRoom(roomCode);
    onRoomSelected(roomCode);
  };

  const getRoomTaskCount = (roomCode) => {
    const tasks = loadTasksFromStorage(roomCode);
    return tasks.length;
  };

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <GroupIcon />
        Seleção de Sala/Projeto
      </DialogTitle>
      
      <DialogContent>
        {currentRoom && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Sala atual: <strong>{currentRoom}</strong>
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Salas Disponíveis */}
        {availableRooms.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              📁 Salas Disponíveis
            </Typography>
            <List dense>
              {availableRooms.map(roomCode => (
                <ListItem key={roomCode} disablePadding>
                  <ListItemButton 
                    onClick={() => handleSelectExistingRoom(roomCode)}
                    selected={roomCode === currentRoom}
                  >
                    <ListItemText
                      primary={roomCode}
                      secondary={`${getRoomTaskCount(roomCode)} tarefas`}
                    />
                    {roomCode === currentRoom && (
                      <Chip label="Atual" size="small" color="primary" />
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
          </Box>
        )}

        {/* Criar Nova Sala */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon />
            Criar Nova Sala
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
            <TextField
              label="Código da Sala (opcional)"
              value={newRoomCode}
              onChange={(e) => setNewRoomCode(e.target.value.toUpperCase())}
              placeholder="Ex: SPRINT01"
              size="small"
              inputProps={{ maxLength: 10 }}
              helperText="Deixe vazio para gerar automaticamente"
            />
            <Button 
              variant="contained" 
              onClick={handleCreateRoom}
              startIcon={<AddIcon />}
            >
              Criar
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Entrar em Sala Existente */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <KeyIcon />
            Entrar em Sala Existente
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
            <TextField
              label="Código da Sala"
              value={joinRoomCode}
              onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
              placeholder="Ex: ABC123"
              size="small"
              inputProps={{ maxLength: 10 }}
            />
            <Button 
              variant="outlined" 
              onClick={handleJoinRoom}
              startIcon={<KeyIcon />}
            >
              Entrar
            </Button>
          </Box>
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="body2" color="info.dark">
            💡 <strong>Como funciona:</strong>
            <br />• Compartilhe o código da sala com sua equipe
            <br />• Todos que usarem o mesmo código verão os mesmos dados
            <br />• Dados ficam salvos no navegador local
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>
          Os dados são compartilhados localmente
        </Typography>
      </DialogActions>
    </Dialog>
  );
};

export default RoomSelector;