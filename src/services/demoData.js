// Dados de demonstração completos para o TaskTracker

export const generateDemoData = () => {
  const developers = ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira', 'Carlos Lima'];
  const epics = ['Sistema de Login', 'Dashboard Analytics', 'API REST', 'Interface Mobile', 'Relatórios'];
  const priorities = ['Baixa', 'Média', 'Alta', 'Crítica'];
  const statuses = ['Backlog', 'Priorizado', 'Doing', 'Done'];
  
  const demoTasks = [
    // Sistema de Login
    {
      id: 'demo-task-1',
      originalId: 1,
      epico: 'Sistema de Login',
      userStory: 'Como usuário, quero fazer login no sistema para acessar minhas informações',
      atividade: 'Implementar tela de login',
      detalhamento: 'Criar componente de login com validação de email e senha',
      desenvolvedor: 'João Silva',
      sprint: 'Sprint 1',
      status: 'Done',
      prioridade: 'Alta',
      estimativa: 8,
      reestimativas: [8, 7, 6, 5, 4, 3, 2, 1, 0, 0],
      tempoGasto: 6,
      taxaErro: -25,
      tempoGastoValidado: true,
      motivoErro: null,
      observacoes: 'Implementação concluída com sucesso',
      dataCriacao: '2025-01-15T09:00:00.000Z',
      dataAtualizacao: '2025-01-18T16:30:00.000Z'
    },
    {
      id: 'demo-task-2',
      originalId: 2,
      epico: 'Sistema de Login',
      userStory: 'Como usuário, quero recuperar minha senha quando esquecer',
      atividade: 'Implementar recuperação de senha',
      detalhamento: 'Sistema de reset de senha por email',
      desenvolvedor: 'Maria Santos',
      sprint: 'Sprint 1',
      status: 'Doing',
      prioridade: 'Média',
      estimativa: 5,
      reestimativas: [5, 5, 4, 4, 3, 3, 2, 2, 1, 1],
      tempoGasto: null,
      taxaErro: null,
      tempoGastoValidado: false,
      motivoErro: null,
      observacoes: 'Em desenvolvimento',
      dataCriacao: '2025-01-16T10:00:00.000Z',
      dataAtualizacao: '2025-01-18T14:00:00.000Z'
    },
    
    // Dashboard Analytics
    {
      id: 'demo-task-3',
      originalId: 3,
      epico: 'Dashboard Analytics',
      userStory: 'Como gestor, quero visualizar métricas de desempenho da equipe',
      atividade: 'Criar gráficos de performance',
      detalhamento: 'Implementar gráficos de burndown, velocity e cycle time',
      desenvolvedor: 'Pedro Costa',
      sprint: 'Sprint 1',
      status: 'Priorizado',
      prioridade: 'Alta',
      estimativa: 13,
      reestimativas: [13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
      tempoGasto: null,
      taxaErro: null,
      tempoGastoValidado: false,
      motivoErro: null,
      observacoes: 'Aguardando início',
      dataCriacao: '2025-01-17T08:00:00.000Z',
      dataAtualizacao: '2025-01-18T09:00:00.000Z'
    },
    {
      id: 'demo-task-4',
      originalId: 4,
      epico: 'Dashboard Analytics',
      userStory: 'Como usuário, quero filtrar dados por período',
      atividade: 'Implementar filtros de data',
      detalhamento: 'Componente de seleção de datas com presets',
      desenvolvedor: 'Ana Oliveira',
      sprint: 'Sprint 1',
      status: 'Done',
      prioridade: 'Média',
      estimativa: 3,
      reestimativas: [3, 3, 2, 2, 1, 1, 0, 0, 0, 0],
      tempoGasto: 4,
      taxaErro: 33.33,
      tempoGastoValidado: true,
      motivoErro: 'Complexidade subestimada na integração com backend',
      observacoes: 'Finalizado com algumas melhorias extras',
      dataCriacao: '2025-01-16T14:00:00.000Z',
      dataAtualizacao: '2025-01-18T17:00:00.000Z'
    },
    
    // API REST
    {
      id: 'demo-task-5',
      originalId: 5,
      epico: 'API REST',
      userStory: 'Como desenvolvedor, quero endpoints para CRUD de usuários',
      atividade: 'Implementar endpoints de usuários',
      detalhamento: 'Criar endpoints para criar, ler, atualizar e deletar usuários',
      desenvolvedor: 'Carlos Lima',
      sprint: 'Sprint 1',
      status: 'Doing',
      prioridade: 'Crítica',
      estimativa: 8,
      reestimativas: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
      tempoGasto: null,
      taxaErro: null,
      tempoGastoValidado: false,
      motivoErro: null,
      observacoes: 'Reestimativa crescente devido a complexidade',
      dataCriacao: '2025-01-15T11:00:00.000Z',
      dataAtualizacao: '2025-01-18T15:00:00.000Z'
    },
    {
      id: 'demo-task-6',
      originalId: 6,
      epico: 'API REST',
      userStory: 'Como sistema, quero logs de auditoria das operações',
      atividade: 'Implementar sistema de auditoria',
      detalhamento: 'Registrar todas as operações críticas do sistema',
      desenvolvedor: 'João Silva',
      sprint: 'Sprint 1',
      status: 'Backlog',
      prioridade: 'Baixa',
      estimativa: 5,
      reestimativas: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      tempoGasto: null,
      taxaErro: null,
      tempoGastoValidado: false,
      motivoErro: null,
      observacoes: 'Pendente de priorização',
      dataCriacao: '2025-01-18T09:30:00.000Z',
      dataAtualizacao: '2025-01-18T09:30:00.000Z'
    },
    
    // Interface Mobile
    {
      id: 'demo-task-7',
      originalId: 7,
      epico: 'Interface Mobile',
      userStory: 'Como usuário mobile, quero acessar o sistema pelo celular',
      atividade: 'Criar layout responsivo',
      detalhamento: 'Adaptar interface para dispositivos móveis',
      desenvolvedor: 'Maria Santos',
      sprint: 'Sprint 2',
      status: 'Backlog',
      prioridade: 'Média',
      estimativa: 21,
      reestimativas: [21, 21, 21, 21, 21, 21, 21, 21, 21, 21],
      tempoGasto: null,
      taxaErro: null,
      tempoGastoValidado: false,
      motivoErro: null,
      observacoes: 'Próximo sprint',
      dataCriacao: '2025-01-18T10:00:00.000Z',
      dataAtualizacao: '2025-01-18T10:00:00.000Z'
    },
    {
      id: 'demo-task-8',
      originalId: 8,
      epico: 'Interface Mobile',
      userStory: 'Como usuário, quero notificações push',
      atividade: 'Implementar push notifications',
      detalhamento: 'Sistema de notificações em tempo real',
      desenvolvedor: 'Pedro Costa',
      sprint: 'Sprint 2',
      status: 'Backlog',
      prioridade: 'Alta',
      estimativa: 13,
      reestimativas: [13, 13, 13, 13, 13, 13, 13, 13, 13, 13],
      tempoGasto: null,
      taxaErro: null,
      tempoGastoValidado: false,
      motivoErro: null,
      observacoes: 'Depende da infraestrutura',
      dataCriacao: '2025-01-18T11:00:00.000Z',
      dataAtualizacao: '2025-01-18T11:00:00.000Z'
    },
    
    // Relatórios
    {
      id: 'demo-task-9',
      originalId: 9,
      epico: 'Relatórios',
      userStory: 'Como gestor, quero relatórios de produtividade',
      atividade: 'Criar relatórios gerenciais',
      detalhamento: 'Relatórios de velocity, burndown e tempo gasto',
      desenvolvedor: 'Ana Oliveira',
      sprint: 'Sprint 2',
      status: 'Priorizado',
      prioridade: 'Alta',
      estimativa: 8,
      reestimativas: [8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
      tempoGasto: null,
      taxaErro: null,
      tempoGastoValidado: false,
      motivoErro: null,
      observacoes: 'Prioridade alta para demo',
      dataCriacao: '2025-01-18T12:00:00.000Z',
      dataAtualizacao: '2025-01-18T12:00:00.000Z'
    },
    {
      id: 'demo-task-10',
      originalId: 10,
      epico: 'Relatórios',
      userStory: 'Como usuário, quero exportar dados para Excel',
      atividade: 'Implementar exportação Excel',
      detalhamento: 'Funcionalidade de export para planilhas',
      desenvolvedor: 'Carlos Lima',
      sprint: 'Sprint 2',
      status: 'Done',
      prioridade: 'Baixa',
      estimativa: 2,
      reestimativas: [2, 2, 1, 1, 0, 0, 0, 0, 0, 0],
      tempoGasto: 1.5,
      taxaErro: -25,
      tempoGastoValidado: true,
      motivoErro: null,
      observacoes: 'Concluído rapidamente',
      dataCriacao: '2025-01-17T15:00:00.000Z',
      dataAtualizacao: '2025-01-18T11:30:00.000Z'
    }
  ];

  return demoTasks;
};

export const getDemoStats = () => {
  const tasks = generateDemoData();
  
  return {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'Done').length,
    inProgressTasks: tasks.filter(t => t.status === 'Doing').length,
    backlogTasks: tasks.filter(t => t.status === 'Backlog').length,
    prioritizedTasks: tasks.filter(t => t.status === 'Priorizado').length,
    totalStoryPoints: tasks.reduce((sum, t) => sum + t.estimativa, 0),
    completedStoryPoints: tasks.filter(t => t.status === 'Done').reduce((sum, t) => sum + t.estimativa, 0),
    averageTimeSpent: tasks.filter(t => t.tempoGasto).reduce((sum, t) => sum + t.tempoGasto, 0) / tasks.filter(t => t.tempoGasto).length,
    developers: [...new Set(tasks.map(t => t.desenvolvedor))],
    epics: [...new Set(tasks.map(t => t.epico))],
    sprints: [...new Set(tasks.map(t => t.sprint))]
  };
};

export const getDemoDescription = () => {
  return {
    title: 'Demo - Sistema de Gestão de Projetos',
    description: 'Demonstração completa do TaskTracker com dados realistas de um projeto de desenvolvimento de software.',
    features: [
      '✅ 10 tarefas de exemplo distribuídas em 5 épicos',
      '✅ 5 desenvolvedores virtuais com diferentes perfis',
      '✅ Dados de burndown realistas com variações',
      '✅ Tarefas em diferentes status (Backlog, Doing, Done)',
      '✅ Tempo gasto e taxa de erro calculados',
      '✅ Histórico de reestimativas por dia',
      '✅ Observações e comentários detalhados'
    ],
    scenario: 'Projeto de desenvolvimento de uma plataforma web com sistema de login, dashboard analytics, API REST, interface mobile e relatórios.',
    duration: '2 sprints (Sprint 1 e Sprint 2)',
    team: '5 desenvolvedores (João, Maria, Pedro, Ana, Carlos)'
  };
};