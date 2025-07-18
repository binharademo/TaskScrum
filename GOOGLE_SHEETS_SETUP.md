# Configuração Google Sheets - TaskTracker

## Passo a Passo para Configurar o Google Sheets

### 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em "Criar Projeto" ou selecione um projeto existente
3. Anote o nome do projeto

### 2. Ativar APIs Necessárias

1. No menu lateral, vá para "APIs e Serviços" → "Biblioteca"
2. Procure e ative as seguintes APIs:
   - **Google Sheets API**
   - **Google Drive API**
   - **Google+ API** (para perfil do usuário)

### 3. Criar Credenciais OAuth 2.0

1. Vá para "APIs e Serviços" → "Credenciais"
2. Clique em "Criar Credenciais" → "ID do cliente OAuth"
3. Selecione "Aplicativo da Web"
4. Configure:
   - **Nome**: TaskTracker
   - **URLs de origem autorizadas**: `http://localhost:4000`
   - **URIs de redirecionamento**: `http://localhost:4000`
5. Clique em "Criar"
6. **Copie o Client ID** gerado

### 4. Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edite o arquivo `.env`:
   ```env
   REACT_APP_GOOGLE_CLIENT_ID=seu-client-id-aqui
   REACT_APP_GOOGLE_API_KEY=sua-api-key-aqui (opcional)
   ```

### 5. Instalar Dependências

```bash
npm install googleapis google-auth-library
```

### 6. Iniciar a Aplicação

```bash
npm start
```

## Como Usar

### Primeiro Acesso

1. Abra o TaskTracker
2. Clique no ícone do Google (🔵) no cabeçalho
3. Faça login com sua conta Google
4. Autorize as permissões solicitadas
5. Suas planilhas serão criadas automaticamente

### Planilhas Criadas

O sistema criará automaticamente 4 planilhas na sua conta:

1. **TaskTracker-{email}-Tasks**: Dados principais das tarefas
2. **TaskTracker-{email}-Sprints**: Histórico de sprints
3. **TaskTracker-{email}-Config**: Configurações do projeto
4. **TaskTracker-{email}-Collaborators**: Lista de colaboradores

### Compartilhamento

1. Vá para a aba "Compartilhar"
2. Digite o email do colaborador
3. Escolha o nível de acesso (Visualizador/Editor)
4. Clique em "Enviar Convite"

### Sincronização

- **Automática**: A cada 2 minutos
- **Manual**: Clique no ícone de sincronização (🔄)
- **Offline**: Mudanças são salvas localmente e sincronizadas quando voltar online

## Estrutura das Planilhas

### Tasks (Tarefas)
- ID, Épico, História do Usuário, Atividade
- Desenvolvedor, Sprint, Status, Prioridade
- Estimativa, Dias 1-10 (reestimativas)
- Tempo Gasto, Taxa de Erro, Motivo do Erro
- Timestamps de criação e atualização

### Sprints
- Nome, Data Início/Fim, Status
- Total de Tarefas, Tarefas Completas
- Horas Estimadas/Gastas

### Config
- Configurações do projeto
- Última sincronização
- Versão do sistema

### Collaborators
- Email, Nome, Nível de Acesso
- Status (convidado/ativo/removido)
- Datas de convite e aceite

## Solução de Problemas

### Erro: "Client ID inválido"
- Verifique se o Client ID está correto no .env
- Confirme se as URLs de origem estão configuradas

### Erro: "Permissões insuficientes"
- Verifique se as APIs estão ativadas
- Confirme se o usuário autorizou as permissões

### Erro: "Planilha não encontrada"
- Verifique se o projeto foi criado corretamente
- Tente recriar o projeto na interface

### Sincronização lenta
- Verifique sua conexão com a internet
- O Google Sheets tem limites de API (100 requests/100s)

## Limitações

- **Quotas da API**: 100 requests por 100 segundos
- **Delay de sincronização**: 30s-2min (não é tempo real)
- **Tamanho**: Máximo 10 milhões de células por planilha
- **Colaboradores**: Limitado pelas quotas do Google Drive

## Backup e Recuperação

- Todas as planilhas ficam no seu Google Drive
- Backup automático do Google Drive
- Exportação manual via botão "Download"
- Dados também salvos localmente (localStorage)

## Segurança

- OAuth 2.0 com tokens seguros
- Dados ficam na sua conta Google
- Compartilhamento controlado por você
- Nenhum dado é enviado para servidores externos