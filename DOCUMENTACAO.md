# TaskTracker - Documentação Completa

## Visão Geral
TaskTracker é um sistema de gestão de tarefas inspirado no Trello, desenvolvido em React 18 com Material-UI, focado em equipes de desenvolvimento ágil com análise preditiva avançada.

## Índice
1. [Arquitetura do Sistema](#arquitetura-do-sistema)
2. [Funcionalidades Principais](#funcionalidades-principais)
3. [Componentes e Estrutura](#componentes-e-estrutura)
4. [APIs e Integração](#apis-e-integração)
5. [Guias de Uso](#guias-de-uso)
6. [Configuração e Deploy](#configuração-e-deploy)

---

## Arquitetura do Sistema

### Stack Tecnológico
- **Frontend**: React 18.2.0 + Material-UI 5.14.0
- **Gráficos**: Chart.js 4.3.0 + Recharts
- **Drag & Drop**: React Beautiful DnD 13.1.1
- **Utilitários**: uuid 9.0.0, date-fns 2.30.0, xlsx 0.18.5
- **Persistência**: localStorage + Google Sheets (opcional)

### Estrutura de Arquivos
```
tasktracker/
├── src/
│   ├── components/
│   │   ├── TableView.js           # Tabela principal + análises
│   │   ├── SimpleKanban.js        # Kanban board completo
│   │   ├── PredictiveAnalysis.js  # Análises preditivas
│   │   ├── GoogleSheetsSimple.js  # Integração Google Sheets
│   │   └── DemoModeInfo.js        # Informações do modo demo
│   ├── services/
│   │   └── demoData.js           # Dados de demonstração
│   ├── utils/
│   │   ├── storage.js            # Persistência localStorage
│   │   ├── sampleData.js         # Estrutura de dados
│   │   └── excelImport.js        # Import de arquivos
│   └── App.js                    # Componente raiz
├── public/
│   └── backlog-sample.csv        # Dados de exemplo
├── CLAUDE.md                     # Instruções do projeto
├── DEBUG_HISTORY.md              # Histórico de debug
└── DOCUMENTACAO.md               # Este arquivo
```

---

## Funcionalidades Principais

### 1. Kanban Board Interativo

#### Características
- **4 Colunas**: Backlog, Priorizado, Doing, Done
- **Drag & Drop**: Movimentação fluida entre colunas
- **Agrupamento**: Por épico com cores automáticas
- **Visões**: Compacta (2 linhas) e Expandida (detalhada)
- **Modal Completo**: Edição de todos os campos

#### Funcionalidades Avançadas
- **Nova Tarefa**: Botão integrado com modal reutilizado
- **Validação de Tempo**: Modal obrigatório ao mover para Done
- **Busca por ID**: Campo exato (#123 ou 123)
- **Filtros Múltiplos**: Por desenvolvedor, sprint, status, prioridade
- **Busca Textual**: Em todos os campos simultaneamente

### 2. TableView com Burndown Chart

#### Estrutura da Tabela
- **Colunas Otimizadas**: Atividade (30%), Est. Inicial (8%), Dias 1-10 (6.2% cada)
- **Linha de Totais**: Primeira linha com somatórios automáticos
- **Reestimativas**: Sistema de replicação para dias seguintes
- **Campos Editáveis**: Click-to-edit com validação

#### Sistema de Abas
1. **📈 Burndown Chart**: Gráfico em tempo real + configurações de equipe
2. **📊 Estatísticas**: Métricas gerais, tarefas, horas, previsões
3. **🔮 Análise Preditiva**: Cronograma, performance, previsão WIP

### 3. Análise Preditiva Avançada

#### Análise de Cronograma
- **Velocidade da Equipe**: Tarefas concluídas por dia
- **Previsão de Entrega**: Data estimada baseada na velocidade
- **Status do Prazo**: Indicador visual (verde/vermelho)
- **Horas Restantes**: Cálculo baseado em estimativas

#### Performance dos Desenvolvedores
- **Tendências Individuais**: Melhorando/Piorando/Estável
- **Precisão das Estimativas**: Percentual de acerto
- **Categorização**: Precisas/Superestimadas/Subestimadas
- **Comparação Temporal**: Últimas 3 tarefas vs históricas

#### Previsão WIP (Work in Progress)
- **Próximos 5 Dias**: Movimentação prevista por coluna
- **Identificação de Gargalos**: Colunas com excesso
- **Limites Configuráveis**: Alertas de violação
- **Gráficos Interativos**: Visualização da evolução

### 4. Sistema de Tempo e Taxa de Erro

#### Validação Obrigatória
- **Modal Automático**: Aparece ao mover tarefa para Done
- **Campos Obrigatórios**: Tempo gasto (horas com decimais)
- **Cálculo Automático**: Taxa de erro = ((tempo/estimativa - 1) * 100)
- **Motivo Condicional**: Obrigatório para taxa > 20%

#### Feedback Visual
- **Verde**: Taxa ≤ 20% (dentro do esperado)
- **Vermelho**: Taxa > 20% (requer justificativa)
- **Histórico Completo**: Dados salvos por tarefa
- **Relatórios**: Integração com análise preditiva

### 5. Integração Google Sheets

#### Modo Simples (CSV)
- **3 Passos**: Baixar CSV → Criar Planilha → Importar
- **Zero Configuração**: Sem OAuth ou APIs
- **Compatibilidade Total**: Todos os campos exportados
- **Sempre Funcional**: Independe de configurações externas

#### Campos Exportados
```csv
ID,Épico,User Story,Atividade,Estimativa,Desenvolvedor,
Sprint,Status,Prioridade,Dia1-10,Tempo Gasto,Taxa Erro,
Criado em,Atualizado em
```

### 6. Modo Demo

#### Cenário Completo
- **Projeto**: Sistema de Gestão de Projetos
- **10 Tarefas Realistas**: Distribuídas em 5 épicos
- **5 Desenvolvedores**: Perfis diversos com dados variados
- **Status Diversificados**: Done (3), Doing (2), Priorizado (2), Backlog (3)

#### Desenvolvedores Virtuais
- **João Silva**: Sênior, estimativas precisas
- **Maria Santos**: Pleno, variações moderadas  
- **Pedro Costa**: Júnior, crescimento nas estimativas
- **Ana Oliveira**: Frontend specialist, conclusões rápidas
- **Carlos Lima**: Arquiteto, complexidade subestimada

---

## Componentes e Estrutura

### Modelo de Dados (Task Object)

```javascript
{
  // Identificação
  id: "uuid",                    // ID único gerado
  originalId: number,            // ID numérico para referência
  
  // Informações Básicas
  epico: "string",              // Agrupamento de tarefas
  userStory: "string",          // História do usuário
  atividade: "string",          // Nome da tarefa
  detalhamento: "string",       // Descrição detalhada
  
  // Estimativas e Tempo
  estimativa: number,           // Horas estimadas inicialmente
  reestimativas: [10 numbers],  // Reestimativas diárias (Dia 1-10)
  tempoGasto: number,           // Tempo efetivamente gasto
  taxaErro: number,             // ((tempoGasto/estimativa - 1) * 100)
  tempoGastoValidado: boolean,  // Flag de validação
  motivoErro: string,           // Explicação para taxa > 20%
  
  // Organização
  desenvolvedor: "string",      // Responsável pela tarefa
  sprint: "string",            // Sprint atual
  status: "Backlog|Priorizado|Doing|Done",
  prioridade: "Baixa|Média|Alta|Crítica",
  
  // Metadados
  createdAt: string,           // Timestamp de criação
  updatedAt: string,           // Timestamp da última atualização
  
  // Campos Adicionais
  tipo: "string",              // Tipo da atividade
  tamanhoStory: "XS|S|M|L|XL", // Tamanho da story
  tela: "string",              // Interface relacionada
  observacoes: "string"        // Observações gerais
}
```

### Principais Componentes

#### App.js - Componente Raiz
```javascript
// Estados Principais
const [tasks, setTasks] = useState([]);
const [activeTab, setActiveTab] = useState(0);
const [isDemoMode, setIsDemoMode] = useState(false);

// Funções Principais
const handleTasksUpdate = (newTasks) => {
  setTasks(newTasks);
  saveToLocalStorage('tasktracker_tasks', newTasks);
};

const handleClearTasks = () => {
  setTasks([]);
  setIsDemoMode(false);
  localStorage.removeItem('tasktracker_tasks');
};
```

#### SimpleKanban.js - Kanban Board
```javascript
// Estados do Kanban
const [filters, setFilters] = useState({
  sprint: '', desenvolvedor: '', status: '', 
  prioridade: '', epico: '', search: '', searchId: ''
});
const [isCompactView, setIsCompactView] = useState(false);
const [detailsOpen, setDetailsOpen] = useState(false);
const [selectedTask, setSelectedTask] = useState(null);

// Funções Principais
const handleStatusChange = (taskId, newStatus) => {
  // Validação obrigatória para Done
  if (newStatus === 'Done') {
    const task = tasks.find(t => t.id === taskId);
    if (!task.tempoGastoValidado) {
      // Abrir modal de validação
      setTimeValidationModal({ open: true, task });
      return;
    }
  }
  // Atualizar status normalmente
};

const getFilteredTasks = () => {
  let filtered = tasks;
  
  // Aplicar todos os filtros
  Object.keys(filters).forEach(key => {
    if (filters[key]) {
      filtered = applyFilter(filtered, key, filters[key]);
    }
  });
  
  return filtered;
};
```

#### TableView.js - Tabela e Análises
```javascript
// Estados da Tabela
const [activeTab, setActiveTab] = useState(0);
const [teamConfig, setTeamConfig] = useState({
  developers: 5, hoursPerDay: 8, sprintDays: 10
});
const [chartData, setChartData] = useState(null);

// Função de Reestimativas
const handleReestimativaChange = (taskId, dayIndex, value) => {
  const updatedTasks = tasks.map(task => {
    if (task.id === taskId) {
      const newReestimativas = [...(task.reestimativas || [])];
      newReestimativas[dayIndex] = parseFloat(value) || 0;
      
      // Replicar para dias seguintes
      for (let i = dayIndex + 1; i < 10; i++) {
        newReestimativas[i] = newReestimativas[dayIndex];
      }
      
      return { ...task, reestimativas: newReestimativas };
    }
    return task;
  });
  
  onTasksUpdate(updatedTasks);
};

// Cálculo do Burndown Chart
const calculateSprintData = (sprintName) => {
  const sprintTasks = tasks.filter(task => task.sprint === sprintName);
  const totals = calculateColumnTotals(sprintTasks);
  
  return {
    labels: ['Dia 0', 'Dia 1', ..., 'Dia 10'],
    datasets: [
      {
        label: 'Linha Ideal',
        data: generateIdealLine(totals.estimativa),
        borderColor: 'blue'
      },
      {
        label: 'Linha Real', 
        data: [totals.estimativa, ...totals.reestimativas],
        borderColor: 'red'
      }
    ]
  };
};
```

#### PredictiveAnalysis.js - Análises Preditivas
```javascript
// Análise de Cronograma
const analyzeDeadlines = (tasks, teamConfig) => {
  const doneTasks = tasks.filter(t => t.status === 'Done').length;
  const totalTasks = tasks.length;
  const remainingTasks = totalTasks - doneTasks;
  
  // Cálculo de velocidade
  const totalDaysWorked = 10; // ou cálculo dinâmico
  const velocity = doneTasks / Math.max(totalDaysWorked, 1);
  const estimatedDaysRemaining = Math.ceil(remainingTasks / velocity);
  
  // Previsão de entrega
  const today = new Date();
  const estimatedCompletionDate = new Date(
    today.getTime() + estimatedDaysRemaining * 24 * 60 * 60 * 1000
  );
  
  return {
    completionPercentage: (doneTasks / totalTasks) * 100,
    velocity,
    estimatedDaysRemaining,
    estimatedCompletionDate,
    isOnTrack: estimatedDaysRemaining <= teamConfig.sprintDays
  };
};

// Análise de Performance Individual
const analyzeDeveloperPerformance = (tasks) => {
  const developers = [...new Set(tasks.map(t => t.desenvolvedor))];
  
  return developers.map(dev => {
    const devTasks = tasks.filter(t => t.desenvolvedor === dev);
    const tasksWithTime = devTasks.filter(t => t.tempoGasto && t.estimativa);
    
    // Análise de tendência (últimas 3 vs anteriores)
    const recentTasks = tasksWithTime.slice(-3);
    const olderTasks = tasksWithTime.slice(0, -3);
    
    const recentAccuracy = recentTasks.reduce((sum, task) => 
      sum + Math.abs(task.taxaErro || 0), 0) / recentTasks.length;
    const olderAccuracy = olderTasks.reduce((sum, task) => 
      sum + Math.abs(task.taxaErro || 0), 0) / olderTasks.length;
    
    let trend = 'stable';
    if (recentAccuracy < olderAccuracy - 10) trend = 'improving';
    else if (recentAccuracy > olderAccuracy + 10) trend = 'declining';
    
    return {
      name: dev,
      totalTasks: devTasks.length,
      completedTasks: devTasks.filter(t => t.status === 'Done').length,
      averageAccuracy: tasksWithTime.reduce((sum, t) => 
        sum + Math.abs(t.taxaErro || 0), 0) / tasksWithTime.length,
      trend,
      recentAccuracy,
      olderAccuracy
    };
  });
};
```

---

## APIs e Integração

### LocalStorage API
```javascript
// storage.js
export const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Erro ao salvar no localStorage:', error);
  }
};

export const loadFromLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Erro ao carregar do localStorage:', error);
    return defaultValue;
  }
};
```

### Google Sheets Integration
```javascript
// GoogleSheetsSimple.js
const generateCSV = (tasks) => {
  const headers = [
    'ID', 'Épico', 'User Story', 'Atividade', 'Estimativa',
    'Desenvolvedor', 'Sprint', 'Status', 'Prioridade',
    'Dia1', 'Dia2', 'Dia3', 'Dia4', 'Dia5',
    'Dia6', 'Dia7', 'Dia8', 'Dia9', 'Dia10',
    'Tempo Gasto', 'Taxa Erro', 'Criado em', 'Atualizado em'
  ];

  const rows = tasks.map(task => [
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
    task.tempoGasto || '',
    task.taxaErro || '',
    task.createdAt || '',
    task.updatedAt || ''
  ]);

  return [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');
};

const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};
```

---

## Guias de Uso

### 1. Primeira Utilização

#### Opção 1: Começar do Zero
1. Acesse http://localhost:3000
2. O sistema inicia com dados vazios
3. Use o botão "Nova Tarefa" para começar
4. Preencha os campos básicos: Atividade, Épico, Desenvolvedor, Estimativa

#### Opção 2: Usar Modo Demo
1. Clique no ícone Google no cabeçalho
2. Selecione "Modo Demo (com dados de exemplo)"
3. Explore as 10 tarefas pré-criadas
4. Teste todas as funcionalidades com dados realistas

#### Opção 3: Importar Dados Existentes
1. Prepare arquivo CSV com as colunas necessárias
2. Use funcionalidade de importação (se disponível)
3. Ou copie dados manualmente usando "Nova Tarefa"

### 2. Fluxo de Trabalho Diário

#### Gestão de Tarefas no Kanban
1. **Visualizar**: Use filtros para focar em sprint/desenvolvedor específico
2. **Mover Tarefas**: Drag & drop entre colunas (Backlog → Priorizado → Doing → Done)
3. **Editar Detalhes**: Clique na tarefa para abrir modal completo
4. **Validar Tempo**: Ao mover para Done, preencha tempo gasto obrigatório

#### Acompanhamento na Tabela
1. **Aba Burndown**: Acompanhe progresso do sprint em tempo real
2. **Reestimativas**: Ajuste valores diários conforme necessário
3. **Configurar Equipe**: Ajuste número de desenvolvedores e horas/dia
4. **Análise Preditiva**: Monitore tendências e riscos

### 3. Análise e Relatórios

#### Análise de Cronograma
- **Verde**: Projeto no prazo
- **Vermelho**: Risco de atraso
- **Métricas**: Velocidade, dias restantes, data prevista

#### Performance Individual
- **🟢 Melhorando**: Desenvolvedores com tendência positiva
- **🔴 Piorando**: Necessitam atenção especial
- **🔵 Estável**: Performance consistente

#### Previsão WIP
- **Gargalos**: Colunas com excesso de tarefas
- **Fluxo**: Previsão de movimentação para 5 dias
- **Limites**: Alertas configuráveis por coluna

### 4. Integração com Google Sheets

#### Exportação Simples
1. Clique no ícone Google no cabeçalho
2. **Passo 1**: Baixar CSV - download automático
3. **Passo 2**: Criar Planilha - abre Google Sheets
4. **Passo 3**: Importar dados via Arquivo → Importar

#### Compartilhamento
1. Na planilha criada, use "Compartilhar" do Google Sheets
2. Adicione emails dos colaboradores
3. Configure permissões (Visualizar/Editar)
4. Colaboração em tempo real nativa do Google

---

## Configuração e Deploy

### Requisitos do Sistema
- **Node.js**: 16.x ou superior
- **npm**: 8.x ou superior
- **Navegador**: Chrome, Firefox, Safari, Edge (versões recentes)
- **Resolução**: Mínima 1024x768, otimizado para desktop

### Instalação Local
```bash
# Clone o repositório
git clone [repo-url]
cd tasktracker

# Instale dependências
npm install

# Inicie o servidor de desenvolvimento
npm start

# Acesse http://localhost:3000
```

### Dependências Principais
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "@mui/material": "^5.14.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "chart.js": "^4.3.0",
    "react-chartjs-2": "^5.2.0",
    "recharts": "^2.7.0",
    "react-beautiful-dnd": "^13.1.1",
    "uuid": "^9.0.0",
    "date-fns": "^2.30.0",
    "xlsx": "^0.18.5"
  }
}
```

### Configurações Opcionais

#### Limites WIP Personalizados
```javascript
// localStorage: tasktracker_wip_limits
{
  "Backlog": 20,
  "Priorizado": 8, 
  "Doing": 5,
  "Done": 999
}
```

#### Configuração de Equipe
```javascript
// localStorage: tasktracker_team_config
{
  "developers": 5,
  "hoursPerDay": 8,
  "sprintDays": 10
}
```

### Build para Produção
```bash
# Gerar build otimizado
npm run build

# Servir arquivos estáticos
# Usar nginx, Apache, ou serviços como Netlify/Vercel
```

### Considerações de Performance
- **localStorage**: Limit ~5MB, adequado para ~1000 tarefas
- **Filtros**: Otimizados para até 500 tarefas simultâneas
- **Gráficos**: Chart.js otimizado para datasets médios
- **Re-renders**: Otimizados com React.memo onde necessário

### Backup e Restauração
```javascript
// Backup completo
const backup = {
  tasks: localStorage.getItem('tasktracker_tasks'),
  wipLimits: localStorage.getItem('tasktracker_wip_limits'),
  teamConfig: localStorage.getItem('tasktracker_team_config')
};

// Salvar backup
localStorage.setItem('tasktracker_backup', JSON.stringify(backup));

// Restaurar backup
const backup = JSON.parse(localStorage.getItem('tasktracker_backup'));
Object.keys(backup).forEach(key => {
  if (backup[key]) {
    localStorage.setItem(`tasktracker_${key}`, backup[key]);
  }
});
```

---

## Solução de Problemas Comuns

### Performance Lenta
- **Causa**: Muitas tarefas carregadas simultaneamente
- **Solução**: Use filtros para reduzir dataset visível
- **Prevenção**: Arquive tarefas antigas regularmente

### Dados Perdidos
- **Causa**: localStorage pode ser limpo pelo navegador
- **Solução**: Use exportação CSV regularmente
- **Prevenção**: Configure backup automático

### Gráficos Não Carregam
- **Causa**: Dados inconsistentes ou faltantes
- **Solução**: Verifique se tarefas têm estimativas válidas
- **Prevenção**: Validação de dados na entrada

### Modal Não Abre
- **Causa**: Estado inconsistente do React
- **Solução**: Recarregue a página (F5)
- **Prevenção**: Evite modificações diretas no localStorage

---

**Documentação completa do sistema TaskTracker - versão atualizada em 27/07/2025**