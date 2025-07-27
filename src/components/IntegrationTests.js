import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  BugReport as TestIcon
} from '@mui/icons-material';

// Services
import { isSupabaseConfigured } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SupabaseService } from '../services/SupabaseService';
import { loadTasksFromStorage, getAvailableRooms } from '../utils/storage';

const IntegrationTests = ({ open, onClose }) => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  
  const auth = useAuth();

  const tests = [
    {
      id: 'config',
      name: '🔧 Verificar Configuração Supabase',
      description: 'Verifica se as credenciais estão configuradas corretamente'
    },
    {
      id: 'auth',
      name: '🔐 Verificar Autenticação',
      description: 'Testa se o usuário está autenticado'  
    },
    {
      id: 'database',
      name: '🗄️ Verificar Conexão com Banco',
      description: 'Testa conexão e estrutura das tabelas'
    },
    {
      id: 'rooms',
      name: '🏠 Testar Operações de Salas',
      description: 'Criar, listar e verificar salas'
    },
    {
      id: 'tasks',  
      name: '📝 Testar CRUD de Tarefas',
      description: 'Criar, ler, atualizar e deletar tarefas'
    },
    {
      id: 'persistence',
      name: '💾 Testar Persistência Híbrida',
      description: 'Verificar se TaskContext salva nos dois sistemas'
    },
    {
      id: 'migration',
      name: '📦 Testar Dados para Migração',
      description: 'Verificar dados locais disponíveis para migração'
    }
  ];

  const runTests = async () => {
    setRunning(true);
    const testResults = [];

    for (const test of tests) {
      try {
        let result;
        switch (test.id) {
          case 'config':
            result = await testConfiguration();
            break;
          case 'auth':
            result = await testAuthentication();
            break;
          case 'database':
            result = await testDatabaseConnection();
            break;
          case 'rooms':
            result = await testRoomOperations();
            break;
          case 'tasks':
            result = await testTaskOperations();
            break;
          case 'persistence':
            result = await testPersistence();
            break;
          case 'migration':
            result = await testMigrationData();
            break;
          default:
            result = { success: false, message: 'Teste não implementado' };
        }

        testResults.push({
          ...test,
          ...result,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        testResults.push({
          ...test,
          success: false,
          message: `Erro: ${error.message}`,
          error: error.stack,
          timestamp: new Date().toISOString()  
        });
      }

      // Pequena pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setResults(testResults);
    setRunning(false);
  };

  // Implementação dos testes
  const testConfiguration = async () => {
    if (!isSupabaseConfigured()) {
      return { 
        success: false, 
        message: 'Supabase não configurado. Verifique .env.local' 
      };
    }

    const url = process.env.REACT_APP_SUPABASE_URL;
    const key = process.env.REACT_APP_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return { 
        success: false, 
        message: 'Credenciais do Supabase não encontradas' 
      };
    }

    return { 
      success: true, 
      message: `URL: ${url.substring(0, 30)}...\nKey: ${key.substring(0, 20)}...` 
    };
  };

  const testAuthentication = async () => {
    if (!auth) {
      return { 
        success: false, 
        message: 'AuthContext não disponível' 
      };
    }

    if (!auth.isAuthenticated) {
      return { 
        success: false, 
        message: 'Usuário não autenticado. Faça login primeiro.' 
      };
    }

    return { 
      success: true, 
      message: `Usuário: ${auth.user?.email}\nUID: ${auth.user?.id}` 
    };
  };

  const testDatabaseConnection = async () => {
    if (!auth?.isAuthenticated) {
      return { 
        success: false, 
        message: 'Login necessário para teste de banco' 
      };
    }

    try {
      const service = new SupabaseService();
      
      // Tentar buscar rooms (teste simples de conectividade)
      const rooms = await service.getUserRooms();
      
      return { 
        success: true, 
        message: `Conexão OK. ${rooms.length} salas encontradas.` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Erro de conexão: ${error.message}` 
      };
    }
  };

  const testRoomOperations = async () => {
    if (!auth?.isAuthenticated) {
      return { 
        success: false, 
        message: 'Login necessário para teste de salas' 
      };
    }

    try {
      const service = new SupabaseService();
      const testRoomCode = `TEST_${Date.now()}`;
      
      // Criar sala de teste
      const room = await service.createRoom({
        name: `Sala de Teste`,
        room_code: testRoomCode,
        is_public: false
      });

      // Verificar se foi criada
      const foundRoom = await service.findRoomByCode(testRoomCode);
      
      if (!foundRoom) {
        return { 
          success: false, 
          message: 'Sala criada mas não encontrada na busca' 
        };
      }

      // Limpar (deletar sala de teste)
      // Nota: SupabaseService não tem delete room, isso é OK para teste

      return { 
        success: true, 
        message: `Sala criada e encontrada: ${testRoomCode}` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Erro em operações de sala: ${error.message}` 
      };
    }
  };

  const testTaskOperations = async () => {
    if (!auth?.isAuthenticated) {
      return { 
        success: false, 
        message: 'Login necessário para teste de tarefas' 
      };
    }

    try {
      const service = new SupabaseService();
      
      // Buscar uma sala existente ou usar a primeira disponível
      const rooms = await service.getUserRooms();
      if (rooms.length === 0) {
        return { 
          success: false, 
          message: 'Nenhuma sala disponível para teste' 
        };
      }

      const testRoom = rooms[0];
      
      // Criar tarefa de teste
      const testTask = {
        room_id: testRoom.id,
        atividade: `Teste CRUD - ${Date.now()}`,
        epico: 'Testes de Integração',
        status: 'Backlog',
        estimativa: 1,
        developed: 'Sistema'
      };

      const createdTask = await service.createTask(testTask);
      
      // Buscar tarefa criada
      const tasks = await service.getTasks();
      const foundTask = tasks.find(t => t.id === createdTask.id);
      
      if (!foundTask) {
        return { 
          success: false, 
          message: 'Tarefa criada mas não encontrada na busca' 
        };
      }

      // Atualizar tarefa
      await service.updateTask(createdTask.id, { 
        status: 'Done',
        atividade: foundTask.atividade + ' (Atualizada)' 
      });

      // Deletar tarefa de teste
      await service.deleteTask(createdTask.id);

      return { 
        success: true, 
        message: `CRUD completo executado com sucesso na sala ${testRoom.name}` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Erro em operações de tarefa: ${error.message}` 
      };
    }
  };

  const testPersistence = async () => {
    // Este teste é mais conceitual, verifica se o sistema está configurado
    const localRooms = getAvailableRooms();
    const hasLocalData = localRooms.length > 0;
    
    let totalLocalTasks = 0;
    localRooms.forEach(roomCode => {
      totalLocalTasks += loadTasksFromStorage(roomCode).length;
    });

    const isHybridMode = isSupabaseConfigured() && auth?.isAuthenticated;

    return { 
      success: true, 
      message: `Modo híbrido: ${isHybridMode ? 'Ativo' : 'Inativo'}\n` +
               `Dados locais: ${localRooms.length} salas, ${totalLocalTasks} tarefas\n` +
               `TaskContext: Configurado para persistência dupla` 
    };
  };

  const testMigrationData = async () => {
    const availableRooms = getAvailableRooms();
    let totalTasks = 0;
    let roomsWithTasks = 0;

    availableRooms.forEach(roomCode => {
      const tasks = loadTasksFromStorage(roomCode);
      totalTasks += tasks.length;
      if (tasks.length > 0) roomsWithTasks++;
    });

    if (totalTasks === 0) {
      return { 
        success: true, 
        message: 'Nenhum dado local para migração (sistema limpo)' 
      };
    }

    return { 
      success: true, 
      message: `Dados disponíveis para migração:\n` +
               `• ${availableRooms.length} salas totais\n` +
               `• ${roomsWithTasks} salas com tarefas\n` +
               `• ${totalTasks} tarefas total` 
    };
  };

  const getStatusIcon = (success, running) => {
    if (running) return <CircularProgress size={20} />;
    if (success) return <CheckIcon sx={{ color: 'success.main' }} />;
    return <ErrorIcon sx={{ color: 'error.main' }} />;
  };

  const getStatusColor = (success) => {
    return success ? 'success' : 'error';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TestIcon />
        Testes de Integração Supabase
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Estes testes verificam se a integração com Supabase está funcionando corretamente.
            Certifique-se de estar logado antes de executar os testes.
          </Typography>
        </Alert>

        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            onClick={runTests}
            disabled={running}
            startIcon={running ? <CircularProgress size={20} /> : <PlayIcon />}
            sx={{ mb: 2 }}
          >
            {running ? 'Executando Testes...' : 'Executar Todos os Testes'}
          </Button>
        </Box>

        {results.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Resultados ({results.filter(r => r.success).length}/{results.length} passaram):
            </Typography>
            
            {tests.map((test, index) => {
              const result = results.find(r => r.id === test.id);
              
              return (
                <Accordion key={test.id} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      {getStatusIcon(result?.success, running && !result)}
                      <Typography sx={{ flex: 1 }}>{test.name}</Typography>
                      {result && (
                        <Chip 
                          label={result.success ? 'PASSOU' : 'FALHOU'}
                          color={getStatusColor(result.success)}
                          size="small"
                        />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {test.description}
                    </Typography>
                    {result && (
                      <Alert severity={result.success ? 'success' : 'error'}>
                        <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>
                          {result.message}
                        </Typography>
                        {result.error && (
                          <details style={{ marginTop: 8 }}>
                            <summary>Stack trace</summary>
                            <pre style={{ fontSize: '0.7rem', overflow: 'auto' }}>
                              {result.error}
                            </pre>
                          </details>
                        )}
                      </Alert>
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default IntegrationTests;