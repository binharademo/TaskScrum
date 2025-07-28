# 🔍 COMO VERIFICAR DADOS NO SUPABASE - TASKTRACKER

## 📋 OBJETIVO
Este guia te ajuda a verificar se o TaskTracker está salvando dados corretamente no Supabase usando queries SQL.

## 🎯 ARQUIVO PRINCIPAL
**Todas as queries estão em**: `docs/SUPABASE_QUERIES_VERIFICACAO.sql`

## 🚀 COMO USAR

### 1️⃣ **ACESSO AO SUPABASE**
1. Vá para: https://supabase.com/dashboard
2. Entre no seu projeto TaskTracker
3. Clique em **SQL Editor** no menu lateral
4. Clique em **New Query**

### 2️⃣ **TESTE BÁSICO (MAIS USADO)**

**Cole este código para teste rápido:**
```sql
-- CONTADOR SIMPLES - EXECUTE ANTES E DEPOIS DE SALVAR
SELECT 
    NOW() as momento_atual,
    (SELECT COUNT(*) FROM tasks) as total_tarefas,
    (SELECT COUNT(*) FROM rooms) as total_salas,
    (SELECT MAX(updated_at) FROM tasks) as ultima_atualizacao_tarefa,
    (SELECT MAX(created_at) FROM tasks) as ultima_criacao_tarefa;
```

### 3️⃣ **FLUXO DE TESTE**

#### **Para verificar se dados estão sendo salvos:**
1. **Execute** o código acima → **Anote os números**
2. **Vá** para TaskTracker (http://localhost:3000)
3. **Crie** ou **edite** uma tarefa
4. **Clique** em salvar
5. **Volte** para Supabase e **execute novamente**
6. **Compare** - os números devem ter mudado!

## 📊 **QUERIES DISPONÍVEIS**

### **🔍 Verificação Geral (Seção 1)**
- Usuários cadastrados
- Salas criadas
- Tarefas salvas
- Acessos às salas
- Resumo geral

### **⏰ Atividades Recentes (Seção 2)**
- Tarefas criadas nos últimos 5 minutos
- Tarefas atualizadas nos últimos 5 minutos
- Salas criadas nos últimos 5 minutos

### **👤 Dados do Usuário (Seção 3)**
- Suas salas específicas
- Suas tarefas específicas
- **IMPORTANTE**: Substitua `'binhara@azuris.com.br'` pelo seu email

### **🧪 Teste em Tempo Real (Seção 4)**
- Contador simples para antes/depois
- **MAIS USADO** para testes rápidos

### **🔧 Debug Avançado (Seção 5)**
- Estrutura das tabelas
- Triggers ativos
- Policies RLS

### **🧹 Limpeza de Dados (Seção 6)**
- Remove dados de teste
- **CUIDADO**: Só use se necessário
- **Descomente** as linhas para ativar

## ✅ **RESULTADOS ESPERADOS**

### **Se está funcionando:**
- ✅ Contadores aumentam após salvar
- ✅ `ultima_atualizacao_tarefa` muda para agora
- ✅ Dados aparecem nas queries de verificação
- ✅ Suas tarefas aparecem na seção "MINHAS TAREFAS"

### **Se não está funcionando:**
- ❌ Números permanecem iguais
- ❌ Dados não aparecem
- ❌ Use o botão 🧪 no TaskTracker para executar testes
- ❌ Use o botão 📋 para copiar relatório de erro

## 🎯 **QUERIES MAIS USADAS**

### **1. Teste Rápido (Use sempre)**
```sql
SELECT NOW() as agora, (SELECT COUNT(*) FROM tasks) as total_tarefas;
```

### **2. Ver Últimas Tarefas**
```sql
SELECT atividade, status, created_at 
FROM tasks 
ORDER BY created_at DESC 
LIMIT 5;
```

### **3. Ver Suas Salas**
```sql
SELECT r.name, r.room_code, COUNT(t.id) as tarefas
FROM rooms r
LEFT JOIN auth.users u ON r.owner_id = u.id
LEFT JOIN tasks t ON r.id = t.room_id
WHERE u.email = 'SEU_EMAIL_AQUI'
GROUP BY r.id, r.name, r.room_code;
```

## 📞 **SUPORTE**

### **Se encontrar problemas:**
1. **Execute** as queries da Seção 1 (Verificação Geral)
2. **Cole** os resultados no chat para análise
3. **Use** o botão 📋 no TaskTracker para copiar relatório completo
4. **Verifique** se seu email está correto nas queries da Seção 3

## 🔗 **ARQUIVOS RELACIONADOS**
- `docs/SUPABASE_QUERIES_VERIFICACAO.sql` - Todas as queries
- `docs/SUPABASE_SETUP_COMPLETO.md` - Configuração inicial
- `docs/SUPABASE_CLEANUP_SCRIPT.sql` - Limpeza do banco
- `docs/SUPABASE_INSTALL_SCRIPT.sql` - Instalação do banco

---
**💡 DICA**: Mantenha uma aba do Supabase SQL Editor sempre aberta para testes rápidos durante o desenvolvimento!