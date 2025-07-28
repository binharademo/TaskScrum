-- =============================================
-- SCRIPT DE LIMPEZA COMPLETA - TASKTRACKER
-- EXECUTE ESTE PRIMEIRO NO SUPABASE SQL EDITOR
-- =============================================

-- AVISO: Este script remove TODOS os dados do TaskTracker

-- Remover todas as policies (RLS)
DROP POLICY IF EXISTS "Allow authenticated users" ON rooms;
DROP POLICY IF EXISTS "Allow authenticated users" ON room_access;
DROP POLICY IF EXISTS "Allow authenticated users" ON tasks;
DROP POLICY IF EXISTS "Allow authenticated users" ON user_settings;

-- Remover policies antigas (se existirem)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON rooms;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON rooms;
DROP POLICY IF EXISTS "Users can view rooms they have access to" ON rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
DROP POLICY IF EXISTS "Room owners can update their rooms" ON rooms;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON room_access;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON room_access;
DROP POLICY IF EXISTS "Users can view room access they're part of" ON room_access;
DROP POLICY IF EXISTS "Room owners/admins can manage access" ON room_access;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON tasks;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON tasks;
DROP POLICY IF EXISTS "Users can view tasks in their rooms" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks in their rooms" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks in their rooms" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their rooms" ON tasks;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_settings;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON user_settings;
DROP POLICY IF EXISTS "Users can manage their own settings" ON user_settings;

-- Remover triggers
DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
DROP TRIGGER IF EXISTS generate_room_code_trigger ON rooms;
DROP TRIGGER IF EXISTS auto_create_owner_access_trigger ON rooms;
DROP TRIGGER IF EXISTS trigger_create_owner_access ON rooms;

-- Remover funções
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS generate_room_code();
DROP FUNCTION IF EXISTS auto_create_owner_access();
DROP FUNCTION IF EXISTS create_owner_access();

-- Remover tabelas (ordem importa devido às foreign keys)
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS room_access CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

-- Verificar se tudo foi removido
SELECT '✅ TaskTracker database cleaned successfully!' as status;
SELECT 'Agora execute: 2_EXECUTAR_INSTALACAO.sql' as proximo_passo;