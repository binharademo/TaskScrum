-- =============================================
-- TRIGGER AUTOMÁTICO: ROOM_ACCESS PARA PROPRIETÁRIO
-- Execute este SQL para criar trigger que garante acesso automático
-- =============================================

-- =============================================
-- 1. CRIAR FUNÇÃO DO TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION create_owner_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir acesso automático para o proprietário da sala
    INSERT INTO room_access (room_id, user_id, role, granted_by, created_at)
    VALUES (
        NEW.id,           -- room_id
        NEW.owner_id,     -- user_id (proprietário)
        'admin',          -- role (admin para o proprietário)
        NEW.owner_id,     -- granted_by (concedido por si mesmo)
        NOW()             -- created_at
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 2. CRIAR O TRIGGER
-- =============================================

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_create_owner_access ON rooms;

-- Criar o trigger
CREATE TRIGGER trigger_create_owner_access
    AFTER INSERT ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION create_owner_access();

-- =============================================
-- 3. TESTAR O TRIGGER
-- =============================================

-- Função para testar se o trigger está funcionando
DO $$
DECLARE
    test_room_id UUID;
    test_user_id UUID;
    access_count INTEGER;
BEGIN
    -- Obter um usuário existente para teste
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Criar uma sala de teste
        INSERT INTO rooms (name, description, room_code, owner_id, is_public)
        VALUES ('Teste Trigger', 'Sala criada para testar o trigger', 'TRIGGER_TEST', test_user_id, false)
        RETURNING id INTO test_room_id;
        
        -- Verificar se o acesso foi criado automaticamente
        SELECT COUNT(*) INTO access_count
        FROM room_access 
        WHERE room_id = test_room_id AND user_id = test_user_id;
        
        IF access_count > 0 THEN
            RAISE NOTICE '✅ TRIGGER FUNCIONANDO: Acesso automático criado para sala %', test_room_id;
        ELSE
            RAISE NOTICE '❌ TRIGGER FALHOU: Nenhum acesso criado para sala %', test_room_id;
        END IF;
        
        -- Limpar teste
        DELETE FROM rooms WHERE id = test_room_id;
        
    ELSE
        RAISE NOTICE '⚠️ TESTE IGNORADO: Nenhum usuário encontrado na tabela auth.users';
    END IF;
END;
$$;

-- =============================================
-- 4. VERIFICAR SE O TRIGGER FOI CRIADO
-- =============================================

SELECT 
    '🔧 VERIFICAÇÃO DO TRIGGER' as status,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_create_owner_access'
AND event_object_table = 'rooms';

-- =============================================
-- 5. POLÍTICAS RLS COMPLEMENTARES
-- =============================================

-- Garantir que as políticas RLS estão corretas para room_access
-- (Você pode pular esta parte se as políticas já estão corretas)

-- Política para permitir que usuários vejam seus próprios acessos
DROP POLICY IF EXISTS "Users can view their own room access" ON room_access;
CREATE POLICY "Users can view their own room access" ON room_access
    FOR SELECT USING (auth.uid() = user_id);

-- Política para permitir que proprietários de sala concedam acesso
DROP POLICY IF EXISTS "Room owners can manage access" ON room_access;
CREATE POLICY "Room owners can manage access" ON room_access
    FOR ALL USING (
        auth.uid() IN (
            SELECT owner_id FROM rooms WHERE id = room_id
        )
    );

-- Política para permitir que o trigger insira automaticamente
DROP POLICY IF EXISTS "Auto-insert owner access" ON room_access;
CREATE POLICY "Auto-insert owner access" ON room_access
    FOR INSERT WITH CHECK (
        auth.uid() = user_id  -- Apenas para o próprio usuário
        OR auth.uid() IN (    -- Ou para proprietário da sala
            SELECT owner_id FROM rooms WHERE id = room_id
        )
    );

-- =============================================
-- 6. INSTRUÇÕES FINAIS
-- =============================================

SELECT 
    '📋 INSTRUÇÕES FINAIS' as instrucoes,
    '
✅ TRIGGER INSTALADO COM SUCESSO!

🔄 O QUE ACONTECE AGORA:
• Toda nova sala criada terá acesso automático para o proprietário
• Não é mais necessário criar room_access manualmente
• O código do SupabaseService.createRoom() pode ser simplificado

🧪 PARA TESTAR:
1. Execute os testes de integração novamente
2. Crie uma nova sala pelo TaskTracker
3. A sala deve aparecer automaticamente na lista

⚠️ SALAS EXISTENTES:
• Salas criadas antes deste trigger ainda podem ter o problema
• Execute o script SUPABASE_CORRIGIR_ROOM_ACCESS.sql para corrigir

🗑️ LIMPEZA (SE NECESSÁRIO):
• Para remover o trigger: DROP TRIGGER trigger_create_owner_access ON rooms;
• Para remover a função: DROP FUNCTION create_owner_access();
    ' as explicacao;

-- =============================================
-- 7. LOG FINAL
-- =============================================

SELECT 
    '🎯 INSTALAÇÃO CONCLUÍDA' as resultado,
    'Trigger de acesso automático instalado com sucesso' as mensagem,
    NOW() as instalado_em;