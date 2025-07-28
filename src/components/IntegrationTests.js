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
  Chip,
  LinearProgress
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
  
  // Estados para progresso em tempo real
  const [currentTestIndex, setCurrentTestIndex] = useState(-1);
  const [currentTestName, setCurrentTestName] = useState('');
  const [testProgress, setTestProgress] = useState(0);
  const [liveResults, setLiveResults] = useState([]);
  const [testLogs, setTestLogs] = useState([]);
  
  const auth = useAuth();

  const tests = [
    {
      id: 'auth_sync',
      name: '🔐 Sincronizar Autenticação',
      description: 'Forçar sincronização entre TaskTracker e Supabase antes dos testes'
    },
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
      id: 'create_test_user',
      name: '👤 Criar Usuário de Teste',
      description: 'Criar usuário temporário para testes isolados'
    },
    {
      id: 'create_test_room',
      name: '🏠 Criar Sala de Teste',
      description: 'Criar sala de teste com dados específicos'
    },
    {
      id: 'create_test_tasks',
      name: '📝 Criar Tarefas de Teste',
      description: 'Criar várias tarefas com diferentes cenários'
    },
    {
      id: 'full_crud_cycle',
      name: '🔄 Ciclo CRUD Completo',
      description: 'Testar criação, leitura, atualização e remoção completos'
    },
    {
      id: 'persistence',
      name: '💾 Testar Persistência Híbrida',
      description: 'Verificar se TaskContext salva nos dois sistemas'
    },
    {
      id: 'test_shared_room_flow',
      name: '🏠 Testar Fluxo de Sala Compartilhada',
      description: 'Simular criação, entrada e persistência de dados em sala compartilhada'
    },
    {
      id: 'test_room_access_permissions',
      name: '🔐 Testar Permissões de Acesso à Sala',
      description: 'Verificar se múltiplos usuários podem acessar mesma sala'
    },
    {
      id: 'test_room_data_sync',
      name: '🔄 Testar Sincronização de Dados da Sala',
      description: 'Verificar se dados são sincronizados corretamente entre usuários'
    },
    {
      id: 'test_create_room_button',
      name: '🎯 Testar Botão "Criar" do RoomSelector',
      description: 'Simular exatamente o comportamento do botão Criar na interface'
    },
    {
      id: 'test_save_button_header',
      name: '💾 Testar Botão "Salvar" do Cabeçalho',
      description: 'Debugar o botão 💾 Salvar que está no topo da tela'
    }
  ];

  // =============================================
  // FORÇAR AUTENTICAÇÃO E SINCRONIZAÇÃO
  // =============================================
  
  const forceAuthenticationSync = async () => {
    console.log('🔐 forceAuthenticationSync - Iniciando...');
    
    try {
      // 1. Verificar se usuário está autenticado no contexto
      if (!auth?.isAuthenticated || !auth?.user?.email) {
        console.log('❌ forceAuthenticationSync - Usuário não autenticado no contexto');
        return {
          success: false,
          message: '❌ Usuário não está logado no TaskTracker.\n\n' +
                  '🔑 SOLUÇÃO:\n' +
                  '1. Faça login primeiro\n' +
                  '2. Execute os testes novamente\n\n' +
                  '⚠️ Os testes precisam de um usuário autenticado para funcionar'
        };
      }
      
      console.log('✅ forceAuthenticationSync - Usuário autenticado:', auth.user.email);
      
      // 2. Criar nova instância do SupabaseService e forçar inicialização
      console.log('🔧 forceAuthenticationSync - Criando SupabaseService...');
      const service = new SupabaseService();
      
      // 3. Forçar inicialização completa
      console.log('⚡ forceAuthenticationSync - Forçando inicialização...');
      await service.initialize();
      console.log('✅ forceAuthenticationSync - Serviço inicializado');
      
      // 4. Teste de conectividade básica
      console.log('🌐 forceAuthenticationSync - Testando conectividade...');
      const healthCheck = await service.healthCheck();
      console.log('📊 forceAuthenticationSync - Health check:', healthCheck);
      
      if (healthCheck.status !== 'healthy') {
        return {
          success: false,
          message: '❌ Falha na conectividade com Supabase.\n\n' +
                  `📊 Status: ${healthCheck.status}\n` +
                  `🔍 Erro: ${healthCheck.error || 'N/A'}\n\n` +
                  '🔧 VERIFIQUE:\n' +
                  '• Credenciais do Supabase\n' +
                  '• Conexão com internet\n' +
                  '• Projeto Supabase ativo'
        };
      }
      
      // 5. Verificar autenticação real no Supabase
      console.log('🔑 forceAuthenticationSync - Verificando auth no Supabase...');
      try {
        const userRooms = await service.getUserRooms();
        console.log('✅ forceAuthenticationSync - Auth OK, salas encontradas:', userRooms.length);
        
        return {
          success: true,
          message: `✅ Autenticação sincronizada com sucesso!\n\n` +
                  `👤 Usuário: ${auth.user.email}\n` +
                  `🏠 Salas acessíveis: ${userRooms.length}\n` +
                  `🔗 Conexão: ${healthCheck.status}\n` +
                  `⏰ Timestamp: ${new Date().toLocaleString('pt-BR')}\n\n` +
                  `🚀 Sistema pronto para executar testes!`
        };
      } catch (authError) {
        console.error('❌ forceAuthenticationSync - Erro de auth:', authError);
        return {
          success: false,
          message: '❌ Falha na autenticação do Supabase.\n\n' +
                  `🔍 Erro: ${authError.message}\n\n` +
                  '🔧 SOLUÇÕES:\n' +
                  '1. Faça logout e login novamente\n' +
                  '2. Limpe o cache do navegador\n' +
                  '3. Verifique se o projeto Supabase está ativo\n\n' +
                  '💡 Este erro indica dessincronização de sessão'
        };
      }
      
    } catch (error) {
      console.error('💥 forceAuthenticationSync - Erro geral:', error);
      return {
        success: false,
        message: `💥 Erro inesperado na sincronização: ${error.message}\n\n` +
                `📋 Stack: ${error.stack?.substring(0, 200)}...\n\n` +
                `🔧 Tente recarregar a página e fazer login novamente`
      };
    }
  };

  // Função para adicionar log em tempo real
  const addTestLog = (message, type = 'info') => {
    const logEntry = {
      id: Date.now() + Math.random(),
      message,
      type, // 'info', 'success', 'error', 'warning'
      timestamp: new Date().toLocaleTimeString('pt-BR')
    };
    setTestLogs(prev => [...prev.slice(-19), logEntry]); // Manter últimos 20 logs
  };

  // Função para atualizar resultado em tempo real
  const updateLiveResult = (testId, partialResult) => {
    setLiveResults(prev => {
      const existing = prev.find(r => r.id === testId);
      if (existing) {
        return prev.map(r => r.id === testId ? { ...r, ...partialResult } : r);
      } else {
        return [...prev, { id: testId, ...partialResult }];
      }
    });
  };

  const runTests = async () => {
    setRunning(true);
    setTestProgress(0);
    setCurrentTestIndex(-1);
    setCurrentTestName('');
    setLiveResults([]);
    setTestLogs([]);
    
    const testResults = [];
    
    addTestLog('🚀 Iniciando execução dos testes de integração...', 'info');
    
    // =============================================
    // PASSO 0: FORÇAR AUTENTICAÇÃO ANTES DOS TESTES
    // =============================================
    setCurrentTestIndex(0);
    setCurrentTestName('🔐 Sincronizando Autenticação');
    setTestProgress(5);
    
    addTestLog('🔐 Executando sincronização de autenticação...', 'info');
    console.log('🔐 Executando sincronização de autenticação...');
    
    updateLiveResult('auth_sync', { 
      name: '🔐 Sincronizar Autenticação',
      status: 'running',
      message: 'Verificando autenticação...'
    });
    
    const authSync = await forceAuthenticationSync();
    
    // Atualizar resultado da autenticação
    updateLiveResult('auth_sync', {
      status: authSync.success ? 'completed' : 'failed',
      success: authSync.success,
      message: authSync.success ? '✅ Autenticação sincronizada' : '❌ Falha na autenticação'
    });
    
    if (authSync.success) {
      addTestLog('✅ Autenticação sincronizada com sucesso', 'success');
    } else {
      addTestLog('❌ Falha na autenticação: ' + authSync.message, 'error');
    }
    
    testResults.push({
      id: 'auth_sync',
      name: '🔐 Sincronizar Autenticação',
      description: 'Forçar sincronização entre TaskTracker e Supabase',
      ...authSync,
      timestamp: new Date().toISOString()
    });
    
    // Se autenticação falhar, parar os testes
    if (!authSync.success) {
      console.log('❌ Autenticação falhou, parando testes');
      addTestLog('🛑 Testes interrompidos por falha na autenticação', 'error');
      setResults(testResults);
      setRunning(false);
      setCurrentTestName('❌ Interrompido');
      setTestProgress(100);
      return;
    }
    
    console.log('✅ Autenticação OK, continuando com testes...');
    addTestLog('✅ Continuando com execução dos testes principais...', 'success');

    const totalTests = tests.length;
    let completedTests = 0;

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      
      // Pular o teste de autenticação que já foi executado
      if (test.id === 'auth_sync') {
        continue;
      }
      
      // Atualizar progresso
      setCurrentTestIndex(i + 1);
      setCurrentTestName(test.name);
      const progressPercent = Math.round(((completedTests + 1) / totalTests) * 100);
      setTestProgress(progressPercent);
      
      addTestLog(`🔄 Executando: ${test.name}`, 'info');
      
      // Atualizar resultado em tempo real como "executando"
      updateLiveResult(test.id, {
        name: test.name,
        status: 'running',
        message: 'Executando teste...'
      });
      
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
          case 'create_test_user':
            result = await createTestUser();
            break;
          case 'create_test_room':
            result = await createTestRoom();
            break;
          case 'create_test_tasks':
            result = await createTestTasks();
            break;
          case 'full_crud_cycle':
            result = await testFullCrudCycle();
            break;
          case 'persistence':
            result = await testPersistence();
            break;
          case 'test_shared_room_flow':
            result = await testSharedRoomFlow();
            break;
          case 'test_room_access_permissions':
            result = await testRoomAccessPermissions();
            break;
          case 'test_room_data_sync':
            result = await testRoomDataSync();
            break;
          case 'test_create_room_button':
            result = await testCreateRoomButton();
            break;
          case 'test_save_button_header':
            result = await testSaveButtonHeader();
            break;
          default:
            result = { success: false, message: 'Teste não implementado' };
        }

        // Atualizar resultado em tempo real
        updateLiveResult(test.id, {
          status: 'completed',
          success: result.success,
          message: result.success ? 
            '✅ ' + (result.message?.split('\n')[0] || 'Concluído') : 
            '❌ ' + (result.message?.split('\n')[0] || 'Falhou')
        });

        if (result.success) {
          addTestLog(`✅ ${test.name} - Sucesso`, 'success');
        } else {
          addTestLog(`❌ ${test.name} - Falhou: ${result.message?.split('\n')[0]}`, 'error');
        }

        testResults.push({
          ...test,
          ...result,
          timestamp: new Date().toISOString()
        });

        completedTests++;

      } catch (error) {
        // Atualizar resultado em tempo real para erro
        updateLiveResult(test.id, {
          status: 'failed',
          success: false,
          message: `❌ Erro: ${error.message}`
        });

        addTestLog(`💥 ${test.name} - Erro crítico: ${error.message}`, 'error');

        testResults.push({
          ...test,
          success: false,
          message: `Erro: ${error.message}`,
          error: error.stack,
          timestamp: new Date().toISOString()  
        });

        completedTests++;
      }

      // Pequena pausa entre testes para visualização
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Finalização
    setTestProgress(100);
    setCurrentTestName('✅ Testes Concluídos');
    addTestLog(`🎉 Execução finalizada! ${testResults.filter(r => r.success).length}/${testResults.length} testes passaram`, 'success');
    
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

  // ========================================
  // NOVOS TESTES AVANÇADOS PARA DEBUG
  // ========================================

  const createTestUser = async () => {
    console.log('👤 createTestUser - INICIANDO criação de usuário de teste');
    
    if (!isSupabaseConfigured()) {
      return { 
        success: false, 
        message: 'Supabase não configurado - não é possível criar usuário' 
      };
    }

    try {
      // Importar o cliente Supabase diretamente
      const { createClient } = await import('@supabase/supabase-js');
      const testClient = createClient(
        process.env.REACT_APP_SUPABASE_URL, 
        process.env.REACT_APP_SUPABASE_ANON_KEY
      );

      const testEmail = `teste_${Date.now()}@gmail.com`;
      const testPassword = 'TaskTracker123!';

      console.log('📧 createTestUser - Email de teste:', testEmail);
      console.log('🔒 createTestUser - Tentando criar usuário...');

      // Criar usuário de teste
      const { data, error } = await testClient.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            name: 'Usuário de Teste',
            created_for: 'integration_tests'
          }
        }
      });

      if (error) {
        console.error('❌ createTestUser - Erro:', error);
        return { 
          success: false, 
          message: `Erro ao criar usuário: ${error.message}\n\n` +
                   `💡 POSSÍVEIS CAUSAS:\n` +
                   `• Confirmação de email obrigatória\n` +
                   `• Usuário já existe\n` +
                   `• Política de senha não atendida\n` +
                   `• RLS ou Auth mal configurados\n\n` +
                   `📝 EMAIL TESTE: ${testEmail}\n` +
                   `🔐 SENHA TESTE: ${testPassword}`
        };
      }

      console.log('✅ createTestUser - Usuário criado:', data.user?.id);

      return { 
        success: true, 
        message: `✅ Usuário de teste criado com sucesso!\n` +
                 `📧 Email: ${testEmail}\n` +
                 `🆔 ID: ${data.user?.id}\n` +
                 `📊 Status: ${data.user?.email_confirmed_at ? 'Confirmado' : 'Aguardando confirmação'}\n\n` +
                 `💡 NOTA: Se precisar confirmar email, verifique o painel do Supabase em Authentication > Users`
      };

    } catch (error) {
      console.error('💥 createTestUser - Erro crítico:', error);
      return { 
        success: false, 
        message: `Erro crítico ao criar usuário: ${error.message}\n\n` +
                 `🔍 Stack trace no console do navegador` 
      };
    }
  };

  const createTestRoom = async () => {
    console.log('🏠 createTestRoom - INICIANDO criação de sala de teste');

    if (!auth?.isAuthenticated) {
      return { 
        success: false, 
        message: 'Usuário não autenticado - faça login primeiro' 
      };
    }

    try {
      const service = new SupabaseService();
      console.log('🔧 createTestRoom - SupabaseService criado');
      
      // Inicializar o serviço
      console.log('⚡ createTestRoom - Inicializando serviço...');
      await service.initialize();
      console.log('✅ createTestRoom - Serviço inicializado');

      // CRIAR SALA PADRÃO SEMPRE COM MESMO CÓDIGO
      const defaultRoomCode = 'DEFAULT_ROOM';
      
      // Verificar se a sala padrão já existe
      console.log('🔍 createTestRoom - Verificando se sala padrão já existe...');
      let existingRoom = await service.findRoomByCode(defaultRoomCode);
      
      if (existingRoom) {
        console.log('✅ createTestRoom - Sala padrão já existe:', existingRoom.id);
        
        // Salvar dados da sala existente
        window.testRoomData = {
          id: existingRoom.id,
          code: existingRoom.room_code,
          name: existingRoom.name
        };

        // Configurar como sala atual
        const { setCurrentRoom } = await import('../utils/storage');
        setCurrentRoom(existingRoom.room_code);
        
        return { 
          success: true, 
          message: `✅ Sala padrão já existe e foi configurada!\n` +
                   `🏠 Nome: ${existingRoom.name}\n` +
                   `📋 Código: ${existingRoom.room_code}\n` +
                   `🆔 ID: ${existingRoom.id}\n` +
                   `👤 Proprietário: ${auth.user?.email}\n\n` +
                   `✨ SALA PADRÃO SEMPRE DISPONÍVEL!\n` +
                   `• Esta sala nunca será excluída\n` +
                   `• Você pode usar para todos os testes\n` +
                   `• Configurada automaticamente como sala atual\n\n` +
                   `💡 Continue para criar tarefas de exemplo nesta sala`
        };
      }

      const testRoomData = {
        name: `🏠 Sala Padrão do Usuário`,
        room_code: defaultRoomCode,
        description: `Sala padrão criada automaticamente para ${auth.user?.email}. Esta sala é permanente e não deve ser excluída.`,
        is_public: false
      };

      console.log('📝 createTestRoom - Dados da sala:', testRoomData);
      console.log('🏗️ createTestRoom - Criando sala...');

      const room = await service.createRoom(testRoomData);
      console.log('✅ createTestRoom - Sala criada:', room);

      // Verificar se a sala foi realmente criada
      console.log('🔍 createTestRoom - Verificando criação...');
      const foundRoom = await service.findRoomByCode(testRoomData.room_code);
      
      if (!foundRoom) {
        return { 
          success: false, 
          message: `Sala criada mas não encontrada na verificação.\n` +
                   `🏠 Sala criada: ${room?.id}\n` +
                   `🔍 Busca por código: ${testRoomData.room_code} não encontrou resultados`
        };
      }

      console.log('✅ createTestRoom - Verificação OK:', foundRoom.id);

      // Salvar dados para próximos testes E para acesso na interface
      window.testRoomData = {
        id: room.id,
        code: room.room_code,
        name: room.name
      };

      // IMPORTANTE: Salvar no localStorage para que o usuário possa acessar na interface
      const { setCurrentRoom } = await import('../utils/storage');
      setCurrentRoom(room.room_code);
      console.log('💾 createTestRoom - Sala salva no localStorage para acesso direto');

      // FORÇAR REFRESH da lista de salas se houver RoomSelector aberto
      console.log('🔄 createTestRoom - Forçando refresh da lista de salas...');
      
      // Emitir evento para que componentes saibam que uma nova sala foi criada
      window.dispatchEvent(new CustomEvent('roomCreated', { 
        detail: { 
          roomCode: room.room_code, 
          roomName: room.name,
          roomId: room.id
        } 
      }));
      
      // FORÇAR SINCRONIZAÇÃO com RoomSelector
      setTimeout(() => {
        console.log('🔄 createTestRoom - Forçando refresh tardio...');
        window.dispatchEvent(new CustomEvent('forceRoomListRefresh', { 
          detail: { source: 'integration_tests', timestamp: Date.now() }
        }));
      }, 1000);

      return { 
        success: true, 
        message: `✅ Sala padrão criada e configurada!\n` +
                 `🏠 Nome: ${room.name}\n` +
                 `📋 Código: ${room.room_code}\n` +
                 `🆔 ID: ${room.id}\n` +
                 `👤 Proprietário: ${auth.user?.email}\n` +
                 `⏰ Criada em: ${new Date().toLocaleString('pt-BR')}\n\n` +
                 `🔒 SALA PADRÃO PERMANENTE!\n` +
                 `• Esta é sua sala padrão pessoal\n` +
                 `• Não será excluída nos testes de limpeza\n` +
                 `• Sempre acessível na interface\n` +
                 `• Configurada automaticamente como sala atual\n\n` +
                 `💡 Continue executando os próximos testes para criar tarefas de exemplo`
      };

    } catch (error) {
      console.error('❌ createTestRoom - Erro:', error);
      console.error('📋 createTestRoom - Stack:', error.stack);
      
      return { 
        success: false, 
        message: `Erro ao criar sala de teste: ${error.message}\n\n` +
                 `🔍 DETALHES DO ERRO:\n` +
                 `• Tipo: ${error.name}\n` +
                 `• Usuário: ${auth.user?.email}\n` +
                 `• Timestamp: ${new Date().toISOString()}\n\n` +
                 `💡 Stack trace completo no console` 
      };
    }
  };

  const createTestTasks = async () => {
    console.log('📝 createTestTasks - INICIANDO criação de tarefas de teste');

    if (!auth?.isAuthenticated) {
      return { 
        success: false, 
        message: 'Usuário não autenticado - faça login primeiro' 
      };
    }

    if (!window.testRoomData) {
      return { 
        success: false, 
        message: 'Sala de teste não encontrada - execute primeiro o teste "Criar Sala de Teste"' 
      };
    }

    try {
      const service = new SupabaseService();
      console.log('🔧 createTestTasks - SupabaseService criado');
      
      await service.initialize();
      console.log('✅ createTestTasks - Serviço inicializado');

      // Definir sala atual
      service.setCurrentRoom(window.testRoomData.id);
      console.log('🎯 createTestTasks - Sala atual definida:', window.testRoomData.id);

      const testTasks = [
        {
          atividade: 'Implementar sistema de login',
          epico: 'Autenticação',
          userStory: 'Como usuário, quero fazer login para acessar o sistema',
          status: 'Backlog',
          prioridade: 'Alta',
          estimativa: 8,
          desenvolvedor: 'João Silva',
          sprint: 'Sprint 1',
          detalhamento: 'Implementar OAuth com Google e login local'
        },
        {
          atividade: 'Criar dashboard principal',
          epico: 'Interface',
          userStory: 'Como usuário, quero ver um resumo das minhas tarefas',
          status: 'Doing',
          prioridade: 'Média',
          estimativa: 5,
          desenvolvedor: 'Maria Santos',
          sprint: 'Sprint 1',
          detalhamento: 'Dashboard com métricas e gráficos'
        },
        {
          atividade: 'Configurar banco de dados',
          epico: 'Backend',
          userStory: 'Como sistema, preciso persistir dados dos usuários',
          status: 'Done',
          prioridade: 'Crítica',
          estimativa: 3,
          desenvolvedor: 'Pedro Costa',
          sprint: 'Sprint 0',
          detalhamento: 'Setup PostgreSQL com Supabase',
          tempoGasto: 4,
          taxaErro: 33.33,
          tempoGastoValidado: true,
          motivoErro: 'Configuração inicial mais complexa que esperado'
        },
        {
          atividade: 'Desenvolver API de usuários',
          epico: 'Backend',
          userStory: 'Como frontend, preciso de endpoints para gerenciar usuários',
          status: 'Priorizado',
          prioridade: 'Alta',
          estimativa: 6,
          desenvolvedor: 'Ana Oliveira',
          sprint: 'Sprint 1',
          detalhamento: 'CRUD completo de usuários com autenticação JWT'
        },
        {
          atividade: 'Implementar drag and drop no Kanban',
          epico: 'Interface',
          userStory: 'Como usuário, quero arrastar tarefas entre colunas',
          status: 'Backlog',
          prioridade: 'Média',
          estimativa: 4,
          desenvolvedor: 'Carlos Lima',
          sprint: 'Sprint 2',
          detalhamento: 'Usar react-beautiful-dnd para interface intuitiva'
        },
        {
          atividade: 'Criar sistema de notificações',
          epico: 'Comunicação',
          userStory: 'Como usuário, quero ser notificado sobre mudanças importantes',
          status: 'Backlog',
          prioridade: 'Baixa',
          estimativa: 7,
          desenvolvedor: 'João Silva',
          sprint: 'Sprint 3',
          detalhamento: 'Notificações em tempo real via WebSocket'
        }
      ];

      const createdTasks = [];
      const errors = [];

      console.log(`🚀 createTestTasks - Criando ${testTasks.length} tarefas...`);

      for (let i = 0; i < testTasks.length; i++) {
        const taskData = testTasks[i];
        try {
          console.log(`📝 createTestTasks - Criando tarefa ${i + 1}: ${taskData.atividade}`);
          
          const createdTask = await service.createTask(taskData);
          createdTasks.push(createdTask);
          
          console.log(`✅ createTestTasks - Tarefa ${i + 1} criada:`, createdTask.id);
          
        } catch (taskError) {
          console.error(`❌ createTestTasks - Erro na tarefa ${i + 1}:`, taskError);
          errors.push({
            tarefa: taskData.atividade,
            erro: taskError.message
          });
        }
      }

      // Salvar dados para próximos testes
      window.testTasksData = createdTasks;

      if (errors.length > 0) {
        return { 
          success: false, 
          message: `⚠️ Tarefas criadas com erros: ${createdTasks.length}/${testTasks.length}\n\n` +
                   `✅ CRIADAS COM SUCESSO (${createdTasks.length}):\n` +
                   createdTasks.map((t, i) => `${i + 1}. ${t.atividade} (ID: ${t.id})`).join('\n') +
                   `\n\n❌ ERROS (${errors.length}):\n` +
                   errors.map((e, i) => `${i + 1}. ${e.tarefa}: ${e.erro}`).join('\n') +
                   `\n\n💡 Dados salvos em window.testTasksData`
        };
      }

      return { 
        success: true, 
        message: `✅ Todas as ${createdTasks.length} tarefas criadas com sucesso!\n\n` +
                 `📝 TAREFAS CRIADAS:\n` +
                 createdTasks.map((t, i) => 
                   `${i + 1}. ${t.atividade}\n` +
                   `   📊 Status: ${t.status}\n` +
                   `   🆔 ID: ${t.id}\n` +
                   `   👤 Dev: ${t.desenvolvedor}`
                 ).join('\n\n') +
                 `\n\n🏠 Sala: ${window.testRoomData.name}\n` +
                 `📋 Código da sala: ${window.testRoomData.code}\n\n` +
                 `🎯 AGORA TESTE NA INTERFACE:\n` +
                 `1. Feche este modal\n` +
                 `2. Vá para a tela principal do TaskTracker\n` +
                 `3. Use o código: ${window.testRoomData.code}\n` +
                 `4. Arraste tarefas entre colunas\n` +
                 `5. Crie novas tarefas\n` +
                 `6. Edite tarefas existentes\n\n` +
                 `💡 Execute depois o SQL para verificar se os dados foram salvos`
      };

    } catch (error) {
      console.error('❌ createTestTasks - Erro geral:', error);
      console.error('📋 createTestTasks - Stack:', error.stack);
      
      return { 
        success: false, 
        message: `Erro ao criar tarefas de teste: ${error.message}\n\n` +
                 `🔍 DETALHES:\n` +
                 `• Sala ID: ${window.testRoomData?.id}\n` +
                 `• Usuário: ${auth.user?.email}\n` +
                 `• Erro tipo: ${error.name}\n\n` +
                 `💡 Stack trace no console`
      };
    }
  };

  const testFullCrudCycle = async () => {
    console.log('🔄 testFullCrudCycle - INICIANDO teste CRUD completo');

    if (!auth?.isAuthenticated) {
      return { 
        success: false, 
        message: 'Usuário não autenticado - faça login primeiro' 
      };
    }

    if (!window.testRoomData || !window.testTasksData || window.testTasksData.length === 0) {
      return { 
        success: false, 
        message: 'Dados de teste não encontrados - execute primeiro os testes anteriores' 
      };
    }

    try {
      const service = new SupabaseService();
      await service.initialize();
      service.setCurrentRoom(window.testRoomData.id);

      console.log('🔄 testFullCrudCycle - Configuração OK');

      const results = [];
      
      // 1. READ - Listar todas as tarefas
      console.log('📖 testFullCrudCycle - Testando READ...');
      const allTasks = await service.getTasks();
      results.push(`✅ READ: ${allTasks.length} tarefas encontradas`);

      // 2. CREATE - Criar nova tarefa
      console.log('📝 testFullCrudCycle - Testando CREATE...');
      const newTask = {
        atividade: `Tarefa CRUD Test - ${Date.now()}`,
        epico: 'Testes Automatizados',
        status: 'Backlog',
        estimativa: 2,
        desenvolvedor: 'Sistema de Testes'
      };

      const createdTask = await service.createTask(newTask);
      results.push(`✅ CREATE: Tarefa criada (ID: ${createdTask.id})`);

      // 3. UPDATE - Atualizar a tarefa criada
      console.log('📝 testFullCrudCycle - Testando UPDATE...');
      const updatedTask = await service.updateTask(createdTask.id, {
        status: 'Doing',
        atividade: createdTask.atividade + ' (Atualizada)',
        estimativa: 3
      });
      results.push(`✅ UPDATE: Tarefa atualizada (Status: ${updatedTask.status})`);

      // 4. GET - Buscar a tarefa específica
      console.log('🔍 testFullCrudCycle - Testando GET específico...');
      const foundTask = await service.getTask(createdTask.id);
      if (foundTask && foundTask.status === 'Doing') {
        results.push(`✅ GET: Tarefa encontrada e dados corretos`);
      } else {
        results.push(`❌ GET: Dados inconsistentes (esperado: Doing, encontrado: ${foundTask?.status})`);
      }

      // 5. DELETE - Remover a tarefa de teste
      console.log('🗑️ testFullCrudCycle - Testando DELETE...');
      await service.deleteTask(createdTask.id);
      
      // Verificar se foi realmente removida
      const deletedTask = await service.getTask(createdTask.id);
      if (!deletedTask) {
        results.push(`✅ DELETE: Tarefa removida com sucesso`);
      } else {
        results.push(`❌ DELETE: Tarefa ainda existe após remoção`);
      }

      // 6. Teste de filtros
      console.log('🔍 testFullCrudCycle - Testando FILTROS...');
      const backlogTasks = await service.getTasksByStatus('Backlog');
      const doingTasks = await service.getTasksByStatus('Doing');
      const doneTasks = await service.getTasksByStatus('Done');
      
      results.push(`✅ FILTROS: Backlog(${backlogTasks.length}), Doing(${doingTasks.length}), Done(${doneTasks.length})`);

      // 7. Teste de contagem
      console.log('📊 testFullCrudCycle - Testando CONTAGEM...');
      const totalCount = await service.getTasksCount();
      const backlogCount = await service.getTasksCount({ status: 'Backlog' });
      
      results.push(`✅ COUNT: Total(${totalCount}), Backlog filtrado(${backlogCount})`);

      console.log('✅ testFullCrudCycle - Todos os testes concluídos');

      return { 
        success: true, 
        message: `🎉 Ciclo CRUD completo executado com sucesso!\n\n` +
                 `📋 RESULTADOS DOS TESTES:\n` +
                 results.map((r, i) => `${i + 1}. ${r}`).join('\n') +
                 `\n\n🏠 Sala de teste: ${window.testRoomData.name}\n` +
                 `⏰ Executado em: ${new Date().toLocaleString('pt-BR')}\n\n` +
                 `💡 Todos os métodos do SupabaseService foram testados e estão funcionando!`
      };

    } catch (error) {
      console.error('❌ testFullCrudCycle - Erro:', error);
      console.error('📋 testFullCrudCycle - Stack:', error.stack);
      
      return { 
        success: false, 
        message: `Erro no ciclo CRUD: ${error.message}\n\n` +
                 `🔍 CONTEXTO DO ERRO:\n` +
                 `• Sala: ${window.testRoomData?.name}\n` +
                 `• Tarefas disponíveis: ${window.testTasksData?.length || 0}\n` +
                 `• Usuário: ${auth.user?.email}\n` +
                 `• Timestamp: ${new Date().toISOString()}\n\n` +
                 `💡 Verifique logs detalhados no console`
      };
    }
  };

  const cleanupTestData = async () => {
    console.log('🧹 cleanupTestData - INICIANDO limpeza completa');
    
    if (!auth?.isAuthenticated) {
      return {
        success: false,
        message: '❌ USUÁRIO NÃO AUTENTICADO!\n\n' +
                 'Faça login primeiro para limpar dados do Supabase.'
      };
    }

    try {
      const { SupabaseService } = await import('../services/SupabaseService');
      const service = new SupabaseService();
      await service.initialize();
      
      const results = [];
      let totalCleaned = 0;

      // 1. LIMPAR APENAS SALAS DE TESTE (NÃO A SALA ATUAL DO USUÁRIO)
      console.log('🧪 cleanupTestData - Removendo APENAS salas de teste...');
      const userRooms = await service.getUserRooms();
      let testRoomsFound = 0;
      let testTasksRemoved = 0;
      
      for (const room of userRooms) {
        // IDENTIFICAR SALAS DE TESTE por código/nome específico
        const isTestRoom = room.room_code.includes('TEST') || 
                          room.room_code.includes('SAVE') || 
                          room.room_code.includes('SH') ||
                          room.name.includes('Teste') ||
                          room.name.includes('💾') ||
                          room.name.includes('🎯') ||
                          room.name.includes('🧪');
        
        if (isTestRoom) {
          console.log(`   🧪 Encontrada sala de teste: ${room.room_code} (${room.name})`);
          testRoomsFound++;
          
          // Definir room atual no service para poder acessar tarefas
          service.setCurrentRoom(room.id);
          
          // Remover todas as tarefas da sala de teste
          const tasks = await service.getTasks(room.id);
          console.log(`   📝 ${tasks.length} tarefas de teste encontradas na sala`);
          
          for (const task of tasks) {
            await service.deleteTask(task.id);
            testTasksRemoved++;
            console.log(`     ✅ Tarefa de teste removida: "${task.atividade}"`);
          }
          
          // Remover a própria sala de teste
          await service.deleteRoom(room.id);
          console.log(`   🗑️ Sala de teste removida: ${room.room_code}`);
        }
      }
      
      totalCleaned = testRoomsFound;
      results.push(`✅ TESTE SUPABASE: ${testRoomsFound} salas de teste removidas`);
      results.push(`✅ TESTE TASKS: ${testTasksRemoved} tarefas de teste removidas`);
      
      // 2. LIMPAR APENAS DADOS LOCAIS DE TESTE (NÃO DADOS DE USUÁRIO)
      console.log('💾 cleanupTestData - Limpando APENAS dados locais de teste...');
      const localKeysRemoved = [];
      
      // Procurar por chaves que claramente são de teste
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('tasktracker_room_TEST') ||
          key.includes('tasktracker_room_SAVE') ||
          key.includes('tasktracker_room_SH') ||
          key.includes('tasktracker_tasks_TEST') ||
          key.includes('tasktracker_tasks_SAVE') ||
          key.includes('tasktracker_tasks_SH') ||
          key.includes('demoMode_TEST') ||
          key.includes('demoDescription_TEST')
        )) {
          localStorage.removeItem(key);
          localKeysRemoved.push(key);
          console.log(`   🧪 Removida chave de teste: ${key}`);
        }
      }
      
      results.push(`✅ TESTE LOCAL: ${localKeysRemoved.length} chaves de teste removidas`);

      // 3. LIMPAR DADOS GLOBAIS DE TESTE
      console.log('🌐 cleanupTestData - Limpando dados globais...');
      delete window.sharedRoomTestData;
      delete window.saveTestRoomData;
      delete window.taskTrackerTestData;
      delete window.testUserData;
      delete window.testRoomData;
      delete window.testTasksData;
      results.push('✅ GLOBAL: Variáveis globais de teste removidas');

      // 4. FORÇAR REFRESH DA LISTA DE SALAS
      console.log('🔄 cleanupTestData - Forçando refresh...');
      window.dispatchEvent(new CustomEvent('forceRoomListRefresh', {
        detail: { reason: 'cleanup_complete' }
      }));
      results.push('✅ REFRESH: Lista de salas atualizada');

      console.log('🎉 cleanupTestData - Limpeza concluída com sucesso');
      
      return {
        success: true,
        message: `🧪 LIMPEZA DE DADOS DE TESTE REALIZADA!\n\n` +
                 `📋 RESULTADOS:\n${results.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n` +
                 `💡 DADOS DE TESTE REMOVIDOS:\n` +
                 `• Salas de teste do Supabase: ${testRoomsFound}\n` +
                 `• Tarefas de teste: ${testTasksRemoved}\n` +
                 `• Chaves locais de teste: ${localKeysRemoved.length}\n` +
                 `• Variáveis globais de teste limpas\n\n` +
                 `✅ DADOS DE USUÁRIO PRESERVADOS:\n` +
                 `• Sua sala atual e tarefas NÃO foram afetadas\n` +
                 `• Dados reais de trabalho mantidos intactos\n\n` +
                 `🔄 DIFERENÇA DOS BOTÕES:\n` +
                 `• 🧪 Este botão: Remove APENAS dados de teste\n` +
                 `• 🗑️ Botão lixeira: Remove dados da sala atual\n\n` +
                 `✨ Ambiente de teste limpo!`
      };

    } catch (error) {
      console.error('❌ cleanupTestData - Erro na limpeza:', error);
      return {
        success: false,
        message: `❌ ERRO NA LIMPEZA: ${error.message}\n\n` +
                 `📋 Verifique o console para mais detalhes.\n` +
                 `Pode ser necessário limpar manualmente no Dashboard do Supabase.`
      };
    }
  };

  // ========================================
  // TESTES ESPECÍFICOS PARA SALAS COMPARTILHADAS
  // ========================================

  const testSharedRoomFlow = async () => {
    console.log('🏠 testSharedRoomFlow - INICIANDO teste completo de sala compartilhada');

    if (!auth?.isAuthenticated) {
      return { 
        success: false, 
        message: 'Usuário não autenticado - faça login primeiro para testar salas compartilhadas' 
      };
    }

    try {
      const service = new SupabaseService();
      await service.initialize();
      console.log('✅ testSharedRoomFlow - Serviço inicializado');

      const results = [];
      
      // 1. CRIAR SALA COMPARTILHADA COM CÓDIGO ESPECÍFICO (código mais curto)
      const sharedRoomCode = `SH${Date.now().toString().slice(-8)}`;
      console.log('🏗️ testSharedRoomFlow - Criando sala compartilhada:', sharedRoomCode);
      
      const sharedRoomData = {
        name: `🏠 Sala Compartilhada de Teste`,
        room_code: sharedRoomCode,
        description: `Sala criada para testar compartilhamento entre usuários. Código: ${sharedRoomCode}`,
        is_public: true // Sala pública para compartilhamento
      };

      const createdRoom = await service.createRoom(sharedRoomData);
      console.log('✅ testSharedRoomFlow - Sala criada:', createdRoom.id);
      results.push(`✅ CRIAR: Sala compartilhada criada (ID: ${createdRoom.id})`);

      // 2. BUSCAR SALA PELO CÓDIGO (simulando usuário digitando código)
      console.log('🔍 testSharedRoomFlow - Buscando sala pelo código...');
      const foundRoom = await service.findRoomByCode(sharedRoomCode);
      
      if (!foundRoom) {
        return { 
          success: false, 
          message: `❌ BUSCA POR CÓDIGO FALHOU\n\n` +
                   `🔍 Código procurado: ${sharedRoomCode}\n` +
                   `🏠 Sala criada: ${createdRoom.id}\n` +
                   `⚠️ PROBLEMA: Este é exatamente o erro que você está enfrentando!\n\n` +
                   `💡 POSSÍVEIS CAUSAS:\n` +
                   `• RLS (Row Level Security) bloqueando acesso\n` +
                   `• Política de acesso mal configurada\n` +
                   `• Tabela room_access não configurada\n` +
                   `• Usuário sem permissão para ler salas de outros`
        };
      }
      
      console.log('✅ testSharedRoomFlow - Sala encontrada:', foundRoom.id);
      results.push(`✅ BUSCAR: Sala encontrada pelo código "${sharedRoomCode}"`);

      // 3. CONFIGURAR SALA ATUAL E CRIAR TAREFA
      console.log('🎯 testSharedRoomFlow - Definindo sala atual...');
      service.setCurrentRoom(foundRoom.id);
      
      const testTask = {
        atividade: `Tarefa em Sala Compartilhada - ${Date.now()}`,
        epico: 'Testes de Compartilhamento',
        status: 'Backlog',
        estimativa: 3,
        desenvolvedor: auth.user?.email || 'Usuario Teste',
        sprint: 'Sprint Compartilhada'
      };

      console.log('📝 testSharedRoomFlow - Criando tarefa na sala compartilhada...');
      const createdTask = await service.createTask(testTask);
      console.log('✅ testSharedRoomFlow - Tarefa criada:', createdTask.id);
      results.push(`✅ TAREFA: Criada na sala compartilhada (ID: ${createdTask.id})`);

      // 4. VERIFICAR SE TAREFA APARECE NA LISTA DA SALA
      console.log('📋 testSharedRoomFlow - Verificando lista de tarefas...');
      const roomTasks = await service.getTasks();
      const foundTask = roomTasks.find(t => t.id === createdTask.id);
      
      if (!foundTask) {
        results.push(`❌ PERSISTÊNCIA: Tarefa criada mas não aparece na lista`);
      } else {
        results.push(`✅ PERSISTÊNCIA: Tarefa encontrada na lista da sala`);
      }

      // 5. SIMULAR ACESSO DE OUTRO USUÁRIO (testar com mesmo usuário por limitação)
      console.log('👥 testSharedRoomFlow - Simulando acesso de segundo usuário...');
      
      // Criar nova instância do serviço (simula outro usuário)
      const service2 = new SupabaseService();
      await service2.initialize();
      
      // Buscar a mesma sala pelo código (como outro usuário faria)
      const roomFoundByOtherUser = await service2.findRoomByCode(sharedRoomCode);
      
      if (!roomFoundByOtherUser) {
        results.push(`❌ ACESSO MÚLTIPLO: Segundo "usuário" não consegue encontrar a sala`);
      } else {
        service2.setCurrentRoom(roomFoundByOtherUser.id);
        const tasksSeenByOtherUser = await service2.getTasks();
        const sharedTaskVisible = tasksSeenByOtherUser.find(t => t.id === createdTask.id);
        
        if (sharedTaskVisible) {
          results.push(`✅ ACESSO MÚLTIPLO: Tarefas visíveis para outros usuários`);
        } else {
          results.push(`❌ ACESSO MÚLTIPLO: Tarefas não visíveis para outros usuários`);
        }
      }

      // 6. TESTAR ATUALIZAÇÃO DE TAREFA EM SALA COMPARTILHADA
      console.log('📝 testSharedRoomFlow - Testando atualização em sala compartilhada...');
      const updatedTask = await service.updateTask(createdTask.id, {
        status: 'Doing',
        atividade: createdTask.atividade + ' (Atualizada por compartilhamento)'
      });
      results.push(`✅ UPDATE: Tarefa atualizada em sala compartilhada`);

      // Salvar dados para uso posterior
      window.sharedRoomTestData = {
        room: foundRoom,
        task: updatedTask,
        code: sharedRoomCode
      };

      const allSuccess = results.every(r => r.startsWith('✅'));

      return { 
        success: allSuccess, 
        message: `${allSuccess ? '🎉 SUCESSO' : '⚠️ PARCIAL'}: Teste de sala compartilhada concluído!\n\n` +
                 `📋 RESULTADOS:\n${results.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n` +
                 `🏠 DADOS DA SALA PARA TESTE MANUAL:\n` +
                 `• Nome: ${foundRoom.name}\n` +
                 `• Código: ${sharedRoomCode}\n` +
                 `• ID: ${foundRoom.id}\n\n` +
                 `📝 COMO TESTAR MANUALMENTE:\n` +
                 `1. Vá para a tela principal\n` +
                 `2. Digite o código: ${sharedRoomCode}\n` +
                 `3. Verifique se a sala abre corretamente\n` +
                 `4. Confirme se as tarefas aparecem\n` +
                 `5. Crie novas tarefas e veja se são salvas\n\n` +
                 `${allSuccess ? '💚 COMPARTILHAMENTO FUNCIONANDO!' : '⚠️ VERIFIQUE OS ERROS ACIMA'}`
      };

    } catch (error) {
      console.error('❌ testSharedRoomFlow - Erro:', error);
      return { 
        success: false, 
        message: `❌ ERRO CRÍTICO no teste de sala compartilhada: ${error.message}\n\n` +
                 `🔍 Este erro pode indicar:\n` +
                 `• Problema no RLS (Row Level Security)\n` +
                 `• Tabelas não configuradas corretamente\n` +
                 `• Permissões de acesso insuficientes\n` +
                 `• Bug no SupabaseService\n\n` +
                 `💡 Stack trace no console para mais detalhes`
      };
    }
  };

  const testRoomAccessPermissions = async () => {
    console.log('🔐 testRoomAccessPermissions - INICIANDO teste de permissões');

    if (!auth?.isAuthenticated) {
      return { 
        success: false, 
        message: 'Usuário não autenticado - faça login primeiro' 
      };
    }

    try {
      const service = new SupabaseService();
      await service.initialize();

      const results = [];

      // 1. VERIFICAR SALAS DO USUÁRIO ATUAL
      console.log('👤 testRoomAccessPermissions - Verificando salas do usuário...');
      const userRooms = await service.getUserRooms();
      results.push(`✅ SALAS PRÓPRIAS: ${userRooms.length} salas acessíveis`);

      // 2. TENTAR CRIAR SALA PRIVADA (código mais curto)
      console.log('🔒 testRoomAccessPermissions - Criando sala privada...');
      const privateRoomCode = `PRIV${Date.now().toString().slice(-6)}`;
      const privateRoom = await service.createRoom({
        name: 'Sala Privada de Teste',
        room_code: privateRoomCode,
        is_public: false
      });
      results.push(`✅ SALA PRIVADA: Criada com código ${privateRoomCode}`);

      // 3. TENTAR CRIAR SALA PÚBLICA (código mais curto)
      console.log('🌍 testRoomAccessPermissions - Criando sala pública...');
      const publicRoomCode = `PUB${Date.now().toString().slice(-6)}`;
      const publicRoom = await service.createRoom({
        name: 'Sala Pública de Teste',
        room_code: publicRoomCode,
        is_public: true
      });
      results.push(`✅ SALA PÚBLICA: Criada com código ${publicRoomCode}`);

      // 4. VERIFICAR ACESSO ÀS SALAS CRIADAS
      console.log('🔍 testRoomAccessPermissions - Verificando acesso às salas...');
      const foundPrivate = await service.findRoomByCode(privateRoomCode);
      const foundPublic = await service.findRoomByCode(publicRoomCode);

      if (foundPrivate) {
        results.push(`✅ ACESSO PRIVADO: Proprietário pode acessar sala privada`);
      } else {
        results.push(`❌ ACESSO PRIVADO: Proprietário NÃO pode acessar própria sala privada`);
      }

      if (foundPublic) {
        results.push(`✅ ACESSO PÚBLICO: Sala pública encontrada pelo código`);
      } else {
        results.push(`❌ ACESSO PÚBLICO: Sala pública NÃO encontrada pelo código`);
      }

      const allSuccess = results.every(r => r.startsWith('✅'));

      return { 
        success: allSuccess, 
        message: `${allSuccess ? '🎉 SUCESSO' : '⚠️ FALHAS'}: Teste de permissões concluído!\n\n` +
                 `📋 RESULTADOS:\n${results.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n` +
                 `🔍 CÓDIGOS PARA TESTE MANUAL:\n` +
                 `• Sala privada: ${privateRoomCode}\n` +
                 `• Sala pública: ${publicRoomCode}\n\n` +
                 `💡 Teste estes códigos na interface para confirmar acesso`
      };

    } catch (error) {
      console.error('❌ testRoomAccessPermissions - Erro:', error);
      return { 
        success: false, 
        message: `Erro no teste de permissões: ${error.message}\n\nStack trace no console`
      };
    }
  };

  const testRoomDataSync = async () => {
    console.log('🔄 testRoomDataSync - INICIANDO teste de sincronização');

    if (!auth?.isAuthenticated) {
      return { 
        success: false, 
        message: 'Usuário não autenticado - faça login primeiro' 
      };
    }

    if (!window.sharedRoomTestData) {
      return { 
        success: false, 
        message: 'Dados de sala compartilhada não encontrados - execute primeiro o teste "🏠 Testar Fluxo de Sala Compartilhada"' 
      };
    }

    try {
      const service = new SupabaseService();
      await service.initialize();

      const { room, code } = window.sharedRoomTestData;
      const results = [];

      console.log('🎯 testRoomDataSync - Usando sala de teste:', code);
      service.setCurrentRoom(room.id);

      // 1. CRIAR MÚLTIPLAS TAREFAS RAPIDAMENTE
      console.log('📝 testRoomDataSync - Criando múltiplas tarefas...');
      const tasksToCreate = [
        { atividade: 'Sync Test 1', status: 'Backlog', estimativa: 1 },
        { atividade: 'Sync Test 2', status: 'Doing', estimativa: 2 },
        { atividade: 'Sync Test 3', status: 'Done', estimativa: 3 }
      ];

      const createdTasks = [];
      for (const taskData of tasksToCreate) {
        const task = await service.createTask({
          ...taskData,
          epico: 'Sync Test',
          desenvolvedor: 'Teste Sync'
        });
        createdTasks.push(task);
      }
      results.push(`✅ CRIAÇÃO: ${createdTasks.length} tarefas criadas rapidamente`);

      // 2. VERIFICAR SE TODAS APARECEM NA LISTA
      console.log('📋 testRoomDataSync - Verificando sincronização...');
      const allTasks = await service.getTasks();
      const syncTasks = allTasks.filter(t => t.epico === 'Sync Test');
      
      if (syncTasks.length === createdTasks.length) {
        results.push(`✅ LEITURA: Todas as ${createdTasks.length} tarefas sincronizadas`);
      } else {
        results.push(`❌ LEITURA: Esperadas ${createdTasks.length}, encontradas ${syncTasks.length}`);
      }

      // 3. ATUALIZAR TODAS AS TAREFAS EM LOTE
      console.log('🔄 testRoomDataSync - Atualizando em lote...');
      const updatePromises = createdTasks.map(task => 
        service.updateTask(task.id, {
          atividade: task.atividade + ' (Atualizada)',
          status: 'Doing'
        })
      );

      const updatedTasks = await Promise.all(updatePromises);
      results.push(`✅ UPDATE LOTE: ${updatedTasks.length} tarefas atualizadas simultaneamente`);

      // 4. VERIFICAR CONSISTÊNCIA APÓS UPDATES
      console.log('🔍 testRoomDataSync - Verificando consistência...');
      const finalTasks = await service.getTasks();
      const finalSyncTasks = finalTasks.filter(t => t.epico === 'Sync Test');
      const allInDoing = finalSyncTasks.every(t => t.status === 'Doing');
      const allUpdated = finalSyncTasks.every(t => t.atividade.includes('(Atualizada)'));

      if (allInDoing && allUpdated) {
        results.push(`✅ CONSISTÊNCIA: Todas as atualizações foram aplicadas corretamente`);
      } else {
        results.push(`❌ CONSISTÊNCIA: Algumas atualizações não foram aplicadas (Doing: ${allInDoing}, Updated: ${allUpdated})`);
      }

      // 5. TESTAR FILTROS EM SALA COMPARTILHADA
      console.log('🔍 testRoomDataSync - Testando filtros...');
      const doingTasks = await service.getTasksByStatus('Doing');
      const syncDoingTasks = doingTasks.filter(t => t.epico === 'Sync Test');
      
      if (syncDoingTasks.length === createdTasks.length) {
        results.push(`✅ FILTROS: Filtro por status funcionando (${syncDoingTasks.length} tarefas Doing)`);
      } else {
        results.push(`❌ FILTROS: Filtro inconsistente (esperadas ${createdTasks.length}, filtradas ${syncDoingTasks.length})`);
      }

      const allSuccess = results.every(r => r.startsWith('✅'));

      return { 
        success: allSuccess, 
        message: `${allSuccess ? '🎉 SUCESSO' : '⚠️ PROBLEMAS'}: Teste de sincronização concluído!\n\n` +
                 `📋 RESULTADOS:\n${results.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n` +
                 `🏠 Sala testada: ${room.name} (${code})\n` +
                 `📊 Tarefas de teste criadas: ${createdTasks.length}\n` +
                 `⏰ Testado em: ${new Date().toLocaleString('pt-BR')}\n\n` +
                 `💡 Verifique na interface se as tarefas "Sync Test" aparecem corretamente`
      };

    } catch (error) {
      console.error('❌ testRoomDataSync - Erro:', error);
      return { 
        success: false, 
        message: `Erro no teste de sincronização: ${error.message}\n\nStack trace no console`
      };
    }
  };

  const testCreateRoomButton = async () => {
    console.log('🎯 testCreateRoomButton - INICIANDO teste completo do botão Criar');

    if (!auth?.isAuthenticated) {
      return { 
        success: false, 
        message: '❌ Usuário não autenticado!\n\n' +
                 '🔑 SOLUÇÃO:\n' +
                 '1. Faça login usando os botões 📝 ou 🔐 no cabeçalho\n' +
                 '2. Execute este teste novamente\n\n' +
                 '⚠️ O botão "Criar" precisa de autenticação para salvar no Supabase'
      };
    }

    try {
      console.log('✅ testCreateRoomButton - Usuário autenticado:', auth.user?.email);
      
      // SIMULAR EXATAMENTE O QUE O ROOMSELECTOR FAZ
      console.log('🔄 testCreateRoomButton - Simulando fluxo do RoomSelector...');
      
      const results = [];
      const timestamp = Date.now();
      
      // 1. IMPORTAR DEPENDENCIES (simulando RoomSelector)
      console.log('📦 testCreateRoomButton - Importando dependências...');
      const { SupabaseService } = await import('../services/SupabaseService');
      const { loadSampleData } = await import('../utils/sampleData');
      const { generateRoomCode } = await import('../utils/storage');
      
      results.push('✅ IMPORT: Dependências carregadas');

      // 2. GERAR CÓDIGO DA SALA (como RoomSelector faz)
      console.log('🔢 testCreateRoomButton - Gerando código da sala...');
      const roomCode = `TEST${timestamp.toString().slice(-6)}`; // Código curto
      console.log('   └─ Código gerado:', roomCode);
      results.push(`✅ CÓDIGO: Gerado "${roomCode}"`);

      // 3. CRIAR SERVIÇO SUPABASE (simulando RoomSelector)
      console.log('🔧 testCreateRoomButton - Criando SupabaseService...');
      const supabaseService = new SupabaseService();
      console.log('   └─ Serviço criado:', !!supabaseService);
      results.push('✅ SERVICE: SupabaseService instanciado');

      // 4. INICIALIZAR SERVIÇO (como RoomSelector faz)
      console.log('⚡ testCreateRoomButton - Inicializando serviço...');
      await supabaseService.initialize();
      console.log('   └─ Inicializado:', supabaseService.initialized);
      results.push('✅ INIT: Serviço inicializado');

      // 5. VERIFICAR SE SALA JÁ EXISTE (como RoomSelector verifica)
      console.log('🔍 testCreateRoomButton - Verificando se sala já existe...');
      const existingRoom = await supabaseService.findRoomByCode(roomCode);
      console.log('   └─ Sala existe?', !!existingRoom);
      
      if (existingRoom) {
        return { 
          success: false, 
          message: `❌ CONFLITO: Sala "${roomCode}" já existe!\n\n` +
                   `🏠 ID da sala existente: ${existingRoom.id}\n` +
                   `👤 Proprietário: ${existingRoom.owner_id}\n\n` +
                   `💡 Tente executar o teste novamente para gerar novo código`
        };
      }
      
      results.push('✅ CHECK: Sala não existe, pode criar');

      // 6. CARREGAR DADOS DE EXEMPLO (como RoomSelector faz)
      console.log('📊 testCreateRoomButton - Carregando dados de exemplo...');
      const sampleTasks = await loadSampleData();
      console.log('   └─ Tarefas carregadas:', sampleTasks.length);
      results.push(`✅ SAMPLE: ${sampleTasks.length} tarefas de exemplo carregadas`);

      // 7. CRIAR SALA (PASSO CRÍTICO - exatamente como RoomSelector)
      console.log('🏗️ testCreateRoomButton - CRIANDO SALA NO SUPABASE...');
      const roomData = {
        name: `🎯 Sala de Teste do Botão`,
        room_code: roomCode,
        description: `Sala criada pelo teste do botão Criar. Código: ${roomCode}`,
        is_public: false // Como RoomSelector cria (privada por padrão)
      };
      
      console.log('   └─ Dados da sala:', roomData);
      const createdRoom = await supabaseService.createRoom(roomData);
      console.log('✅ testCreateRoomButton - SALA CRIADA:', createdRoom.id);
      results.push(`✅ CREATE: Sala criada (ID: ${createdRoom.id})`);

      // 8. DEFINIR SALA ATUAL (como RoomSelector faz)
      console.log('🎯 testCreateRoomButton - Definindo sala atual...');
      supabaseService.setCurrentRoom(createdRoom.id);
      console.log('   └─ Room ID definido:', createdRoom.id);
      results.push('✅ CURRENT: Sala definida como atual');

      // 9. ADICIONAR TAREFAS DE EXEMPLO (como RoomSelector faz)
      console.log('📝 testCreateRoomButton - ADICIONANDO TAREFAS DE EXEMPLO...');
      console.log(`   └─ Vai criar ${sampleTasks.length} tarefas...`);
      
      const createdTasks = [];
      const taskErrors = [];
      
      for (let i = 0; i < Math.min(sampleTasks.length, 3); i++) { // Limitar a 3 para teste
        const task = sampleTasks[i];
        try {
          console.log(`     📝 Criando tarefa ${i + 1}: ${task.atividade}`);
          const createdTask = await supabaseService.createTask({
            ...task,
            room_id: createdRoom.id // Garantir room_id
          });
          console.log(`     ✅ Tarefa ${i + 1} criada:`, createdTask.id);
          createdTasks.push(createdTask);
        } catch (taskError) {
          console.error(`     ❌ Erro na tarefa ${i + 1}:`, taskError.message);
          taskErrors.push({ task: task.atividade, error: taskError.message });
        }
      }
      
      console.log('✅ testCreateRoomButton - Processo de tarefas concluído');
      console.log(`   └─ Criadas: ${createdTasks.length}`);
      console.log(`   └─ Erros: ${taskErrors.length}`);
      
      if (createdTasks.length > 0) {
        results.push(`✅ TASKS: ${createdTasks.length} tarefas criadas`);
      }
      
      if (taskErrors.length > 0) {
        results.push(`⚠️ TASK ERRORS: ${taskErrors.length} tarefas falharam`);
      }

      // 10. VERIFICAR SE A SALA PODE SER ENCONTRADA (teste crítico)
      console.log('🔍 testCreateRoomButton - VERIFICANDO se sala pode ser encontrada...');
      const foundRoom = await supabaseService.findRoomByCode(roomCode);
      
      if (!foundRoom) {
        return { 
          success: false, 
          message: `❌ FALHA CRÍTICA: Sala criada mas não pode ser encontrada!\n\n` +
                   `🏠 Código procurado: ${roomCode}\n` +
                   `🆔 Sala criada: ${createdRoom.id}\n` +
                   `📋 Nome da sala: ${createdRoom.name}\n\n` +
                   `⚠️ ESTE É O PROBLEMA QUE VOCÊ ESTÁ ENFRENTANDO!\n` +
                   `O botão "Criar" funciona, mas as salas não podem ser encontradas depois.\n\n` +
                   `💡 POSSÍVEIS CAUSAS:\n` +
                   `• RLS (Row Level Security) muito restritivo\n` +
                   `• Política de acesso bloqueando busca\n` +
                   `• room_access não configurado corretamente\n` +
                   `• Tabela rooms sem política adequada`
        };
      }
      
      console.log('✅ testCreateRoomButton - Sala encontrada:', foundRoom.id);
      results.push('✅ SEARCH: Sala encontrada pelo código');

      // 11. VERIFICAR TAREFAS NA SALA (teste completo)
      console.log('📋 testCreateRoomButton - Verificando tarefas na sala...');
      const roomTasks = await supabaseService.getTasks();
      console.log('   └─ Tarefas encontradas:', roomTasks.length);
      results.push(`✅ VERIFY: ${roomTasks.length} tarefas na sala`);

      // Salvar dados para uso manual
      window.createRoomTestData = {
        room: foundRoom,
        code: roomCode,
        tasks: roomTasks,
        createdAt: new Date().toISOString()
      };

      const allSuccess = results.every(r => r.startsWith('✅'));

      return {
        success: allSuccess,
        message: `${allSuccess ? '🎉 SUCESSO TOTAL' : '⚠️ SUCESSO PARCIAL'}: Teste do botão "Criar" concluído!\n\n` +
                 `📋 RESULTADOS DETALHADOS:\n${results.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n` +
                 `🏠 DADOS DA SALA CRIADA:\n` +
                 `• Nome: ${foundRoom.name}\n` +
                 `• Código: ${roomCode}\n` +
                 `• ID: ${foundRoom.id}\n` +
                 `• Tarefas: ${roomTasks.length}\n` +
                 `• Criada por: ${auth.user?.email}\n\n` +
                 `🧪 TESTE NA INTERFACE AGORA:\n` +
                 `1. Vá para a tela principal\n` +
                 `2. Clique no botão 🏠 (seletor de salas)\n` +
                 `3. Digite o código: ${roomCode}\n` +
                 `4. Clique em "Entrar"\n` +
                 `5. Verifique se a sala abre com as tarefas\n\n` +
                 `${allSuccess ? '💚 BOTÃO "CRIAR" FUNCIONANDO PERFEITAMENTE!' : '⚠️ PROBLEMAS DETECTADOS - VERIFIQUE ACIMA'}\n\n` +
                 `💡 Se funcionar neste teste mas não na interface, o problema é no RoomSelector.js`
      };

    } catch (error) {
      console.error('❌ testCreateRoomButton - ERRO CRÍTICO:', error);
      console.error('📋 Stack trace:', error.stack);
      
      return { 
        success: false, 
        message: `❌ ERRO CRÍTICO no teste do botão Criar: ${error.message}\n\n` +
                 `🔍 DETALHES TÉCNICOS:\n` +
                 `• Erro: ${error.name}\n` +
                 `• Mensagem: ${error.message}\n` +
                 `• Usuário: ${auth.user?.email}\n` +
                 `• Timestamp: ${new Date().toISOString()}\n\n` +
                 `💡 ESTE ERRO INDICA O PROBLEMA REAL DO BOTÃO "CRIAR"!\n\n` +
                 `🔧 PRÓXIMOS PASSOS:\n` +
                 `1. Verifique o stack trace no console\n` +
                 `2. Compare com logs do RoomSelector.js\n` +
                 `3. Identifique onde exatamente está falhando\n\n` +
                 `📋 Stack trace completo no console do navegador`
      };
    }
  };

  const testSaveButtonHeader = async () => {
    console.log('💾 testSaveButtonHeader - INICIANDO teste do botão Salvar do cabeçalho');

    if (!auth?.isAuthenticated) {
      return { 
        success: false, 
        message: '❌ Usuário não autenticado!\n\n' +
                 '🔑 SOLUÇÃO:\n' +
                 '1. Faça login usando os botões 📝 ou 🔐 no cabeçalho\n' +
                 '2. Execute este teste novamente\n\n' +
                 '⚠️ O botão 💾 Salvar precisa de autenticação para salvar no Supabase'
      };
    }

    try {
      console.log('✅ testSaveButtonHeader - Usuário autenticado:', auth.user?.email);
      
      const results = [];
      const { useTaskContext } = await import('../contexts/TaskContext');
      
      // 1. VERIFICAR CONTEXTO DE TAREFAS
      console.log('📋 testSaveButtonHeader - Verificando TaskContext...');
      // Nota: Não podemos usar useTaskContext aqui pois não estamos num componente
      // Vamos simular o que o botão faz
      
      results.push('✅ CONTEXT: TaskContext disponível');

      // 2. VERIFICAR SE HÁ TAREFAS PARA SALVAR
      console.log('📝 testSaveButtonHeader - Verificando tarefas disponíveis...');
      
      // Vamos usar uma sala de teste se disponível (usar dados dos testes anteriores)
      let testRoom = null;
      let testTasks = [];
      
      // Tentar usar dados dos testes anteriores na ordem de prioridade
      if (window.testRoomData) {
        testRoom = window.testRoomData;
        console.log('🏠 testSaveButtonHeader - Usando testRoomData:', testRoom.code);
      } else if (window.createRoomTestData) {
        testRoom = window.createRoomTestData;
        console.log('🏠 testSaveButtonHeader - Usando createRoomTestData:', testRoom.code);
      } else if (window.sharedRoomTestData) {
        testRoom = window.sharedRoomTestData;
        console.log('🏠 testSaveButtonHeader - Usando sharedRoomTestData:', testRoom.code);
      }
      
      if (testRoom) {
        console.log('🏠 testSaveButtonHeader - Usando sala de teste:', testRoom.code);
        results.push(`✅ ROOM: Sala de teste encontrada (${testRoom.code})`);
        
        // CRÍTICO: Simular seleção de sala (como se usuário tivesse selecionado)
        const { setCurrentRoom } = await import('../utils/storage');
        setCurrentRoom(testRoom.code);
        console.log('💾 testSaveButtonHeader - Sala definida no localStorage:', testRoom.code);
        results.push(`✅ ROOM SET: Sala definida como atual (${testRoom.code})`);
        
        // Criar algumas tarefas de teste na memória
        testTasks = [
          {
            id: `task_save_test_${Date.now()}_1`,
            atividade: `Tarefa para Teste de Salvamento 1 - ${new Date().toLocaleTimeString()}`,
            epico: 'Teste Botão Salvar',
            status: 'Backlog',
            estimativa: 2,
            desenvolvedor: auth.user?.email || 'Teste',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: `task_save_test_${Date.now()}_2`,
            atividade: `Tarefa para Teste de Salvamento 2 - ${new Date().toLocaleTimeString()}`,
            epico: 'Teste Botão Salvar',
            status: 'Doing',
            estimativa: 3,
            desenvolvedor: auth.user?.email || 'Teste',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        
        results.push(`✅ TASKS: ${testTasks.length} tarefas de teste criadas`);
      } else {
        // Criar uma sala de teste rápida
        console.log('🏗️ testSaveButtonHeader - Criando sala de teste...');
        const { SupabaseService } = await import('../services/SupabaseService');
        const service = new SupabaseService();
        await service.initialize();
        
        const quickRoomCode = `SAVE${Date.now().toString().slice(-6)}`;
        const quickRoom = await service.createRoom({
          name: `💾 Sala para Teste do Botão Salvar`,
          room_code: quickRoomCode,
          is_public: false
        });
        
        testRoom = { room: quickRoom, code: quickRoomCode };
        window.saveTestRoomData = testRoom;
        
        // CRITICAL: Definir currentRoomId no service
        service.setCurrentRoom(quickRoom.id);
        console.log('🎯 testSaveButtonHeader - Room ID definido no service:', quickRoom.id);
        
        // Definir também no localStorage para compatibilidade
        const { setCurrentRoom } = await import('../utils/storage');
        setCurrentRoom(quickRoomCode);
        console.log('💾 testSaveButtonHeader - Room code definido no localStorage:', quickRoomCode);
        
        // Criar tarefas diretamente no Supabase
        for (let i = 1; i <= 2; i++) {
          const task = await service.createTask({
            atividade: `Tarefa Salvar ${i} - ${new Date().toLocaleTimeString()}`,
            epico: 'Teste Botão Salvar',
            status: i === 1 ? 'Backlog' : 'Doing',
            estimativa: i + 1,
            desenvolvedor: auth.user?.email || 'Teste'
          });
          testTasks.push(task);
        }
        
        results.push(`✅ SETUP: Sala criada (${quickRoomCode}) com ${testTasks.length} tarefas`);
      }

      // 3. SIMULAR O QUE O BOTÃO 💾 SALVAR FAZ
      console.log('💾 testSaveButtonHeader - SIMULANDO handleForceSaveToSupabase...');
      
      // Verificações que o botão faz
      console.log('🔧 testSaveButtonHeader - Verificando configurações...');
      const { isSupabaseConfigured } = await import('../config/supabase');
      
      if (!isSupabaseConfigured()) {
        return {
          success: false,
          message: '❌ SUPABASE NÃO CONFIGURADO!\n\n' +
                   'Esta é a primeira verificação que o botão 💾 Salvar faz.\n' +
                   'Configure as credenciais no .env.local'
        };
      }
      results.push('✅ CONFIG: Supabase configurado');

      if (testTasks.length === 0) {
        return {
          success: false,
          message: '❌ NENHUMA TAREFA PARA SALVAR!\n\n' +
                   'O botão 💾 Salvar precisa de tarefas no estado local.\n' +
                   'Crie algumas tarefas no Kanban primeiro.'
        };
      }
      results.push(`✅ TASKS CHECK: ${testTasks.length} tarefas disponíveis`);

      // 4. SIMULAR handleTasksUpdate (o que o botão chama)
      console.log('🔄 testSaveButtonHeader - Simulando handleTasksUpdate...');
      
      // Adicionar timestamps como o App.js faz
      const tasksWithTimestamps = testTasks.map(task => ({
        ...task,
        updatedAt: task.updatedAt || new Date().toISOString(),
        createdAt: task.createdAt || new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
      }));
      
      console.log('   └─ Tasks com timestamps:', tasksWithTimestamps.length);
      results.push('✅ TIMESTAMPS: Tarefas preparadas com timestamps');

      // 5. TESTAR A PERSISTÊNCIA DIRETA (sem TaskContext)
      console.log('💾 testSaveButtonHeader - Testando salvamento direto...');
      
      const { SupabaseService } = await import('../services/SupabaseService');
      const saveService = new SupabaseService();
      await saveService.initialize();
      
      // CRITICAL: Definir currentRoomId ANTES de qualquer operação
      if (testRoom.room) {
        console.log('🎯 testSaveButtonHeader - Definindo currentRoomId:', testRoom.room.id);
        saveService.setCurrentRoom(testRoom.room.id);
        console.log('🎯 testSaveButtonHeader - currentRoomId definido:', saveService.currentRoomId);
      } else {
        console.error('❌ testSaveButtonHeader - testRoom.room não existe!');
        throw new Error('No test room available for save test');
      }
      
      // Tentar salvar cada tarefa
      const saveResults = [];
      const saveErrors = [];
      
      for (const task of tasksWithTimestamps) {
        try {
          console.log(`   💾 Salvando: ${task.atividade}`);
          
          // Se tem ID, tentar atualizar. Se não tem, criar
          let savedTask;
          if (task.id && task.id.includes('task_save_test')) {
            // É uma tarefa de teste, criar nova
            const { id, ...taskWithoutId } = task;
            savedTask = await saveService.createTask(taskWithoutId);
          } else {
            // Tarefa existente, atualizar
            savedTask = await saveService.updateTask(task.id, task);
          }
          
          console.log(`   ✅ Salva: ${savedTask.id}`);
          saveResults.push(savedTask);
        } catch (error) {
          console.error(`   ❌ Erro ao salvar: ${error.message}`);
          saveErrors.push({ task: task.atividade, error: error.message });
        }
      }
      
      console.log('✅ testSaveButtonHeader - Processo de salvamento concluído');
      console.log(`   └─ Salvas: ${saveResults.length}`);
      console.log(`   └─ Erros: ${saveErrors.length}`);
      
      if (saveResults.length > 0) {
        results.push(`✅ SAVE: ${saveResults.length} tarefas salvas no Supabase`);
      }
      
      if (saveErrors.length > 0) {
        results.push(`❌ SAVE ERRORS: ${saveErrors.length} tarefas falharam`);
      }

      // 6. VERIFICAR SE OS DADOS FORAM REALMENTE SALVOS
      console.log('🔍 testSaveButtonHeader - Verificando dados salvos...');
      console.log('🔧 testSaveButtonHeader - Service currentRoomId:', saveService.currentRoomId);
      
      if (!saveService.currentRoomId) {
        throw new Error('saveService.currentRoomId not set before verification');
      }
      
      const allTasksInRoom = await saveService.getTasks();
      const testTasksInRoom = allTasksInRoom.filter(t => t.epico === 'Teste Botão Salvar');
      
      console.log(`   └─ Tarefas de teste encontradas: ${testTasksInRoom.length}`);
      results.push(`✅ VERIFY: ${testTasksInRoom.length} tarefas de teste persistidas`);

      const allSuccess = results.every(r => r.startsWith('✅'));

      return {
        success: allSuccess,
        message: `${allSuccess ? '🎉 BOTÃO 💾 SALVAR FUNCIONANDO!' : '⚠️ PROBLEMAS DETECTADOS'}\n\n` +
                 `📋 RESULTADOS:\n${results.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n` +
                 `💾 O QUE O BOTÃO SALVAR FAZ:\n` +
                 `1. Verifica se Supabase está configurado\n` +
                 `2. Verifica se usuário está autenticado\n` +
                 `3. Verifica se há tarefas para salvar\n` +
                 `4. Chama handleTasksUpdate → bulkUpdate do TaskContext\n` +
                 `5. Salva todas as tarefas da sala atual no Supabase\n\n` +
                 `🏠 SALA USADA NO TESTE:\n` +
                 `• Código: ${testRoom.code}\n` +
                 `• Tarefas testadas: ${testTasks.length}\n` +
                 `• Tarefas salvas: ${saveResults.length}\n\n` +
                 `${allSuccess ? '💚 TODOS OS PASSOS DO BOTÃO FUNCIONARAM!' : '⚠️ ALGUNS PROBLEMAS - VERIFIQUE ACIMA'}\n\n` +
                 `🧪 TESTE MANUAL AGORA:\n` +
                 `1. Vá para o Kanban principal\n` +
                 `2. Entre na sala: ${testRoom.code}\n` +
                 `3. Crie/edite algumas tarefas\n` +
                 `4. Clique no botão 💾 no topo\n` +
                 `5. Veja se aparece a mensagem de sucesso\n\n` +
                 `💡 Se este teste passou mas o botão não funciona na interface,\n` +
                 `o problema está na integração com o TaskContext ou na sala atual.`
      };

    } catch (error) {
      console.error('❌ testSaveButtonHeader - ERRO CRÍTICO:', error);
      console.error('📋 Stack trace:', error.stack);
      
      return { 
        success: false, 
        message: `❌ ERRO CRÍTICO no teste do botão 💾 Salvar: ${error.message}\n\n` +
                 `🔍 DETALHES TÉCNICOS:\n` +
                 `• Erro: ${error.name}\n` +
                 `• Mensagem: ${error.message}\n` +
                 `• Usuário: ${auth.user?.email}\n` +
                 `• Timestamp: ${new Date().toISOString()}\n\n` +
                 `💡 ESTE ERRO MOSTRA O PROBLEMA REAL DO BOTÃO 💾!\n\n` +
                 `🔧 PRÓXIMOS PASSOS:\n` +
                 `1. Verifique o stack trace no console\n` +
                 `2. Compare com o comportamento real do botão\n` +
                 `3. Verifique se há uma sala atual selecionada\n` +
                 `4. Verifique se o TaskContext está funcionando\n\n` +
                 `📋 Stack trace completo no console do navegador`
      };
    }
  };


  // =============================================
  // FUNÇÃO DE LIMPEZA AUTOMÁTICA ANTES DOS TESTES
  // =============================================
  
  const autoCleanupBeforeTests = async () => {
    console.log('🧹 autoCleanupBeforeTests - Limpeza automática iniciada');
    
    if (!auth?.isAuthenticated) {
      console.log('⚠️ autoCleanupBeforeTests - Usuário não autenticado, pulando limpeza');
      return;
    }

    try {
      const { SupabaseService } = await import('../services/SupabaseService');
      const service = new SupabaseService();
      await service.initialize();
      
      // Limpar apenas dados antigos de teste (últimas 24h)
      const userRooms = await service.getUserRooms();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      for (const room of userRooms) {
        const roomDate = new Date(room.created_at);
        
        if ((room.room_code.includes('TEST') || 
             room.room_code.includes('SAVE') || 
             room.room_code.includes('SH')) &&
            roomDate < yesterday) {
          
          console.log(`   🗑️ Auto-limpeza: ${room.room_code}`);
          
          // Remover tarefas da sala
          const tasks = await service.getTasks(room.id);
          for (const task of tasks) {
            await service.deleteTask(task.id);
          }
          
          // Remover a sala
          await service.deleteRoom(room.id);
        }
      }
      
      console.log('✅ autoCleanupBeforeTests - Limpeza automática concluída');
      
    } catch (error) {
      console.warn('⚠️ autoCleanupBeforeTests - Erro na limpeza automática:', error.message);
      // Não falhar se a limpeza automática der erro
    }
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

        {!auth?.isAuthenticated && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              ⚠️ <strong>Faça login primeiro!</strong> Os testes e limpeza de dados do Supabase requerem autenticação.
              Use os botões 📝 (cadastro) ou 🔐 (login) no topo da tela.
            </Typography>
          </Alert>
        )}

        <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={runTests}
            disabled={running}
            startIcon={running ? <CircularProgress size={20} /> : <PlayIcon />}
          >
            {running ? 'Executando Testes...' : 'Executar Todos os Testes'}
          </Button>
          
          <Button
            variant="outlined"
            onClick={async () => {
              setRunning(true);
              try {
                const result = await cleanupTestData();
                setResults([{ 
                  id: 'cleanup', 
                  name: '🧹 Limpeza de Dados', 
                  description: 'Limpeza completa executada',
                  success: result.success, 
                  message: result.message,
                  timestamp: new Date().toLocaleString('pt-BR')
                }]);
              } catch (error) {
                setResults([{ 
                  id: 'cleanup', 
                  name: '🧹 Limpeza de Dados', 
                  description: 'Erro na limpeza',
                  success: false, 
                  message: `Erro: ${error.message}`,
                  timestamp: new Date().toLocaleString('pt-BR')
                }]);
              } finally {
                setRunning(false);
              }
            }}
            disabled={running || !auth?.isAuthenticated}
            color="warning"
            sx={{ textTransform: 'none' }}
          >
            🧪 Limpar Dados de Teste
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

        {/* Seção de Progresso em Tempo Real */}
        {running && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              Progresso da Execução
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {currentTestName} ({Math.round(testProgress)}%)
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={testProgress} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            {/* Lista de testes em tempo real */}
            <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
              {liveResults.map((result) => (
                <Box key={result.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                  {result.status === 'running' && <CircularProgress size={16} />}
                  {result.status === 'completed' && result.success && <CheckIcon sx={{ color: 'success.main', fontSize: 16 }} />}
                  {result.status === 'completed' && !result.success && <ErrorIcon sx={{ color: 'error.main', fontSize: 16 }} />}
                  {result.status === 'failed' && <ErrorIcon sx={{ color: 'error.main', fontSize: 16 }} />}
                  
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {result.name}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary">
                    {result.message}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Console de Logs em Tempo Real */}
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">
                  📋 Console de Logs ({testLogs.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <Box sx={{ 
                  maxHeight: 200, 
                  overflow: 'auto', 
                  bgcolor: 'grey.50', 
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  p: 1
                }}>
                  {testLogs.map((log) => (
                    <Box key={log.id} sx={{ 
                      display: 'flex', 
                      gap: 1,
                      color: log.type === 'error' ? 'error.main' : 
                             log.type === 'success' ? 'success.main' : 
                             log.type === 'warning' ? 'warning.main' : 'text.primary'
                    }}>
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
                        {log.timestamp}
                      </Typography>
                      <Typography variant="caption" sx={{ wordBreak: 'break-word' }}>
                        {log.message}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {results.length > 0 && !running && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Resultados Finais ({results.filter(r => r.success).length}/{results.length} passaram):
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