# 🛠️ SCRIPTS SUPABASE - TASKTRACKER

## 📁 Arquivos Disponíveis

### 1️⃣ `SUPABASE_CLEANUP_SCRIPT.sql`
**Uso**: Remove TUDO do banco Supabase
- **Quando usar**: Para limpar instalação anterior ou corrigir problemas
- **Executa**: Remove tabelas, triggers, funções e policies
- **Resultado**: Banco limpo, pronto para nova instalação

### 2️⃣ `SUPABASE_INSTALL_SCRIPT.sql`  
**Uso**: Cria estrutura completa do TaskTracker
- **Quando usar**: Após executar o script de limpeza
- **Executa**: Cria tabelas, triggers, RLS e indexes
- **Resultado**: Sistema TaskTracker 100% funcional

### 3️⃣ `SUPABASE_SETUP_COMPLETO.md`
**Uso**: Documentação completa com passo-a-passo
- **Quando usar**: Para configuração inicial ou consulta
- **Contém**: Instruções detalhadas, credenciais, troubleshooting

### 4️⃣ `SUPABASE_QUERIES_VERIFICACAO.sql` ⭐ **NOVO**
**Uso**: Queries para verificar se dados estão sendo salvos
- **Quando usar**: Para testar se TaskTracker está salvando no Supabase
- **Contém**: 6 seções de queries de verificação e debug
- **Resultado**: Confirmação de que dados estão sendo persistidos

### 5️⃣ `COMO_VERIFICAR_DADOS_SUPABASE.md` ⭐ **NOVO**
**Uso**: Guia completo de como verificar dados salvos
- **Quando usar**: Para aprender a usar as queries de verificação
- **Contém**: Passo-a-passo, exemplos práticos, troubleshooting
- **Resultado**: Domínio total da verificação de dados

## 🚀 FLUXO DE INSTALAÇÃO RECOMENDADO

### Instalação Limpa (Recomendado)
```
1. Execute: SUPABASE_CLEANUP_SCRIPT.sql
2. Execute: SUPABASE_INSTALL_SCRIPT.sql  
3. Teste no TaskTracker
```

### Instalação em Banco Novo
```
1. Execute apenas: SUPABASE_INSTALL_SCRIPT.sql
2. Teste no TaskTracker
```

## 🎯 COMO EXECUTAR

### No Supabase Dashboard:
1. **Acesse**: https://supabase.com/dashboard
2. **Entre** no seu projeto TaskTracker
3. **Vá em**: SQL Editor → New Query
4. **Cole** o conteúdo do script
5. **Execute** clicando em "Run"
6. **Aguarde** mensagem de sucesso

## ✅ RESULTADOS ESPERADOS

### Após CLEANUP:
```
TaskTracker database cleaned successfully!
```

### Após INSTALL:
```
TaskTracker Supabase setup completed successfully - Clean Installation!
```

### No Table Editor:
- ✅ `rooms` - Salas de trabalho
- ✅ `room_access` - Controle de acesso  
- ✅ `tasks` - Tarefas principais
- ✅ `user_settings` - Configurações

## 🔧 TROUBLESHOOTING

### ❌ "permission denied for schema"
- **Solução**: Certifique-se de estar usando o SQL Editor do Supabase, não um cliente externo

### ❌ "relation already exists"  
- **Solução**: Execute primeiro o script de limpeza

### ❌ "function does not exist"
- **Solução**: Execute o script completo, não apenas partes

## 📞 SUPORTE

1. **Execute** os testes de integração no TaskTracker (🧪)
2. **Use** o botão "📋 Copiar Relatório Completo"
3. **Compartilhe** o relatório para diagnóstico preciso

---
**Última atualização**: Janeiro 2025  
**Versão**: TaskTracker v1.0 com Supabase