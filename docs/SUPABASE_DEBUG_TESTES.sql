-- =============================================
-- DEBUG DOS TESTES - INVESTIGAR O QUE ACONTECEU
-- Execute este SQL para entender por que não há tarefas de teste
-- =============================================

-- 1. TODAS AS TAREFAS (sem filtro)
SELECT 
    '1️⃣ TODAS AS TAREFAS EXISTENTES' as debug,
    COUNT(*) as total_tarefas,
    MIN(created_at) as primeira_tarefa,
    MAX(created_at) as ultima_tarefa
FROM tasks;

-- 2. ÚLTIMAS TAREFAS CRIADAS (independente do nome)
SELECT 
    '2️⃣ ÚLTIMAS 10 TAREFAS CRIADAS' as debug,
    t.atividade,
    t.epico,
    t.desenvolvedor,
    t.status,
    r.name as sala_nome,
    r.room_code as sala_codigo,
    u.email as criado_por,
    t.created_at
FROM tasks t
LEFT JOIN rooms r ON t.room_id = r.id
LEFT JOIN auth.users u ON t.created_by = u.id
ORDER BY t.created_at DESC
LIMIT 10;

-- 3. TODAS AS SALAS (verificar se foram criadas)
SELECT 
    '3️⃣ TODAS AS SALAS EXISTENTES' as debug,
    r.name,
    r.room_code,
    r.description,
    u.email as proprietario,
    r.created_at,
    (SELECT COUNT(*) FROM tasks t WHERE t.room_id = r.id) as total_tarefas
FROM rooms r
LEFT JOIN auth.users u ON r.owner_id = u.id
ORDER BY r.created_at DESC;

-- 4. USUARIOS COM EMAIL DE TESTE
SELECT 
    '4️⃣ USUÁRIOS DE TESTE CRIADOS' as debug,
    email,
    created_at,
    email_confirmed_at IS NOT NULL as confirmado
FROM auth.users 
WHERE email LIKE '%teste_%' OR email LIKE '%@gmail.com'
ORDER BY created_at DESC
LIMIT 10;

-- 5. ATIVIDADE DOS ÚLTIMOS 60 MINUTOS
SELECT 
    '5️⃣ ATIVIDADE RECENTE (60 MIN)' as debug,
    'Salas' as tipo,
    COUNT(*) as quantidade,
    MIN(created_at) as primeira,
    MAX(created_at) as ultima
FROM rooms 
WHERE created_at > NOW() - INTERVAL '60 minutes'

UNION ALL

SELECT 
    '5️⃣ ATIVIDADE RECENTE (60 MIN)' as debug,
    'Tarefas' as tipo,
    COUNT(*) as quantidade,
    MIN(created_at) as primeira,
    MAX(created_at) as ultima
FROM tasks 
WHERE created_at > NOW() - INTERVAL '60 minutes';

-- 6. BUSCAR TAREFAS COM PADRÕES MAIS AMPLOS
SELECT 
    '6️⃣ BUSCA AMPLA POR TAREFAS DE TESTE' as debug,
    t.atividade,
    t.epico,
    t.desenvolvedor,
    r.name as sala,
    r.room_code,
    t.created_at
FROM tasks t
LEFT JOIN rooms r ON t.room_id = r.id
WHERE (
    t.atividade ILIKE '%login%' OR
    t.atividade ILIKE '%dashboard%' OR
    t.atividade ILIKE '%banco%' OR
    t.atividade ILIKE '%crud%' OR
    t.atividade ILIKE '%test%' OR
    t.desenvolvedor ILIKE '%joão%' OR
    t.desenvolvedor ILIKE '%maria%' OR
    t.desenvolvedor ILIKE '%pedro%' OR
    t.epico ILIKE '%autenticação%' OR
    t.epico ILIKE '%interface%' OR
    t.epico ILIKE '%backend%'
)
ORDER BY t.created_at DESC;

-- 7. VERIFICAR SE HÁ TAREFAS COM TEMPO_GASTO (que só os testes criam)
SELECT 
    '7️⃣ TAREFAS COM TEMPO_GASTO' as debug,
    t.atividade,
    t.tempo_gasto,
    t.taxa_erro,
    t.motivo_erro,
    t.tempo_gasto_validado,
    r.name as sala,
    t.created_at
FROM tasks t
LEFT JOIN rooms r ON t.room_id = r.id
WHERE t.tempo_gasto IS NOT NULL OR t.taxa_erro IS NOT NULL
ORDER BY t.created_at DESC;

-- 8. RESUMO PARA ANÁLISE
SELECT 
    '8️⃣ RESUMO PARA ANÁLISE' as debug,
    json_build_object(
        'total_rooms', (SELECT COUNT(*) FROM rooms),
        'total_tasks', (SELECT COUNT(*) FROM tasks),
        'rooms_ultima_hora', (SELECT COUNT(*) FROM rooms WHERE created_at > NOW() - INTERVAL '1 hour'),
        'tasks_ultima_hora', (SELECT COUNT(*) FROM tasks WHERE created_at > NOW() - INTERVAL '1 hour'),
        'users_teste', (SELECT COUNT(*) FROM auth.users WHERE email LIKE '%teste_%'),
        'tasks_com_tempo', (SELECT COUNT(*) FROM tasks WHERE tempo_gasto IS NOT NULL),
        'agora', NOW()
    ) as dados;

-- =============================================
-- RESULTADO ESPERADO VS REALIDADE
-- =============================================

SELECT 
    '9️⃣ DIAGNÓSTICO FINAL' as debug,
    CASE 
        WHEN (SELECT COUNT(*) FROM tasks) = 0 THEN
            '❌ NENHUMA TAREFA EXISTE - Testes não criaram dados ou houve erro'
            
        WHEN (SELECT COUNT(*) FROM tasks WHERE created_at > NOW() - INTERVAL '1 hour') = 0 THEN
            '⚠️ TAREFAS EXISTEM MAS SÃO ANTIGAS - Testes não executaram recentemente'
            
        WHEN (SELECT COUNT(*) FROM tasks WHERE tempo_gasto IS NOT NULL) = 0 THEN
            '🔍 TAREFAS RECENTES EXISTEM MAS SEM TEMPO_GASTO - Podem não ser dos testes'
            
        ELSE
            '✅ DADOS RECENTES COM TEMPO_GASTO ENCONTRADOS - Testes provavelmente executaram'
    END as diagnostico,
    NOW() as verificado_em;