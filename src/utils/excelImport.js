import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

const parseCSV = (csvText) => {
  const lines = csvText.split('\n');
  
  // Detectar separador automaticamente (tab, ponto e vírgula ou vírgula)
  const firstLine = lines[0];
  let separator = ';';
  if (firstLine.includes('\t')) {
    separator = '\t';
  } else if (firstLine.includes(',') && !firstLine.includes(';')) {
    separator = ',';
  }
  
  console.log('Separador detectado:', separator === '\t' ? 'TAB' : separator);
  
  const headers = firstLine.split(separator).map(h => h.trim().replace(/^\uFEFF/, ''));
  console.log('Headers encontrados:', headers);
  
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = lines[i].split(separator);
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ? values[index].trim() : '';
      });
      data.push(row);
    }
  }
  
  console.log('Dados parseados:', data.length, 'linhas');
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
          epico: String(row.Épico || row.Epico || ''),
          userStory: String(row['User Story'] || row.UserStory || ''),
          tela: String(row.Tela || ''),
          atividade: String(row.Atividade || ''),
          detalhamento: String(row.Detalhamento || ''),
          tipoAtividade: String(row['Tipo Atividade'] || row.TipoAtividade || ''),
          estimativa: parseFloat(row['Estimativa (h)'] || row.Estimativa || 0),
          desenvolvedor: String(row.Desenvolvedor || '').trim(),
          sprint: String(row.Sprint || '').trim(),
          prioridade: String(row.Prioridade || 'Média'),
          tamanhoStory: String(row['Tamanho Story'] || row.TamanhoStory || ''),
          observacoes: String(row.Observações || row.Observacoes || ''),
          estimativaHoras: parseFloat(row['Estimativa em horas'] || row.EstimativaHoras || 0),
          horasMedidas: parseFloat(row['Horas medidas'] || row.HorasMedidas || 0),
          status: String(row.Status || 'Backlog'),
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