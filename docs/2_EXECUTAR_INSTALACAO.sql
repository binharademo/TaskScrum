-- =============================================
-- TASKTRACKER SUPABASE SETUP COMPLETO
-- EXECUTE ESTE SEGUNDO NO SUPABASE SQL EDITOR
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. ROOMS TABLE
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
-- 2. ROOM_ACCESS TABLE (SEM updated_at!)
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
-- 3. TASKS TABLE (Todos os campos necessários)
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
-- 4. USER_SETTINGS TABLE
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
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

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
-- 7. TRIGGER CRÍTICO: AUTO-CREATE OWNER ACCESS
-- =============================================
CREATE OR REPLACE FUNCTION create_owner_access()
RETURNS TRIGGER AS $$
BEGIN
    -- CRÍTICO: Inserir acesso automático para o proprietário da sala
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

CREATE TRIGGER trigger_create_owner_access
    AFTER INSERT ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION create_owner_access();

-- =============================================
-- 8. ROW LEVEL SECURITY (Simplificado)
-- =============================================
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

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
-- FINALIZAÇÃO
-- =============================================
SELECT '🎉 INSTALAÇÃO COMPLETA!' as titulo;
SELECT 'Execute agora: 3_EXECUTAR_VERIFICACAO.sql' as proximo_passo;