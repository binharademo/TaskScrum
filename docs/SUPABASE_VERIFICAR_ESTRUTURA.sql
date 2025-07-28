-- =============================================
-- VERIFICAR ESTRUTURA DAS TABELAS
-- Execute este SQL primeiro para verificar a estrutura
-- =============================================

-- =============================================
-- 1. VERIFICAR ESTRUTURA DA TABELA ROOM_ACCESS
-- =============================================

SELECT 
    '📋 ESTRUTURA DA TABELA ROOM_ACCESS' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'room_access' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- 2. VERIFICAR ESTRUTURA DA TABELA ROOMS
-- =============================================

SELECT 
    '🏠 ESTRUTURA DA TABELA ROOMS' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'rooms' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- 3. VERIFICAR DADOS ATUAIS
-- =============================================

-- Contar salas e acessos
SELECT 
    '📊 CONTADORES ATUAIS' as info,
    (SELECT COUNT(*) FROM rooms) as total_salas,
    (SELECT COUNT(*) FROM room_access) as total_acessos,
    (SELECT COUNT(*) FROM auth.users) as total_usuarios;

-- =============================================
-- 4. IDENTIFICAR PROBLEMA ESPECÍFICO
-- =============================================

-- Salas sem acesso para o proprietário
SELECT 
    '🚨 SALAS SEM ACESSO PARA PROPRIETÁRIO' as problema,
    r.id,
    r.name,
    r.room_code,
    r.owner_id,
    u.email as proprietario,
    CASE 
        WHEN ra.room_id IS NULL THEN '❌ SEM ACESSO'
        ELSE '✅ COM ACESSO'
    END as status
FROM rooms r
LEFT JOIN auth.users u ON r.owner_id = u.id
LEFT JOIN room_access ra ON r.id = ra.room_id AND r.owner_id = ra.user_id
ORDER BY r.created_at DESC;

-- =============================================
-- 5. CORREÇÃO SEGURA (SEM UPDATED_AT)
-- =============================================

-- Esta query irá inserir apenas se necessário
INSERT INTO room_access (room_id, user_id, role, granted_by, created_at)
SELECT 
    r.id,
    r.owner_id,
    'admin',
    r.owner_id,
    NOW()
FROM rooms r
LEFT JOIN room_access ra ON r.id = ra.room_id AND r.owner_id = ra.user_id
WHERE ra.room_id IS NULL  -- Apenas salas sem acesso
AND r.owner_id IS NOT NULL;  -- Apenas salas com proprietário válido

-- =============================================
-- 6. VERIFICAÇÃO FINAL
-- =============================================

SELECT 
    '✅ VERIFICAÇÃO FINAL' as resultado,
    COUNT(*) as total_salas,
    COUNT(CASE WHEN ra.room_id IS NOT NULL THEN 1 END) as salas_com_acesso,
    COUNT(CASE WHEN ra.room_id IS NULL THEN 1 END) as salas_sem_acesso_ainda
FROM rooms r
LEFT JOIN room_access ra ON r.id = ra.room_id AND r.owner_id = ra.user_id;

-- =============================================
-- 7. FOCO NA SALA DEFAULT_ROOM
-- =============================================

SELECT 
    '🎯 STATUS DA SALA DEFAULT_ROOM' as foco,
    r.name,
    r.room_code,
    r.owner_id,
    u.email as proprietario,
    ra.role,
    CASE 
        WHEN ra.room_id IS NOT NULL THEN '✅ ACESSO OK'
        ELSE '❌ SEM ACESSO'
    END as status_acesso
FROM rooms r
LEFT JOIN auth.users u ON r.owner_id = u.id
LEFT JOIN room_access ra ON r.id = ra.room_id AND r.owner_id = ra.user_id
WHERE r.room_code = 'DEFAULT_ROOM';

-- =============================================
-- 8. RESULTADO PARA O USUÁRIO
-- =============================================

SELECT 
    '🎉 RESULTADO' as titulo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM rooms r 
            JOIN room_access ra ON r.id = ra.room_id 
            WHERE r.room_code = 'DEFAULT_ROOM' 
            AND ra.user_id = r.owner_id
        ) THEN '✅ SALA DEFAULT_ROOM AGORA ESTÁ ACESSÍVEL'
        WHEN EXISTS (
            SELECT 1 FROM rooms r 
            WHERE r.room_code = 'DEFAULT_ROOM'
        ) THEN '⚠️ SALA DEFAULT_ROOM EXISTE MAS SEM ACESSO - VERIFIQUE PROPRIETÁRIO'
        ELSE '❌ SALA DEFAULT_ROOM NÃO EXISTE - EXECUTE TESTES DE INTEGRAÇÃO'
    END as status,
    NOW() as verificado_em;