-- =============================================
-- QUERIES DE VERIFICAÇÃO SUPABASE - TASKTRACKER
-- Execute estes comandos no Supabase SQL Editor para verificar dados
-- =============================================

-- =============================================
-- 1. VERIFICAÇÃO COMPLETA DE DADOS SALVOS
-- =============================================

-- 1. Verificar usuários cadastrados
SELECT 
    'USUÁRIOS CADASTRADOS' as tipo,
    COUNT(*) as total
FROM auth.users;

-- 2. Verificar salas criadas
SELECT 
    'SALAS CRIADAS' as tipo,
    r.name as nome_sala,
    r.room_code as codigo,
    r.is_public as publica,
    u.email as proprietario,
    r.created_at as criado_em
FROM rooms r
LEFT JOIN auth.users u ON r.owner_id = u.id
ORDER BY r.created_at DESC;

-- 3. Verificar tarefas salvas
SELECT 
    'TAREFAS SALVAS' as tipo,
    t.atividade,
    t.epico,
    t.status,
    t.desenvolvedor,
    t.estimativa,
    r.name as sala,
    u.email as criado_por,
    t.created_at as criado_em
FROM tasks t
LEFT JOIN rooms r ON t.room_id = r.id
LEFT JOIN auth.users u ON t.created_by = u.id
ORDER BY t.created_at DESC
LIMIT 10;

-- 4. Verificar acessos às salas
SELECT 
    'ACESSOS ÀS SALAS' as tipo,
    r.name as sala,
    u.email as usuario,
    ra.role as papel,
    ra.created_at as adicionado_em
FROM room_access ra
LEFT JOIN rooms r ON ra.room_id = r.id
LEFT JOIN auth.users u ON ra.user_id = u.id
ORDER BY ra.created_at DESC;

-- 5. Resumo geral
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_usuarios,
    (SELECT COUNT(*) FROM rooms) as total_salas,
    (SELECT COUNT(*) FROM tasks) as total_tarefas,
    (SELECT COUNT(*) FROM room_access) as total_acessos;

-- =============================================
-- 2. VERIFICAR ÚLTIMAS ATIVIDADES (TEMPO REAL)
-- =============================================

-- Tarefas criadas nos últimos 5 minutos
SELECT 
    '🆕 TAREFA RECÉM CRIADA' as status,
    t.atividade,
    t.epico,
    t.status,
    t.desenvolvedor,
    r.name as sala,
    u.email as usuario,
    t.created_at as quando
FROM tasks t
LEFT JOIN rooms r ON t.room_id = r.id
LEFT JOIN auth.users u ON t.created_by = u.id
WHERE t.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY t.created_at DESC;

-- Tarefas atualizadas nos últimos 5 minutos
SELECT 
    '📝 TAREFA ATUALIZADA' as status,
    t.atividade,
    t.status,
    t.desenvolvedor,
    r.name as sala,
    u.email as usuario,
    t.updated_at as quando
FROM tasks t
LEFT JOIN rooms r ON t.room_id = r.id
LEFT JOIN auth.users u ON t.updated_by = u.id
WHERE t.updated_at > NOW() - INTERVAL '5 minutes'
AND t.updated_at != t.created_at
ORDER BY t.updated_at DESC;

-- Salas criadas nos últimos 5 minutos
SELECT 
    '🏠 SALA CRIADA' as status,
    r.name as nome,
    r.room_code as codigo,
    u.email as proprietario,
    r.created_at as quando
FROM rooms r
LEFT JOIN auth.users u ON r.owner_id = u.id
WHERE r.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY r.created_at DESC;

-- =============================================
-- 3. VERIFICAR DADOS ESPECÍFICOS DO SEU USUÁRIO
-- SUBSTITUA 'SEU_EMAIL_AQUI' pelo seu email real
-- =============================================

-- Suas salas
SELECT 
    'MINHAS SALAS' as tipo,
    r.name as nome_sala,
    r.room_code as codigo,
    r.is_public as publica,
    COUNT(t.id) as total_tarefas,
    r.created_at as criada_em
FROM rooms r
LEFT JOIN auth.users u ON r.owner_id = u.id
LEFT JOIN tasks t ON r.id = t.room_id
WHERE u.email = 'binhara@azuris.com.br'  -- SUBSTITUA PELO SEU EMAIL
GROUP BY r.id, r.name, r.room_code, r.is_public, r.created_at
ORDER BY r.created_at DESC;

-- Suas tarefas
SELECT 
    'MINHAS TAREFAS' as tipo,
    t.atividade,
    t.epico,
    t.status,
    t.desenvolvedor,
    t.estimativa,
    r.name as sala,
    t.created_at as criada_em,
    t.updated_at as atualizada_em
FROM tasks t
LEFT JOIN rooms r ON t.room_id = r.id
LEFT JOIN auth.users u ON t.created_by = u.id
WHERE u.email = 'binhara@azuris.com.br'  -- SUBSTITUA PELO SEU EMAIL
ORDER BY t.updated_at DESC;

-- =============================================
-- 4. TESTE EM TEMPO REAL
-- Execute ANTES e DEPOIS de salvar no TaskTracker
-- =============================================

SELECT 
    NOW() as momento_atual,
    (SELECT COUNT(*) FROM tasks) as total_tarefas,
    (SELECT COUNT(*) FROM rooms) as total_salas,
    (SELECT MAX(updated_at) FROM tasks) as ultima_atualizacao_tarefa,
    (SELECT MAX(created_at) FROM tasks) as ultima_criacao_tarefa;

-- =============================================
-- 5. QUERIES DE DEBUG AVANÇADAS
-- =============================================

-- Verificar estrutura das tabelas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('rooms', 'tasks', 'room_access', 'user_settings')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Verificar triggers ativos
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN ('rooms', 'tasks', 'room_access', 'user_settings');

-- Verificar policies RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('rooms', 'tasks', 'room_access', 'user_settings');

-- =============================================
-- 6. LIMPEZA DE DADOS DE TESTE (USAR COM CUIDADO!)
-- =============================================

-- ATENÇÃO: Descomente apenas se quiser limpar dados de teste
-- CUIDADO: Isso vai apagar dados reais!

/*
-- Apagar tarefas de teste (que contém "Teste" no nome)
DELETE FROM tasks WHERE atividade ILIKE '%teste%';

-- Apagar salas de teste (que começam com "TEST_" ou "Sala de Teste")
DELETE FROM rooms WHERE room_code LIKE 'TEST_%' OR name LIKE 'Sala de Teste%';

-- Verificar o que foi apagado
SELECT 'Limpeza concluída' as status;
*/