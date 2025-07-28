-- =============================================
-- ADICIONAR COLUNA motivoErro NA TABELA tasks
-- Execute no Supabase Dashboard > SQL Editor
-- =============================================

-- 1. Adicionar coluna motivoErro (texto opcional)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS motivo_erro TEXT;

-- 2. Comentário na coluna para documentação
COMMENT ON COLUMN tasks.motivo_erro IS 'Explicação para taxas de erro acima de 20% no tempo gasto vs estimativa';

-- 3. Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name = 'motivo_erro';

-- 4. Teste rápido (opcional - só para verificar)
-- Inserir um registro de teste com motivo_erro
/*
INSERT INTO tasks (
    atividade, 
    epico, 
    status, 
    estimativa, 
    tempo_gasto, 
    taxa_erro, 
    motivo_erro,
    room_id
) VALUES (
    'Teste Motivo Erro',
    'Testes',
    'Done',
    2,
    4,
    100,
    'Complexidade subestimada - primeira implementação',
    (SELECT id FROM rooms LIMIT 1)
);
*/

-- =============================================
-- INFORMAÇÕES
-- =============================================

-- Campo motivoErro é usado quando:
-- - taxa_erro > 20% (diferença entre tempo gasto e estimativa)
-- - Obrigatório no modal de validação de tempo gasto
-- - Salvo como motivo_erro no banco (snake_case)
-- - Convertido para motivoErro no frontend (camelCase)

-- Exemplo de uso:
-- Se estimativa = 2h e tempo_gasto = 4h
-- Então taxa_erro = 100% (dobrou o tempo)
-- Campo motivo_erro deve ser preenchido obrigatoriamente

SELECT 'Coluna motivoErro adicionada com sucesso!' as resultado;