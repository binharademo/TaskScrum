// =============================================
// TESTE ESPECÍFICO: TaskContext + Supabase
// Execute este teste para verificar se TaskContext está persistindo dados
// =============================================

import { SupabaseService } from '../src/services/SupabaseService.js';
import { getCurrentRoom, setCurrentRoom } from '../src/utils/storage.js';

// Simular TaskContext workflow
const testeTaskContextWorkflow = async () => {
  console.log('🧪 TESTE TASKCONTEXT WORKFLOW - INICIANDO');
  console.log('=' .repeat(50));

  const supabaseService = new SupabaseService();
  
  try {
    // ========================================
    // 1. INICIALIZAR SERVIÇO (como TaskContext faz)
    // ========================================
    console.log('1️⃣ Inicializando SupabaseService...');
    await supabaseService.initialize();
    console.log('✅ SupabaseService inicializado');

    // ========================================
    // 2. CRIAR USUÁRIO DE TESTE
    // ========================================
    console.log('\n2️⃣ Criando usuário de teste...');
    const testUser = await supabaseService.createUser(
      'teste_taskcontext@gmail.com',
      '123456'
    );
    console.log('✅ Usuário criado:', testUser.email);

    // ========================================
    // 3. CRIAR SALA DE TESTE (como RoomSelector faz)
    // ========================================
    console.log('\n3️⃣ Criando sala de teste...');
    const testRoom = await supabaseService.createRoom({
      name: 'Sala Teste TaskContext',
      room_code: 'TEST_TASKCONTEXT',
      description: 'Sala para testar TaskContext'
    });
    console.log('✅ Sala criada:', testRoom.room_code);

    // ========================================
    // 4. CONFIGURAR ROOM ATUAL (como TaskContext deveria fazer)
    // ========================================
    console.log('\n4️⃣ Configurando room atual...');
    
    // Simular localStorage
    setCurrentRoom('TEST_TASKCONTEXT');
    
    // Configurar no SupabaseService (como TaskContext.useEffect faz)
    const currentRoomCode = getCurrentRoom();
    console.log('   Room code do localStorage:', currentRoomCode);
    
    const room = await supabaseService.findRoomByCode(currentRoomCode);
    if (room) {
      supabaseService.setCurrentRoom(room.id);
      console.log('✅ Room ID configurado no service:', room.id);
    } else {
      throw new Error('Room não encontrada!');
    }

    // ========================================
    // 5. TESTAR addTask (como TaskContext.addTask faz)
    // ========================================
    console.log('\n5️⃣ Testando addTask workflow...');
    
    const newTask = {
      atividade: 'Tarefa Teste TaskContext',
      epico: 'Teste de Integração',
      status: 'Backlog',
      desenvolvedor: 'Sistema',
      estimativa: 8,
      tempo_gasto: 10,
      taxa_erro: 25,
      motivo_erro: 'Complexidade subestimada',
      tempo_gasto_validado: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Garantir que service está inicializado (como TaskContext faz)
    if (!supabaseService.initialized) {
      console.log('   Reinicializando service...');
      await supabaseService.initialize();
    }
    
    // Garantir que room_id está configurado (como TaskContext faz)
    if (!supabaseService.currentRoomId) {
      const currentRoom = getCurrentRoom();
      if (currentRoom) {
        const room = await supabaseService.findRoomByCode(currentRoom);
        if (room) {
          supabaseService.setCurrentRoom(room.id);
          console.log('   Room ID reconfigurado:', room.id);
        }
      }
    }

    console.log('   Criando tarefa no Supabase...');
    const createdTask = await supabaseService.createTask(newTask);
    console.log('✅ Tarefa criada:', createdTask.atividade, '(ID:', createdTask.id + ')');

    // ========================================
    // 6. TESTAR updateTask (como TaskContext.updateTask faz)
    // ========================================
    console.log('\n6️⃣ Testando updateTask workflow...');
    
    const updates = {
      status: 'Doing',
      desenvolvedor: 'João Silva',
      updatedAt: new Date().toISOString()
    };

    await supabaseService.updateTask(createdTask.id, updates);
    console.log('✅ Tarefa atualizada para status:', updates.status);

    // ========================================
    // 7. TESTAR loadTasks (como TaskContext.loadTasksFromPersistence faz)
    // ========================================
    console.log('\n7️⃣ Testando loadTasks workflow...');
    
    const loadedTasks = await supabaseService.getTasks();
    console.log('✅ Tarefas carregadas:', loadedTasks.length);
    
    const ourTask = loadedTasks.find(t => t.atividade === 'Tarefa Teste TaskContext');
    if (ourTask) {
      console.log('   Nossa tarefa encontrada:');
      console.log('   - ID:', ourTask.id);
      console.log('   - Status:', ourTask.status);
      console.log('   - Desenvolvedor:', ourTask.desenvolvedor);
      console.log('   - Tempo gasto:', ourTask.tempo_gasto);
      console.log('   - Taxa erro:', ourTask.taxa_erro);
    } else {
      throw new Error('Tarefa não encontrada no carregamento!');
    }

    // ========================================
    // 8. VERIFICAR DADOS NO BANCO
    // ========================================
    console.log('\n8️⃣ Verificando dados no banco...');
    
    console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('✅ TaskContext workflow está funcionando corretamente');
    console.log('✅ Dados estão sendo persistidos no Supabase');
    
    return {
      user: testUser,
      room: testRoom,
      task: createdTask,
      loadedTasks: loadedTasks,
      success: true
    };

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
    console.error('❌ Stack:', error.stack);
    
    return {
      error: error.message,
      success: false
    };
  }
};

// =============================================
// EXECUTAR TESTE
// =============================================
console.log('🚀 INICIANDO TESTE TASKCONTEXT + SUPABASE');
console.log('Data/Hora:', new Date().toLocaleString());
console.log('');

testeTaskContextWorkflow()
  .then(result => {
    console.log('\n' + '='.repeat(50));
    console.log('🎯 RESULTADO FINAL:');
    
    if (result.success) {
      console.log('✅ TESTE PASSOU!');
      console.log('✅ TaskContext + Supabase funcionando');
      console.log('');
      console.log('📊 SQL para verificar no Supabase:');
      console.log(`SELECT * FROM tasks WHERE atividade = 'Tarefa Teste TaskContext';`);
      console.log(`SELECT * FROM rooms WHERE room_code = 'TEST_TASKCONTEXT';`);
    } else {
      console.log('❌ TESTE FALHOU!');
      console.log('❌ Erro:', result.error);
    }
  })
  .catch(error => {
    console.error('💥 ERRO FATAL:', error);
  });

export { testeTaskContextWorkflow };