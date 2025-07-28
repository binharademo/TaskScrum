import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Grid,
  TextField,
  Alert,
  Chip,
  Divider,
  LinearProgress,
  Fade,
  Zoom
} from '@mui/material';
import {
  Waves as WelcomeIcon,
  Dashboard as KanbanIcon,
  TrendingUp as BurndownIcon,
  Psychology as PredictiveIcon,
  Computer as LocalIcon,
  Cloud as CloudIcon,
  Group as SharedIcon,
  ArrowForward as NextIcon,
  ArrowBack as BackIcon,
  CheckCircle as CompleteIcon,
  CheckCircle,
  Lightbulb as TipIcon,
  Star as FeatureIcon
} from '@mui/icons-material';

// Hooks e utilitários
import { isSupabaseConfigured } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

const WelcomeWizard = ({ open, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMode, setSelectedMode] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const auth = isSupabaseConfigured() ? useAuth() : { isAuthenticated: false, user: null };

  // Configuração dos steps
  const steps = [
    'Boas-vindas',
    'Funcionalidades', 
    'Modos de Trabalho',
    'Configuração Final'
  ];

  // =============================================
  // STEP 1: TELA DE BOAS-VINDAS
  // =============================================
  const WelcomeStep = () => (
    <Fade in timeout={800}>
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Zoom in timeout={1000}>
          <Box sx={{ mb: 4 }}>
            <WelcomeIcon sx={{ fontSize: 120, color: 'primary.main', mb: 2 }} />
            <Typography variant="h3" component="h1" gutterBottom color="primary" fontWeight="bold">
              Bem-vindo ao TaskTracker!
            </Typography>
          </Box>
        </Zoom>
        
        <Typography variant="h5" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
          Sua ferramenta completa para gestão ágil de projetos
        </Typography>
        
        <Box sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
          <Typography variant="body1" paragraph>
            O TaskTracker é uma ferramenta poderosa inspirada no Trello, desenvolvida especialmente 
            para equipes de desenvolvimento que trabalham com metodologias ágeis.
          </Typography>
          
          <Typography variant="body1" paragraph>
            Com ele, você terá controle total sobre suas tarefas, poderá acompanhar o progresso 
            do seu sprint e ainda contar com análises preditivas avançadas.
          </Typography>
        </Box>

        <Alert severity="info" sx={{ maxWidth: 500, mx: 'auto', mb: 4 }}>
          <Typography variant="body2">
            <TipIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
            Este wizard vai te ajudar a configurar o sistema da melhor forma para seu time!
          </Typography>
        </Alert>

        <Button
          variant="contained"
          size="large"
          onClick={() => setCurrentStep(1)}
          endIcon={<NextIcon />}
          sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
        >
          Vamos começar!
        </Button>
      </Box>
    </Fade>
  );

  // =============================================
  // STEP 2: FUNCIONALIDADES DO SISTEMA
  // =============================================
  const FeaturesStep = () => (
    <Fade in timeout={800}>
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" textAlign="center" gutterBottom color="primary" fontWeight="bold">
          🚀 Funcionalidades Principais
        </Typography>
        
        <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
          Conheça as ferramentas que vão revolucionar sua gestão de projetos
        </Typography>

        <Grid container spacing={3}>
          {/* Kanban Board */}
          <Grid item xs={12} md={4}>
            <Zoom in timeout={600}>
              <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <KanbanIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Kanban Visual
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quadro visual com colunas Backlog, Priorizado, Doing e Done. 
                    Arraste e solte tarefas, organize por épicos e mantenha tudo organizado.
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Chip label="Drag & Drop" size="small" variant="outlined" sx={{ mr: 1 }} />
                    <Chip label="Épicos" size="small" variant="outlined" />
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          {/* Burndown Chart */}
          <Grid item xs={12} md={4}>
            <Zoom in timeout={800}>
              <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <BurndownIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Burndown Chart
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Acompanhe o progresso do sprint em tempo real com gráficos de burndown. 
                    Veja se está no prazo e identifique desvios rapidamente.
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Chip label="Tempo Real" size="small" variant="outlined" sx={{ mr: 1 }} />
                    <Chip label="Sprint" size="small" variant="outlined" />
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          {/* Análise Preditiva */}
          <Grid item xs={12} md={4}>
            <Zoom in timeout={1000}>
              <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <PredictiveIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Análise Preditiva
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Algoritmos avançados analisam o desempenho da equipe e fazem previsões 
                    sobre entregas, riscos e necessidade de recursos.
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Chip label="IA" size="small" variant="outlined" sx={{ mr: 1 }} />
                    <Chip label="Previsões" size="small" variant="outlined" />
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        </Grid>

        <Alert severity="success" sx={{ mt: 4, mb: 3 }}>
          <Typography variant="body2">
            <FeatureIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
            <strong>Mais recursos:</strong> Filtros avançados, exportação de dados, 
            métricas de performance e muito mais!
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={() => setCurrentStep(0)}
            startIcon={<BackIcon />}
          >
            Voltar
          </Button>
          <Button
            variant="contained"
            onClick={() => setCurrentStep(2)}
            endIcon={<NextIcon />}
          >
            Próximo: Modos de Trabalho
          </Button>
        </Box>
      </Box>
    </Fade>
  );

  // =============================================
  // STEP 3: MODOS DE TRABALHO
  // =============================================
  const WorkModesStep = () => (
    <Fade in timeout={800}>
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" textAlign="center" gutterBottom color="primary" fontWeight="bold">
          💾 Como Você Quer Trabalhar?
        </Typography>
        
        <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
          Escolha a melhor forma de armazenar e compartilhar seus dados
        </Typography>

        <Grid container spacing={3}>
          {/* Modo Local */}
          <Grid item xs={12} md={4}>
            <Zoom in timeout={600}>
              <Card sx={{ height: '100%', border: '2px solid transparent', transition: 'all 0.3s' }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <LocalIcon sx={{ fontSize: 60, color: 'info.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    💻 Modo Local
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Os dados ficam salvos apenas no seu navegador. Ideal para trabalho 
                    individual ou equipes pequenas que compartilham um computador.
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Chip label="✅ Mais rápido" size="small" color="success" sx={{ m: 0.5 }} />
                    <Chip label="✅ Funciona offline" size="small" color="success" sx={{ m: 0.5 }} />
                    <Chip label="✅ Zero configuração" size="small" color="success" sx={{ m: 0.5 }} />
                  </Box>
                  
                  <Typography variant="caption" color="warning.main">
                    ⚠️ Dados não sincronizam entre dispositivos
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          {/* Modo Nuvem */}
          <Grid item xs={12} md={4}>
            <Zoom in timeout={800}>
              <Card sx={{ height: '100%', border: '2px solid transparent', transition: 'all 0.3s' }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <CloudIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    ☁️ Modo Nuvem
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Dados salvos na nuvem com acesso de qualquer dispositivo. 
                    Perfeito para equipes distribuídas e trabalho remoto.
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Chip label="✅ Acesso em qualquer lugar" size="small" color="success" sx={{ m: 0.5 }} />
                    <Chip label="✅ Backup automático" size="small" color="success" sx={{ m: 0.5 }} />
                    <Chip label="✅ Controle de acesso" size="small" color="success" sx={{ m: 0.5 }} />
                  </Box>
                  
                  <Typography variant="caption" color="info.main">
                    📝 Requer cadastro e login
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          {/* Modo Compartilhado */}
          <Grid item xs={12} md={4}>
            <Zoom in timeout={1000}>
              <Card sx={{ height: '100%', border: '2px solid transparent', transition: 'all 0.3s' }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <SharedIcon sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    🔗 Sala Compartilhada
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Entre em uma sala já criada por outro usuário usando um código. 
                    Ideal para colaborar em projetos existentes.
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Chip label="✅ Colaboração imediata" size="small" color="success" sx={{ m: 0.5 }} />
                    <Chip label="✅ Sem configuração" size="small" color="success" sx={{ m: 0.5 }} />
                    <Chip label="✅ Acesso controlado" size="small" color="success" sx={{ m: 0.5 }} />
                  </Box>
                  
                  <Typography variant="caption" color="secondary.main">
                    🔑 Precisa do código da sala
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ mt: 4, mb: 3 }}>
          <Typography variant="body2">
            <TipIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
            <strong>Dica:</strong> Você pode mudar o modo de trabalho a qualquer momento 
            nas configurações do sistema. Comece com o que for mais simples para você!
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={() => setCurrentStep(1)}
            startIcon={<BackIcon />}
          >
            Voltar
          </Button>
          <Button
            variant="contained"
            onClick={() => setCurrentStep(3)}
            endIcon={<NextIcon />}
          >
            Próximo: Configurar
          </Button>
        </Box>
      </Box>
    </Fade>
  );

  // =============================================
  // STEP 4: CONFIGURAÇÃO FINAL
  // =============================================
  const ConfigurationStep = () => (
    <Fade in timeout={800}>
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" textAlign="center" gutterBottom color="primary" fontWeight="bold">
          🎯 Configuração Final
        </Typography>
        
        <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
          Escolha seu modo preferido e vamos começar!
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} justifyContent="center">
          {/* Opção 1: Modo Local */}
          <Grid item xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: selectedMode === 'local' ? '3px solid' : '2px solid transparent',
                borderColor: selectedMode === 'local' ? 'info.main' : 'transparent',
                transition: 'all 0.3s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
              }}
              onClick={() => setSelectedMode('local')}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <LocalIcon sx={{ fontSize: 50, color: 'info.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  💻 Trabalhar Localmente
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Começar imediatamente com dados no navegador
                </Typography>
                {selectedMode === 'local' && (
                  <CheckCircle sx={{ color: 'success.main', mt: 2 }} />
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Opção 2: Modo Nuvem */}
          <Grid item xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: selectedMode === 'cloud' ? '3px solid' : '2px solid transparent',
                borderColor: selectedMode === 'cloud' ? 'primary.main' : 'transparent',
                transition: 'all 0.3s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
                opacity: !isSupabaseConfigured() ? 0.5 : 1
              }}
              onClick={() => isSupabaseConfigured() && setSelectedMode('cloud')}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <CloudIcon sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  ☁️ Trabalhar na Nuvem
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isSupabaseConfigured() ? 
                    'Criar conta e sincronizar dados' : 
                    'Não disponível (não configurado)'
                  }
                </Typography>
                {selectedMode === 'cloud' && (
                  <CheckCircle sx={{ color: 'success.main', mt: 2 }} />
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Opção 3: Sala Compartilhada */}
          <Grid item xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: selectedMode === 'shared' ? '3px solid' : '2px solid transparent',
                borderColor: selectedMode === 'shared' ? 'secondary.main' : 'transparent',
                transition: 'all 0.3s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
              }}
              onClick={() => setSelectedMode('shared')}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <SharedIcon sx={{ fontSize: 50, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  🔗 Entrar em Sala
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Usar código de sala existente
                </Typography>
                {selectedMode === 'shared' && (
                  <CheckCircle sx={{ color: 'success.main', mt: 2 }} />
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Campo para código da sala se modo compartilhado */}
        {selectedMode === 'shared' && (
          <Fade in timeout={500}>
            <Box sx={{ maxWidth: 400, mx: 'auto', mt: 3 }}>
              <TextField
                fullWidth
                label="Código da Sala"
                placeholder="Ex: ABC123"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                inputProps={{ maxLength: 10 }}
                helperText="Digite o código fornecido pelo administrador da sala"
              />
            </Box>
          </Fade>
        )}

        {/* Informação sobre autenticação para modo nuvem */}
        {selectedMode === 'cloud' && (
          <Fade in timeout={500}>
            <Alert severity="info" sx={{ maxWidth: 500, mx: 'auto', mt: 3 }}>
              Você será direcionado para criar uma conta ou fazer login após finalizar o wizard.
            </Alert>
          </Fade>
        )}

        {loading && (
          <Box sx={{ mt: 3 }}>
            <LinearProgress />
            <Typography variant="body2" textAlign="center" sx={{ mt: 1 }}>
              Configurando sistema...
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={() => setCurrentStep(2)}
            startIcon={<BackIcon />}
            disabled={loading}
          >
            Voltar
          </Button>
          <Button
            variant="contained"
            onClick={handleComplete}
            endIcon={<CompleteIcon />}
            disabled={!selectedMode || loading || (selectedMode === 'shared' && !roomCode.trim())}
            size="large"
            sx={{ px: 4 }}
          >
            {loading ? 'Configurando...' : 'Finalizar Configuração'}
          </Button>
        </Box>
      </Box>
    </Fade>
  );

  // =============================================
  // FUNÇÃO DE FINALIZAÇÃO
  // =============================================
  const handleComplete = async () => {
    setLoading(true);
    setError('');

    try {
      // Salvar escolha do usuário
      const wizardResult = {
        mode: selectedMode,
        roomCode: selectedMode === 'shared' ? roomCode.trim().toUpperCase() : null,
        completedAt: new Date().toISOString()
      };

      // Marcar wizard como concluído
      localStorage.setItem('tasktracker_wizard_completed', 'true');
      localStorage.setItem('tasktracker_wizard_result', JSON.stringify(wizardResult));

      // Aguardar um pouco para dar feedback visual
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Chamar callback com resultado
      onComplete(wizardResult);

    } catch (error) {
      console.error('Erro ao finalizar wizard:', error);
      setError('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // COMPONENTE PRINCIPAL
  // =============================================
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return <WelcomeStep />;
      case 1: return <FeaturesStep />;
      case 2: return <WorkModesStep />;
      case 3: return <ConfigurationStep />;
      default: return <WelcomeStep />;
    }
  };

  return (
    <Dialog 
      open={open} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '80vh',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Stepper */}
        <Box sx={{ p: 3, pb: 0 }}>
          <Stepper activeStep={currentStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Conteúdo da etapa atual */}
        <Box sx={{ px: 3, pb: 3, minHeight: 400 }}>
          {renderCurrentStep()}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeWizard;