-- =============================================
-- DEBUG: VERIFICAR SALA DEFAULT_ROOM
-- Execute no Supabase SQL Editor para diagnosticar
-- =============================================

-- =============================================
-- 1. VERIFICAR SE A SALA DEFAULT_ROOM EXISTE
-- =============================================
SELECT 
    '🏠 VERIFICAÇÃO DA SALA DEFAULT_ROOM' as check_type,
    r.id,
    r.name,
    r.room_code,
    r.owner_id,
    u.email as proprietario_email,
    r.created_at,
    r.is_public
FROM rooms r
LEFT JOIN auth.users u ON r.owner_id = u.id
WHERE r.room_code = 'DEFAULT_ROOM';

-- =============================================
-- 2. VERIFICAR ACESSO À SALA DEFAULT_ROOM
-- =============================================
SELECT 
    '🔐 VERIFICAÇÃO DE ACESSO À SALA DEFAULT_ROOM' as check_type,
    ra.id,
    ra.room_id,
    ra.user_id,
    u.email as usuario_email,
    ra.role,
    ra.granted_by,
    ra.created_at
FROM room_access ra
JOIN rooms r ON ra.room_id = r.id
LEFT JOIN auth.users u ON ra.user_id = u.id
WHERE r.room_code = 'DEFAULT_ROOM';

-- =============================================
-- 3. VERIFICAR TAREFAS NA SALA DEFAULT_ROOM
-- =============================================
SELECT 
    '📋 TAREFAS NA SALA DEFAULT_ROOM' as check_type,
    COUNT(*) as total_tarefas
FROM tasks t
JOIN rooms r ON t.room_id = r.id
WHERE r.room_code = 'DEFAULT_ROOM';

-- Se houver tarefas, mostrar algumas
SELECT 
    '📝 ALGUMAS TAREFAS DA SALA DEFAULT_ROOM' as info,
    t.atividade,
    t.status,
    t.desenvolvedor,
    t.created_at
FROM tasks t
JOIN rooms r ON t.room_id = r.id
WHERE r.room_code = 'DEFAULT_ROOM'
ORDER BY t.created_at DESC
LIMIT 5;

-- =============================================
-- 4. VERIFICAR TODAS AS SALAS DO USUÁRIO ATUAL
-- =============================================
SELECT 
    '👤 TODAS AS SALAS DO USUÁRIO ATUAL' as check_type,
    r.name,
    r.room_code,
    ra.role,
    r.created_at
FROM rooms r
JOIN room_access ra ON r.id = ra.room_id
WHERE ra.user_id = auth.uid()
ORDER BY r.created_at DESC;

-- =============================================
-- 5. VERIFICAR SE USUÁRIO ESTÁ LOGADO
-- =============================================
SELECT 
    '🔑 USUÁRIO ATUAL' as check_type,
    auth.uid() as user_id,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ LOGADO'
        ELSE '❌ NÃO LOGADO'
    END as status;

-- =============================================
-- 6. CONTADORES GERAIS
-- =============================================
SELECT 
    '📊 CONTADORES GERAIS' as info,
    (SELECT COUNT(*) FROM rooms) as total_salas,
    (SELECT COUNT(*) FROM room_access) as total_acessos,
    (SELECT COUNT(*) FROM tasks) as total_tarefas,
    (SELECT COUNT(*) FROM auth.users) as total_usuarios;

-- =============================================
-- 7. DIAGNÓSTICO FINAL
-- =============================================
SELECT 
    '🎯 DIAGNÓSTICO' as resultado,
    CASE 
        WHEN auth.uid() IS NULL THEN '❌ USUÁRIO NÃO LOGADO - Faça login primeiro'
        WHEN NOT EXISTS (SELECT 1 FROM rooms WHERE room_code = 'DEFAULT_ROOM') 
            THEN '❌ SALA DEFAULT_ROOM NÃO EXISTE - Execute testes de integração'
        WHEN NOT EXISTS (
            SELECT 1 FROM room_access ra 
            JOIN rooms r ON ra.room_id = r.id 
            WHERE r.room_code = 'DEFAULT_ROOM' AND ra.user_id = auth.uid()
        ) THEN '❌ USUÁRIO NÃO TEM ACESSO À SALA DEFAULT_ROOM - Problema no trigger'
        ELSE '✅ TUDO OK - Sala existe e usuário tem acesso'
    END as status;