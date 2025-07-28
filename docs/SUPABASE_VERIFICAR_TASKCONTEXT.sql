-- =============================================
-- VERIFICAÇÃO ESPECÍFICA: TaskContext + Supabase
-- Execute após interagir com o TaskTracker (drag & drop, criar tarefas)
-- =============================================

-- =============================================
-- 1. VERIFICAR SE HÁ TAREFAS CRIADAS VIA INTERFACE
-- =============================================

SELECT 
    '🎯 TAREFAS CRIADAS VIA INTERFACE DO TASKTRACKER' as secao,
    COUNT(*) as total_tarefas,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '10 minutes' THEN 1 END) as criadas_ultimos_10min,
    COUNT(CASE WHEN updated_at > NOW() - INTERVAL '10 minutes' THEN 1 END) as atualizadas_ultimos_10min
FROM tasks;

-- =============================================
-- 2. ÚLTIMAS TAREFAS CRIADAS (QUALQUER ORIGEM)
-- =============================================

SELECT 
    '📝 ÚLTIMAS 5 TAREFAS CRIADAS' as secao,
    t.id,
    t.atividade,
    t.epico,
    t.status,
    t.desenvolvedor,
    r.name as sala_nome,
    r.room_code as sala_codigo,
    t.created_at,
    t.updated_at,
    CASE 
        WHEN t.created_at > NOW() - INTERVAL '5 minutes' THEN '🔥 MUITO RECENTE'
        WHEN t.created_at > NOW() - INTERVAL '30 minutes' THEN '🆕 RECENTE'
        ELSE '⏰ ANTIGA'
    END as idade
FROM tasks t
LEFT JOIN rooms r ON t.room_id = r.id
ORDER BY t.created_at DESC
LIMIT 5;

-- =============================================
-- 3. VERIFICAR ATUALIZAÇÕES RECENTES (DRAG & DROP)
-- =============================================

SELECT 
    '🔄 TAREFAS COM MUDANÇAS DE STATUS RECENTES' as secao,
    t.id,
    t.atividade,
    t.status,
    t.desenvolvedor,
    r.room_code as sala,
    t.created_at,
    t.updated_at,
    CASE 
        WHEN t.updated_at > t.created_at + INTERVAL '10 seconds' THEN '✅ FOI ATUALIZADA'
        ELSE '📝 SÓ CRIADA'
    END as tipo_operacao
FROM tasks t
LEFT JOIN rooms r ON t.room_id = r.id
WHERE t.updated_at > NOW() - INTERVAL '30 minutes'
ORDER BY t.updated_at DESC;

-- =============================================
-- 4. VERIFICAR SALAS ATIVAS
-- =============================================

SELECT 
    '🏠 SALAS COM ATIVIDADE RECENTE' as secao,
    r.name,
    r.room_code,
    r.created_at as sala_criada,
    COUNT(t.id) as total_tarefas,
    COUNT(CASE WHEN t.created_at > NOW() - INTERVAL '30 minutes' THEN 1 END) as tarefas_recentes,
    MAX(t.created_at) as ultima_tarefa_criada,
    MAX(t.updated_at) as ultima_tarefa_atualizada
FROM rooms r
LEFT JOIN tasks t ON r.id = t.room_id
GROUP BY r.id, r.name, r.room_code, r.created_at
HAVING COUNT(t.id) > 0
ORDER BY MAX(t.updated_at) DESC;

-- =============================================
-- 5. VERIFICAR DADOS TÍPICOS DE INTERFACE
-- =============================================

-- Verificar se há tarefas com campos que só a interface preenche
SELECT 
    '🎨 TAREFAS COM DADOS TÍPICOS DA INTERFACE' as secao,
    COUNT(*) as total_tarefas,
    COUNT(CASE WHEN tempo_gasto IS NOT NULL THEN 1 END) as com_tempo_gasto,
    COUNT(CASE WHEN taxa_erro IS NOT NULL THEN 1 END) as com_taxa_erro,
    COUNT(CASE WHEN motivo_erro IS NOT NULL THEN 1 END) as com_motivo_erro,
    COUNT(CASE WHEN tempo_gasto_validado = true THEN 1 END) as tempo_validado
FROM tasks;

-- =============================================
-- 6. DIAGNÓSTICO: TaskContext está funcionando?
-- =============================================

SELECT 
    '🔍 DIAGNÓSTICO TASKCONTEXT' as secao,
    CASE 
        -- Caso ideal: tarefas criadas recentemente via interface
        WHEN (SELECT COUNT(*) FROM tasks WHERE created_at > NOW() - INTERVAL '10 minutes') > 0
        THEN '✅ TASKCONTEXT FUNCIONANDO - Tarefas criadas nos últimos 10 min'
        
        -- Caso bom: atualizações recentes (drag & drop)
        WHEN (SELECT COUNT(*) FROM tasks WHERE updated_at > NOW() - INTERVAL '10 minutes' AND updated_at > created_at + INTERVAL '10 seconds') > 0
        THEN '✅ TASKCONTEXT FUNCIONANDO - Atualizações detectadas (drag & drop)'
        
        -- Caso suspeito: tarefas existem mas são antigas
        WHEN (SELECT COUNT(*) FROM tasks) > 0
        THEN '⚠️ DADOS ANTIGOS - TaskContext pode não estar persistindo mudanças recentes'
        
        -- Caso problemático: nenhuma tarefa
        ELSE '❌ NENHUMA TAREFA - TaskContext não está persistindo dados'
    END as diagnostico,
    NOW() as verificado_em;

-- =============================================
-- 7. INSTRUÇÕES PARA TESTE MANUAL
-- =============================================

SELECT 
    '📋 INSTRUÇÕES PARA TESTE MANUAL' as instrucoes,
    '
🧪 PARA TESTAR SE TASKCONTEXT ESTÁ FUNCIONANDO:

1️⃣ Abra o TaskTracker: http://localhost:3000
2️⃣ Faça login no Supabase
3️⃣ Crie ou entre numa sala
4️⃣ Execute ALGUMAS destas ações:
   • Criar uma nova tarefa
   • Arrastar uma tarefa entre colunas (Backlog → Doing → Done)
   • Editar uma tarefa existente
   • Deletar uma tarefa

5️⃣ Execute este SQL novamente
6️⃣ Verifique se:
   ✅ Novas tarefas aparecem na seção "ÚLTIMAS TAREFAS CRIADAS"
   ✅ Mudanças aparecem na seção "MUDANÇAS DE STATUS RECENTES"  
   ✅ O diagnóstico mostra "TASKCONTEXT FUNCIONANDO"

🚨 SE NÃO FUNCIONAR:
   • Verifique o console do navegador (F12)
   • Procure logs do TaskContext
   • Verifique se está logado no Supabase
   • Confirme se está numa sala válida
    ' as explicacao;

-- =============================================
-- 8. QUERY PARA LIMPEZA (SE NECESSÁRIO)
-- =============================================

SELECT 
    '🧹 LIMPEZA (Execute se necessário)' as limpeza,
    'DELETE FROM tasks WHERE atividade LIKE ''%Teste%'';' as query_limpeza_tarefas,
    'DELETE FROM rooms WHERE name LIKE ''%Teste%'';' as query_limpeza_salas;