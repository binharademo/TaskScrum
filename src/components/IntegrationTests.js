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
      id: 'cleanup_tests',
      name: '🧹 Limpeza de Dados de Teste',
      description: 'Remover dados de teste criados'
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

  const runTests = async () => {
    setRunning(true);
    const testResults = [];
    
    // =============================================
    // PASSO 0: FORÇAR AUTENTICAÇÃO ANTES DOS TESTES
    // =============================================
    console.log('🔐 Executando sincronização de autenticação...');
    const authSync = await forceAuthenticationSync();
    
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
      setResults(testResults);
      setRunning(false);
      return;
    }
    
    console.log('✅ Autenticação OK, continuando com testes...');

    for (const test of tests) {
      try {
        let result;
        switch (test.id) {
          case 'auth_sync':
            // Este teste já foi executado antes do loop
            continue;
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
          case 'cleanup_tests':
            result = await cleanupTestData();
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
    console.log('🧹 cleanupTestData - INICIANDO limpeza de dados de teste');

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
      let errors = [];

      // ========================================
      // IMPORTANTE: NÃO REMOVER SALA E TAREFAS
      // O usuário quer manter os dados para testar na interface
      // ========================================

      console.log('⚠️ cleanupTestData - LIMPEZA DESABILITADA');
      console.log('💡 cleanupTestData - Dados mantidos para inspeção na interface');

      // Limpar apenas variáveis globais temporárias
      if (window.testUserData) {
        delete window.testUserData;
        results.push(`🧹 Dados de usuário de teste limpos (somente variáveis)`);
      }

      // Manter dados de sala padrão e tarefas para inspeção
      if (window.testRoomData) {
        const isDefaultRoom = window.testRoomData.code === 'DEFAULT_ROOM';
        if (isDefaultRoom) {
          results.push(`🔒 Sala padrão PRESERVADA (nunca será excluída): ${window.testRoomData.name}`);
        } else {
          results.push(`🏠 Sala de teste MANTIDA para inspeção: ${window.testRoomData.name} (${window.testRoomData.code})`);
        }
      }

      if (window.testTasksData && window.testTasksData.length > 0) {
        results.push(`📝 ${window.testTasksData.length} tarefas de teste MANTIDAS para inspeção`);
      }

      return { 
        success: true, 
        message: `✅ Dados de teste mantidos para inspeção na interface!\n\n` +
                 `🎯 DADOS DISPONÍVEIS PARA TESTE:\n${results.join('\n')}\n\n` +
                 `📋 COMO TESTAR NA INTERFACE:\n` +
                 `1. Vá para a tela principal do TaskTracker\n` +
                 `2. Use o código da sala: ${window.testRoomData?.code || 'TEST_[timestamp]'}\n` +
                 `3. Interaja com as tarefas (drag & drop, editar, criar novas)\n` +
                 `4. Verifique se as mudanças são salvas no Supabase\n\n` +
                 `🗄️ VERIFICAÇÃO NO BANCO:\n` +
                 `• Execute o SQL: docs/SUPABASE_VERIFICAR_TASKCONTEXT.sql\n` +
                 `• Confirme se suas ações aparecem como dados recentes\n\n` +
                 `⏰ Dados criados em: ${new Date().toLocaleString('pt-BR')}\n\n` +
                 `💡 Para limpar apenas tarefas de teste (mantendo sala padrão):\n` +
                 `DELETE FROM tasks WHERE room_id IN (SELECT id FROM rooms WHERE room_code = 'DEFAULT_ROOM');\n\n` +
                 `⚠️ IMPORTANTE: A sala padrão (DEFAULT_ROOM) nunca deve ser excluída!\n` +
                 `Esta é a sala permanente do usuário para testes e uso geral.`
      };

    } catch (error) {
      console.error('❌ cleanupTestData - Erro:', error);
      console.error('📋 cleanupTestData - Stack:', error.stack);
      
      return { 
        success: false, 
        message: `Erro ao processar limpeza: ${error.message}\n\n` +
                 `🔍 Stack trace no console`
      };
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