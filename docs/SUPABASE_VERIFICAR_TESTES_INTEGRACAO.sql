-- =============================================
-- VERIFICAÇÃO DOS TESTES DE INTEGRAÇÃO - TASKTRACKER
-- Execute este SQL no Supabase Dashboard após rodar os testes
-- =============================================

-- =============================================
-- RESUMO GERAL DOS DADOS
-- =============================================

SELECT 
    '🎯 RESUMO GERAL DOS DADOS CRIADOS PELOS TESTES' as secao,
    (SELECT COUNT(*) FROM rooms) as total_salas,
    (SELECT COUNT(*) FROM tasks) as total_tarefas,
    (SELECT COUNT(*) FROM room_access) as total_acessos,
    NOW() as verificado_em;

-- =============================================
-- SALAS CRIADAS PELOS TESTES
-- =============================================

SELECT 
    '🏠 SALAS DE TESTE CRIADAS' as secao,
    r.name as nome_sala,
    r.room_code as codigo_sala,
    r.description as descricao,
    u.email as proprietario,
    r.created_at,
    (SELECT COUNT(*) FROM tasks t WHERE t.room_id = r.id) as total_tarefas_na_sala
FROM rooms r
LEFT JOIN auth.users u ON r.owner_id = u.id
WHERE r.name LIKE '%Teste%' OR r.room_code LIKE 'TEST_%'
ORDER BY r.created_at DESC;

-- =============================================
-- TAREFAS CRIADAS PELOS TESTES
-- =============================================

SELECT 
    '📝 TAREFAS DE TESTE CRIADAS' as secao,
    t.atividade,
    t.epico,
    t.status,
    t.desenvolvedor,
    t.estimativa,
    t.tempo_gasto,
    t.taxa_erro,
    t.motivo_erro,
    r.name as sala,
    u.email as criado_por,
    t.created_at
FROM tasks t
LEFT JOIN rooms r ON t.room_id = r.id
LEFT JOIN auth.users u ON t.created_by = u.id
WHERE (
    t.atividade LIKE '%Teste%' OR 
    t.atividade LIKE '%CRUD%' OR
    t.epico LIKE '%Teste%' OR
    t.desenvolvedor LIKE '%Sistema%' OR
    r.name LIKE '%Teste%' OR
    r.room_code LIKE 'TEST_%'
)
ORDER BY t.created_at DESC;

-- =============================================
-- VERIFICAR CAMPOS ESPECÍFICOS DOS TESTES
-- =============================================

-- Tarefas com tempo gasto (devem ter algumas)
SELECT 
    '⏱️ TAREFAS COM TEMPO GASTO (TESTE DE VALIDAÇÃO)' as secao,
    COUNT(*) as total_com_tempo_gasto,
    AVG(tempo_gasto) as tempo_medio,
    MAX(tempo_gasto) as tempo_maximo,
    COUNT(CASE WHEN taxa_erro > 20 THEN 1 END) as com_taxa_erro_alta,
    COUNT(CASE WHEN motivo_erro IS NOT NULL THEN 1 END) as com_motivo_erro
FROM tasks
WHERE tempo_gasto IS NOT NULL;

-- =============================================
-- USUÁRIOS DE TESTE CRIADOS
-- =============================================

SELECT 
    '👤 USUÁRIOS DE TESTE' as secao,
    u.email,
    u.created_at,
    u.email_confirmed_at IS NOT NULL as email_confirmado,
    (SELECT COUNT(*) FROM rooms r WHERE r.owner_id = u.id) as salas_criadas
FROM auth.users u
WHERE u.email LIKE '%teste_%@gmail.com'
ORDER BY u.created_at DESC;

-- =============================================
-- VERIFICAR LIMPEZA DOS TESTES
-- =============================================

-- Esta query deve mostrar se os dados de teste foram limpos
SELECT 
    '🧹 STATUS DA LIMPEZA' as secao,
    CASE 
        WHEN EXISTS (SELECT 1 FROM rooms WHERE name LIKE '%Teste%' OR room_code LIKE 'TEST_%') 
        THEN '⚠️ DADOS DE TESTE AINDA EXISTEM - Testes não foram limpos'
        ELSE '✅ DADOS DE TESTE FORAM LIMPOS - Sistema restaurado'
    END as status_limpeza;

-- =============================================
-- ÚLTIMAS ATIVIDADES (TEMPO REAL)
-- =============================================

-- Verificar atividade dos últimos 10 minutos
SELECT 
    '📊 ATIVIDADE DOS ÚLTIMOS 10 MINUTOS' as secao,
    'Salas criadas' as tipo,
    COUNT(*) as quantidade
FROM rooms 
WHERE created_at > NOW() - INTERVAL '10 minutes'

UNION ALL

SELECT 
    '📊 ATIVIDADE DOS ÚLTIMOS 10 MINUTOS' as secao,
    'Tarefas criadas' as tipo,
    COUNT(*) as quantidade
FROM tasks 
WHERE created_at > NOW() - INTERVAL '10 minutes'

UNION ALL

SELECT 
    '📊 ATIVIDADE DOS ÚLTIMOS 10 MINUTOS' as secao,
    'Tarefas atualizadas' as tipo,
    COUNT(*) as quantidade  
FROM tasks 
WHERE updated_at > NOW() - INTERVAL '10 minutes';

-- =============================================
-- TESTE DE INTEGRIDADE DOS DADOS
-- =============================================

-- Verificar se os relacionamentos estão corretos
SELECT 
    '🔍 VERIFICAÇÃO DE INTEGRIDADE' as secao,
    'Tarefas com salas válidas' as teste,
    COUNT(t.id) as total_tarefas,
    COUNT(r.id) as total_com_sala_valida,
    CASE 
        WHEN COUNT(t.id) = COUNT(r.id) THEN '✅ Todos os relacionamentos OK'
        ELSE '❌ Existem tarefas órfãs'
    END as resultado
FROM tasks t
LEFT JOIN rooms r ON t.room_id = r.id;

-- =============================================
-- RESUMO FINAL PARA DEBUG
-- =============================================

SELECT 
    '🎯 RESUMO FINAL PARA DEBUG' as secao,
    'Total de registros por tabela' as info,
    json_build_object(
        'rooms', (SELECT COUNT(*) FROM rooms),
        'tasks', (SELECT COUNT(*) FROM tasks),
        'room_access', (SELECT COUNT(*) FROM room_access),
        'usuarios_teste', (SELECT COUNT(*) FROM auth.users WHERE email LIKE '%teste_%@gmail.com'),
        'salas_teste', (SELECT COUNT(*) FROM rooms WHERE name LIKE '%Teste%' OR room_code LIKE 'TEST_%'),
        'tarefas_teste', (SELECT COUNT(*) FROM tasks WHERE atividade LIKE '%Teste%' OR atividade LIKE '%CRUD%'),
        'ultima_verificacao', NOW()
    ) as contadores;

-- =============================================
-- INSTRUÇÕES DE USO
-- =============================================

SELECT 
    '📋 COMO INTERPRETAR OS RESULTADOS' as instrucoes,
    '
    ✅ SE OS TESTES FUNCIONARAM CORRETAMENTE:
    • Deve haver pelo menos 1 sala de teste (nome contém "Teste")
    • Deve haver pelo menos 3 tarefas de teste
    • Pelo menos 1 tarefa deve ter tempo_gasto preenchido
    • Deve haver 1 usuário de teste (email teste_123@gmail.com)
    
    🔄 SE OS TESTES FORAM EXECUTADOS E LIMPOS:
    • Contadores podem estar zerados (limpeza funcionou)
    • Atividade recente deve mostrar criações e remoções
    
    ❌ SE OS TESTES FALHARAM:
    • Contadores zerados E sem atividade recente
    • Usuários de teste criados mas sem salas/tarefas
    • Erros de integridade nos relacionamentos
    ' as explicacao;

-- =============================================
-- QUERY FINAL DE VALIDAÇÃO
-- =============================================

SELECT 
    '🚀 VALIDAÇÃO FINAL' as titulo,
    CASE 
        WHEN (SELECT COUNT(*) FROM rooms WHERE created_at > NOW() - INTERVAL '30 minutes') > 0
        OR (SELECT COUNT(*) FROM tasks WHERE created_at > NOW() - INTERVAL '30 minutes') > 0
        THEN '✅ TESTES EXECUTARAM - Dados foram criados nos últimos 30 minutos'
        ELSE '⚠️ NENHUMA ATIVIDADE RECENTE - Testes podem não ter executado ou dados foram limpos'
    END as resultado_final,
    NOW() as verificado_em;