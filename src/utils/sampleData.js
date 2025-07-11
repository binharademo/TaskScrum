import { v4 as uuidv4 } from 'uuid';

export const loadSampleData = async () => {
  try {
    const response = await fetch('/backlog-sample.csv');
    const csvText = await response.text();
    
    const lines = csvText.split('\n');
    const headers = lines[0].split(';').map(h => h.trim().replace(/^\uFEFF/, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(';');
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] ? values[index].trim() : '';
        });
        data.push(row);
      }
    }
    
    const tasks = data.map((row, index) => {
      // Distribuir tarefas pelos status para simular projeto real
      const statusDistribution = ['Backlog', 'Backlog', 'Backlog', 'Priorizado', 'Doing', 'Done'];
      const randomStatus = statusDistribution[Math.floor(Math.random() * statusDistribution.length)];
      
      // Criar timestamps realistas
      const now = new Date();
      const createdDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Últimos 30 dias
      const updatedDate = new Date(createdDate.getTime() + Math.random() * (now.getTime() - createdDate.getTime()));
      
      return {
        id: uuidv4(),
        originalId: row.ID || index + 1,
        epico: row.Épico || row.Epico || '',
        userStory: row['User Story'] || row.UserStory || '',
        tela: row.Tela || '',
        atividade: row.Atividade || '',
        detalhamento: row.Detalhamento || '',
        tipoAtividade: row['Tipo Atividade'] || row.TipoAtividade || '',
        estimativa: parseFloat(row['Estimativa (h)'] || row.Estimativa || 0),
        desenvolvedor: (row.Desenvolvedor || '').trim(),
        sprint: (row.Sprint || '').trim(),
        prioridade: row.Prioridade || 'Média',
        tamanhoStory: row['Tamanho Story'] || row.TamanhoStory || '',
        observacoes: row.Observações || row.Observacoes || '',
        estimativaHoras: parseFloat(row['Estimativa em horas'] || row.EstimativaHoras || 0),
        horasMedidas: parseFloat(row['Horas medidas'] || row.HorasMedidas || 0),
        status: randomStatus,
        // Reestimativas diárias (10 dias de sprint) - inicializar com a estimativa inicial
        reestimativas: Array.from({ length: 10 }, () => 
          parseFloat(row['Estimativa (h)'] || row.Estimativa || 0)
        ),
        createdAt: createdDate.toISOString(),
        updatedAt: updatedDate.toISOString(),
        statusChangedAt: updatedDate.toISOString(),
        // Campos para controle de WIP
        blockedAt: null,
        blockedReason: null,
        ageInDays: Math.floor((now - createdDate) / (1000 * 60 * 60 * 24)),
        // Histórico de movimentação (simplificado para demo)
        movements: [
          {
            timestamp: createdDate.toISOString(),
            from: null,
            to: 'Backlog',
            userId: 'system'
          }
        ]
      };
    });
    
    return tasks;
  } catch (error) {
    console.error('Error loading sample data:', error);
    return [];
  }
};