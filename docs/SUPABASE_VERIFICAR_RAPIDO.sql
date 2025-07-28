-- =============================================
-- VERIFICAÇÃO RÁPIDA DOS TESTES - TASKTRACKER
-- Execute este SQL para verificação rápida
-- =============================================

-- CONTADORES BÁSICOS
SELECT 
    '📊 CONTADORES ATUAIS' as tipo,
    (SELECT COUNT(*) FROM rooms) as total_salas,
    (SELECT COUNT(*) FROM tasks) as total_tarefas,
    (SELECT COUNT(*) FROM auth.users WHERE email LIKE '%teste_%') as usuarios_teste,
    NOW() as verificado_em;

-- ATIVIDADE RECENTE (30 minutos)
SELECT 
    '⏰ ATIVIDADE DOS ÚLTIMOS 30 MINUTOS' as tipo,
    (SELECT COUNT(*) FROM rooms WHERE created_at > NOW() - INTERVAL '30 minutes') as salas_criadas,
    (SELECT COUNT(*) FROM tasks WHERE created_at > NOW() - INTERVAL '30 minutes') as tarefas_criadas,
    (SELECT COUNT(*) FROM tasks WHERE updated_at > NOW() - INTERVAL '30 minutes') as tarefas_atualizadas;

-- DADOS DE TESTE ESPECÍFICOS
SELECT 
    '🧪 DADOS DE TESTE ENCONTRADOS' as tipo,
    (SELECT COUNT(*) FROM rooms WHERE name LIKE '%Teste%' OR room_code LIKE 'TEST_%') as salas_teste,
    (SELECT COUNT(*) FROM tasks WHERE atividade LIKE '%Teste%' OR atividade LIKE '%CRUD%' OR epico LIKE '%Teste%') as tarefas_teste,
    (SELECT COUNT(*) FROM tasks WHERE tempo_gasto IS NOT NULL) as tarefas_com_tempo;

-- RESULTADO FINAL
SELECT 
    '🎯 RESULTADO DA VERIFICAÇÃO' as tipo,
    CASE 
        WHEN (SELECT COUNT(*) FROM rooms WHERE created_at > NOW() - INTERVAL '1 hour') > 0
        OR (SELECT COUNT(*) FROM tasks WHERE created_at > NOW() - INTERVAL '1 hour') > 0
        THEN '✅ TESTES EXECUTADOS - Atividade detectada na última hora'
        
        WHEN (SELECT COUNT(*) FROM rooms WHERE name LIKE '%Teste%') > 0
        OR (SELECT COUNT(*) FROM tasks WHERE atividade LIKE '%Teste%') > 0  
        THEN '⚠️ DADOS DE TESTE EXISTEM - Mas podem ser antigos'
        
        ELSE '❌ NENHUM DADO DE TESTE - Testes podem não ter executado'
    END as status,
    NOW() as verificado_em;