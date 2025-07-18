// Serviço simplificado para Google Sheets
class SimpleSheetsService {
  constructor() {
    this.spreadsheetId = localStorage.getItem('userSpreadsheetId');
    this.isReady = false;
  }

  // Configurar planilha
  setSpreadsheetId(id) {
    this.spreadsheetId = id;
    localStorage.setItem('userSpreadsheetId', id);
    this.isReady = true;
  }

  // Verificar se está pronto
  isConfigured() {
    return this.isReady && this.spreadsheetId && window.gapi && window.gapi.auth2;
  }

  // Verificar se usuário está logado
  isSignedIn() {
    if (!window.gapi || !window.gapi.auth2) return false;
    const authInstance = window.gapi.auth2.getAuthInstance();
    return authInstance && authInstance.isSignedIn.get();
  }

  // Salvar tarefas na planilha
  async saveTasks(tasks) {
    try {
      if (!this.isConfigured() || !this.isSignedIn()) {
        console.log('Google Sheets não configurado ou usuário não logado');
        return false;
      }

      // Converter tarefas para formato de planilha
      const values = tasks.map(task => [
        task.id || '',
        task.epico || '',
        task.userStory || '',
        task.atividade || '',
        task.estimativa || 0,
        task.desenvolvedor || '',
        task.sprint || '',
        task.status || 'Backlog',
        task.prioridade || 'Média',
        ...(task.reestimativas || Array(10).fill(0)),
        task.tempoGasto || 0,
        task.taxaErro || 0,
        task.createdAt || new Date().toISOString(),
        task.updatedAt || new Date().toISOString()
      ]);

      // Limpar planilha primeiro (exceto cabeçalho)
      await window.gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: 'Tarefas!A2:Z1000'
      });

      // Salvar dados
      const response = await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Tarefas!A2',
        valueInputOption: 'RAW',
        resource: {
          values: values
        }
      });

      console.log(`✅ ${tasks.length} tarefas salvas no Google Sheets`);
      return true;

    } catch (error) {
      console.error('Erro ao salvar no Google Sheets:', error);
      return false;
    }
  }

  // Carregar tarefas da planilha
  async loadTasks() {
    try {
      if (!this.isConfigured() || !this.isSignedIn()) {
        console.log('Google Sheets não configurado ou usuário não logado');
        return [];
      }

      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Tarefas!A2:Z1000'
      });

      const rows = response.result.values || [];
      
      const tasks = rows.map(row => ({
        id: row[0] || '',
        epico: row[1] || '',
        userStory: row[2] || '',
        atividade: row[3] || '',
        estimativa: parseFloat(row[4]) || 0,
        desenvolvedor: row[5] || '',
        sprint: row[6] || '',
        status: row[7] || 'Backlog',
        prioridade: row[8] || 'Média',
        reestimativas: [
          parseFloat(row[9]) || 0,
          parseFloat(row[10]) || 0,
          parseFloat(row[11]) || 0,
          parseFloat(row[12]) || 0,
          parseFloat(row[13]) || 0,
          parseFloat(row[14]) || 0,
          parseFloat(row[15]) || 0,
          parseFloat(row[16]) || 0,
          parseFloat(row[17]) || 0,
          parseFloat(row[18]) || 0
        ],
        tempoGasto: parseFloat(row[19]) || null,
        taxaErro: parseFloat(row[20]) || null,
        tempoGastoValidado: row[19] ? true : false,
        motivoErro: row[21] || null,
        createdAt: row[22] || new Date().toISOString(),
        updatedAt: row[23] || new Date().toISOString()
      })).filter(task => task.atividade); // Filtrar linhas vazias

      console.log(`📥 ${tasks.length} tarefas carregadas do Google Sheets`);
      return tasks;

    } catch (error) {
      console.error('Erro ao carregar do Google Sheets:', error);
      return [];
    }
  }

  // Sincronização automática
  async syncTasks(localTasks) {
    try {
      if (!this.isConfigured() || !this.isSignedIn()) {
        return localTasks; // Retorna dados locais se não configurado
      }

      // Carregar dados da planilha
      const sheetTasks = await this.loadTasks();
      
      if (sheetTasks.length === 0) {
        // Se planilha está vazia, salvar dados locais
        await this.saveTasks(localTasks);
        return localTasks;
      }

      // Mesclar dados baseado no timestamp mais recente
      const mergedTasks = this.mergeTasks(localTasks, sheetTasks);
      
      // Salvar resultado mesclado
      await this.saveTasks(mergedTasks);
      
      return mergedTasks;

    } catch (error) {
      console.error('Erro na sincronização:', error);
      return localTasks; // Retorna dados locais em caso de erro
    }
  }

  // Mesclar tarefas baseado no timestamp
  mergeTasks(localTasks, sheetTasks) {
    const taskMap = new Map();

    // Adicionar tarefas do sheets primeiro
    sheetTasks.forEach(task => {
      taskMap.set(task.id, { ...task, source: 'sheet' });
    });

    // Sobrescrever com tarefas locais se forem mais recentes
    localTasks.forEach(localTask => {
      const existingTask = taskMap.get(localTask.id);
      
      if (!existingTask) {
        taskMap.set(localTask.id, { ...localTask, source: 'local' });
      } else {
        const localDate = new Date(localTask.updatedAt || localTask.createdAt || '2000-01-01');
        const sheetDate = new Date(existingTask.updatedAt || existingTask.createdAt || '2000-01-01');
        
        if (localDate >= sheetDate) {
          taskMap.set(localTask.id, { ...localTask, source: 'local' });
        }
      }
    });

    return Array.from(taskMap.values());
  }

  // Obter URL da planilha
  getSpreadsheetUrl() {
    if (!this.spreadsheetId) return null;
    return `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`;
  }

  // Status da sincronização
  getStatus() {
    if (!this.isConfigured()) return 'not_configured';
    if (!this.isSignedIn()) return 'not_signed_in';
    return 'ready';
  }
}

// Instância singleton
export const simpleSheets = new SimpleSheetsService();
export default simpleSheets;