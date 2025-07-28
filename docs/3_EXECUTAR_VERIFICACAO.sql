-- =============================================
-- VERIFICAÇÃO COMPLETA DA INSTALAÇÃO
-- EXECUTE ESTE TERCEIRO NO SUPABASE SQL EDITOR
-- =============================================

-- =============================================
-- 1. VERIFICAR TABELAS CRIADAS
-- =============================================
SELECT 
    '📋 TABELAS CRIADAS' as check_type,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('rooms', 'room_access', 'tasks', 'user_settings')
ORDER BY table_name;

-- =============================================
-- 2. VERIFICAR CAMPOS CRÍTICOS DA TABELA TASKS
-- =============================================
SELECT 
    '🔍 CAMPOS CRÍTICOS TASKS' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('motivo_erro', 'tempo_gasto', 'taxa_erro', 'tempo_gasto_validado')
ORDER BY column_name;

-- =============================================
-- 3. VERIFICAR ESTRUTURA DA ROOM_ACCESS
-- =============================================
SELECT 
    '🔐 ESTRUTURA ROOM_ACCESS (SEM updated_at)' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'room_access'
ORDER BY ordinal_position;

-- =============================================
-- 4. VERIFICAR TRIGGERS INSTALADOS
-- =============================================
SELECT 
    '🔧 TRIGGERS INSTALADOS' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    event_object_table
FROM information_schema.triggers 
WHERE event_object_table IN ('rooms', 'tasks', 'user_settings')
ORDER BY event_object_table, trigger_name;

-- =============================================
-- 5. TESTE AUTOMÁTICO DO TRIGGER CRÍTICO
-- =============================================
DO $$
DECLARE
    test_room_id UUID;
    test_user_id UUID;
    access_count INTEGER;
BEGIN
    -- Obter um usuário existente para teste (se houver)
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Criar uma sala de teste
        INSERT INTO rooms (name, description, room_code, owner_id, is_public)
        VALUES ('🧪 Teste Trigger', 'Sala para testar trigger automático', 'TRIGGER_TEST', test_user_id, false)
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
        RAISE NOTICE '⚠️ TESTE DE TRIGGER IGNORADO: Nenhum usuário encontrado para teste';
    END IF;
END;
$$;

-- =============================================
-- 6. VALIDAÇÃO FINAL
-- =============================================
SELECT 
    '🎯 RESULTADO FINAL' as resultado,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_create_owner_access')
        THEN '✅ SISTEMA INSTALADO CORRETAMENTE - Pronto para uso!'
        ELSE '❌ PROBLEMA NA INSTALAÇÃO - Execute novamente o script'
    END as status,
    NOW() as instalado_em;

-- =============================================
-- 7. PRÓXIMOS PASSOS
-- =============================================
SELECT 
    '📋 PRÓXIMOS PASSOS' as instrucoes,
    '
🧪 AGORA TESTE O SISTEMA:

1. Acesse: http://localhost:3000
2. Faça login ou cadastre-se
3. Execute testes de integração (botão 🧪)
4. Deve mostrar 10/10 testes passando
5. Verifique se sala DEFAULT_ROOM aparece na lista
6. Teste criar novas tarefas e arrastar

Se tudo funcionar, sua integração Supabase está perfeita!
    ' as detalhes;