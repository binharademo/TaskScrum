# 🚀 CONFIGURAÇÃO COMPLETA DO SUPABASE PARA TASKTRACKER

## 📋 PASSO A PASSO DETALHADO

### 1️⃣ CRIAR PROJETO SUPABASE

1. **Acesse**: https://supabase.com/dashboard
2. **Clique**: "New Project"
3. **Configure**:
   - **Organization**: Selecione sua organização
   - **Name**: `TaskTracker` (ou nome de sua escolha)
   - **Database Password**: **IMPORTANTE** - Anote esta senha!
   - **Region**: Escolha a região mais próxima
   - **Pricing Plan**: Free (para desenvolvimento)
4. **Aguarde**: 2-3 minutos para criação do projeto

### 2️⃣ OBTER CREDENCIAIS

Após criação do projeto:

1. **No Dashboard do projeto**, vá em **Settings** > **API**
2. **Copie as credenciais**:
   - **Project URL**: https://aourlpxdsbcjlaeiiyvp.supabase.co
   - **anon/public key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvdXJscHhkc2JjamxhZWlpeXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NTQzNDgsImV4cCI6MjA2OTIzMDM0OH0.f45_AYO0rkr3-fZBrADRgfQ8rn4MrIsmcwsM98xG-5g

### 3️⃣ CONFIGURAR ARQUIVO .env.local

Crie/edite o arquivo `.env.local` na raiz do projeto:

```env
# Supabase Configuration - TaskTracker Multi-Room
REACT_APP_SUPABASE_URL=https://aourlpxdsbcjlaeiiyvp.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvdXJscHhkc2JjamxhZWlpeXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NTQzNDgsImV4cCI6MjA2OTIzMDM0OH0.f45_AYO0rkr3-fZBrADRgfQ8rn4MrIsmcwsM98xG-5g

# Google Sheets (existing - optional)
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_GOOGLE_API_KEY=your-google-api-key

# Project settings
REACT_APP_PROJECT_NAME=TaskTracker
REACT_APP_SYNC_INTERVAL=2
```

**IMPORTANTE**: Substitua `SEU_PROJECT_ID` e `sua_anon_key_aqui` pelos valores reais!

### 4️⃣ EXECUTAR SCRIPT SQL

1. **No Dashboard do Supabase**, vá em **SQL Editor**
2. **Clique** em "New Query"
3. **Cole e execute** o script completo abaixo:

```sql
-- =============================================
-- TASKTRACKER SUPABASE SETUP COMPLETO
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. ROOMS TABLE (Salas de trabalho)
-- =============================================
CREATE TABLE IF NOT EXISTS rooms (
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
CREATE TABLE IF NOT EXISTS room_access (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- owner, admin, member, viewer
    granted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(room_id, user_id)
);

-- =============================================
-- 3. TASKS TABLE (Tarefas principais)
-- =============================================
CREATE TABLE IF NOT EXISTS tasks (
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
CREATE TABLE IF NOT EXISTS user_settings (
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
DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
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

DROP TRIGGER IF EXISTS generate_room_code_trigger ON rooms;
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

DROP TRIGGER IF EXISTS auto_create_owner_access_trigger ON rooms;
CREATE TRIGGER auto_create_owner_access_trigger AFTER INSERT ON rooms
    FOR EACH ROW EXECUTE FUNCTION auto_create_owner_access();

-- =============================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ROOMS
DROP POLICY IF EXISTS "Users can view rooms they have access to" ON rooms;
CREATE POLICY "Users can view rooms they have access to" ON rooms
    FOR SELECT USING (
        id IN (
            SELECT room_id FROM room_access 
            WHERE user_id = auth.uid()
        )
        OR is_public = true
    );

DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
CREATE POLICY "Users can create rooms" ON rooms
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Room owners can update their rooms" ON rooms;
CREATE POLICY "Room owners can update their rooms" ON rooms
    FOR UPDATE USING (
        id IN (
            SELECT room_id FROM room_access 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- RLS Policies for ROOM_ACCESS
DROP POLICY IF EXISTS "Users can view room access they're part of" ON room_access;
CREATE POLICY "Users can view room access they're part of" ON room_access
    FOR SELECT USING (
        room_id IN (
            SELECT room_id FROM room_access 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Room owners/admins can manage access" ON room_access;
CREATE POLICY "Room owners/admins can manage access" ON room_access
    FOR ALL USING (
        room_id IN (
            SELECT room_id FROM room_access 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- RLS Policies for TASKS
DROP POLICY IF EXISTS "Users can view tasks in their rooms" ON tasks;
CREATE POLICY "Users can view tasks in their rooms" ON tasks
    FOR SELECT USING (
        room_id IN (
            SELECT room_id FROM room_access 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create tasks in their rooms" ON tasks;
CREATE POLICY "Users can create tasks in their rooms" ON tasks
    FOR INSERT WITH CHECK (
        room_id IN (
            SELECT room_id FROM room_access 
            WHERE user_id = auth.uid()
        )
        AND auth.uid() = created_by
    );

DROP POLICY IF EXISTS "Users can update tasks in their rooms" ON tasks;
CREATE POLICY "Users can update tasks in their rooms" ON tasks
    FOR UPDATE USING (
        room_id IN (
            SELECT room_id FROM room_access 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete tasks in their rooms" ON tasks;
CREATE POLICY "Users can delete tasks in their rooms" ON tasks
    FOR DELETE USING (
        room_id IN (
            SELECT room_id FROM room_access 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for USER_SETTINGS
DROP POLICY IF EXISTS "Users can manage their own settings" ON user_settings;
CREATE POLICY "Users can manage their own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 9. INDEXES (Performance)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_rooms_owner_id ON rooms(owner_id);
CREATE INDEX IF NOT EXISTS idx_rooms_room_code ON rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_room_access_room_id ON room_access(room_id);
CREATE INDEX IF NOT EXISTS idx_room_access_user_id ON room_access(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_room_id ON tasks(room_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_desenvolvedor ON tasks(desenvolvedor);
CREATE INDEX IF NOT EXISTS idx_tasks_sprint ON tasks(sprint);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_room ON user_settings(user_id, room_id);

-- =============================================
-- 10. SAMPLE DATA (OPCIONAL - PARA TESTES)
-- =============================================
-- Execute apenas se quiser dados de exemplo

/*
-- Criar sala de exemplo (substitua pelo seu user ID real)
INSERT INTO rooms (name, description, room_code, is_public, owner_id) 
VALUES (
    'Sala de Testes', 
    'Sala para testar o TaskTracker', 
    'TEST2024', 
    true, 
    auth.uid()  -- Isso vai funcionar apenas se executado quando logado
);

-- Tarefas de exemplo serão criadas automaticamente pelo aplicativo
*/

-- =============================================
-- FINALIZAÇÃO
-- =============================================
SELECT 'TaskTracker Supabase setup completed successfully!' as status;
```

### 5️⃣ VERIFICAR INSTALAÇÃO

1. **Execute** o script SQL acima
2. **Reinicie** o servidor TaskTracker (`npm start`)
3. **Clique** no botão de testes (🧪) no cabeçalho
4. **Execute** os testes de integração
5. **Verifique** se todos passam

### 6️⃣ PRIMEIRO USO

1. **Cadastre** um usuário usando o botão 📝 no cabeçalho
2. **Faça login** usando o botão 🔐
3. **Execute** os testes novamente
4. **Use** o botão 📦 para migrar dados locais (se houver)

## 🔧 TROUBLESHOOTING

### ❌ "Supabase connection failed"
- Verifique se as credenciais em `.env.local` estão corretas
- Confirme se o projeto existe no Supabase Dashboard
- Teste a URL do projeto no navegador

### ❌ "relation 'rooms' does not exist"
- Execute o script SQL completo no SQL Editor
- Verifique se todas as tabelas foram criadas
- Use o teste "📋 Verificar Estrutura das Tabelas"

### ❌ "new row violates row-level security policy"
- Certifique-se de estar logado antes de testar
- Verifique se o RLS foi aplicado corretamente
- Teste com usuário proprietário da sala

## 📞 SUPORTE

Se persistirem problemas:
1. Abra o console do navegador (F12)
2. Execute os testes de integração
3. Compartilhe os logs detalhados
4. Verifique a aba Network para erros HTTP

---
**Status**: Este setup cria um ambiente Supabase completo para TaskTracker com multi-room, RLS e todas as funcionalidades.