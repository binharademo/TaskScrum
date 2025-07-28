-- =============================================
-- FORÇAR CRIAÇÃO DA SALA DEFAULT_ROOM
-- Execute se a solução de sessão não resolver
-- =============================================

-- Deletar sala DEFAULT_ROOM existente (se houver problemas)
DELETE FROM tasks WHERE room_id IN (SELECT id FROM rooms WHERE room_code = 'DEFAULT_ROOM');
DELETE FROM room_access WHERE room_id IN (SELECT id FROM rooms WHERE room_code = 'DEFAULT_ROOM');
DELETE FROM rooms WHERE room_code = 'DEFAULT_ROOM';

-- Criar sala DEFAULT_ROOM para seu usuário específico
INSERT INTO rooms (name, description, room_code, owner_id, is_public, created_at, updated_at)
SELECT 
    '🏠 Sala Padrão do Usuário',
    'Sala padrão criada automaticamente para binhara@azuris.com.br. Esta sala é permanente.',
    'DEFAULT_ROOM',
    u.id,
    false,
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email = 'binhara@azuris.com.br';

-- Criar acesso automático
INSERT INTO room_access (room_id, user_id, role, granted_by, created_at)
SELECT 
    r.id,
    u.id,
    'admin',
    u.id,
    NOW()
FROM rooms r, auth.users u
WHERE r.room_code = 'DEFAULT_ROOM' 
AND u.email = 'binhara@azuris.com.br';

-- Criar 6 tarefas de exemplo
INSERT INTO tasks (
    room_id, atividade, epico, user_story, desenvolvedor, 
    sprint, status, prioridade, estimativa, created_by, updated_by
)
SELECT 
    r.id,
    unnest(ARRAY[
        'Implementar sistema de login',
        'Criar dashboard principal', 
        'Desenvolver API REST',
        'Design da interface mobile',
        'Configurar banco de dados',
        'Testes automatizados'
    ]),
    unnest(ARRAY[
        'Sistema de Login',
        'Dashboard Analytics',
        'API REST', 
        'Interface Mobile',
        'Infraestrutura',
        'Qualidade'
    ]),
    unnest(ARRAY[
        'Como usuário, quero fazer login seguro',
        'Como gestor, quero ver métricas em tempo real',
        'Como dev, quero API robusta para integração',
        'Como usuário mobile, quero interface intuitiva', 
        'Como admin, quero banco performático',
        'Como equipe, queremos qualidade garantida'
    ]),
    unnest(ARRAY[
        'João Silva',
        'Maria Santos',
        'Pedro Costa',
        'Ana Oliveira',
        'Carlos Lima',
        'João Silva' 
    ]),
    'Sprint 1',
    unnest(ARRAY[
        'Done',
        'Doing', 
        'Doing',
        'Priorizado',
        'Priorizado',
        'Backlog'
    ]),
    unnest(ARRAY[
        'Alta',
        'Crítica',
        'Alta', 
        'Média',
        'Alta',
        'Baixa'
    ]),
    unnest(ARRAY[8, 13, 21, 5, 8, 3]),
    u.id,
    u.id
FROM rooms r, auth.users u
WHERE r.room_code = 'DEFAULT_ROOM'
AND u.email = 'binhara@azuris.com.br';

-- Verificação final
SELECT 
    '✅ SALA DEFAULT_ROOM CRIADA MANUALMENTE' as resultado,
    r.name,
    r.room_code,
    u.email as proprietario,
    (SELECT COUNT(*) FROM tasks t WHERE t.room_id = r.id) as total_tarefas,
    (SELECT COUNT(*) FROM room_access ra WHERE ra.room_id = r.id) as total_acessos
FROM rooms r
JOIN auth.users u ON r.owner_id = u.id  
WHERE r.room_code = 'DEFAULT_ROOM';