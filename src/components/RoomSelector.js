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

// Storage utils (localStorage - modo padrão)
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

// Supabase integration (modo híbrido)
import { isSupabaseConfigured } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SupabaseService } from '../services/SupabaseService';

const RoomSelector = ({ open, onRoomSelected }) => {
  const [newRoomCode, setNewRoomCode] = useState('');
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [error, setError] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [currentRoom, setCurrentRoomState] = useState('');
  const [loading, setLoading] = useState(false);

  // Supabase context (optional - só usa se configurado)
  const auth = isSupabaseConfigured() ? useAuth() : { isAuthenticated: false, user: null };
  
  // Determinar modo de operação
  const isSupabaseMode = isSupabaseConfigured() && auth?.isAuthenticated;
  const supabaseService = isSupabaseMode ? new SupabaseService() : null;

  // ========================================
  // SERVICE ABSTRACTION LAYER
  // Funções wrapper que usam localStorage OU Supabase automaticamente
  // ========================================
  
  const getAvailableRoomsHybrid = async () => {
    if (isSupabaseMode && supabaseService) {
      try {
        const userRooms = await supabaseService.getUserRooms();
        return userRooms.map(room => ({
          code: room.room_code,
          name: room.name,
          taskCount: room.task_count || 0
        }));
      } catch (error) {
        console.error('Error loading Supabase rooms:', error);
        return [];
      }
    } else {
      // Modo localStorage padrão
      const rooms = getAvailableRooms();
      return rooms.map(roomCode => ({
        code: roomCode,
        name: roomCode,
        taskCount: loadTasksFromStorage(roomCode).length
      }));
    }
  };

  const roomExistsHybrid = async (roomCode) => {
    if (isSupabaseMode && supabaseService) {
      try {
        return await supabaseService.findRoomByCode(roomCode) !== null;
      } catch (error) {
        console.error('Error checking room existence:', error);
        return false;
      }
    } else {
      return roomExists(roomCode);
    }
  };

  const createRoomHybrid = async (roomCode, initialTasks = []) => {
    if (isSupabaseMode && supabaseService) {
      try {
        const room = await supabaseService.createRoom({
          name: `Sala ${roomCode}`,
          room_code: roomCode,
          is_public: false
        });
        
        // Adicionar tarefas iniciais se fornecidas
        if (initialTasks.length > 0) {
          for (const task of initialTasks) {
            await supabaseService.createTask({
              ...task,
              room_id: room.id
            });
          }
        }
        
        return room;
      } catch (error) {
        console.error('Error creating Supabase room:', error);
        throw error;
      }
    } else {
      // Modo localStorage padrão
      createRoom(roomCode, initialTasks);
      return { room_code: roomCode };
    }
  };

  const joinRoomHybrid = async (roomCode) => {
    if (isSupabaseMode && supabaseService) {
      try {
        const room = await supabaseService.findRoomByCode(roomCode);
        if (!room) {
          throw new Error('Sala não encontrada');
        }
        
        // Para salas públicas, usuário pode entrar automaticamente
        // Para salas privadas, precisa ser convidado (implementação futura)
        return room;
      } catch (error) {
        console.error('Error joining Supabase room:', error);
        throw error;
      }
    } else {
      // Modo localStorage padrão
      if (!roomExists(roomCode)) {
        throw new Error('Sala não encontrada');
      }
      setCurrentRoom(roomCode);
      return { room_code: roomCode };
    }
  };

  useEffect(() => {
    if (open) {
      const loadRooms = async () => {
        setLoading(true);
        try {
          const rooms = await getAvailableRoomsHybrid();
          setAvailableRooms(rooms);
          
          const current = getCurrentRoom();
          setCurrentRoomState(current || '');
        } catch (error) {
          console.error('Error loading rooms:', error);
          setError('Erro ao carregar salas: ' + error.message);
        } finally {
          setLoading(false);
        }
      };
      
      loadRooms();
    }
  }, [open, isSupabaseMode]);

  const handleCreateRoom = async () => {
    setLoading(true);
    try {
      setError('');
      
      // Gerar código se não fornecido
      const roomCode = newRoomCode.trim().toUpperCase() || generateRoomCode();
      
      // Verificar se já existe
      if (await roomExistsHybrid(roomCode)) {
        setError(`Sala "${roomCode}" já existe. Escolha outro código.`);
        return;
      }

      // Carregar dados de exemplo para nova sala
      const sampleTasks = await loadSampleData();
      
      // Criar sala com dados de exemplo (usar função híbrida)
      await createRoomHybrid(roomCode, sampleTasks);
      
      // Fechar modal e notificar
      onRoomSelected(roomCode);
      setNewRoomCode('');
      
    } catch (error) {
      setError('Erro ao criar sala: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    setLoading(true);
    try {
      const roomCode = joinRoomCode.trim().toUpperCase();
      
      if (!roomCode) {
        setError('Digite o código da sala');
        return;
      }

      // Usar função híbrida para verificar e entrar na sala
      await joinRoomHybrid(roomCode);

      // Atualizar localStorage para compatibilidade (sempre)
      setCurrentRoom(roomCode);
      
      onRoomSelected(roomCode);
      setJoinRoomCode('');
      setError('');
      
    } catch (error) {
      setError(error.message || 'Erro ao entrar na sala');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExistingRoom = (roomCode) => {
    setCurrentRoom(roomCode);
    onRoomSelected(roomCode);
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
              {availableRooms.map(room => (
                <ListItem key={room.code} disablePadding>
                  <ListItemButton 
                    onClick={() => handleSelectExistingRoom(room.code)}
                    selected={room.code === currentRoom}
                  >
                    <ListItemText
                      primary={room.name}
                      secondary={`${room.taskCount} tarefas`}
                    />
                    {room.code === currentRoom && (
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
              disabled={loading}
            >
              {loading ? 'Criando...' : 'Criar'}
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
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </Box>
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="body2" color="info.dark">
            💡 <strong>Como funciona:</strong>
            <br />• Compartilhe o código da sala com sua equipe
            <br />• Todos que usarem o mesmo código verão os mesmos dados
            <br />• {isSupabaseMode ? 'Dados sincronizados na nuvem' : 'Dados ficam salvos no navegador local'}
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>
          {isSupabaseMode ? 'Dados sincronizados com Supabase' : 'Os dados são compartilhados localmente'}
        </Typography>
      </DialogActions>
    </Dialog>
  );
};

export default RoomSelector;