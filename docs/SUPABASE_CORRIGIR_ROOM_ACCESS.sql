-- =============================================
-- CORREÇÃO CRÍTICA: ROOM_ACCESS AUSENTE
-- Execute este SQL para corrigir salas sem acesso para o proprietário
-- =============================================

-- =============================================
-- 1. IDENTIFICAR O PROBLEMA
-- =============================================

-- Verificar salas que existem mas não têm acesso para o proprietário
SELECT 
    '🚨 PROBLEMA IDENTIFICADO' as diagnostico,
    r.id as room_id,
    r.name as room_name,
    r.room_code,
    r.owner_id,
    u.email as proprietario_email,
    CASE 
        WHEN ra.room_id IS NULL THEN '❌ SEM ACESSO'
        ELSE '✅ COM ACESSO'
    END as status_acesso
FROM rooms r
LEFT JOIN auth.users u ON r.owner_id = u.id
LEFT JOIN room_access ra ON r.id = ra.room_id AND r.owner_id = ra.user_id
WHERE ra.room_id IS NULL  -- Salas sem acesso para o proprietário
ORDER BY r.created_at DESC;

-- =============================================
-- 2. CORREÇÃO AUTOMÁTICA
-- =============================================

-- Inserir acesso automático para proprietários de salas existentes
INSERT INTO room_access (room_id, user_id, role, granted_by, created_at, updated_at)
SELECT 
    r.id as room_id,
    r.owner_id as user_id,
    'admin' as role,
    r.owner_id as granted_by,
    NOW() as created_at,
    NOW() as updated_at
FROM rooms r
LEFT JOIN room_access ra ON r.id = ra.room_id AND r.owner_id = ra.user_id
WHERE ra.room_id IS NULL  -- Apenas salas sem acesso
AND r.owner_id IS NOT NULL;  -- Apenas salas com proprietário válido

-- =============================================
-- 3. VERIFICAÇÃO PÓS-CORREÇÃO
-- =============================================

-- Verificar se todas as salas agora têm acesso para o proprietário
SELECT 
    '✅ VERIFICAÇÃO PÓS-CORREÇÃO' as resultado,
    COUNT(*) as total_salas,
    COUNT(CASE WHEN ra.room_id IS NOT NULL THEN 1 END) as salas_com_acesso,
    COUNT(CASE WHEN ra.room_id IS NULL THEN 1 END) as salas_sem_acesso
FROM rooms r
LEFT JOIN room_access ra ON r.id = ra.room_id AND r.owner_id = ra.user_id;

-- =============================================
-- 4. LISTAR SALAS POR USUÁRIO (PARA TESTE)
-- =============================================

-- Verificar quais salas cada usuário pode ver agora
SELECT 
    '👤 SALAS POR USUÁRIO' as relatorio,
    u.email,
    r.name as sala_nome,
    r.room_code,
    ra.role,
    r.created_at
FROM auth.users u
JOIN room_access ra ON u.id = ra.user_id
JOIN rooms r ON ra.room_id = r.id
ORDER BY u.email, r.created_at DESC;

-- =============================================
-- 5. FOCO NA SALA DEFAULT_ROOM
-- =============================================

-- Verificar especificamente a sala DEFAULT_ROOM
SELECT 
    '🏠 VERIFICAÇÃO SALA DEFAULT_ROOM' as foco,
    r.id,
    r.name,
    r.room_code,
    r.owner_id,
    u.email as proprietario,
    ra.role as nivel_acesso,
    r.created_at as criada_em,
    CASE 
        WHEN ra.room_id IS NOT NULL THEN '✅ USUÁRIO TEM ACESSO'
        ELSE '❌ USUÁRIO SEM ACESSO'
    END as status
FROM rooms r
LEFT JOIN auth.users u ON r.owner_id = u.id
LEFT JOIN room_access ra ON r.id = ra.room_id AND r.owner_id = ra.user_id
WHERE r.room_code = 'DEFAULT_ROOM';

-- =============================================
-- 6. INSTRUÇÕES DE USO
-- =============================================

SELECT 
    '📋 INSTRUÇÕES PÓS-CORREÇÃO' as instrucoes,
    '
🔧 PASSOS PARA TESTAR:

1. Execute todo este script no Supabase SQL Editor
2. Verifique se a correção foi aplicada (deve mostrar 0 salas sem acesso)
3. No TaskTracker, abra o seletor de salas (botão de salas)
4. A sala DEFAULT_ROOM agora deve aparecer na lista
5. Você deve conseguir selecionar e acessar a sala

🚨 SE AINDA NÃO FUNCIONAR:

1. Faça logout e login novamente no TaskTracker
2. Execute os testes de integração novamente
3. Verifique se o usuário logado corresponde ao owner_id da sala

📊 QUERIES ÚTEIS PARA DEBUG:

-- Ver seu user_id atual:
SELECT auth.uid() as meu_user_id;

-- Ver salas que você deveria ter acesso:
SELECT * FROM rooms WHERE owner_id = auth.uid();

-- Ver seus acessos atuais:
SELECT * FROM room_access WHERE user_id = auth.uid();
    ' as explicacao;

-- =============================================
-- 7. QUERY FINAL DE VALIDAÇÃO
-- =============================================

SELECT 
    '🎯 VALIDAÇÃO FINAL' as resultado,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM rooms r 
            JOIN room_access ra ON r.id = ra.room_id 
            WHERE r.room_code = 'DEFAULT_ROOM' 
            AND ra.user_id = r.owner_id
        ) THEN '✅ CORREÇÃO BEM-SUCEDIDA - Sala DEFAULT_ROOM acessível'
        ELSE '❌ PROBLEMA PERSISTE - Verifique logs e configurações'
    END as status_final,
    NOW() as verificado_em;