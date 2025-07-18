import { GOOGLE_CONFIG, SHEET_HEADERS } from '../config/googleConfig';
import googleAuth from './googleAuth';

class GoogleSheetsService {
  constructor() {
    this.userSpreadsheets = null;
    this.lastSync = null;
  }

  // Obter cliente autenticado
  async getAuthenticatedClient() {
    const token = await googleAuth.getAccessToken();
    if (!token) {
      throw new Error('Token de acesso não disponível');
    }
    return token;
  }

  // Criar projeto do usuário (múltiplas planilhas)
  async createUserProject(userEmail) {
    try {
      const token = await this.getAuthenticatedClient();
      const projectName = `${GOOGLE_CONFIG.SPREADSHEET_CONFIG.PROJECT_PREFIX}-${userEmail}`;
      
      // Criar planilhas do projeto
      const spreadsheets = {};
      
      for (const [key, sheetName] of Object.entries(GOOGLE_CONFIG.SPREADSHEET_CONFIG.SHEETS)) {
        const spreadsheet = await this.createSpreadsheet(
          `${projectName}-${sheetName}`,
          SHEET_HEADERS[key]
        );
        spreadsheets[key.toLowerCase()] = spreadsheet;
      }
      
      // Salvar IDs das planilhas
      const projectConfig = {
        userEmail,
        projectName,
        spreadsheets,
        createdAt: new Date().toISOString(),
        lastSync: null
      };
      
      localStorage.setItem('tasktracker_project', JSON.stringify(projectConfig));
      this.userSpreadsheets = projectConfig;
      
      return projectConfig;
      
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      throw new Error('Falha na criação do projeto');
    }
  }

  // Criar uma planilha individual
  async createSpreadsheet(title, headers) {
    try {
      const token = await this.getAuthenticatedClient();
      
      const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            title: title,
          },
          sheets: [{
            properties: {
              title: 'Dados',
              gridProperties: {
                rowCount: 1000,
                columnCount: headers.length
              }
            },
            data: [{
              rowData: [{
                values: headers.map(header => ({
                  userEnteredValue: { stringValue: header },
                  userEnteredFormat: {
                    textFormat: { bold: true },
                    backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 }
                  }
                }))
              }]
            }]
          }]
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const spreadsheet = await response.json();
      
      return {
        id: spreadsheet.spreadsheetId,
        title: title,
        url: spreadsheet.spreadsheetUrl,
        headers: headers
      };
      
    } catch (error) {
      console.error('Erro ao criar planilha:', error);
      throw new Error('Falha na criação da planilha');
    }
  }

  // Carregar projeto existente
  async loadUserProject() {
    try {
      const savedProject = localStorage.getItem('tasktracker_project');
      if (savedProject) {
        this.userSpreadsheets = JSON.parse(savedProject);
        return this.userSpreadsheets;
      }
      return null;
    } catch (error) {
      console.error('Erro ao carregar projeto:', error);
      return null;
    }
  }

  // Verificar se projeto existe
  async hasUserProject() {
    const project = await this.loadUserProject();
    return project !== null;
  }

  // Ler dados de uma planilha
  async readSheet(sheetType, range = 'A:Z') {
    try {
      const project = await this.loadUserProject();
      if (!project) {
        throw new Error('Projeto não encontrado');
      }
      
      const spreadsheet = project.spreadsheets[sheetType.toLowerCase()];
      if (!spreadsheet) {
        throw new Error(`Planilha ${sheetType} não encontrada`);
      }
      
      const token = await this.getAuthenticatedClient();
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet.id}/values/Dados!${range}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      return this.parseSheetData(data.values, spreadsheet.headers);
      
    } catch (error) {
      console.error('Erro ao ler planilha:', error);
      throw new Error('Falha na leitura da planilha');
    }
  }

  // Escrever dados em uma planilha
  async writeSheet(sheetType, data, range = 'A2') {
    try {
      const project = await this.loadUserProject();
      if (!project) {
        throw new Error('Projeto não encontrado');
      }
      
      const spreadsheet = project.spreadsheets[sheetType.toLowerCase()];
      if (!spreadsheet) {
        throw new Error(`Planilha ${sheetType} não encontrada`);
      }
      
      const token = await this.getAuthenticatedClient();
      const values = this.formatDataForSheet(data, spreadsheet.headers);
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet.id}/values/Dados!${range}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: values
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      // Atualizar timestamp de sincronização
      this.lastSync = new Date().toISOString();
      project.lastSync = this.lastSync;
      localStorage.setItem('tasktracker_project', JSON.stringify(project));
      
      return await response.json();
      
    } catch (error) {
      console.error('Erro ao escrever planilha:', error);
      throw new Error('Falha na escrita da planilha');
    }
  }

  // Converter dados da planilha para objetos
  parseSheetData(values, headers) {
    if (!values || values.length <= 1) return [];
    
    const data = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const obj = {};
      
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      
      data.push(obj);
    }
    
    return data;
  }

  // Formatar dados para envio à planilha
  formatDataForSheet(data, headers) {
    if (!Array.isArray(data)) {
      data = [data];
    }
    
    return data.map(item => 
      headers.map(header => {
        const value = item[header];
        if (value === null || value === undefined) return '';
        return String(value);
      })
    );
  }

  // Compartilhar planilha com colaborador
  async shareProject(email, role = 'writer') {
    try {
      const project = await this.loadUserProject();
      if (!project) {
        throw new Error('Projeto não encontrado');
      }
      
      const token = await this.getAuthenticatedClient();
      const results = [];
      
      // Compartilhar todas as planilhas do projeto
      for (const [key, spreadsheet] of Object.entries(project.spreadsheets)) {
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${spreadsheet.id}/permissions`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'user',
              role: role,
              emailAddress: email
            })
          }
        );
        
        if (response.ok) {
          results.push({ sheet: key, success: true });
        } else {
          results.push({ sheet: key, success: false, error: response.status });
        }
      }
      
      // Adicionar colaborador à planilha de colaboradores
      await this.addCollaborator(email, role);
      
      return results;
      
    } catch (error) {
      console.error('Erro ao compartilhar projeto:', error);
      throw new Error('Falha no compartilhamento do projeto');
    }
  }

  // Adicionar colaborador à lista
  async addCollaborator(email, role) {
    try {
      const collaborator = {
        Email: email,
        Nome: '', // Será preenchido quando aceitar
        Role: role,
        Status: 'convidado',
        DataConvite: new Date().toISOString(),
        DataAceite: ''
      };
      
      await this.writeSheet('collaborators', [collaborator], 'A:A');
      
    } catch (error) {
      console.error('Erro ao adicionar colaborador:', error);
    }
  }

  // Obter informações do projeto
  getProjectInfo() {
    return this.userSpreadsheets;
  }

  // Obter última sincronização
  getLastSync() {
    return this.lastSync;
  }
}

// Instância singleton
export const googleSheets = new GoogleSheetsService();
export default googleSheets;