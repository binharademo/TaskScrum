-- =============================================
-- VERIFICAR SUCESSO DOS TESTES DE INTEGRAÇÃO
-- Execute para confirmar se os dados foram persistidos
-- =============================================

-- =============================================
-- 1. VERIFICAR USUÁRIO ATUAL E SUAS SALAS
-- =============================================
SELECT 
    '👤 USUÁRIO ATUAL E SUAS SALAS' as info,
    u.email as usuario,
    r.name as sala_nome,
    r.room_code as sala_codigo,
    ra.role as papel,
    (SELECT COUNT(*) FROM tasks t WHERE t.room_id = r.id) as total_tarefas
FROM auth.users u
JOIN room_access ra ON u.id = ra.user_id  
JOIN rooms r ON ra.room_id = r.id
WHERE u.id = auth.uid()
ORDER BY r.created_at DESC;

-- =============================================
-- 2. DETALHES DA SALA DEFAULT_ROOM
-- =============================================
SELECT 
    '🏠 DETALHES DA SALA DEFAULT_ROOM' as info,
    r.id as room_id,
    r.name as nome,
    r.room_code as codigo,
    u.email as proprietario,
    r.created_at as criada_em,
    (SELECT COUNT(*) FROM tasks t WHERE t.room_id = r.id) as total_tarefas,
    (SELECT COUNT(*) FROM room_access ra WHERE ra.room_id = r.id) as total_usuarios_com_acesso
FROM rooms r
LEFT JOIN auth.users u ON r.owner_id = u.id
WHERE r.room_code = 'DEFAULT_ROOM';

-- =============================================
-- 3. LISTAR TODAS AS TAREFAS DA SALA DEFAULT_ROOM
-- =============================================
SELECT 
    '📋 TAREFAS NA SALA DEFAULT_ROOM' as info,
    t.atividade,
    t.epico,
    t.desenvolvedor,
    t.status,
    t.prioridade,
    t.estimativa,
    t.created_at
FROM tasks t
JOIN rooms r ON t.room_id = r.id
WHERE r.room_code = 'DEFAULT_ROOM'
ORDER BY t.created_at ASC;

-- =============================================
-- 4. CONTADORES POR STATUS
-- =============================================
SELECT 
    '📊 TAREFAS POR STATUS (DEFAULT_ROOM)' as info,
    t.status,
    COUNT(*) as quantidade
FROM tasks t
JOIN rooms r ON t.room_id = r.id
WHERE r.room_code = 'DEFAULT_ROOM'
GROUP BY t.status
ORDER BY quantidade DESC;

-- =============================================
-- 5. CONTADORES POR DESENVOLVEDOR
-- =============================================
SELECT 
    '👥 TAREFAS POR DESENVOLVEDOR (DEFAULT_ROOM)' as info,
    t.desenvolvedor,
    COUNT(*) as quantidade,
    STRING_AGG(t.status, ', ') as status_das_tarefas
FROM tasks t
JOIN rooms r ON t.room_id = r.id
WHERE r.room_code = 'DEFAULT_ROOM'
GROUP BY t.desenvolvedor
ORDER BY quantidade DESC;

-- =============================================
-- 6. VERIFICAR CAMPOS ESPECÍFICOS (motivo_erro, etc.)
-- =============================================
SELECT 
    '🔍 CAMPOS ESPECÍFICOS DAS TAREFAS' as info,
    COUNT(*) as total_tarefas,
    COUNT(t.tempo_gasto) as com_tempo_gasto,
    COUNT(t.taxa_erro) as com_taxa_erro,
    COUNT(t.motivo_erro) as com_motivo_erro,
    COUNT(CASE WHEN t.tempo_gasto_validado = true THEN 1 END) as tempo_validado
FROM tasks t
JOIN rooms r ON t.room_id = r.id
WHERE r.room_code = 'DEFAULT_ROOM';

-- =============================================
-- 7. VERIFICAR TIMESTAMPS RECENTES
-- =============================================
SELECT 
    '⏰ TAREFAS CRIADAS RECENTEMENTE' as info,
    COUNT(*) as tarefas_ultimas_24h,
    MIN(t.created_at) as primeira_criada,
    MAX(t.created_at) as ultima_criada,
    EXTRACT(EPOCH FROM (MAX(t.created_at) - MIN(t.created_at))) / 60 as duracao_criacao_minutos
FROM tasks t
JOIN rooms r ON t.room_id = r.id
WHERE r.room_code = 'DEFAULT_ROOM'
AND t.created_at > NOW() - INTERVAL '24 hours';

-- =============================================
-- 8. VERIFICAR INTEGRIDADE DOS DADOS
-- =============================================
SELECT 
    '✅ VERIFICAÇÃO DE INTEGRIDADE' as info,
    COUNT(*) as total_tarefas,
    COUNT(CASE WHEN t.atividade IS NOT NULL AND t.atividade != '' THEN 1 END) as com_atividade,
    COUNT(CASE WHEN t.room_id IS NOT NULL THEN 1 END) as com_room_id,
    COUNT(CASE WHEN t.created_by IS NOT NULL THEN 1 END) as com_created_by,
    COUNT(CASE WHEN t.estimativa >= 0 THEN 1 END) as com_estimativa_valida
FROM tasks t
JOIN rooms r ON t.room_id = r.id
WHERE r.room_code = 'DEFAULT_ROOM';

-- =============================================
-- 9. RESULTADO FINAL
-- =============================================
SELECT 
    '🎯 RESULTADO FINAL DOS TESTES' as resultado,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM rooms WHERE room_code = 'DEFAULT_ROOM')
            THEN '❌ SALA DEFAULT_ROOM NÃO EXISTE'
        WHEN NOT EXISTS (
            SELECT 1 FROM room_access ra 
            JOIN rooms r ON ra.room_id = r.id 
            WHERE r.room_code = 'DEFAULT_ROOM' AND ra.user_id = auth.uid()
        ) THEN '❌ USUÁRIO SEM ACESSO À SALA'
        WHEN (SELECT COUNT(*) FROM tasks t JOIN rooms r ON t.room_id = r.id WHERE r.room_code = 'DEFAULT_ROOM') = 0
            THEN '❌ NENHUMA TAREFA CRIADA'
        WHEN (SELECT COUNT(*) FROM tasks t JOIN rooms r ON t.room_id = r.id WHERE r.room_code = 'DEFAULT_ROOM') < 5
            THEN '⚠️ POUCAS TAREFAS CRIADAS - Pode haver problema'
        ELSE '✅ TESTES DE INTEGRAÇÃO FUNCIONARAM PERFEITAMENTE!'
    END as status,
    (SELECT COUNT(*) FROM tasks t JOIN rooms r ON t.room_id = r.id WHERE r.room_code = 'DEFAULT_ROOM') as total_tarefas_criadas,
    NOW() as verificado_em;

-- =============================================
-- 10. INSTRUÇÕES PARA O USUÁRIO
-- =============================================
SELECT 
    '📋 PRÓXIMOS PASSOS' as instrucoes,
    '
🎉 SE VOCÊ VÊ DADOS ACIMA, OS TESTES FUNCIONARAM!

✅ DADOS ESPERADOS:
• Usuário: binhara@azuris.com.br
• Sala: DEFAULT_ROOM criada
• Tarefas: Entre 6-24 tarefas criadas
• Acesso: Você deve ter papel "admin"

🖥️ AGORA TESTE NA INTERFACE:
1. Volte ao TaskTracker (http://localhost:3000)
2. Clique no seletor de salas
3. Você deve ver "DEFAULT_ROOM" na lista
4. Selecione a sala e veja as tarefas

🐛 SE NÃO FUNCIONAR:
• Faça logout e login novamente
• Limpe cache do navegador
• Execute os testes novamente
    ' as detalhes;