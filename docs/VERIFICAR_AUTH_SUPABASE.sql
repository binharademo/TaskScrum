-- =============================================
-- VERIFICAR AUTENTICAÇÃO NO SUPABASE
-- Este script ajuda a diagnosticar problemas de auth
-- =============================================

-- =============================================
-- 1. VERIFICAR SE auth.uid() ESTÁ FUNCIONANDO
-- =============================================
SELECT 
    '🔑 VERIFICAÇÃO DE AUTENTICAÇÃO' as check_type,
    auth.uid() as current_user_id,
    auth.email() as current_user_email,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ USUÁRIO LOGADO NO SUPABASE'
        ELSE '❌ USUÁRIO NÃO LOGADO NO SUPABASE'
    END as auth_status;

-- =============================================
-- 2. VERIFICAR USUÁRIOS EXISTENTES
-- =============================================
SELECT 
    '👥 USUÁRIOS CADASTRADOS' as info,
    id,
    email,
    created_at,
    email_confirmed_at IS NOT NULL as email_confirmado,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;

-- =============================================
-- 3. BUSCAR SEU USUÁRIO ESPECÍFICO
-- =============================================
SELECT 
    '🎯 SEU USUÁRIO ESPECÍFICO' as info,
    id,
    email,
    created_at,
    email_confirmed_at IS NOT NULL as email_confirmado,
    last_sign_in_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ EMAIL CONFIRMADO'
        ELSE '⚠️ EMAIL NÃO CONFIRMADO'
    END as status_email
FROM auth.users 
WHERE email = 'binhara@azuris.com.br';

-- =============================================
-- 4. VERIFICAR SALAS DESTE USUÁRIO ESPECÍFICO
-- =============================================
SELECT 
    '🏠 SALAS DO USUÁRIO binhara@azuris.com.br' as info,
    r.name,
    r.room_code,
    r.created_at,
    'Proprietário' as papel
FROM rooms r
JOIN auth.users u ON r.owner_id = u.id
WHERE u.email = 'binhara@azuris.com.br'

UNION ALL

SELECT 
    '🏠 SALAS COM ACESSO PARA binhara@azuris.com.br' as info,
    r.name,
    r.room_code,
    r.created_at,
    ra.role as papel
FROM rooms r
JOIN room_access ra ON r.id = ra.room_id
JOIN auth.users u ON ra.user_id = u.id
WHERE u.email = 'binhara@azuris.com.br'
ORDER BY created_at DESC;

-- =============================================
-- 5. VERIFICAR ESPECIFICAMENTE A SALA DEFAULT_ROOM
-- =============================================
SELECT 
    '📍 SALA DEFAULT_ROOM - DETALHES COMPLETOS' as info,
    r.id,
    r.name,
    r.room_code,
    r.owner_id,
    u.email as proprietario_email,
    r.created_at
FROM rooms r
LEFT JOIN auth.users u ON r.owner_id = u.id
WHERE r.room_code = 'DEFAULT_ROOM';

-- =============================================
-- 6. ACESSOS À SALA DEFAULT_ROOM
-- =============================================
SELECT 
    '🔐 ACESSOS À SALA DEFAULT_ROOM' as info,
    ra.user_id,
    u.email,
    ra.role,
    ra.created_at
FROM room_access ra
JOIN rooms r ON ra.room_id = r.id
LEFT JOIN auth.users u ON ra.user_id = u.id
WHERE r.room_code = 'DEFAULT_ROOM';

-- =============================================
-- 7. DIAGNÓSTICO FINAL
-- =============================================
SELECT 
    '🎯 DIAGNÓSTICO FINAL' as resultado,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'binhara@azuris.com.br')
            THEN '❌ USUÁRIO binhara@azuris.com.br NÃO EXISTE NO SUPABASE'
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'binhara@azuris.com.br' AND email_confirmed_at IS NULL)
            THEN '⚠️ USUÁRIO EXISTE MAS EMAIL NÃO CONFIRMADO'
        WHEN NOT EXISTS (SELECT 1 FROM rooms WHERE room_code = 'DEFAULT_ROOM')
            THEN '❌ SALA DEFAULT_ROOM NÃO EXISTE'
        WHEN NOT EXISTS (
            SELECT 1 
            FROM room_access ra 
            JOIN rooms r ON ra.room_id = r.id 
            JOIN auth.users u ON ra.user_id = u.id
            WHERE r.room_code = 'DEFAULT_ROOM' AND u.email = 'binhara@azuris.com.br'
        ) THEN '❌ USUÁRIO SEM ACESSO À SALA DEFAULT_ROOM'
        ELSE '✅ TUDO PARECE OK - PROBLEMA É DE SESSÃO/AUTH'
    END as status;