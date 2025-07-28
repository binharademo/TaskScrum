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
  Divider,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Group as GroupIcon,
  VpnKey as KeyIcon,
  Storage as StorageIcon,
  Cloud as CloudIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  ExitToApp as ExitIcon
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

const RoomSelector = ({ open, onRoomSelected, initialRoomCode = '' }) => {
  const [newRoomCode, setNewRoomCode] = useState('');
  const [joinRoomCode, setJoinRoomCode] = useState(initialRoomCode);
  const [error, setError] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [currentRoom, setCurrentRoomState] = useState('');
  const [loading, setLoading] = useState(false);

  // Supabase context (optional - só usa se configurado)
  const auth = isSupabaseConfigured() ? useAuth() : { isAuthenticated: false, user: null };
  
  // Estados para seleção de persistência
  const [selectedPersistenceMode, setSelectedPersistenceMode] = useState(
    isSupabaseConfigured() && auth?.isAuthenticated ? 'supabase' : 'localStorage'
  );
  const [showPersistenceInfo, setShowPersistenceInfo] = useState(false);
  
  // Determinar modo de operação baseado na seleção do usuário
  const isSupabaseMode = selectedPersistenceMode === 'supabase' && 
                         isSupabaseConfigured() && 
                         auth?.isAuthenticated;
  const supabaseService = isSupabaseMode ? new SupabaseService() : null;
  
  console.log('🔧 RoomSelector - Configuração de persistência:');
  console.log('   └─ Modo selecionado:', selectedPersistenceMode);
  console.log('   └─ Supabase configurado:', isSupabaseConfigured());
  console.log('   └─ Usuário autenticado:', auth?.isAuthenticated);
  console.log('   └─ Email do usuário:', auth?.user?.email);
  console.log('   └─ Switch desabilitado?', !isSupabaseConfigured() || !auth?.isAuthenticated);
  console.log('   └─ Modo final (isSupabaseMode):', isSupabaseMode);

  // ========================================
  // SERVICE ABSTRACTION LAYER
  // Funções wrapper que usam localStorage OU Supabase automaticamente
  // ========================================
  
  const getAvailableRoomsHybrid = async () => {
    if (isSupabaseMode && supabaseService) {
      try {
        console.log('🏠 getAvailableRoomsHybrid - Carregando salas do Supabase...');
        console.log('🔧 Service inicializado:', supabaseService.initialized);
        console.log('👤 Usuário autenticado:', auth?.user?.email);
        
        // Garantir que o service está inicializado
        if (!supabaseService.initialized) {
          console.log('⚡ getAvailableRoomsHybrid - Inicializando service...');
          await supabaseService.initialize();
        }
        
        const userRooms = await supabaseService.getUserRooms();
        console.log('✅ getAvailableRoomsHybrid - Salas encontradas:', userRooms.length);
        
        userRooms.forEach((room, index) => {
          console.log(`   ${index + 1}. "${room.name}" (${room.room_code}) - ID: ${room.id}`);
        });
        
        return userRooms.map(room => ({
          code: room.room_code,
          name: room.name,
          taskCount: room.task_count || 0
        }));
      } catch (error) {
        console.error('❌ getAvailableRoomsHybrid - Erro ao carregar salas do Supabase:', error);
        console.error('📋 Stack trace:', error.stack);
        return [];
      }
    } else {
      // Modo localStorage padrão
      console.log('💾 getAvailableRoomsHybrid - Carregando salas do localStorage...');
      const rooms = getAvailableRooms();
      console.log('✅ getAvailableRoomsHybrid - Salas localStorage:', rooms);
      
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
    console.log('🏗️ createRoomHybrid - INICIANDO criação de sala');
    console.log('   └─ Código da sala:', roomCode);
    console.log('   └─ Modo selecionado pelo usuário:', selectedPersistenceMode);
    console.log('   └─ Supabase configurado:', isSupabaseConfigured());
    console.log('   └─ Usuário autenticado:', auth?.isAuthenticated);
    console.log('   └─ Email do usuário:', auth?.user?.email);
    console.log('   └─ Modo Supabase ativo (isSupabaseMode):', isSupabaseMode);
    console.log('   └─ Tarefas iniciais:', initialTasks.length);
    console.log('   └─ SupabaseService inicializado:', supabaseService ? 'SIM' : 'NÃO');
    console.log('   └─ SupabaseService object:', supabaseService);

    if (isSupabaseMode && supabaseService) {
      try {
        console.log('🔧 createRoomHybrid - INICIANDO inicialização do SupabaseService');
        console.log('   └─ Verificando se SupabaseService existe:', !!supabaseService);
        console.log('   └─ Método initialize existe:', typeof supabaseService.initialize);
        
        const initResult = await supabaseService.initialize();
        console.log('✅ createRoomHybrid - SupabaseService inicializado:', initResult);

        console.log('🏠 createRoomHybrid - CRIANDO sala no Supabase');
        console.log('   └─ Dados da sala:', {
          name: `Sala ${roomCode}`,
          room_code: roomCode,
          is_public: false
        });
        
        const room = await supabaseService.createRoom({
          name: `Sala ${roomCode}`,
          room_code: roomCode,
          is_public: false
        });
        console.log('✅ createRoomHybrid - Sala criada com sucesso:', room);
        
        // Definir currentRoomId para poder criar tarefas
        console.log('🎯 createRoomHybrid - DEFININDO room ID:', room.id);
        supabaseService.setCurrentRoom(room.id);
        console.log('🎯 createRoomHybrid - Room ID definido no service:', supabaseService.currentRoomId);
        
        // Verificar se foi definido corretamente
        if (!supabaseService.currentRoomId) {
          console.error('❌ createRoomHybrid - ERRO: currentRoomId não foi definido!');
          throw new Error('Failed to set current room ID');
        }
        
        // Adicionar tarefas iniciais se fornecidas
        if (initialTasks.length > 0) {
          console.log(`📝 createRoomHybrid - ADICIONANDO ${initialTasks.length} tarefas iniciais`);
          for (const task of initialTasks) {
            // Garantir que a tarefa tenha pelo menos atividade ou userStory
            const taskWithRoom = {
              ...task,
              room_id: room.id,
              // Se não tem atividade nem userStory, usar uma padrão
              atividade: task.atividade || task.userStory || `Tarefa ${task.originalId || 'sem ID'}`,
              userStory: task.userStory || task.atividade || `Story ${task.originalId || 'sem ID'}`
            };
            console.log('   └─ Criando tarefa:', task.atividade);
            console.log('   └─ Dados da tarefa:', {
              atividade: task.atividade,
              epico: task.epico,
              status: task.status,
              room_id: taskWithRoom.room_id,
              currentRoomId: supabaseService.currentRoomId
            });
            
            try {
              const createdTask = await supabaseService.createTask(taskWithRoom);
              console.log('     ✅ Tarefa criada:', createdTask.id);
            } catch (taskError) {
              console.error('     ❌ Erro ao criar tarefa:', taskError.message);
              console.error('     ❌ Stack:', taskError.stack);
              console.error('     ❌ Dados que causaram erro:', taskWithRoom);
              console.error('     ❌ currentRoomId no service:', supabaseService.currentRoomId);
            }
          }
          console.log('✅ createRoomHybrid - Processo de criação de tarefas concluído');
        }
        
        console.log('🎉 createRoomHybrid - SALA CRIADA COM SUCESSO (modo Supabase)');
        return room;
      } catch (error) {
        console.error('❌ createRoomHybrid - ERRO na criação Supabase:', error);
        console.error('   └─ Error name:', error.name);
        console.error('   └─ Error message:', error.message);
        console.error('   └─ Error stack:', error.stack);
        console.error('   └─ Error causa possível: Verificar se o Supabase está configurado corretamente');
        console.error('   └─ Modo selecionado era:', selectedPersistenceMode);
        console.error('   └─ Service era:', supabaseService);
        console.error('   └─ Auth estava:', auth);
        throw error;
      }
    } else {
      // Modo localStorage padrão
      console.log('💾 createRoomHybrid - CRIANDO sala no localStorage (modo local)');
      console.log('   └─ Razão do modo local:');
      console.log('     - isSupabaseMode:', isSupabaseMode);
      console.log('     - selectedPersistenceMode:', selectedPersistenceMode);
      console.log('     - isSupabaseConfigured():', isSupabaseConfigured());
      console.log('     - auth?.isAuthenticated:', auth?.isAuthenticated);
      console.log('     - supabaseService existe:', !!supabaseService);
      
      createRoom(roomCode, initialTasks);
      console.log('✅ createRoomHybrid - Sala criada com sucesso (modo localStorage)');
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
      
      // Escutar evento de sala criada pelos testes de integração
      const handleRoomCreated = (event) => {
        console.log('🔄 RoomSelector - Evento roomCreated recebido:', event.detail);
        console.log('📋 RoomSelector - Recarregando lista de salas...');
        loadRooms();
      };
      
      // Escutar evento de refresh forçado
      const handleForceRefresh = (event) => {
        console.log('🔄 RoomSelector - Evento forceRoomListRefresh recebido:', event.detail);
        console.log('📋 RoomSelector - Forçando refresh da lista...');
        setTimeout(() => {
          loadRooms();
        }, 500);
      };
      
      window.addEventListener('roomCreated', handleRoomCreated);
      window.addEventListener('forceRoomListRefresh', handleForceRefresh);
      
      // Cleanup
      return () => {
        window.removeEventListener('roomCreated', handleRoomCreated);
        window.removeEventListener('forceRoomListRefresh', handleForceRefresh);
      };
    }
  }, [open, isSupabaseMode]);

  // Atualizar joinRoomCode quando initialRoomCode mudar
  useEffect(() => {
    if (initialRoomCode) {
      console.log('🔗 RoomSelector - Código de sala inicial recebido:', initialRoomCode);
      setJoinRoomCode(initialRoomCode);
    }
  }, [initialRoomCode]);

  const handleCreateRoom = async () => {
    console.log('🚀 handleCreateRoom - INÍCIO do processo de criação');
    setLoading(true);
    try {
      setError('');
      
      // Gerar código se não fornecido
      const roomCode = newRoomCode.trim().toUpperCase() || generateRoomCode();
      console.log('📝 handleCreateRoom - Código da sala definido:', roomCode);
      
      // Verificar se já existe
      console.log('🔍 handleCreateRoom - VERIFICANDO se sala já existe');
      const exists = await roomExistsHybrid(roomCode);
      console.log('   └─ Sala existe?', exists);
      
      if (exists) {
        const errorMsg = `Sala "${roomCode}" já existe. Escolha outro código.`;
        console.log('❌ handleCreateRoom - ERRO:', errorMsg);
        setError(errorMsg);
        return;
      }

      // Carregar dados de exemplo para nova sala
      console.log('📊 handleCreateRoom - CARREGANDO dados de exemplo');
      const sampleTasks = await loadSampleData();
      console.log('   └─ Dados carregados:', sampleTasks.length, 'tarefas');
      
      // Criar sala com dados de exemplo (usar função híbrida)
      console.log('🏗️ handleCreateRoom - CHAMANDO createRoomHybrid');
      const createdRoom = await createRoomHybrid(roomCode, sampleTasks);
      console.log('✅ handleCreateRoom - Sala criada com sucesso:', createdRoom);
      
      // Fechar modal e notificar
      console.log('✨ handleCreateRoom - FINALIZANDO processo');
      onRoomSelected(roomCode);
      setNewRoomCode('');
      console.log('🎉 handleCreateRoom - PROCESSO CONCLUÍDO COM SUCESSO');
      
    } catch (error) {
      const errorMsg = 'Erro ao criar sala: ' + error.message;
      console.error('❌ handleCreateRoom - ERRO GERAL:', error);
      console.error('   └─ Error message:', error.message);
      console.error('   └─ Error stack:', error.stack);
      setError(errorMsg);
    } finally {
      console.log('🔄 handleCreateRoom - FINALIZANDO loading');
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

  const handleDeleteRoom = async (roomCode, event) => {
    // Prevenir propagação para não selecionar a sala
    event.stopPropagation();
    
    console.log('🗑️ handleDeleteRoom - INÍCIO:', roomCode);
    
    if (!window.confirm(`Tem certeza que deseja remover a sala "${roomCode}"?\n\n⚠️ Esta ação irá:\n• Apagar todas as tarefas da sala\n• Remover a sala permanentemente\n• Não pode ser desfeita`)) {
      return;
    }

    setLoading(true);
    try {
      if (isSupabaseMode && supabaseService) {
        console.log('☁️ handleDeleteRoom - Removendo do Supabase:', roomCode);
        
        // Inicializar service se necessário
        await supabaseService.initialize();
        
        // Encontrar sala no Supabase
        const room = await supabaseService.findRoomByCode(roomCode);
        if (room) {
          // Remover todas as tarefas da sala primeiro
          const tasks = await supabaseService.getTasks(room.id);
          for (const task of tasks) {
            await supabaseService.deleteTask(task.id);
          }
          
          // Remover a sala
          await supabaseService.deleteRoom(room.id);
          console.log('✅ handleDeleteRoom - Sala removida do Supabase');
        }
      }
      
      // Sempre remover do localStorage também
      console.log('💾 handleDeleteRoom - Removendo do localStorage:', roomCode);
      
      // Usar a mesma chave que o storage.js usa (tasktracker_room_)
      const storageKey = `tasktracker_room_${roomCode}`;
      localStorage.removeItem(storageKey);
      console.log('   └─ Removida chave:', storageKey);
      
      // Também remover chaves antigas se existirem (compatibilidade)
      const oldStorageKey = `tasktracker_tasks_${roomCode}`;
      localStorage.removeItem(oldStorageKey);
      console.log('   └─ Removida chave antiga:', oldStorageKey);
      
      // Limpar dados da sala atual se for esta sala  
      const currentRoomFromStorage = getCurrentRoom();
      console.log('   └─ Sala atual no storage:', currentRoomFromStorage);
      console.log('   └─ Sala sendo removida:', roomCode);
      console.log('   └─ Sala atual no estado:', currentRoom);
      
      if (currentRoomFromStorage === roomCode) {
        setCurrentRoom('');
        console.log('   └─ Limpou sala atual no storage');
      }
      
      if (currentRoom === roomCode) {
        setCurrentRoomState('');
        console.log('   └─ Limpou sala atual no estado');
      }
      
      console.log('✅ handleDeleteRoom - Sala removida completamente');
      
      // Recarregar lista de salas
      console.log('🔄 handleDeleteRoom - Recarregando lista de salas');
      const rooms = await getAvailableRoomsHybrid();
      console.log('   └─ Novas salas carregadas:', rooms.length);
      setAvailableRooms(rooms);
      
    } catch (error) {
      console.error('❌ handleDeleteRoom - Erro:', error);
      setError('Erro ao remover sala: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupIcon />
          Seleção de Sala/Projeto
        </Box>
        <Button
          onClick={onRoomSelected ? () => onRoomSelected(null) : undefined}
          startIcon={<ExitIcon />}
          size="small"
          color="inherit"
          sx={{ 
            textTransform: 'none',
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
        >
          Sair
        </Button>
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
                    sx={{ pr: 1 }}
                  >
                    <ListItemText
                      primary={room.name}
                      secondary={`${room.taskCount} tarefas`}
                    />
                    {room.code === currentRoom && (
                      <Chip label="Atual" size="small" color="primary" sx={{ mr: 1 }} />
                    )}
                    <Button
                      size="small"
                      color="error"
                      onClick={(e) => handleDeleteRoom(room.code, e)}
                      sx={{ 
                        minWidth: 'auto',
                        width: 32,
                        height: 32,
                        p: 0,
                        '&:hover': {
                          backgroundColor: 'error.light',
                          color: 'white'
                        }
                      }}
                      title={`Remover sala ${room.code}`}
                    >
                      <DeleteIcon fontSize="small" />
                    </Button>
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
          
          {/* Seleção de Persistência */}
          <Card sx={{ mb: 2, p: 2, backgroundColor: 'background.default' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              💾 Escolha onde salvar os dados:
              <Button 
                size="small" 
                onClick={() => setShowPersistenceInfo(!showPersistenceInfo)}
                startIcon={<InfoIcon />}
              >
                {showPersistenceInfo ? 'Ocultar' : 'Saiba mais'}
              </Button>
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: showPersistenceInfo ? 2 : 0 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={selectedPersistenceMode === 'supabase'}
                    onChange={(e) => setSelectedPersistenceMode(e.target.checked ? 'supabase' : 'localStorage')}
                    disabled={!isSupabaseConfigured() || !auth?.isAuthenticated}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {selectedPersistenceMode === 'supabase' ? <CloudIcon /> : <StorageIcon />}
                    {selectedPersistenceMode === 'supabase' ? 'Nuvem (Supabase)' : 'Local (Navegador)'}
                  </Box>
                }
              />
              
              {/* Indicador de status de autenticação */}
              {!isSupabaseConfigured() && (
                <Typography variant="caption" color="error" sx={{ ml: 4 }}>
                  ⚠️ Supabase não configurado
                </Typography>
              )}
              
              {isSupabaseConfigured() && !auth?.isAuthenticated && (
                <Typography variant="caption" color="warning.main" sx={{ ml: 4 }}>
                  ⚠️ Faça login primeiro usando os botões 📝 ou 🔐 no cabeçalho
                </Typography>
              )}
              
              {isSupabaseConfigured() && auth?.isAuthenticated && (
                <Typography variant="caption" color="success.main" sx={{ ml: 4 }}>
                  ✅ Logado como: {auth.user?.email}
                </Typography>
              )}
            </Box>
            
            {showPersistenceInfo && (
              <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2" color="info.dark">
                  <strong>💾 Local (Navegador):</strong><br />
                  • Dados salvos apenas neste dispositivo<br />
                  • Mais rápido, funciona offline<br />
                  • Compartilhamento por código da sala apenas<br /><br />
                  
                  <strong>☁️ Nuvem (Supabase):</strong><br />
                  • Dados sincronizados entre dispositivos<br />
                  • Backup automático na nuvem<br />
                  • Acesso controlado por usuário<br />
                  • {!auth?.isAuthenticated && '⚠️ Requer login com Google'}
                </Typography>
              </Box>
            )}
          </Card>
          
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
          
          {loading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {selectedPersistenceMode === 'supabase' ? 
                  'Criando sala na nuvem...' : 
                  'Criando sala localmente...'
                }
              </Typography>
            </Box>
          )}
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
      
      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          {isSupabaseMode ? 'Dados sincronizados com Supabase' : 'Os dados são compartilhados localmente'}
        </Typography>
        <Button 
          onClick={onRoomSelected ? () => onRoomSelected(null) : undefined}
          startIcon={<CloseIcon />}
          color="inherit"
          sx={{ textTransform: 'none' }}
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoomSelector;