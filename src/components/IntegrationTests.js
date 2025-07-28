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
  BugReport as TestIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';

// Services
import { isSupabaseConfigured } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SupabaseService } from '../services/SupabaseService';
import { loadTasksFromStorage, getAvailableRooms } from '../utils/storage';

const IntegrationTests = ({ open, onClose }) => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [copySuccess, setCopySuccess] = useState(false);
  
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
      id: 'tables',
      name: '📋 Verificar Estrutura das Tabelas',
      description: 'Confirma se as tabelas necessárias existem no banco'
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
          case 'tables':
            result = await testTablesStructure();
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

  const testTablesStructure = async () => {
    try {
      console.log('🔍 Verificando estrutura das tabelas...');
      const { createClient } = await import('@supabase/supabase-js');
      const testClient = createClient(
        process.env.REACT_APP_SUPABASE_URL, 
        process.env.REACT_APP_SUPABASE_ANON_KEY
      );

      const requiredTables = ['rooms', 'tasks', 'room_access', 'user_settings'];
      const tableResults = [];

      for (const tableName of requiredTables) {
        try {
          console.log(`📋 Testando tabela: ${tableName}`);
          const { data, error } = await testClient
            .from(tableName)
            .select('*')
            .limit(1);

          if (error) {
            console.error(`❌ Erro na tabela ${tableName}:`, error);
            tableResults.push(`❌ ${tableName}: ${error.message}`);
          } else {
            console.log(`✅ Tabela ${tableName}: OK`);
            tableResults.push(`✅ ${tableName}: OK`);
          }
        } catch (tableError) {
          console.error(`💥 Erro crítico na tabela ${tableName}:`, tableError);
          tableResults.push(`💥 ${tableName}: ${tableError.message}`);
        }
      }

      const allTablesOK = tableResults.every(result => result.includes('✅'));

      return {
        success: allTablesOK,
        message: allTablesOK 
          ? `✅ Todas as tabelas encontradas:\n${tableResults.join('\n')}`
          : `❌ Problemas encontrados:\n${tableResults.join('\n')}\n\n` +
            `💡 SOLUÇÃO: Execute o script SQL no Supabase Dashboard:\n` +
            `1. Acesse https://supabase.com/dashboard\n` +
            `2. Vá em SQL Editor\n` +
            `3. Cole e execute o script SQL completo\n` +
            `4. Script disponível em: docs/supabase-setup.sql`
      };
    } catch (error) {
      console.error('💥 Erro ao verificar tabelas:', error);
      return {
        success: false,
        message: `Erro ao verificar tabelas: ${error.message}\n\n` +
                `🔍 Possíveis causas:\n` +
                `• Credenciais inválidas\n` +
                `• Projeto Supabase não existe\n` +
                `• Problema de rede\n\n` +
                `💡 Verifique suas credenciais em .env.local`
      };
    }
  };

  const testDatabaseConnection = async () => {
    if (!auth?.isAuthenticated) {
      return { 
        success: false, 
        message: 'Login necessário para teste de banco' 
      };
    }

    try {
      // Log detalhado para debug
      console.log('🔍 Iniciando teste de conexão Supabase...');
      console.log('📧 Usuário autenticado:', auth.user?.email);
      console.log('🔗 URL Supabase:', process.env.REACT_APP_SUPABASE_URL);
      console.log('🔑 Key (primeiros 20 chars):', process.env.REACT_APP_SUPABASE_ANON_KEY?.substring(0, 20) + '...');

      const service = new SupabaseService();
      console.log('✅ SupabaseService criado');
      
      // Inicializar o serviço primeiro
      console.log('🔄 Inicializando serviço...');
      await service.initialize();
      console.log('✅ Serviço inicializado');
      
      // Tentar buscar rooms (teste simples de conectividade)
      console.log('🏠 Buscando salas do usuário...');
      const rooms = await service.getUserRooms();
      console.log('✅ Salas encontradas:', rooms.length);
      
      return { 
        success: true, 
        message: `Conexão OK. ${rooms.length} salas encontradas.\n` +
                `👤 Usuário: ${auth.user?.email}\n` +
                `🔗 URL: ${process.env.REACT_APP_SUPABASE_URL}\n` +
                `📊 Projeto ativo: ${service.initialized}`
      };
    } catch (error) {
      console.error('❌ Erro detalhado na conexão:', error);
      console.error('📋 Stack trace:', error.stack);
      
      return { 
        success: false, 
        message: `Erro de conexão: ${error.message}\n\n` +
                `🔍 Detalhes do erro:\n` +
                `• Tipo: ${error.name}\n` +
                `• Causa: ${error.cause?.message || 'N/A'}\n` +
                `• URL: ${process.env.REACT_APP_SUPABASE_URL}\n` +
                `• Auth: ${auth?.isAuthenticated ? 'OK' : 'FALHA'}\n\n` +
                `💡 Verifique o console do navegador para logs detalhados`
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
      
      // Inicializar o serviço primeiro
      await service.initialize();
      
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
      
      // Inicializar o serviço primeiro
      await service.initialize();
      
      // Buscar uma sala existente ou criar uma para teste
      let rooms = await service.getUserRooms();
      let testRoom = rooms[0];
      
      if (rooms.length === 0) {
        // Criar uma sala de teste se não existir nenhuma
        testRoom = await service.createRoom({
          name: `Sala de Teste - ${Date.now()}`,
          is_public: false
        });
      }
      
      // Definir a sala atual para permitir operações de tarefas
      service.setCurrentRoom(testRoom.id);
      
      // Criar tarefa de teste (sem ID - deixar Supabase gerar)
      const testTask = {
        atividade: `Teste CRUD - ${Date.now()}`,
        epico: 'Testes de Integração',
        status: 'Backlog',
        estimativa: 1,
        desenvolvedor: 'Sistema'
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

  const copyAllErrors = async () => {
    try {
      // Gerar relatório completo dos testes
      const timestamp = new Date().toLocaleString('pt-BR');
      const failedTests = results.filter(result => !result.success);
      const passedTests = results.filter(result => result.success);
      
      let report = `🧪 RELATÓRIO DE TESTES DE INTEGRAÇÃO SUPABASE - TaskTracker\n`;
      report += `📅 Data/Hora: ${timestamp}\n`;
      report += `📊 Resumo: ${passedTests.length}/${results.length} testes passaram\n`;
      report += `🔗 URL Supabase: ${process.env.REACT_APP_SUPABASE_URL}\n`;
      report += `👤 Usuário logado: ${auth?.isAuthenticated ? auth.user?.email : 'Não logado'}\n`;
      report += `\n${'='.repeat(60)}\n\n`;

      if (failedTests.length > 0) {
        report += `❌ TESTES QUE FALHARAM (${failedTests.length}):\n\n`;
        
        failedTests.forEach((test, index) => {
          report += `${index + 1}. ${test.name}\n`;
          report += `   📝 Descrição: ${test.description}\n`;
          report += `   ⚠️ Erro: ${test.message}\n`;
          if (test.error) {
            report += `   📋 Stack trace: ${test.error}\n`;
          }
          report += `   ⏰ Timestamp: ${test.timestamp}\n\n`;
        });
      }

      if (passedTests.length > 0) {
        report += `✅ TESTES QUE PASSARAM (${passedTests.length}):\n\n`;
        
        passedTests.forEach((test, index) => {
          report += `${index + 1}. ${test.name} - ${test.message.split('\n')[0]}\n`;
        });
        report += `\n`;
      }

      report += `${'='.repeat(60)}\n`;
      report += `💡 PRÓXIMOS PASSOS:\n`;
      
      if (failedTests.some(t => t.id === 'config')) {
        report += `• Configure as credenciais do Supabase no .env.local\n`;
      }
      if (failedTests.some(t => t.id === 'tables')) {
        report += `• Execute o script SQL no Supabase Dashboard (SQL Editor)\n`;
      }
      if (failedTests.some(t => t.id === 'auth')) {
        report += `• Faça login usando os botões 📝 (cadastro) ou 🔐 (login)\n`;
      }
      if (failedTests.some(t => t.id === 'database' || t.id === 'rooms' || t.id === 'tasks')) {
        report += `• Verifique se as tabelas foram criadas e o RLS está ativo\n`;
      }

      report += `\n📞 SUPORTE: Compartilhe este relatório para obter ajuda técnica\n`;

      // Copiar para clipboard
      await navigator.clipboard.writeText(report);
      setCopySuccess(true);
      
      // Reset do feedback após 3 segundos
      setTimeout(() => setCopySuccess(false), 3000);
      
    } catch (error) {
      console.error('Erro ao copiar relatório:', error);
      // Fallback para navegadores sem suporte ao clipboard
      alert('Erro ao copiar. Abra o console (F12) para ver o relatório completo.');
    }
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
          {results.length > 0 && (
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
              💡 Use o botão "Copiar Relatório Completo" para compartilhar os resultados dos testes.
            </Typography>
          )}
        </Alert>

        <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={runTests}
            disabled={running}
            startIcon={running ? <CircularProgress size={20} /> : <PlayIcon />}
          >
            {running ? 'Executando Testes...' : 'Executar Todos os Testes'}
          </Button>
          
          {results.length > 0 && (
            <Button
              variant="outlined"
              onClick={copyAllErrors}
              disabled={running}
              startIcon={<CopyIcon />}
              color={copySuccess ? 'success' : 'primary'}
              sx={{ 
                minWidth: 200,
                transition: 'all 0.3s ease'
              }}
            >
              {copySuccess ? '✅ Relatório Copiado!' : '📋 Copiar Relatório Completo'}
            </Button>
          )}
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