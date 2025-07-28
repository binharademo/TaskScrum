-- =============================================
-- TASKTRACKER SUPABASE SETUP COMPLETO - VERSÃO ATUALIZADA
-- INCLUI: Correções dos testes de integração (campos motivoErro, etc.)
-- Execute este script APÓS o script de limpeza se necessário
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. ROOMS TABLE (Salas de trabalho)
-- =============================================
CREATE TABLE rooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    room_code VARCHAR(20) UNIQUE NOT NULL,
    is_public BOOLEAN DEFAULT false,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================
-- 2. ROOM_ACCESS TABLE (Controle de acesso)
-- =============================================
CREATE TABLE room_access (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    granted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(room_id, user_id)
);

-- =============================================
-- 3. TASKS TABLE (Tarefas principais)
-- =============================================
CREATE TABLE tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    
    -- Campos principais TaskTracker
    atividade TEXT NOT NULL,
    epico VARCHAR(255),
    user_story TEXT,
    detalhamento TEXT,
    desenvolvedor VARCHAR(255),
    sprint VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Backlog',
    prioridade VARCHAR(50) DEFAULT 'Média',
    
    -- Estimativas e tempo
    estimativa DECIMAL(5,2) DEFAULT 0,
    reestimativas JSONB DEFAULT '[]',
    tempo_gasto DECIMAL(5,2),
    taxa_erro DECIMAL(5,2),
    tempo_gasto_validado BOOLEAN DEFAULT false,
    motivo_erro TEXT,
    
    -- Campos complementares
    tipo_atividade VARCHAR(100),
    tamanho_story VARCHAR(10),
    tela VARCHAR(255),
    observacoes TEXT,
    horas_medidas DECIMAL(5,2) DEFAULT 0,
    
    -- Metadados
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================
-- 4. USER_SETTINGS TABLE (Configurações por usuário)
-- =============================================
CREATE TABLE user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, room_id, setting_key)
);

-- =============================================
-- 5. TRIGGERS (Auto-update timestamps)
-- =============================================

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for all tables
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 6. AUTO-GENERATE ROOM CODE
-- =============================================
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.room_code IS NULL OR NEW.room_code = '' THEN
        NEW.room_code := UPPER(LEFT(MD5(RANDOM()::text), 8));
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_room_code_trigger BEFORE INSERT ON rooms
    FOR EACH ROW EXECUTE FUNCTION generate_room_code();

-- =============================================
-- 7. AUTO-CREATE OWNER ACCESS
-- =============================================
CREATE OR REPLACE FUNCTION auto_create_owner_access()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO room_access (room_id, user_id, role, granted_by)
    VALUES (NEW.id, NEW.owner_id, 'owner', NEW.owner_id);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER auto_create_owner_access_trigger AFTER INSERT ON rooms
    FOR EACH ROW EXECUTE FUNCTION auto_create_owner_access();

-- =============================================
-- 8. ROW LEVEL SECURITY (RLS) - SIMPLIFICADO
-- =============================================

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies simples para funcionar
CREATE POLICY "Allow authenticated users" ON rooms FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users" ON room_access FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users" ON tasks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users" ON user_settings FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- 9. INDEXES (Performance)
-- =============================================
CREATE INDEX idx_rooms_owner_id ON rooms(owner_id);
CREATE INDEX idx_rooms_room_code ON rooms(room_code);
CREATE INDEX idx_room_access_room_id ON room_access(room_id);
CREATE INDEX idx_room_access_user_id ON room_access(user_id);
CREATE INDEX idx_tasks_room_id ON tasks(room_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_desenvolvedor ON tasks(desenvolvedor);
CREATE INDEX idx_tasks_sprint ON tasks(sprint);
CREATE INDEX idx_user_settings_user_room ON user_settings(user_id, room_id);

-- =============================================
-- FINALIZAÇÃO E VERIFICAÇÃO
-- =============================================

-- Verificar estrutura das tabelas criadas
SELECT 'TaskTracker Supabase setup completed successfully - UPDATED VERSION!' as status;

-- Verificar se todas as colunas importantes existem
SELECT 
    'Verificação da tabela tasks' as check_type,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'tasks';

-- Listar colunas específicas importantes para verificação
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('motivo_erro', 'tempo_gasto', 'taxa_erro', 'tempo_gasto_validado')
ORDER BY column_name;

-- =============================================
-- PRÓXIMOS PASSOS
-- =============================================

-- ✅ INSTALAÇÃO COMPLETA!
-- 1. Todas as tabelas foram criadas com campos atualizados
-- 2. Triggers e RLS estão configurados
-- 3. Campo motivo_erro foi incluído (correção dos testes)
-- 
-- 🧪 PARA TESTAR:
-- 1. Acesse http://localhost:3000
-- 2. Faça login com os botões 📝 ou 🔐
-- 3. Clique no botão 🧪 para executar testes de integração
-- 4. Deve mostrar 10/10 testes passando
-- 
-- 🎯 CAMPOS ADICIONADOS NESTA VERSÃO:
-- • tempo_gasto: DECIMAL(5,2) - Tempo real gasto na tarefa
-- • taxa_erro: DECIMAL(5,2) - Percentual de erro da estimativa  
-- • tempo_gasto_validado: BOOLEAN - Flag se tempo foi validado
-- • motivo_erro: TEXT - Explicação obrigatória para erros > 20%

SELECT 'Sistema pronto para uso! Execute os testes de integração para verificar.' as final_message;