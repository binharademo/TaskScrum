import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

const parseCSV = (csvText) => {
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
  
  return data;
};

export const importExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        let jsonData;
        
        if (file.name.endsWith('.csv')) {
          const csvText = e.target.result;
          jsonData = parseCSV(csvText);
        } else {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          jsonData = XLSX.utils.sheet_to_json(worksheet);
        }
        
        const tasks = jsonData.map((row, index) => ({
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
          status: 'Backlog',
          // Reestimativas diárias (10 dias de sprint)
          reestimativas: Array.from({ length: 10 }, (_, i) => 
            parseFloat(row[`Dia${i + 1}`] || row[`dia${i + 1}`] || 0)
          ),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        
        resolve(tasks);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};

export const exportToExcel = (tasks) => {
  const exportData = tasks.map(task => ({
    'ID': task.originalId,
    'Épico': task.epico,
    'User Story': task.userStory,
    'Tela': task.tela,
    'Atividade': task.atividade,
    'Detalhamento': task.detalhamento,
    'Tipo Atividade': task.tipoAtividade,
    'Estimativa (h)': task.estimativa,
    'Desenvolvedor': task.desenvolvedor,
    'Sprint': task.sprint,
    'Prioridade': task.prioridade,
    'Tamanho Story': task.tamanhoStory,
    'Observações': task.observacoes,
    'Estimativa em horas': task.estimativaHoras,
    'Horas medidas': task.horasMedidas,
    'Status': task.status
  }));
  
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
  
  XLSX.writeFile(wb, 'tasks_export.xlsx');
};