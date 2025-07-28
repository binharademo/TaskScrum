-- ===============================================
-- TASKTRACKER SUPABASE DATABASE SETUP
-- ===============================================
-- Execute this script in Supabase SQL Editor
-- Order: Tables → RLS → Policies → Functions → Triggers

-- ===============================================
-- FASE 2: ESTRUTURA DE DADOS
-- ===============================================

-- 2.1 Tabela: rooms
-- Sala onde ficam as tarefas, pode ser compartilhada
CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  room_code text UNIQUE NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indices para performance
CREATE INDEX idx_rooms_owner ON rooms(owner_id);
CREATE INDEX idx_rooms_code ON rooms(room_code);
CREATE INDEX idx_rooms_created ON rooms(created_at DESC);

-- 2.2 Tabela: room_access  
-- Controla quem tem acesso a cada sala
CREATE TABLE room_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  granted_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(room_id, user_id)
);

-- Índices para queries de acesso
CREATE INDEX idx_room_access_user ON room_access(user_id);
CREATE INDEX idx_room_access_room ON room_access(room_id);
CREATE INDEX idx_room_access_role ON room_access(room_id, role);

-- 2.3 Tabela: tasks (adaptada do TaskTracker atual)
-- Todas as tarefas ficam agrupadas por sala
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  
  -- Campos TaskTracker existentes (compatibilidade total)
  original_id integer,
  atividade text,
  user_story text,
  epico text,
  desenvolvedor text,
  sprint text,
  status text DEFAULT 'Backlog' CHECK (status IN ('Backlog', 'Priorizado', 'Doing', 'Done')),
  prioridade text DEFAULT 'Média' CHECK (prioridade IN ('Baixa', 'Média', 'Alta', 'Crítica')),
  
  -- Campos numéricos
  estimativa numeric DEFAULT 0,
  tempo_gasto numeric,
  taxa_erro numeric,
  
  -- Arrays e objetos (mantém compatibilidade)
  reestimativas jsonb DEFAULT '[]',
  
  -- Campos opcionais
  detalhamento text,
  tipo_atividade text,
  tamanho_story text,
  tela text,
  observacoes text,
  motivo_erro text,
  
  -- Flags de controle
  tempo_gasto_validado boolean DEFAULT false,
  
  -- Auditoria
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Índices para performance das queries mais comuns
CREATE INDEX idx_tasks_room ON tasks(room_id);
CREATE INDEX idx_tasks_status ON tasks(room_id, status);
CREATE INDEX idx_tasks_sprint ON tasks(room_id, sprint);
CREATE INDEX idx_tasks_dev ON tasks(room_id, desenvolvedor);
CREATE INDEX idx_tasks_epico ON tasks(room_id, epico);
CREATE INDEX idx_tasks_created ON tasks(room_id, created_at DESC);

-- 2.4 Tabela: user_settings
-- Configurações por usuário por sala (WIP limits, preferências, etc)
CREATE TABLE user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  setting_key text NOT NULL,
  setting_value jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id, room_id, setting_key)
);

-- Índice para queries de configuração
CREATE INDEX idx_settings_user_room ON user_settings(user_id, room_id);
CREATE INDEX idx_settings_key ON user_settings(setting_key);

-- ===============================================
-- FASE 3: POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ===============================================

-- 3.1 Habilitar RLS em todas as tabelas
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 3.2 Políticas para rooms
-- Usuários podem ver salas que possuem ou têm acesso
CREATE POLICY "Users can view accessible rooms" ON rooms
  FOR SELECT
  USING (
    owner_id = auth.uid() OR
    is_public = true OR
    id IN (
      SELECT room_id FROM room_access 
      WHERE user_id = auth.uid()
    )
  );

-- Apenas donos podem criar/atualizar suas salas
CREATE POLICY "Users can create their own rooms" ON rooms
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Room owners can update their rooms" ON rooms
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Apenas donos podem deletar suas salas
CREATE POLICY "Room owners can delete their rooms" ON rooms
  FOR DELETE
  USING (owner_id = auth.uid());

-- 3.3 Políticas para room_access
-- Ver acessos das salas que tem permissão
CREATE POLICY "Users can view room access" ON room_access
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    room_id IN (
      SELECT id FROM rooms WHERE owner_id = auth.uid()
    ) OR
    room_id IN (
      SELECT room_id FROM room_access 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Donos e admins da sala podem gerenciar acessos
CREATE POLICY "Room owners and admins can manage access" ON room_access
  FOR ALL
  USING (
    room_id IN (
      SELECT id FROM rooms WHERE owner_id = auth.uid()
    ) OR
    room_id IN (
      SELECT room_id FROM room_access 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- 3.4 Políticas para tasks
-- Ver tasks das salas que tem acesso
CREATE POLICY "Users can view accessible tasks" ON tasks
  FOR SELECT
  USING (
    room_id IN (
      SELECT rooms.id FROM rooms
      LEFT JOIN room_access ON rooms.id = room_access.room_id
      WHERE rooms.owner_id = auth.uid() 
         OR room_access.user_id = auth.uid()
         OR rooms.is_public = true
    )
  );

-- Criar tasks nas salas que tem acesso de membro+
CREATE POLICY "Users can create tasks in accessible rooms" ON tasks
  FOR INSERT
  WITH CHECK (
    room_id IN (
      SELECT rooms.id FROM rooms
      LEFT JOIN room_access ON rooms.id = room_access.room_id
      WHERE rooms.owner_id = auth.uid() 
         OR (room_access.user_id = auth.uid() AND room_access.role IN ('owner', 'admin', 'member'))
    )
  );

-- Editar tasks nas salas que tem acesso de membro+
CREATE POLICY "Users can update tasks in accessible rooms" ON tasks
  FOR UPDATE
  USING (
    room_id IN (
      SELECT rooms.id FROM rooms
      LEFT JOIN room_access ON rooms.id = room_access.room_id
      WHERE rooms.owner_id = auth.uid() 
         OR (room_access.user_id = auth.uid() AND room_access.role IN ('owner', 'admin', 'member'))
    )
  );

-- Deletar tasks: apenas donos e admins
CREATE POLICY "Room owners and admins can delete tasks" ON tasks
  FOR DELETE
  USING (
    room_id IN (
      SELECT rooms.id FROM rooms
      LEFT JOIN room_access ON rooms.id = room_access.room_id
      WHERE rooms.owner_id = auth.uid() 
         OR (room_access.user_id = auth.uid() AND room_access.role IN ('owner', 'admin'))
    )
  );

-- 3.5 Políticas para user_settings
-- Usuários podem gerenciar suas próprias configurações
CREATE POLICY "Users can manage their settings" ON user_settings
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ===============================================
-- FASE 4: FUNCTIONS E TRIGGERS
-- ===============================================

-- 4.1 Function: Gerar room_code único
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS text AS $$
DECLARE
  new_code text;
  exists_check boolean;
BEGIN
  LOOP
    -- Gerar código de 8 caracteres aleatório
    new_code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM rooms WHERE room_code = new_code) INTO exists_check;
    
    -- Se não existe, usar este código
    IF NOT exists_check THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- 4.2 Trigger: Auto room_code e updated_at para rooms
CREATE OR REPLACE FUNCTION set_room_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Gerar room_code se não fornecido
  IF NEW.room_code IS NULL OR NEW.room_code = '' THEN
    NEW.room_code := generate_room_code();
  END IF;
  
  -- Garantir que room_code é único (double-check)
  WHILE EXISTS(SELECT 1 FROM rooms WHERE room_code = NEW.room_code AND id != COALESCE(NEW.id, gen_random_uuid())) LOOP
    NEW.room_code := generate_room_code();
  END LOOP;
  
  -- Set updated_at
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_room_defaults
  BEFORE INSERT OR UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION set_room_defaults();

-- 4.3 Trigger: Adicionar dono à room_access automaticamente
CREATE OR REPLACE FUNCTION add_owner_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir o dono como owner na tabela de acesso
  INSERT INTO room_access (room_id, user_id, role, granted_by)
  VALUES (NEW.id, NEW.owner_id, 'owner', NEW.owner_id)
  ON CONFLICT (room_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_owner_access
  AFTER INSERT ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION add_owner_access();

-- 4.4 Trigger: Updated_at automático para todas as tabelas
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de updated_at
CREATE TRIGGER trigger_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 4.5 Function: Verificar acesso à sala
CREATE OR REPLACE FUNCTION user_has_room_access(room_uuid uuid, min_role text DEFAULT 'viewer')
RETURNS boolean AS $$
DECLARE
  user_uuid uuid := auth.uid();
  user_role text;
  is_owner boolean;
BEGIN
  -- Se não está autenticado, sem acesso
  IF user_uuid IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar se é dono da sala
  SELECT owner_id = user_uuid INTO is_owner
  FROM rooms WHERE id = room_uuid;
  
  IF is_owner THEN
    RETURN true;
  END IF;
  
  -- Verificar acesso explícito
  SELECT role INTO user_role
  FROM room_access 
  WHERE room_id = room_uuid AND user_id = user_uuid;
  
  -- Se não tem acesso explícito, verificar se sala é pública
  IF user_role IS NULL THEN
    SELECT is_public INTO is_owner -- reutilizando variável
    FROM rooms WHERE id = room_uuid;
    
    IF is_owner THEN
      user_role := 'viewer';
    END IF;
  END IF;
  
  -- Verificar se o role é suficiente
  RETURN CASE 
    WHEN min_role = 'viewer' THEN user_role IN ('viewer', 'member', 'admin', 'owner')
    WHEN min_role = 'member' THEN user_role IN ('member', 'admin', 'owner')
    WHEN min_role = 'admin' THEN user_role IN ('admin', 'owner')
    WHEN min_role = 'owner' THEN user_role = 'owner'
    ELSE false
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- FASE 5: VIEWS ÚTEIS (OPCIONAL)
-- ===============================================

-- 5.1 View: Rooms com informações de acesso do usuário atual
CREATE OR REPLACE VIEW user_rooms AS
SELECT 
  r.*,
  COALESCE(ra.role, CASE WHEN r.is_public THEN 'viewer' ELSE NULL END) as user_role,
  (r.owner_id = auth.uid()) as is_owner,
  (SELECT COUNT(*) FROM tasks WHERE room_id = r.id) as task_count,
  (SELECT COUNT(*) FROM room_access WHERE room_id = r.id) as member_count
FROM rooms r
LEFT JOIN room_access ra ON r.id = ra.room_id AND ra.user_id = auth.uid()
WHERE 
  r.owner_id = auth.uid() OR
  ra.user_id = auth.uid() OR
  r.is_public = true;

-- 5.2 View: Estatísticas por sala
CREATE OR REPLACE VIEW room_stats AS
SELECT 
  r.id as room_id,
  r.name as room_name,
  r.room_code,
  COUNT(t.id) as total_tasks,
  COUNT(CASE WHEN t.status = 'Done' THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN t.status = 'Doing' THEN 1 END) as in_progress_tasks,
  COUNT(CASE WHEN t.status IN ('Backlog', 'Priorizado') THEN 1 END) as todo_tasks,
  COALESCE(SUM(t.estimativa), 0) as total_estimated_hours,
  COALESCE(SUM(t.tempo_gasto), 0) as total_spent_hours,
  COUNT(DISTINCT t.desenvolvedor) as developer_count,
  COUNT(DISTINCT t.sprint) as sprint_count,
  MAX(t.updated_at) as last_activity
FROM rooms r
LEFT JOIN tasks t ON r.id = t.room_id
GROUP BY r.id, r.name, r.room_code;

-- ===============================================
-- DADOS INICIAIS (OPCIONAL)
-- ===============================================

-- Comentar/descomentar conforme necessário

-- Inserir configurações padrão
-- INSERT INTO user_settings (user_id, room_id, setting_key, setting_value)
-- SELECT 
--   auth.uid(),
--   id,
--   'wip_limits',
--   '{"Backlog": null, "Priorizado": 10, "Doing": 5, "Done": null}'::jsonb
-- FROM rooms WHERE owner_id = auth.uid()
-- ON CONFLICT (user_id, room_id, setting_key) DO NOTHING;

-- ===============================================
-- VERIFICAÇÕES FINAIS
-- ===============================================

-- Verificar se todas as tabelas foram criadas
SELECT 
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE tablename IN ('rooms', 'room_access', 'tasks', 'user_settings')
ORDER BY tablename;

-- Verificar RLS habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('rooms', 'room_access', 'tasks', 'user_settings')
ORDER BY tablename;

-- Contar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('rooms', 'room_access', 'tasks', 'user_settings')
ORDER BY tablename, policyname;

-- ===============================================
-- SCRIPT COMPLETO - PRONTO PARA EXECUÇÃO
-- ===============================================
-- 
-- INSTRUÇÕES:
-- 1. Faça login no Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole este script completo
-- 4. Execute (pode demorar 30-60 segundos)
-- 5. Verifique se todas as verificações finais retornam dados
-- 
-- COMPATIBILIDADE:
-- - ✅ Todos os campos do TaskTracker atual
-- - ✅ Arrays de reestimativas (jsonb)
-- - ✅ Sistema de salas multi-tenant
-- - ✅ Compartilhamento seguro via room_code
-- - ✅ Controle de acesso granular (owner/admin/member/viewer)
-- - ✅ RLS para isolamento de dados
-- - ✅ Triggers para automação
-- - ✅ Índices para performance
--