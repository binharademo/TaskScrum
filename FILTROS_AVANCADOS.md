# Filtros Avançados - TaskTracker

## Filtros por Status e Workflow
- **Multi-status**: Selecionar múltiplos status (Backlog + Priorizado)
- **Exclusão**: "Todos exceto Done" ou "Apenas não finalizados"
- **Progresso**: Tarefas com reestimativas alteradas vs. originais

## Filtros por Pessoas e Equipe
- **Desenvolvedor**: Filtrar por pessoa específica ou múltiplas
- **Carga de trabalho**: Desenvolvedores com mais/menos de X horas
- **Disponibilidade**: Tarefas sem desenvolvedor atribuído

## Filtros por Tempo e Estimativas
- **Estimativa**: Intervalos (ex: 1-5h, 5-10h, 10h+)
- **Variação**: Tarefas com grande diferença entre estimativa inicial e atual
- **Tendência**: Tarefas aumentando vs. diminuindo ao longo dos dias
- **Risco**: Tarefas que nunca diminuíram de estimativa

## Filtros por Conteúdo
- **Épico**: Filtrar por épico específico
- **User Story**: Busca por texto nas histórias
- **Atividade**: Busca por palavras-chave nas atividades
- **Prioridade**: Alta, média, baixa

## Filtros Avançados de Burndown
- **Problemáticas**: Tarefas que não seguem o burndown ideal
- **Críticas**: Tarefas que podem impactar o sprint
- **Bloqueadas**: Sem progresso por X dias consecutivos

## Filtros Combinados
- **Preset "Atenção"**: Status Doing + estimativa aumentando
- **Preset "Finalizar"**: Próximas de zero + não Done
- **Preset "Revisar"**: Grandes variações de estimativa

## Implementação Técnica Sugerida

### Interface
- **Painel lateral** ou **modal** com filtros
- **Chips visuais** para filtros ativos
- **Botão "Limpar filtros"**
- **Salvar filtros** como presets

### Funcionalidades
- **Filtros persistentes** (localStorage)
- **Contadores** de resultados
- **Combinação AND/OR** entre filtros
- **Histórico** de filtros aplicados

### Performance
- **Debounce** para buscas de texto
- **Indexação** para filtros rápidos
- **Paginação** para grandes volumes
- **Cache** de resultados filtrados