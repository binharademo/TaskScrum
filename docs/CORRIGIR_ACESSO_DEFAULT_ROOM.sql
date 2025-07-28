-- =============================================
-- CORREÇÃO: ACESSO À SALA DEFAULT_ROOM
-- Execute se o debug mostrar que você não tem acesso
-- =============================================

-- Inserir acesso automático para sala DEFAULT_ROOM
INSERT INTO room_access (room_id, user_id, role, granted_by, created_at)
SELECT 
    r.id,
    auth.uid(),
    'admin',
    auth.uid(),
    NOW()
FROM rooms r
WHERE r.room_code = 'DEFAULT_ROOM'
AND auth.uid() IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM room_access ra 
    WHERE ra.room_id = r.id AND ra.user_id = auth.uid()
);

-- Verificar se foi corrigido
SELECT 
    '✅ CORREÇÃO APLICADA' as resultado,
    r.name,
    r.room_code,
    ra.role,
    u.email
FROM rooms r
JOIN room_access ra ON r.id = ra.room_id
LEFT JOIN auth.users u ON ra.user_id = u.id
WHERE r.room_code = 'DEFAULT_ROOM' 
AND ra.user_id = auth.uid();