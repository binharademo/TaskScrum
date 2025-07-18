// Google OAuth2 e Sheets API Configuration
export const GOOGLE_CONFIG = {
  // Configurações do OAuth2
  CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'seu-client-id-aqui',
  API_KEY: process.env.REACT_APP_GOOGLE_API_KEY || 'sua-api-key-aqui',
  
  // Scopes necessários
  SCOPES: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ],
  
  // Configurações das planilhas
  SPREADSHEET_CONFIG: {
    PROJECT_PREFIX: 'TaskTracker',
    SHEETS: {
      TASKS: 'Tasks',
      SPRINTS: 'Sprints', 
      CONFIG: 'Config',
      COLLABORATORS: 'Collaborators'
    }
  }
};

// Headers das planilhas
export const SHEET_HEADERS = {
  TASKS: [
    'ID', 'Épico', 'UserStory', 'Atividade', 'Detalhamento', 'Desenvolvedor',
    'Sprint', 'Status', 'Prioridade', 'Estimativa', 'Dia1', 'Dia2', 'Dia3',
    'Dia4', 'Dia5', 'Dia6', 'Dia7', 'Dia8', 'Dia9', 'Dia10', 'TempoGasto',
    'TaxaErro', 'MotivoErro', 'TempoGastoValidado', 'Observacoes', 'DataCriacao',
    'DataAtualizacao'
  ],
  
  SPRINTS: [
    'Nome', 'DataInicio', 'DataFim', 'Status', 'TotalTarefas', 'TarefasCompletas',
    'HorasEstimadas', 'HorasGastas', 'DataCriacao'
  ],
  
  CONFIG: [
    'Chave', 'Valor', 'Tipo', 'Descricao', 'DataAtualizacao'
  ],
  
  COLLABORATORS: [
    'Email', 'Nome', 'Role', 'Status', 'DataConvite', 'DataAceite'
  ]
};