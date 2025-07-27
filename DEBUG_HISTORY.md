# TaskTracker - Histórico de Debug e Implementações Detalhadas

## 🆕 ATUALIZAÇÕES DA SESSÃO - 11/07/2025

### Funcionalidades Implementadas Hoje

#### 1. **Configuração Dinâmica da Equipe**
- Inputs para desenvolvedores, horas/dia e dias do sprint
- Cálculo automático da capacidade total da equipe
- Nova linha no gráfico: "Previsão Equipe"
- Gráfico dinâmico que expande quando necessário

#### 2. **Previsão de Desenvolvedores**
- Algoritmo para calcular desenvolvedores necessários
- Cenários alternativos (4h, 6h, 8h por dia)
- Integração visual no painel de estatísticas

#### 3. **Análise Preditiva Avançada**
- Algoritmo de regressão linear por desenvolvedor
- Análise de tendências das reestimativas
- Cálculo de nível de risco (baixo/médio/alto)
- Previsão de entrega baseada em tendências
- Indicadores de confiança das previsões

#### 4. **Sistema de Abas Reorganizado**
- 3 abas principais: Burndown Chart, Estatísticas, Análise Preditiva
- Layout limpo e focado por categoria
- Remoção das estatísticas da tela da tabela

### Algoritmo de Análise Preditiva

#### Conceitos Implementados
1. **Regressão Linear**: Análise de tendência por desenvolvedor
2. **Variação Média Diária**: Cálculo de slope das reestimativas
3. **Nível de Risco**: Baseado na magnitude das variações
4. **Confiança**: Baseada na consistência das tendências
5. **Projeção**: Extrapolação das tendências para o futuro

#### Fórmulas Chave
```javascript
// Regressão Linear
const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

// Nível de Risco
if (Math.abs(overallTrend) < 0.5) riskLevel = 'low';
else if (Math.abs(overallTrend) < 1.5) riskLevel = 'medium';
else riskLevel = 'high';

// Confiança
confidence = Math.max(0, Math.min(100, 100 - (trendVariance * 20)));
```

---

## 🆕 MODAL DE EDIÇÃO NO KANBAN - 11/07/2025

### Correções Técnicas Realizadas

#### 1. **Erro: onTasksUpdate is not defined**
- **Problema**: `EpicGroup` não recebia prop `onTasksUpdate`
- **Solução**: Adicionado `onTasksUpdate` e `allTasks` como props
- **Propagação**: SimpleKanban → EpicGroup → TaskCard

#### 2. **Estrutura de Props Corrigida**
```javascript
// EpicGroup
const EpicGroup = ({ epic, tasks, onStatusChange, onTasksUpdate, allTasks }) => {

// TaskCard  
const TaskCard = ({ task, onStatusChange, onTasksUpdate, allTasks }) => {

// TaskDetailsModal
const TaskDetailsModal = ({ task, open, onClose, onStatusChange, onTasksUpdate }) => {
```

#### 3. **Integração de Dados**
- **allTasks**: Lista completa de tarefas para atualização
- **tasks**: Lista filtrada por épico para exibição
- **Atualização**: Mapeamento correto da tarefa editada

---

## 🔄 ESTUDO DE PERSISTÊNCIA - Para Implementação Futura

### Problema Atual
- Sistema usa localStorage compartilhado por navegador
- Não há isolamento entre usuários
- Dados sempre vem pré-carregados

### Soluções Analisadas (Sem Backend)

#### 1. **Sistema de Projetos/Workspaces** ⭐ **RECOMENDADO**
- Dropdown para selecionar/criar projeto
- Cada projeto = dados isolados
- ~20 linhas de código, zero impacto
- Interface: `[📁 Projeto: Sprint Q1 ▼] [+ Novo] [🗑️ Excluir]`

#### 2. **Sistema de Sessões por URL**
- URL única por usuário (#sessao-joao)
- ~10 linhas de código, zero impacto

#### 3. **Exportar/Importar Projetos**
- Botões download/upload JSON
- ~30 linhas de código, zero impacto

#### 4. **Sistema de Backup Automático**
- Backup diário + lista de restauração
- ~25 linhas de código, zero impacto

#### 5. **IndexedDB (mais robusto)**
- Maior capacidade de armazenamento
- ~50 linhas de código, impacto mínimo

---

## 🔍 BUSCA TEXTUAL NOS FILTROS - 15/07/2025

### Código Implementado

#### Estado dos Filtros
```javascript
const [filters, setFilters] = useState({
  sprint: '',
  desenvolvedor: '',
  prioridade: '',
  status: '',
  epico: '',
  search: ''  // ← Novo campo
});
```

#### Função de Busca
```javascript
if (filters.search) {
  const searchTerm = filters.search.toLowerCase();
  filtered = filtered.filter(task => 
    Object.values(task).some(value => 
      value && value.toString().toLowerCase().includes(searchTerm)
    )
  );
}
```

#### Interface do Campo
```javascript
<TextField
  label="Buscar em todos os campos"
  value={filters.search}
  onChange={(e) => handleFilterChange('search', e.target.value)}
  size="small"
  sx={{ minWidth: 200 }}
  placeholder="Digite para buscar..."
/>
```

### Arquivos Modificados

#### `/src/components/SimpleKanban.js`
- **Linha 847**: Adicionado campo `search` ao estado
- **Linha 865-873**: Implementada lógica de busca textual
- **Linha 912**: Atualizado `clearFilters` para incluir search
- **Linha 984-992**: Adicionado campo de busca na UI

#### `/src/components/TableView.js`
- **Linha 100**: Adicionado campo `search` ao estado
- **Linha 221**: Atualizado `clearFilters` para incluir search
- **Linha 440-449**: Implementada lógica de busca textual
- **Linha 1058-1066**: Adicionado campo de busca na UI

### Exemplos de Busca

- **"backend"** → Encontra tarefas com "backend" em qualquer campo
- **"João"** → Encontra tarefas do desenvolvedor João
- **"crítica"** → Encontra tarefas com prioridade crítica
- **"API"** → Encontra tarefas relacionadas a API
- **"bug"** → Encontra tarefas com "bug" em descrição/observações

---

## ⏱️ SISTEMA DE TEMPO GASTO E TAXA DE ERRO - 15/07/2025

### Código Implementado

#### Novos Campos no Modelo
```javascript
// src/utils/sampleData.js
{
  tempoGasto: null,
  taxaErro: null,
  tempoGastoValidado: false,
  motivoErro: null
}
```

#### Validação Obrigatória
```javascript
// src/components/SimpleKanban.js
const handleStatusChange = (taskId, newStatus) => {
  if (newStatus === 'Done') {
    const task = tasks.find(t => t.id === taskId);
    if (!task.tempoGastoValidado || task.tempoGasto === null) {
      setTimeValidationModal({
        open: true,
        task: task
      });
      return;
    }
  }
  // Continuar com mudança normal...
};
```

#### Cálculo da Taxa de Erro
```javascript
const taxaErro = tempoGasto && task.estimativa ? 
  ((tempoGasto / task.estimativa - 1) * 100) : 0;
const taxaErroPositiva = Math.max(0, taxaErro);
```

#### Modal de Validação
```javascript
const TimeValidationModal = ({ open, task, onClose, onSave }) => {
  // Estados para tempo gasto e motivo do erro
  // Validação condicional baseada na taxa de erro
  // Interface responsiva com feedback visual
  // Botão habilitado apenas quando válido
};
```

### Interface do Modal de Validação

#### Elementos da Interface:
1. **Título**: "Validação Obrigatória - Tempo Gasto"
2. **Alerta**: Warning com nome da tarefa
3. **Estimativa**: Exibição da estimativa inicial
4. **Tempo Gasto**: Campo numérico obrigatório (min: 0.1, step: 0.1)
5. **Taxa de Erro**: Campo calculado automaticamente (readonly)
6. **Motivo do Erro**: Campo obrigatório se taxa > 20%
7. **Dica**: Orientação sobre a importância do preenchimento
8. **Botões**: Cancelar e "Finalizar Tarefa"

#### Validação do Formulário:
```javascript
const isValid = tempoGasto && (taxaErroPositiva <= 20 || motivoErro.trim());
```

### Seção no Modal de Detalhes

#### Layout da Seção:
```javascript
<Box>
  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
    Tempo Gasto e Taxa de Erro
  </Typography>
  <Paper sx={{ p: 2 }}>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <Typography>Tempo Gasto: {tempoGasto}h</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography color={taxaErro > 20 ? 'error.main' : 'success.main'}>
          Taxa de Erro: {taxaErro}%
        </Typography>
      </Grid>
    </Grid>
    
    {/* Motivo do erro se presente */}
    {/* Alertas de validação */}
    {/* Orientações contextuais */}
  </Paper>
</Box>
```

### Fluxo de Uso

#### Processo Completo:
1. **Usuário** tenta mover card para "Done"
2. **Sistema** verifica se tempo gasto foi validado
3. **Modal** abre automaticamente se não validado
4. **Usuário** preenche tempo gasto
5. **Sistema** calcula taxa de erro automaticamente
6. **Validação** condicional para motivo se taxa > 20%
7. **Salvamento** dos dados e finalização da tarefa
8. **Visualização** dos dados no modal de detalhes

### Arquivos Modificados

#### `/src/utils/sampleData.js`
- **Linhas 62-66**: Adicionados novos campos ao modelo de dados
- **Compatibilidade**: Mantém estrutura existente

#### `/src/components/SimpleKanban.js`
- **Linhas 28, 910**: Adicionado import Alert e estado timeValidationModal
- **Linhas 398-456**: Nova seção no modal de detalhes
- **Linhas 942-954**: Validação obrigatória no handleStatusChange
- **Linhas 1000-1036**: Função handleTimeValidationSave
- **Linhas 1076-1190**: Componente TimeValidationModal completo

### Cenários Testados:
- ✅ Tentativa de mover para Done sem tempo gasto
- ✅ Preenchimento do modal de validação
- ✅ Cálculo automático da taxa de erro
- ✅ Validação para taxa > 20%
- ✅ Salvamento dos dados
- ✅ Visualização no modal de detalhes

---

## 🔗 INTEGRAÇÃO GOOGLE SHEETS - 18/07/2025

### Arquivos Criados

#### `/src/config/googleConfig.js`
- **Configurações centralizadas** do Google OAuth2
- **Headers das planilhas** padronizados
- **Scopes necessários** para APIs

#### `/src/services/googleAuth.js`
- **Classe GoogleAuthService**: Gerenciamento de autenticação
- **Métodos**: signIn, signOut, getCurrentUser, refreshToken
- **Integração**: Google API carregada dinamicamente

#### `/src/services/googleSheets.js`
- **Classe GoogleSheetsService**: Operações com planilhas
- **Métodos**: createUserProject, readSheet, writeSheet, shareProject
- **Formatação**: Conversão entre formato TaskTracker e Sheets

#### `/src/services/syncService.js`
- **Classe SyncService**: Sincronização bidirecional
- **Recursos**: Auto-sync, conflitos, offline-first
- **Eventos**: Notificações para componentes

#### `/src/components/GoogleAuthComponent.js`
- **Interface de login** com Google
- **Gerenciamento de projeto** (criar/recriar)
- **Status de sincronização** e informações do usuário

#### `/src/components/ProjectSharing.js`
- **Interface de compartilhamento** completa
- **Convites por email** com validação
- **Gerenciamento de colaboradores** (adicionar/remover)
- **Visualização de permissões** e status

### Integração no App.js

#### Estados Adicionados
```javascript
const [user, setUser] = useState(null);
const [projectInfo, setProjectInfo] = useState(null);
const [syncStatus, setSyncStatus] = useState(null);
const [showGoogleAuth, setShowGoogleAuth] = useState(false);
const [isOnline, setIsOnline] = useState(navigator.onLine);
```

#### Novos Recursos na Interface
- **Botão Google** no cabeçalho para alternar modos
- **Indicador de status** (online/offline/sincronizando)
- **Botão de sincronização** manual
- **Aba compartilhamento** quando logado
- **Chips de status** para feedback visual

### Configuração Necessária

#### 1. **Google Cloud Console**
- Criar projeto e ativar APIs (Sheets, Drive)
- Configurar OAuth2 Client ID
- Definir URLs de redirecionamento

#### 2. **Variáveis de Ambiente**
```env
REACT_APP_GOOGLE_CLIENT_ID=seu-client-id-aqui
REACT_APP_GOOGLE_API_KEY=sua-api-key-aqui
```

#### 3. **Dependências**
```bash
npm install googleapis google-auth-library
```

### Fluxo de Uso

#### **Primeira Vez**
1. Usuário clica no botão Google
2. Login OAuth2 com Google
3. Planilhas criadas automaticamente
4. Sincronização iniciada

#### **Uso Diário**
1. Trabalhar normalmente no TaskTracker
2. Dados sincronizados a cada 2 minutos
3. Status visível no cabeçalho
4. Trabalha offline se necessário

#### **Compartilhamento**
1. Ir para aba "Compartilhar"
2. Inserir email do colaborador
3. Escolher nível de acesso
4. Colaborador recebe acesso às planilhas

### Vantagens da Implementação

- ✅ **Controle total**: Cada usuário é dono dos seus dados
- ✅ **Privacidade**: Dados ficam na conta Google do usuário
- ✅ **Colaboração**: Compartilhamento flexível por email
- ✅ **Backup automático**: Google Drive nativo
- ✅ **Offline-first**: Funciona sem internet
- ✅ **Transparente**: Alternância fácil entre modos

### Limitações

- ⚠️ **Quotas da API**: 100 requests por 100 segundos
- ⚠️ **Não é tempo real**: Sincronização a cada 2 minutos
- ⚠️ **Dependência Google**: Requer conta Google
- ⚠️ **Configuração inicial**: Necessário setup no Google Cloud

---

## 🎯 MODO DEMO IMPLEMENTADO - 18/07/2025

### Arquivos Criados

#### `/src/services/demoData.js`
- **Função `generateDemoData()`**: Gera 10 tarefas com dados realistas
- **Função `getDemoStats()`**: Calcula estatísticas dos dados demo
- **Função `getDemoDescription()`**: Descrição completa do cenário
- **Dados incluem**: Reestimativas progressivas, tempo gasto vs estimativa, taxa de erro, observações

#### `/src/components/DemoModeInfo.js`
- **Card informativo** expansível sobre o cenário demo
- **Lista de funcionalidades** demonstradas
- **Detalhes do projeto** e equipe
- **Dicas de uso** para o usuário

### Integração no Sistema

#### Estados Adicionados ao App.js
```javascript
const [isDemoMode, setIsDemoMode] = useState(false);
const [demoDescription, setDemoDescription] = useState(null);
```

#### Funções Implementadas
- **`handleDemoMode()`**: Ativa modo demo com dados de exemplo
- **`handleCloseDemoInfo()`**: Fecha card informativo
- **Integração com `handleClearTasks()`**: Remove modo demo ao zerar dados

### Dados de Exemplo Incluídos

#### Tarefas Realistas
- **Reestimativas variadas**: Crescentes, decrescentes, estáveis
- **Tempo gasto real**: Alguns abaixo, outros acima da estimativa
- **Taxa de erro calculada**: Automática com base na diferença
- **Motivos de erro**: Para taxas acima de 20%
- **Observações detalhadas**: Comentários realistas de desenvolvimento

#### Desenvolvedores Virtuais
- **João Silva**: Desenvolvedor sênior, estimativas precisas
- **Maria Santos**: Desenvolvedor pleno, variações moderadas
- **Pedro Costa**: Desenvolvedor júnior, estimativas em crescimento
- **Ana Oliveira**: Especialista frontend, conclusões rápidas
- **Carlos Lima**: Arquiteto backend, complexidade subestimada

---

## 🚀 GOOGLE SHEETS SUPER SIMPLES VIA CSV - 19/07/2025

### Problema Resolvido
O sistema anterior de Google Sheets com OAuth era muito complexo e causava erros de API. Foi implementada uma solução **100% simples** usando CSV.

### Implementação Técnica

#### Componente GoogleSheetsSimple.js
```javascript
// Geração automática de CSV
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
    // ... todos os campos
  ]);

  const csv = [headers, ...rows].map(row => row.join(',')).join('\\n');
  return csv;
};
```

#### Funcionalidades Implementadas
1. **Download automático** de CSV com todos os dados
2. **Abertura automática** do Google Sheets
3. **Cópia para clipboard** dos dados CSV
4. **Instruções visuais** para importação
5. **Stepper progressivo** com validação de passos

### Comparação: Antes vs Depois

#### **❌ Sistema Anterior (Complexo):**
- Configurações OAuth obrigatórias
- Client ID e API Keys necessários
- Erros frequentes de inicialização
- Dependência de APIs externas
- Interface confusa com fallbacks

#### **✅ Sistema Atual (Simples):**
- Zero configuração necessária
- Funciona imediatamente
- Sem erros de API
- Interface intuitiva guiada
- Sempre disponível

---

## 🆕 FUNCIONALIDADE "ADICIONAR NOVA TAREFA" - 21/07/2025

### Arquivos Modificados

#### `/src/components/SimpleKanban.js`
- **Linhas 32, 980**: Adicionado import `AddIcon` e estado `newTaskModal`
- **Linhas 80-133**: Adaptado `TaskDetailsModal` para modo `isNewTask`
- **Linhas 84-113**: Lógica de inicialização para nova tarefa com defaults
- **Linhas 114-128**: Função `handleSave` adaptada para criação vs edição
- **Linhas 129-136**: Função `handleCancel` com comportamento diferenciado
- **Linhas 350-400**: Campos Tipo, Sprint, Tamanho, Tela tornados editáveis
- **Linhas 448-465**: Campo Estimativa tornado editável com validação numérica
- **Linhas 510-530**: Campo Observações tornado editável
- **Linhas 1190-1200**: Botão "Nova Tarefa" na barra de filtros
- **Linhas 1220-1235**: Modal de nova tarefa com handlers específicos

### Cenários Testados:
- ✅ Abertura do modal de nova tarefa
- ✅ Preenchimento de todos os campos editáveis
- ✅ Validação de campos obrigatórios
- ✅ Criação e aparição na coluna Backlog
- ✅ Integração com agrupamento por épico
- ✅ Funcionamento de filtros na nova tarefa
- ✅ Edição posterior da tarefa criada
- ✅ Modal compacto/expandido funcionando
- ✅ Drag-and-drop da nova tarefa

---

## 🔮 ANÁLISE PREDITIVA AVANÇADA - 22/07/2025

### Algoritmos Implementados

#### **Análise de Cronograma**
```javascript
// Cálculo de velocidade
const velocity = doneTasks / Math.max(totalDaysWorked, 1);
const estimatedDaysRemaining = Math.ceil(remainingTasks / velocity);

// Previsão de entrega
const estimatedCompletionDate = new Date(today.getTime() + estimatedDaysRemaining * 24 * 60 * 60 * 1000);
```

#### **Performance de Desenvolvedores**
```javascript
// Análise de tendência
const recentAccuracy = recentTasks.reduce((sum, task) => 
  sum + Math.abs(task.taxaErro || 0), 0) / recentTasks.length;

if (recentAccuracy < olderAccuracy - 10) trend = 'improving';
else if (recentAccuracy > olderAccuracy + 10) trend = 'declining';
else trend = 'stable';
```

#### **Previsão WIP**
```javascript
// Previsão de movimentação
const donePerDay = tasksWithTimeSpent.filter(task => task.status === 'Done').length / 10;
const predictedDone = Math.min(statusCounts['Doing'], Math.ceil(donePerDay * day));
```

### Arquivos Modificados

#### `/src/components/PredictiveAnalysis.js`
- **Linhas 37-208**: Implementadas 3 funções principais de análise
  - `analyzeDeadlines()`: Cronograma e prazos
  - `analyzeDeveloperPerformance()`: Performance individual
  - `analyzeWIPPredictive()`: Previsão WIP
- **Linhas 272-449**: Interface completamente redesenhada
  - Cards de status do cronograma
  - Grid de performance de desenvolvedores  
  - Gráficos de previsão WIP
  - Seção de estimativas existente mantida

### Cenários Testados
- ✅ **Sprint vazio**: Exibe análises básicas com dados padrão
- ✅ **Sprint com tarefas**: Cálculos corretos de métricas
- ✅ **Múltiplos desenvolvedores**: Performance individual calculada
- ✅ **WIP configurado**: Previsões baseadas em limites
- ✅ **Responsividade**: Layout adapta em mobile/tablet

---

## 🐛 CORREÇÃO DE BUG CRÍTICO - 21/07/2025

### Problema Identificado

#### **Erro**: `bValue.toLowerCase is not a function`
- **Local**: `/src/components/TableView.js` linha 459
- **Situação**: Ao clicar na aba "Tabela" após criar nova tarefa
- **Tipo**: Runtime Error que quebrava totalmente a funcionalidade

#### **Causa Raiz**
- **Nova tarefa** criada com campo `estimativa` como **number** (0)
- **Função de ordenação** esperava apenas strings
- **Código problemático**:
```javascript
// ❌ ERRO: Assumia que se aValue é string, bValue também é
if (typeof aValue === 'string') {
  aValue = aValue.toLowerCase();
  bValue = bValue.toLowerCase(); // 🐛 ERRO: bValue pode ser number!
}
```

### Solução Implementada

#### **Código Corrigido**
```javascript
// ✅ SOLUÇÃO: Verificação de tipos robusta
return filtered.sort((a, b) => {
  let aValue = a[sortBy];
  let bValue = b[sortBy];
  
  // 1️⃣ Tratar valores nulos/undefined
  if (aValue == null) aValue = '';
  if (bValue == null) bValue = '';
  
  // 2️⃣ Converter APENAS se ambos forem strings
  if (typeof aValue === 'string' && typeof bValue === 'string') {
    aValue = aValue.toLowerCase();
    bValue = bValue.toLowerCase();
  }
  
  // 3️⃣ Ordenação funciona com qualquer tipo
  if (sortDirection === 'asc') {
    return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
  } else {
    return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
  }
});
```

#### **Template para Funções de Ordenação Seguras**
```javascript
const safeSortFunction = (a, b, sortBy, direction = 'asc') => {
  let aValue = a[sortBy];
  let bValue = b[sortBy];
  
  // 1. Null safety
  if (aValue == null) aValue = '';
  if (bValue == null) bValue = '';
  
  // 2. Type safety para strings
  if (typeof aValue === 'string' && typeof bValue === 'string') {
    aValue = aValue.toLowerCase();
    bValue = bValue.toLowerCase();
  }
  
  // 3. Ordenação universal
  const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
  return direction === 'asc' ? result : -result;
};
```

### Testes Realizados
- ✅ **Aba Tabela**: Abre normalmente após criação de nova tarefa
- ✅ **Ordenação**: Funciona com campos string e numéricos
- ✅ **Filtros**: Operam normalmente com dados mistos
- ✅ **Burndown Chart**: Gera gráficos corretamente
- ✅ **Nova tarefa**: Integração perfeita entre Kanban e Tabela

---

## 🎯 VISÃO COMPACTA APRIMORADA E BUSCA POR ID - 22/07/2025

### Arquivos Modificados

#### `/src/components/SimpleKanban.js`
- **Linhas 677**: Adicionada função `getPriorityColor` para CompactTaskCard
- **Linhas 726-836**: Layout reestruturado em duas linhas
- **Linhas 1248**: Adicionado campo `searchId` ao estado de filtros
- **Linhas 1277-1283**: Lógica de filtro por ID exata implementada
- **Linhas 1357**: Atualizado `clearFilters` para incluir searchId
- **Linhas 1464-1472**: Interface do campo de busca por ID

### Layout da Visão Compacta

#### **Primeira Linha**
```
[#ID] [Nome da Atividade...........................]
```

#### **Segunda Linha**
```
[Prioridade] [Xh] [👤] [←] [→]
```

#### **Elementos e Tamanhos**
- **ID**: Typography caption, cor secundária, negrito
- **Atividade**: Typography body2, truncada com ellipsis
- **Prioridade**: Chip colorido 16px altura, fonte 0.6rem
- **Horas**: Typography caption 0.7rem, cor secundária
- **Avatar**: 20x20px, fonte 0.65rem
- **Botões**: 20x20px, ícones 12px

### Campo de Busca por ID

#### **Exemplos de Uso**
- Digite `123` → Encontra tarefa com originalId = 123
- Digite `#456` → Encontra tarefa com originalId = 456  
- Digite `12` → NÃO encontra tarefa 123 (busca exata)
- Combina com outros filtros (desenvolvedor, sprint, etc.)

---

## Comandos Úteis Testados

```bash
# Corrigir Sprint nos CSVs
sed -i 's/;3;/;2;/g; s/;5;/;2;/g; s/;6;/;2;/g; s/;8;/;2;/g; s/;9;/;2;/g; s/;12;/;2;/g' /home/binhara/tasktracker/backlog-sample.csv

# Verificar processo React
ps aux | grep react

# Iniciar servidor
npm start
```

---

## Configurações de CSS/Styling

### Campos Numéricos Sem Setas
```css
'& input[type=number]': {
  '-moz-appearance': 'textfield'
},
'& input[type=number]::-webkit-outer-spin-button': {
  '-webkit-appearance': 'none',
  margin: 0
},
'& input[type=number]::-webkit-inner-spin-button': {
  '-webkit-appearance': 'none', 
  margin: 0
}
```

### Layout da Tabela
- **tableLayout: 'fixed'** para controle de larguras
- **width: '100%'** com overflow horizontal
- **Padding reduzido** para compactação
- **Fontes menores** (0.75rem para dias)

---

## Estados e Hooks Importantes

### useState
- `[chartData, setChartData]` - Dados do gráfico
- `[selectedTask, setSelectedTask]` - Tarefa selecionada no modal
- `[detailsOpen, setDetailsOpen]` - Controle do modal

### useEffect
- **Atualização automática** do gráfico quando tasks mudam
- **Seleção automática** do primeiro sprint

---

## Funções-Chave Implementadas

### `handleReestimativaChange(taskId, dayIndex, value)`
- **Atualiza valor** do dia específico
- **Replica automaticamente** para dias seguintes
- **Força atualização** do gráfico
- **Garante array** de 10 elementos

### `calculateSprintData(sprintName)`
- **Calcula dados** para burndown chart
- **Usa mesma lógica** dos totais da tabela
- **Gera linha ideal** e linha real 
- **Labels como "Dia 0", "Dia 1"**

### `calculateColumnTotals(tasksToCalculate)`
- **Calcula somatórios** por coluna
- **Exclui tarefas Done** no gráfico
- **Usado tanto** para tabela quanto gráfico

### `ensureReestimativas(task)`
- **Garante array** de 10 elementos
- **Preserva valores** existentes
- **Inicializa faltantes** com estimativa inicial

---

**Arquivo de debug criado com todo o histórico detalhado de implementações.**