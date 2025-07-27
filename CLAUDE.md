# TaskTracker - Sessão de Desenvolvimento

## Resumo do Projeto
TaskTracker é um sistema de gestão de tarefas inspirado no Trello, desenvolvido em React 18 com Material-UI, focado em equipes de desenvolvimento ágil.

## Funcionalidades Principais Ativas

### 1. Kanban Board Completo
- **Colunas**: Backlog, Priorizado, Doing, Done
- **Drag-and-drop**: Movimentação entre colunas
- **Modal de edição**: Todos os campos editáveis
- **Agrupamento por épico**: Organização visual
- **Visão compacta/expandida**: Toggle dinâmico
- **Busca por ID**: Campo exato para localização rápida

### 2. TableView com Burndown
- **Colunas otimizadas**: Atividade, Est. Inicial, Dias 1-10
- **Reestimativas**: Lógica de replicação automática
- **Linha de totais**: Primeira linha com somatórios
- **Burndown Chart**: Gráfico sincronizado em tempo real
- **Sistema de abas**: Burndown, Estatísticas, Análise Preditiva

### 3. Análise Preditiva Avançada
- **Cronograma**: Velocidade, dias restantes, data prevista
- **Performance individual**: Tendências por desenvolvedor
- **Previsão WIP**: Movimentação futura das colunas
- **Visualizações**: Gráficos interativos com Recharts

### 4. Sistema de Tempo e Taxa de Erro
- **Validação obrigatória**: Modal ao mover para Done
- **Cálculo automático**: Taxa de erro baseada na estimativa
- **Motivo obrigatório**: Para taxas > 20%
- **Histórico completo**: Dados salvos por tarefa

### 5. Filtros e Busca
- **Filtros múltiplos**: Sprint, desenvolvedor, status, prioridade, épico
- **Busca textual**: Todos os campos simultaneamente
- **Busca por ID**: Exata, aceita #123 ou 123
- **Limpeza rápida**: Botão para resetar filtros

### 6. Google Sheets Simples
- **3 passos**: Baixar CSV → Criar planilha → Importar dados
- **Zero configuração**: Sem OAuth ou APIs complexas
- **Compatibilidade total**: Todos os campos exportados

### 7. Modo Demo
- **10 tarefas realistas**: Cenário completo de desenvolvimento
- **5 desenvolvedores**: Perfis diversos com dados variados
- **Funcionalidades completas**: Todas as análises funcionando

### 8. Adicionar Nova Tarefa
- **Modal reutilizado**: Mesmo componente para criar/editar
- **Campos completos**: Todos editáveis desde a criação
- **Validação inteligente**: Atividade OU História obrigatória
- **Integração perfeita**: Aparece no Kanban instantaneamente

## Arquivos Principais

### Core Components
- `/src/components/TableView.js` - Tabela principal e análises
- `/src/components/SimpleKanban.js` - Kanban board completo
- `/src/components/PredictiveAnalysis.js` - Análises preditivas
- `/src/App.js` - Componente raiz e roteamento

### Utilities
- `/src/utils/storage.js` - Persistência localStorage
- `/src/utils/sampleData.js` - Estrutura de dados
- `/src/services/demoData.js` - Dados de demonstração

## Estrutura de Dados (Task Object)

```javascript
{
  id: "uuid",
  originalId: number,
  epico: "string",
  userStory: "string", 
  atividade: "string",
  estimativa: number,
  desenvolvedor: "string",
  sprint: "string",
  status: "Backlog|Priorizado|Doing|Done",
  prioridade: "Baixa|Média|Alta|Crítica",
  reestimativas: [10 numbers], // Dia 1-10
  tempoGasto: number,
  taxaErro: number,
  tempoGastoValidado: boolean,
  motivoErro: string,
  createdAt: string,
  updatedAt: string
}
```

## Comandos de Desenvolvimento

### Iniciar servidor
```bash
npm start
# Servidor roda em http://localhost:3000
```

### Dependências principais
- React 18.2.0 + Material-UI 5.14.0
- Chart.js 4.3.0 + React Beautiful DnD 13.1.1
- uuid 9.0.0 + date-fns 2.30.0

## Funcionalidades por Aba

### 🏠 Kanban (Principal)
- Drag-and-drop entre colunas
- Modal de edição completo
- Filtros e busca avançada
- Visão compacta/expandida
- Botão "Nova Tarefa"

### 📊 Tabela
- **Aba 1**: Burndown Chart + configurações equipe
- **Aba 2**: Estatísticas gerais e métricas
- **Aba 3**: Análise preditiva avançada

### 🔵 Google Sheets
- Interface em 3 passos simples
- Geração automática de CSV
- Abertura direta no Google Sheets

## Status Atual: ✅ TOTALMENTE FUNCIONAL

### Últimas Implementações
- ✅ **Análise preditiva avançada** (cronograma, performance, WIP)
- ✅ **Visão compacta aprimorada** (layout 2 linhas, ID visível)
- ✅ **Busca por ID exata** (60px, #123 ou 123)
- ✅ **Bug crítico corrigido** (ordenação tipos mistos)
- ✅ **Nova tarefa completa** (modal reutilizado, validações)

### Servidor
- **URL**: http://localhost:3000
- **Status**: Rodando sem erros
- **Performance**: Otimizada para grandes volumes

---

**Projeto completo e funcional** - Todas as funcionalidades implementadas, testadas e documentadas. Sistema robusto para gestão ágil de projetos.

## Arquivos de Documentação

- **CLAUDE.md** (este arquivo): Instruções essenciais para desenvolvimento
- **DOCUMENTACAO.md**: Documentação técnica completa
- **DEBUG_HISTORY.md**: Histórico detalhado de implementações e debug