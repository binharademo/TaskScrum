# Plano Completo: Separação de Botões de Limpeza e Lixeira

## 📋 Problema Identificado

Existem **2 botões de limpeza** com funções conflitantes:
1. **🗑️ Botão Lixeira** (cabeçalho App.js) - deve limpar dados de usuário da sala atual
2. **🧹 Botão Limpeza** (tela testes IntegrationTests.js) - deve limpar apenas dados de teste

**Status atual**: Ambos fazem a mesma coisa, criando confusão.

## 🎯 Objetivo Final

- **🗑️ Lixeira (App.js)**: Remove TODAS as tarefas que o usuário vê na sala atual (dados reais de trabalho)
- **🧹 Limpeza (IntegrationTests.js)**: Remove APENAS dados criados pelos testes de integração

## 📊 Análise de Localização

### 🗑️ Botão Lixeira (Principal)
- **Arquivo**: `/src/App.js` linha ~1009
- **Função**: `handleClearTasks` 
- **Ícone**: `<DeleteIcon />`
- **Tooltip**: "Zerar todas as atividades"
- **Contexto**: Interface principal do usuário

### 🧹 Botão Limpeza (Testes)
- **Arquivo**: `/src/components/IntegrationTests.js` linha ~2434
- **Função**: `cleanupTestData`
- **Texto**: "🧹 Limpar Sala Atual" 
- **Contexto**: Tela de testes de integração

## 🔍 Identificação de Dados

### Dados de USUÁRIO (Lixeira deve limpar):
- ✅ Tarefas na sala atual que o usuário está vendo
- ✅ Dados editados/criados manualmente pelo usuário
- ✅ Tarefas importadas de CSV pelo usuário
- ❌ **NÃO deve remover**: Dados de teste, variáveis globais temporárias

### Dados de TESTE (Limpeza deve limpar):
- ✅ Variáveis globais: `window.*TestData`
- ✅ Salas com códigos: TEST*, SAVE*, SH*
- ✅ Tarefas com épico "Teste", "Debug", etc.
- ✅ Dados criados pelos testes de integração
- ❌ **NÃO deve remover**: Dados reais do usuário

## 📝 Tarefas do Plano

### FASE 1: Corrigir Botão Lixeira (App.js)
#### Tarefa 1.1: Analisar função atual `handleClearTasks`
- [x] Localizar função no App.js
- [ ] Entender fluxo atual
- [ ] Identificar se está funcionando corretamente
- [ ] Documentar comportamento atual

#### Tarefa 1.2: Implementar limpeza focada no usuário
- [ ] Modificar `handleClearTasks` para focar em dados de usuário
- [ ] Remover todas as tarefas da sala atual via TaskContext
- [ ] Manter apenas limpeza de dados visíveis ao usuário
- [ ] Adicionar confirmação específica: "Remover todas as tarefas desta sala?"

#### Tarefa 1.3: Testar botão lixeira
- [ ] Criar tarefas normais na interface
- [ ] Usar botão lixeira
- [ ] Verificar se remove apenas dados da sala atual
- [ ] Verificar se não afeta dados de teste

### FASE 2: Corrigir Botão Limpeza (IntegrationTests.js)
#### Tarefa 2.1: Analisar função atual `cleanupTestData`
- [x] Localizar função no IntegrationTests.js
- [ ] Entender o que está limpando atualmente
- [ ] Identificar dados de teste vs usuário
- [ ] Mapear variáveis globais de teste

#### Tarefa 2.2: Implementar limpeza focada em testes
- [ ] Modificar `cleanupTestData` para focar apenas em dados de teste
- [ ] Limpar apenas salas/tarefas criadas pelos testes
- [ ] Limpar variáveis globais: window.*TestData
- [ ] Preservar dados reais do usuário na sala atual

#### Tarefa 2.3: Identificar dados de teste de forma robusta
- [ ] Implementar marcação de origem nos dados de teste
- [ ] Usar timestamps para dados temporários
- [ ] Filtrar por épicos específicos: "Teste", "Debug", etc.
- [ ] Considerar códigos de sala específicos

### FASE 3: Melhorar Identificação de Dados
#### Tarefa 3.1: Adicionar marcação de origem
- [ ] Adicionar campo `dataSource` nas tarefas
- [ ] Valores: "user", "demo", "test", "integration"
- [ ] Implementar nos testes de integração
- [ ] Implementar na criação manual de tarefas

#### Tarefa 3.2: Implementar filtros inteligentes
- [ ] Função para identificar dados de teste
- [ ] Função para identificar dados de usuário
- [ ] Função para identificar dados de demo
- [ ] Blacklist/whitelist de salas permanentes

### FASE 4: Interface e Feedback
#### Tarefa 4.1: Melhorar feedback do botão lixeira
- [ ] Mensagem específica: "X tarefas da sala Y serão removidas"
- [ ] Confirmação mais clara
- [ ] Feedback pós-ação
- [ ] Botão de desfazer (opcional)

#### Tarefa 4.2: Melhorar feedback do botão limpeza
- [ ] Listar especificamente o que será removido
- [ ] Contar dados de teste encontrados
- [ ] Relatório pós-limpeza detalhado
- [ ] Opção de limpeza seletiva

### FASE 5: Testes e Validação
#### Tarefa 5.1: Teste isolado de cada botão
- [ ] Criar cenário com dados mistos (usuário + teste)
- [ ] Testar botão lixeira isoladamente
- [ ] Testar botão limpeza isoladamente
- [ ] Verificar não-interferência entre eles

#### Tarefa 5.2: Teste de integração completa
- [ ] Executar testes de integração
- [ ] Usar botão limpeza
- [ ] Adicionar dados de usuário
- [ ] Usar botão lixeira
- [ ] Verificar integridade dos dados

## 🚀 Estratégia de Implementação

### Ordem de Execução:
1. **FASE 1** → Corrigir botão lixeira (crítico para usuário)
2. **FASE 2** → Corrigir botão limpeza (crítico para testes)
3. **FASE 3** → Melhorar identificação (qualidade)
4. **FASE 4** → Interface e feedback (UX)
5. **FASE 5** → Testes finais (validação)

### Critério de Sucesso:
- ✅ Botão lixeira remove apenas dados da sala atual do usuário
- ✅ Botão limpeza remove apenas dados de teste
- ✅ Nenhum conflito entre os dois botões
- ✅ Dados não se misturam ou se perdem
- ✅ Interface clara sobre o que cada botão faz

## ⚠️ Riscos e Mitigações

### Risco 1: Perda de dados do usuário
- **Mitigação**: Implementar primeiro identificação robusta
- **Backup**: Sempre pedir confirmação antes de limpar

### Risco 2: Dados de teste não removidos
- **Mitigação**: Logs detalhados do que foi/não foi removido
- **Backup**: Opção de limpeza manual forçada

### Risco 3: Conflito entre localStorage e Supabase
- **Mitigação**: Sincronizar limpeza em ambos os sistemas
- **Backup**: Verificação pós-limpeza