# TaskTracker - Sistema de Gestão de Tarefas

Um aplicativo web moderno para gestão de tarefas inspirado no Trello, com funcionalidades avançadas para equipes de desenvolvimento.

## 🚀 Funcionalidades

### 📋 Visualização Kanban
- **Colunas personalizáveis**: Backlog, Priorizado, Doing, Done
- **Drag & Drop**: Mova tarefas entre colunas intuitivamente
- **Filtros avançados**: Por sprint, desenvolvedor, prioridade e tags
- **Indicadores visuais**: Prazos, prioridades e contadores

### 📊 Visualização em Tabela
- **Edição inline**: Edite diretamente os campos das tarefas
- **Ordenação e filtros**: Por qualquer coluna
- **Paginação**: Para grandes volumes de dados
- **Exportação**: Para Excel e CSV

### 📈 Gráfico de Burndown
- **Atualização dinâmica**: Reflete o progresso do sprint atual
- **Comparação**: Linha ideal vs. progresso real
- **Métricas detalhadas**: Estatísticas de sprint e horas

### 🔄 Gestão de Sprints
- **Ciclos de 10 dias**: Configuração automática
- **Relatórios**: Métricas de conclusão e horas gastas
- **Histórico**: Acompanhamento de sprints anteriores

### 💾 Persistência de Dados
- **Local Storage**: Armazenamento no navegador
- **Importação Excel**: Carregue dados de planilhas
- **Exportação**: Salve dados em Excel

## 🛠️ Tecnologias Utilizadas

- **React 18**: Framework principal
- **Material-UI**: Componentes de interface
- **React Beautiful DnD**: Drag and drop
- **Chart.js**: Gráficos interativos
- **SheetJS**: Manipulação de arquivos Excel
- **date-fns**: Manipulação de datas

## 📦 Instalação

1. **Clone o repositório**:
```bash
git clone <repository-url>
cd tasktracker
```

2. **Instale as dependências**:
```bash
npm install
```

3. **Inicie o servidor de desenvolvimento**:
```bash
npm start
```

4. **Acesse o aplicativo**:
```
http://localhost:3000
```

## 📋 Estrutura de Dados

### Formato do Excel
O arquivo Excel deve conter as seguintes colunas:

| Coluna | Descrição | Obrigatório |
|--------|-----------|-------------|
| ID | Identificador único | Sim |
| Épico | Épico da tarefa | Não |
| User Story | Descrição da história | Sim |
| Tela | Tela relacionada | Não |
| Atividade | Descrição da atividade | Não |
| Detalhamento | Detalhes da tarefa | Não |
| Tipo Atividade | Tipo da atividade | Não |
| Estimativa (h) | Estimativa em horas | Não |
| Desenvolvedor | Responsável | Não |
| Sprint | Sprint associado | Não |
| Prioridade | Alta/Média/Baixa | Não |
| Tamanho Story | Tamanho da história | Não |
| Observações | Observações gerais | Não |
| Estimativa em horas | Estimativa detalhada | Não |
| Horas medidas | Horas efetivamente gastas | Não |

### Exemplo de Estrutura
```javascript
{
  id: "uuid",
  originalId: 1,
  epico: "Funcionalidade X",
  userStory: "Como usuário, eu quero...",
  tela: "Login",
  atividade: "Implementar validação",
  detalhamento: "Validar campos obrigatórios",
  tipoAtividade: "Desenvolvimento",
  estimativa: 8,
  desenvolvedor: "João Silva",
  sprint: "Sprint 1",
  prioridade: "Alta",
  tamanhoStory: "M",
  observacoes: "Requer testes extras",
  estimativaHoras: 8,
  horasMedidas: 6,
  status: "Doing",
  createdAt: "2023-01-01T00:00:00.000Z",
  updatedAt: "2023-01-01T00:00:00.000Z"
}
```

## 🎯 Como Usar

### 1. Importação de Dados
1. Clique no ícone de upload na barra superior
2. Selecione um arquivo Excel (.xlsx ou .xls)
3. Os dados serão automaticamente importados

### 2. Visualização Kanban
1. Acesse a aba "Kanban"
2. Use os filtros para refinar a visualização
3. Arraste e solte tarefas entre as colunas
4. Clique em uma tarefa para ver detalhes

### 3. Visualização em Tabela
1. Acesse a aba "Tabela"
2. Clique no ícone de edição para modificar uma tarefa
3. Use os filtros e ordenação para organizar dados
4. Exporte dados usando o botão "Exportar"

### 4. Gráfico de Burndown
1. Acesse a aba "Burndown"
2. Selecione o sprint desejado
3. Analise o progresso comparando linha ideal vs. real
4. Consulte as métricas detalhadas no painel lateral

### 5. Alternância de Tema
- Clique no ícone de sol/lua na barra superior
- O tema (claro/escuro) será persistido no navegador

## 📁 Estrutura do Projeto

```
tasktracker/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── KanbanBoard.js
│   │   ├── TableView.js
│   │   └── BurndownChart.js
│   ├── utils/
│   │   ├── storage.js
│   │   └── excelImport.js
│   ├── App.js
│   └── index.js
├── package.json
└── README.md
```

## 🔧 Configuração Avançada

### Personalização de Colunas
Para modificar as colunas do Kanban, edite o array `columns` em `src/components/KanbanBoard.js`:

```javascript
const columns = [
  { id: 'Backlog', title: 'Backlog', color: '#e3f2fd' },
  { id: 'Priorizado', title: 'Priorizado', color: '#fff3e0' },
  { id: 'Doing', title: 'Doing', color: '#e8f5e8' },
  { id: 'Done', title: 'Done', color: '#f3e5f5' }
];
```

### Configuração de Prioridades
Modifique as cores das prioridades em `src/components/KanbanBoard.js`:

```javascript
const priorityColors = {
  'Alta': '#f44336',
  'Média': '#ff9800',
  'Baixa': '#4caf50'
};
```

## 📊 Métricas e Relatórios

### Métricas Disponíveis
- **Taxa de conclusão**: Percentual de tarefas concluídas
- **Horas estimadas vs. trabalhadas**: Comparação de estimativas
- **Progresso do sprint**: Acompanhamento em tempo real
- **Distribuição por desenvolvedor**: Carga de trabalho

### Exportação de Dados
- **Excel**: Exporta todas as tarefas filtradas
- **Formato original**: Mantém a estrutura de colunas original
- **Dados atualizados**: Inclui modificações feitas no sistema

## 🎨 Personalização Visual

### Temas
- **Tema claro**: Interface limpa e moderna
- **Tema escuro**: Reduz fadiga ocular
- **Persistência**: Preferência salva no navegador

### Cores e Estilos
- **Material Design**: Seguindo as diretrizes do Google
- **Responsivo**: Adaptado para dispositivos móveis
- **Acessibilidade**: Contrastes e tamanhos adequados

## 🔄 Backup e Sincronização

### Backup Local
Os dados são automaticamente salvos no Local Storage do navegador.

### Exportação Regular
Recomenda-se exportar dados periodicamente para Excel como backup.

### Sincronização (Futuro)
Possível integração com:
- Google Drive
- Dropbox
- Servidor próprio

## 🐛 Solução de Problemas

### Problemas Comuns

1. **Arquivo Excel não carrega**
   - Verifique se o arquivo está no formato correto (.xlsx ou .xls)
   - Confirme se as colunas estão nomeadas corretamente

2. **Drag and Drop não funciona**
   - Verifique se o navegador suporta HTML5 drag and drop
   - Tente recarregar a página

3. **Dados não são salvos**
   - Verifique se o Local Storage está habilitado
   - Limpe o cache do navegador se necessário

4. **Gráfico não aparece**
   - Verifique se há dados de sprint disponíveis
   - Confirme se as datas estão no formato correto

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Crie uma issue no repositório do projeto
- Consulte a documentação online
- Entre em contato com a equipe de desenvolvimento

## 🔮 Roadmap

### Próximas Funcionalidades
- [ ] Gestão de usuários e permissões
- [ ] Notificações em tempo real
- [ ] Integração com GitHub/GitLab
- [ ] API REST para integração
- [ ] Aplicativo mobile
- [ ] Relatórios avançados
- [ ] Integrações com Slack/Teams

### Melhorias Planejadas
- [ ] Performance para grandes volumes de dados
- [ ] Testes automatizados
- [ ] Documentação de API
- [ ] Tutoriais em vídeo
- [ ] Suporte a múltiplos idiomas

## 📄 Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Desenvolvido com ❤️ para equipes de desenvolvimento ágil**