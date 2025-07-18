import googleSheets from './googleSheets';
import { loadTasksFromStorage, saveTasksToStorage } from '../utils/storage';

class SyncService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncInterval = null;
    this.lastSync = null;
    this.pendingChanges = [];
    
    // Monitorar status de conexão
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingChanges();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Iniciar sincronização automática
  startAutoSync(intervalMinutes = 2) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      this.syncWithSheets();
    }, intervalMinutes * 60 * 1000);
    
    // Sincronizar imediatamente
    this.syncWithSheets();
  }

  // Parar sincronização automática
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Sincronizar com Google Sheets
  async syncWithSheets() {
    if (!this.isOnline) {
      console.log('Offline - sincronização adiada');
      return;
    }

    try {
      console.log('Iniciando sincronização...');
      
      // Carregar dados locais
      const localTasks = loadTasksFromStorage();
      
      // Enviar dados para o Sheets
      await this.pushToSheets(localTasks);
      
      // Buscar dados do Sheets
      const remoteTasks = await this.pullFromSheets();
      
      // Resolver conflitos e mesclar
      const mergedTasks = this.mergeData(localTasks, remoteTasks);
      
      // Salvar dados mesclados localmente
      saveTasksToStorage(mergedTasks);
      
      this.lastSync = new Date().toISOString();
      console.log('Sincronização concluída:', this.lastSync);
      
      // Notificar componentes sobre a sincronização
      this.notifySyncComplete(mergedTasks);
      
    } catch (error) {
      console.error('Erro na sincronização:', error);
      this.handleSyncError(error);
    }
  }

  // Enviar dados para Google Sheets
  async pushToSheets(tasks) {
    try {
      // Converter tarefas para formato do Sheets
      const sheetData = this.convertTasksToSheetFormat(tasks);
      
      // Enviar para planilha Tasks
      await googleSheets.writeSheet('tasks', sheetData);
      
      // Atualizar configurações se necessário
      await this.updateConfig();
      
    } catch (error) {
      console.error('Erro ao enviar para Sheets:', error);
      throw error;
    }
  }

  // Buscar dados do Google Sheets
  async pullFromSheets() {
    try {
      // Buscar dados da planilha Tasks
      const sheetData = await googleSheets.readSheet('tasks');
      
      // Converter para formato do TaskTracker
      const tasks = this.convertSheetFormatToTasks(sheetData);
      
      return tasks;
      
    } catch (error) {
      console.error('Erro ao buscar do Sheets:', error);
      throw error;
    }
  }

  // Mesclar dados locais e remotos
  mergeData(localTasks, remoteTasks) {
    const merged = [];
    const processedIds = new Set();
    
    // Mesclar tarefas existentes
    for (const localTask of localTasks) {
      const remoteTask = remoteTasks.find(t => t.id === localTask.id);
      
      if (remoteTask) {
        // Resolver conflito por timestamp
        const mergedTask = this.resolveConflict(localTask, remoteTask);
        merged.push(mergedTask);
      } else {
        // Tarefa só existe localmente
        merged.push(localTask);
      }
      
      processedIds.add(localTask.id);
    }
    
    // Adicionar tarefas que só existem remotamente
    for (const remoteTask of remoteTasks) {
      if (!processedIds.has(remoteTask.id)) {
        merged.push(remoteTask);
      }
    }
    
    return merged;
  }

  // Resolver conflitos entre versões local e remota
  resolveConflict(localTask, remoteTask) {
    const localDate = new Date(localTask.dataAtualizacao || localTask.dataCriacao);
    const remoteDate = new Date(remoteTask.dataAtualizacao || remoteTask.dataCriacao);
    
    // Usar a versão mais recente
    if (localDate > remoteDate) {
      return { ...localTask, _source: 'local' };
    } else if (remoteDate > localDate) {
      return { ...remoteTask, _source: 'remote' };
    } else {
      // Mesmo timestamp - mesclar campos específicos
      return {
        ...localTask,
        ...remoteTask,
        _source: 'merged'
      };
    }
  }

  // Converter tarefas para formato do Sheets
  convertTasksToSheetFormat(tasks) {
    return tasks.map(task => ({
      ID: task.id,
      Épico: task.epico || '',
      UserStory: task.userStory || '',
      Atividade: task.atividade || '',
      Detalhamento: task.detalhamento || '',
      Desenvolvedor: task.desenvolvedor || '',
      Sprint: task.sprint || '',
      Status: task.status || '',
      Prioridade: task.prioridade || '',
      Estimativa: task.estimativa || 0,
      Dia1: task.reestimativas?.[0] || task.estimativa || 0,
      Dia2: task.reestimativas?.[1] || task.estimativa || 0,
      Dia3: task.reestimativas?.[2] || task.estimativa || 0,
      Dia4: task.reestimativas?.[3] || task.estimativa || 0,
      Dia5: task.reestimativas?.[4] || task.estimativa || 0,
      Dia6: task.reestimativas?.[5] || task.estimativa || 0,
      Dia7: task.reestimativas?.[6] || task.estimativa || 0,
      Dia8: task.reestimativas?.[7] || task.estimativa || 0,
      Dia9: task.reestimativas?.[8] || task.estimativa || 0,
      Dia10: task.reestimativas?.[9] || task.estimativa || 0,
      TempoGasto: task.tempoGasto || '',
      TaxaErro: task.taxaErro || '',
      MotivoErro: task.motivoErro || '',
      TempoGastoValidado: task.tempoGastoValidado || false,
      Observacoes: task.observacoes || '',
      DataCriacao: task.dataCriacao || new Date().toISOString(),
      DataAtualizacao: task.dataAtualizacao || new Date().toISOString()
    }));
  }

  // Converter formato do Sheets para tarefas
  convertSheetFormatToTasks(sheetData) {
    return sheetData.map(row => ({
      id: row.ID,
      originalId: parseInt(row.ID.split('-')[1]) || 1,
      epico: row.Épico,
      userStory: row.UserStory,
      atividade: row.Atividade,
      detalhamento: row.Detalhamento,
      desenvolvedor: row.Desenvolvedor,
      sprint: row.Sprint,
      status: row.Status,
      prioridade: row.Prioridade,
      estimativa: parseFloat(row.Estimativa) || 0,
      reestimativas: [
        parseFloat(row.Dia1) || 0,
        parseFloat(row.Dia2) || 0,
        parseFloat(row.Dia3) || 0,
        parseFloat(row.Dia4) || 0,
        parseFloat(row.Dia5) || 0,
        parseFloat(row.Dia6) || 0,
        parseFloat(row.Dia7) || 0,
        parseFloat(row.Dia8) || 0,
        parseFloat(row.Dia9) || 0,
        parseFloat(row.Dia10) || 0
      ],
      tempoGasto: parseFloat(row.TempoGasto) || null,
      taxaErro: parseFloat(row.TaxaErro) || null,
      motivoErro: row.MotivoErro || null,
      tempoGastoValidado: row.TempoGastoValidado === 'true',
      observacoes: row.Observacoes,
      dataCriacao: row.DataCriacao || new Date().toISOString(),
      dataAtualizacao: row.DataAtualizacao || new Date().toISOString()
    }));
  }

  // Atualizar configurações no Sheets
  async updateConfig() {
    try {
      const config = [
        { Chave: 'lastSync', Valor: this.lastSync, Tipo: 'timestamp', Descricao: 'Última sincronização' },
        { Chave: 'version', Valor: '1.0.0', Tipo: 'string', Descricao: 'Versão do TaskTracker' },
        { Chave: 'syncInterval', Valor: '2', Tipo: 'number', Descricao: 'Intervalo de sincronização (minutos)' }
      ];
      
      await googleSheets.writeSheet('config', config);
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
    }
  }

  // Adicionar mudança pendente (para modo offline)
  addPendingChange(change) {
    this.pendingChanges.push({
      ...change,
      timestamp: new Date().toISOString()
    });
  }

  // Sincronizar mudanças pendentes
  async syncPendingChanges() {
    if (this.pendingChanges.length === 0) return;
    
    try {
      console.log(`Sincronizando ${this.pendingChanges.length} mudanças pendentes...`);
      
      // Aplicar mudanças pendentes
      for (const change of this.pendingChanges) {
        await this.applyChange(change);
      }
      
      // Limpar mudanças pendentes
      this.pendingChanges = [];
      
      // Sincronizar completamente
      await this.syncWithSheets();
      
    } catch (error) {
      console.error('Erro ao sincronizar mudanças pendentes:', error);
    }
  }

  // Aplicar mudança individual
  async applyChange(change) {
    switch (change.type) {
      case 'task_update':
        // Atualizar tarefa
        break;
      case 'task_create':
        // Criar tarefa
        break;
      case 'task_delete':
        // Deletar tarefa
        break;
      default:
        console.warn('Tipo de mudança desconhecido:', change.type);
    }
  }

  // Notificar componentes sobre sincronização
  notifySyncComplete(tasks) {
    const event = new CustomEvent('tasktracker-sync-complete', {
      detail: { tasks, lastSync: this.lastSync }
    });
    window.dispatchEvent(event);
  }

  // Tratar erros de sincronização
  handleSyncError(error) {
    const event = new CustomEvent('tasktracker-sync-error', {
      detail: { error }
    });
    window.dispatchEvent(event);
  }

  // Obter status da sincronização
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      lastSync: this.lastSync,
      pendingChanges: this.pendingChanges.length,
      autoSyncActive: this.syncInterval !== null
    };
  }
}

// Instância singleton
export const syncService = new SyncService();
export default syncService;