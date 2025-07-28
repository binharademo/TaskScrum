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
  Star as FeatureIcon,
  Menu as MenuIcon,
  ViewModule as ViewModuleIcon,
  TableView as TableViewIcon,
  Analytics as AnalyticsIcon,
  Share as ShareIcon,
  Settings as SettingsIcon,
  GetApp as ExportIcon,
  ContentCopy as CopyIcon,
  Google as GoogleIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Brightness4
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
    'Ícones da Barra Superior',
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
          🎯 Uma ferramenta simples para organizar suas tarefas
        </Typography>
        
        <Box sx={{ maxWidth: 500, mx: 'auto', mb: 4 }}>
          <Typography variant="h6" paragraph sx={{ fontSize: '1.3rem', lineHeight: 1.6 }}>
            📝 <strong>O que é o TaskTracker?</strong>
          </Typography>
          <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
            É como uma lista de tarefas super inteligente! Você pode:
          </Typography>
          
          <Box sx={{ textAlign: 'left', maxWidth: 400, mx: 'auto' }}>
            <Typography variant="body1" sx={{ fontSize: '1.1rem', mb: 1 }}>
              ✅ Ver suas tarefas organizadas
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.1rem', mb: 1 }}>
              🏃‍♂️ Mover elas de "fazendo" para "pronto"
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.1rem', mb: 1 }}>
              📊 Ver gráficos do seu progresso
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.1rem', mb: 1 }}>
              👥 Trabalhar junto com sua equipe
            </Typography>
          </Box>
        </Box>

        <Alert severity="success" sx={{ maxWidth: 450, mx: 'auto', mb: 4 }}>
          <Typography variant="body2" sx={{ fontSize: '1rem' }}>
            <TipIcon sx={{ fontSize: 20, mr: 1, verticalAlign: 'middle' }} />
            <strong>Não se preocupe!</strong> Vamos configurar tudo junto, passo a passo! 😊
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
  // STEP 2: FUNCIONALIDADES DO SISTEMA (ELI5)
  // =============================================
  const FeaturesStep = () => (
    <Fade in timeout={800}>
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" textAlign="center" gutterBottom color="primary" fontWeight="bold" sx={{ fontSize: '2.2rem', mb: 2 }}>
          🎮 O Que Você Pode Fazer Aqui?
        </Typography>
        
        <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 4, fontSize: '1.3rem', lineHeight: 1.6 }}>
          Imagine como se fosse um jogo onde você organiza suas tarefas! 😊
        </Typography>

        <Grid container spacing={3}>
          {/* Kanban Board */}
          <Grid item xs={12} md={4}>
            <Zoom in timeout={600}>
              <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' }, border: '2px solid #e3f2fd' }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <KanbanIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ fontSize: '1.4rem', mb: 2 }}>
                    🎯 Quadro de Tarefas
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.6, mb: 2 }}>
                    É como organizar suas tarefas em caixinhas:
                  </Typography>
                  <Box sx={{ textAlign: 'left', maxWidth: 250, mx: 'auto' }}>
                    <Typography variant="body2" sx={{ fontSize: '1rem', mb: 1 }}>
                      📋 <strong>Para Fazer</strong> - suas tarefas esperando
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '1rem', mb: 1 }}>
                      🏃‍♂️ <strong>Fazendo</strong> - o que você está trabalhando
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '1rem', mb: 1 }}>
                      ✅ <strong>Pronto</strong> - tarefas que você terminou
                    </Typography>
                  </Box>
                  <Alert severity="success" sx={{ mt: 2, fontSize: '0.9rem' }}>
                    <strong>Legal:</strong> Você pode arrastar as tarefas de uma caixinha para outra!
                  </Alert>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          {/* Burndown Chart */}
          <Grid item xs={12} md={4}>
            <Zoom in timeout={800}>
              <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' }, border: '2px solid #e8f5e8' }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <BurndownIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                  <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ fontSize: '1.4rem', mb: 2 }}>
                    📊 Gráfico de Progresso
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.6, mb: 2 }}>
                    Como um medidor que mostra se você está indo bem:
                  </Typography>
                  <Box sx={{ textAlign: 'left', maxWidth: 250, mx: 'auto' }}>
                    <Typography variant="body2" sx={{ fontSize: '1rem', mb: 1 }}>
                      📈 <strong>Linha Verde</strong> - onde você deveria estar
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '1rem', mb: 1 }}>
                      📉 <strong>Linha Azul</strong> - onde você realmente está
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '1rem', mb: 1 }}>
                      🎯 <strong>Se as linhas estão próximas</strong> - você está indo bem!
                    </Typography>
                  </Box>
                  <Alert severity="info" sx={{ mt: 2, fontSize: '0.9rem' }}>
                    <strong>Dica:</strong> É como um velocímetro do seu trabalho!
                  </Alert>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          {/* Análise Preditiva */}
          <Grid item xs={12} md={4}>
            <Zoom in timeout={1000}>
              <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' }, border: '2px solid #fff3e0' }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <PredictiveIcon sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
                  <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ fontSize: '1.4rem', mb: 2 }}>
                    🔮 Previsão Inteligente
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.6, mb: 2 }}>
                    O computador olha como você trabalha e te avisa:
                  </Typography>
                  <Box sx={{ textAlign: 'left', maxWidth: 250, mx: 'auto' }}>
                    <Typography variant="body2" sx={{ fontSize: '1rem', mb: 1 }}>
                      ⏰ <strong>"Você vai terminar no prazo"</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '1rem', mb: 1 }}>
                      ⚠️ <strong>"Atenção, pode atrasar!"</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '1rem', mb: 1 }}>
                      👥 <strong>"Precisa de mais pessoas"</strong>
                    </Typography>
                  </Box>
                  <Alert severity="warning" sx={{ mt: 2, fontSize: '0.9rem' }}>
                    <strong>Incrível:</strong> É como ter um assistente inteligente!
                  </Alert>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        </Grid>

        <Alert severity="success" sx={{ mt: 4, mb: 3, fontSize: '1.1rem', py: 2 }}>
          <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
            <FeatureIcon sx={{ fontSize: 20, mr: 1, verticalAlign: 'middle' }} />
            <strong>E tem muito mais!</strong> Você pode filtrar suas tarefas, baixar relatórios, 
            trabalhar em equipe e várias outras coisas legais! 🎉
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={() => setCurrentStep(0)}
            startIcon={<BackIcon />}
            sx={{ fontSize: '1rem', px: 3, py: 1.5 }}
          >
            ← Voltar
          </Button>
          <Button
            variant="contained"
            onClick={() => setCurrentStep(2)}
            endIcon={<NextIcon />}
            sx={{ fontSize: '1rem', px: 3, py: 1.5 }}
          >
            Próximo: Botões do Topo →
          </Button>
        </Box>
      </Box>
    </Fade>
  );

  // =============================================
  // STEP 3: INTERFACE DO SISTEMA (ELI5)
  // =============================================
  const InterfaceStep = () => (
    <Fade in timeout={800}>
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" textAlign="center" gutterBottom color="primary" fontWeight="bold" sx={{ fontSize: '2.2rem', mb: 2 }}>
          🔘 Botões na Parte de Cima
        </Typography>
        
        <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 4, fontSize: '1.3rem', lineHeight: 1.6 }}>
          Vamos conhecer para que serve cada botãozinho! 😊
        </Typography>

        {/* Simulação visual da barra superior */}
        <Box sx={{ 
          mb: 4, 
          p: 2, 
          bgcolor: 'primary.main', 
          borderRadius: 1,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            TaskTracker - Gestão de Tarefas
          </Typography>
          <SharedIcon />
          <CopyIcon />
          <GoogleIcon />
          <Typography variant="caption">📝</Typography>
          <Typography variant="caption">🔐</Typography>
          <Typography variant="caption">📦</Typography>
          <Typography variant="caption">🎯</Typography>
          <Typography variant="caption">🧪</Typography>
          <DownloadIcon />
          <DeleteIcon />
          <Brightness4 />
        </Box>

        <Grid container spacing={3}>
          {/* Coluna 1 - Botões Importantes */}
          <Grid item xs={12} md={6}>
            <Card sx={{ mb: 2, border: '2px solid #e3f2fd' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom color="primary" fontWeight="bold" sx={{ fontSize: '1.4rem', mb: 3 }}>
                  🔧 Botões Mais Importantes
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SharedIcon sx={{ fontSize: 28, color: 'primary.main', mr: 2 }} />
                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.2rem' }}>🏠 Trocar de Sala</Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ ml: 4, fontSize: '1.1rem', lineHeight: 1.6 }}>
                    É como trocar de quarto! Você pode criar uma sala nova ou entrar numa sala que já existe.
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CopyIcon sx={{ fontSize: 28, color: 'info.main', mr: 2 }} />
                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.2rem' }}>📋 Copiar Código</Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ ml: 4, fontSize: '1.1rem', lineHeight: 1.6 }}>
                    Pega o código da sua sala para dar para seus amigos entrarem junto com você!
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <GoogleIcon sx={{ fontSize: 28, color: 'success.main', mr: 2 }} />
                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.2rem' }}>💾 Google Sheets</Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ ml: 4, fontSize: '1.1rem', lineHeight: 1.6 }}>
                    Salva suas tarefas no Google (como se fosse na nuvem) para não perder nada!
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Coluna 2 - Login e Conta */}
          <Grid item xs={12} md={6}>
            <Card sx={{ mb: 2, border: '2px solid #e8f5e8' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom color="secondary" fontWeight="bold" sx={{ fontSize: '1.4rem', mb: 3 }}>
                  👤 Sua Conta Pessoal
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography sx={{ fontSize: 28, mr: 2 }}>📝</Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.2rem' }}>✨ Criar Conta</Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ ml: 4, fontSize: '1.1rem', lineHeight: 1.6 }}>
                    Como fazer uma conta nova no site, igual quando você cria conta no Instagram!
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography sx={{ fontSize: 28, mr: 2 }}>🔐</Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.2rem' }}>🚪 Entrar</Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ ml: 4, fontSize: '1.1rem', lineHeight: 1.6 }}>
                    Entrar na sua conta que você já criou antes (com email e senha).
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography sx={{ fontSize: 28, mr: 2 }}>👋</Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.2rem' }}>📤 Sair</Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ ml: 4, fontSize: '1.1rem', lineHeight: 1.6 }}>
                    Quando você quer sair da sua conta (como fazer logout).
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Coluna 3 - Ferramentas Úteis */}
          <Grid item xs={12} md={6}>
            <Card sx={{ mb: 2, border: '2px solid #fff3e0' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom color="warning.main" fontWeight="bold" sx={{ fontSize: '1.4rem', mb: 3 }}>
                  🛠️ Ferramentas Legais
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography sx={{ fontSize: 28, mr: 2 }}>📁</Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.2rem' }}>💾 Baixar Tarefas</Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ ml: 4, fontSize: '1.1rem', lineHeight: 1.6 }}>
                    Baixa todas suas tarefas para o computador (como fazer backup).
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography sx={{ fontSize: 28, mr: 2 }}>🌙</Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.2rem' }}>🌞 Mudar Cor</Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ ml: 4, fontSize: '1.1rem', lineHeight: 1.6 }}>
                    Deixa a tela escura (modo noturno) ou clara (modo normal).
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Coluna 4 - Botão Especial */}
          <Grid item xs={12} md={6}>
            <Card sx={{ mb: 2, border: '2px solid #ffebee' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom color="error.main" fontWeight="bold" sx={{ fontSize: '1.4rem', mb: 3 }}>
                  ⚠️ Botão de Cuidado
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <DeleteIcon sx={{ fontSize: 28, color: 'error.main', mr: 2 }} />
                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.2rem' }}>🗑️ Apagar Tudo</Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ ml: 4, fontSize: '1.1rem', lineHeight: 1.6 }}>
                    <strong>Cuidado!</strong> Este botão apaga TODAS as suas tarefas. Só use se tiver certeza!
                  </Typography>
                  <Alert severity="warning" sx={{ mt: 2, ml: 4 }}>
                    É como jogar tudo no lixo - não tem como desfazer!
                  </Alert>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Alert severity="success" sx={{ mt: 4, mb: 3, fontSize: '1.1rem', py: 2 }}>
          <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
            <TipIcon sx={{ fontSize: 20, mr: 1, verticalAlign: 'middle' }} />
            <strong>Dica legal:</strong> Se você passar o mouse em cima de qualquer botão, 
            vai aparecer uma explicação rapidinha do que ele faz! 🖱️✨
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={() => setCurrentStep(1)}
            startIcon={<BackIcon />}
            sx={{ fontSize: '1rem', px: 3, py: 1.5 }}
          >
            ← Voltar
          </Button>
          <Button
            variant="contained"
            onClick={() => setCurrentStep(3)}
            endIcon={<NextIcon />}
            sx={{ fontSize: '1rem', px: 3, py: 1.5 }}
          >
            Próximo: Como Trabalhar →
          </Button>
        </Box>
      </Box>
    </Fade>
  );

  // =============================================
  // STEP 4: MODOS DE TRABALHO (ELI5)
  // =============================================
  const WorkModesStep = () => (
    <Fade in timeout={800}>
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" textAlign="center" gutterBottom color="primary" fontWeight="bold" sx={{ fontSize: '2.2rem', mb: 2 }}>
          🏠 Onde Você Quer Guardar Suas Tarefas?
        </Typography>
        
        <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 4, fontSize: '1.3rem', lineHeight: 1.6 }}>
          É como escolher onde guardar seus brinquedos! 😊
        </Typography>

        <Grid container spacing={3}>
          {/* Modo Local */}
          <Grid item xs={12} md={4}>
            <Zoom in timeout={600}>
              <Card sx={{ height: '100%', border: '3px solid #e3f2fd', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)' } }}>
                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                  <LocalIcon sx={{ fontSize: 80, color: 'info.main', mb: 3 }} />
                  <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ fontSize: '1.5rem', mb: 2 }}>
                    💻 No Meu Computador
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.6, mb: 3 }}>
                    É como guardar seus brinquedos na sua gaveta! 
                    Suas tarefas ficam só no seu computador.
                  </Typography>
                  
                  <Alert severity="success" sx={{ mb: 2, textAlign: 'left' }}>
                    <Typography variant="body2" sx={{ fontSize: '1rem' }}>
                      <strong>Bom porque:</strong><br/>
                      🚀 Super rápido<br/>
                      ⚡ Funciona sem internet<br/>
                      🔧 Não precisa configurar nada
                    </Typography>
                  </Alert>
                  
                  <Alert severity="warning" sx={{ textAlign: 'left' }}>
                    <Typography variant="body2" sx={{ fontSize: '1rem' }}>
                      <strong>Mas cuidado:</strong><br/>
                      📱 Só funciona no seu computador<br/>
                      💾 Se formatou, perdeu tudo
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          {/* Modo Nuvem */}
          <Grid item xs={12} md={4}>
            <Zoom in timeout={800}>
              <Card sx={{ height: '100%', border: '3px solid #e8f5e8', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)' } }}>
                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                  <CloudIcon sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
                  <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ fontSize: '1.5rem', mb: 2 }}>
                    ☁️ Na Nuvem
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.6, mb: 3 }}>
                    É como guardar suas coisas na nuvem do Google! 
                    Você pode acessar de qualquer lugar.
                  </Typography>
                  
                  <Alert severity="success" sx={{ mb: 2, textAlign: 'left' }}>
                    <Typography variant="body2" sx={{ fontSize: '1rem' }}>
                      <strong>Incrível porque:</strong><br/>
                      🌍 Acessa de qualquer lugar<br/>
                      🔄 Nunca perde nada<br/>
                      👥 Trabalha com amigos
                    </Typography>
                  </Alert>
                  
                  <Alert severity="info" sx={{ textAlign: 'left' }}>
                    <Typography variant="body2" sx={{ fontSize: '1rem' }}>
                      <strong>Só precisa:</strong><br/>
                      📧 Criar uma conta<br/>
                      🔐 Fazer login sempre
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          {/* Modo Compartilhado */}
          <Grid item xs={12} md={4}>
            <Zoom in timeout={1000}>
              <Card sx={{ height: '100%', border: '3px solid #fff3e0', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)' } }}>
                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                  <SharedIcon sx={{ fontSize: 80, color: 'secondary.main', mb: 3 }} />
                  <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ fontSize: '1.5rem', mb: 2 }}>
                    🎮 Sala do Amigo
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.6, mb: 3 }}>
                    É como ir brincar na casa do seu amigo! 
                    Você entra numa sala que alguém já criou.
                  </Typography>
                  
                  <Alert severity="success" sx={{ mb: 2, textAlign: 'left' }}>
                    <Typography variant="body2" sx={{ fontSize: '1rem' }}>
                      <strong>Legal porque:</strong><br/>
                      👫 Trabalha junto na hora<br/>
                      🎯 Não precisa configurar<br/>
                      🔒 O dono controla quem entra
                    </Typography>
                  </Alert>
                  
                  <Alert severity="warning" sx={{ textAlign: 'left' }}>
                    <Typography variant="body2" sx={{ fontSize: '1rem' }}>
                      <strong>Só precisa:</strong><br/>
                      🔑 Do código da sala<br/>
                      👤 Alguém te dar o código
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        </Grid>

        <Alert severity="success" sx={{ mt: 4, mb: 3, fontSize: '1.1rem', py: 2 }}>
          <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
            <TipIcon sx={{ fontSize: 20, mr: 1, verticalAlign: 'middle' }} />
            <strong>Não se preocupe!</strong> Você pode mudar de ideia depois! 
            É como trocar de quarto - sempre pode mudar se não gostar! 😊🔄
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={() => setCurrentStep(2)}
            startIcon={<BackIcon />}
            sx={{ fontSize: '1rem', px: 3, py: 1.5 }}
          >
            ← Voltar
          </Button>
          <Button
            variant="contained"
            onClick={() => setCurrentStep(4)}
            endIcon={<NextIcon />}
            sx={{ fontSize: '1rem', px: 3, py: 1.5 }}
          >
            Próximo: Vamos Escolher →
          </Button>
        </Box>
      </Box>
    </Fade>
  );

  // =============================================
  // STEP 5: CONFIGURAÇÃO FINAL (ELI5)
  // =============================================
  const ConfigurationStep = () => (
    <Fade in timeout={800}>
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" textAlign="center" gutterBottom color="primary" fontWeight="bold" sx={{ fontSize: '2.2rem', mb: 2 }}>
          🎉 Agora É Só Escolher!
        </Typography>
        
        <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 4, fontSize: '1.3rem', lineHeight: 1.6 }}>
          Clique na opção que você quer e vamos começar a brincar! 🚀
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
                border: selectedMode === 'local' ? '4px solid' : '3px solid transparent',
                borderColor: selectedMode === 'local' ? 'info.main' : 'transparent',
                transition: 'all 0.3s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
                height: '100%'
              }}
              onClick={() => setSelectedMode('local')}
            >
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <LocalIcon sx={{ fontSize: 70, color: 'info.main', mb: 3 }} />
                <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ fontSize: '1.4rem', mb: 2 }}>
                  💻 No Meu Computador
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.6, mb: 2 }}>
                  Começar agora mesmo!<br/>
                  Rápido e fácil!
                </Typography>
                {selectedMode === 'local' && (
                  <Zoom in timeout={300}>
                    <Box>
                      <CheckCircle sx={{ color: 'success.main', fontSize: 40, mt: 2 }} />
                      <Typography variant="body2" color="success.main" fontWeight="bold" sx={{ mt: 1 }}>
                        ✨ Escolhido!
                      </Typography>
                    </Box>
                  </Zoom>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Opção 2: Modo Nuvem */}
          <Grid item xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                cursor: isSupabaseConfigured() ? 'pointer' : 'not-allowed',
                border: selectedMode === 'cloud' ? '4px solid' : '3px solid transparent',
                borderColor: selectedMode === 'cloud' ? 'primary.main' : 'transparent',
                transition: 'all 0.3s',
                '&:hover': isSupabaseConfigured() ? { transform: 'translateY(-4px)', boxShadow: 6 } : {},
                opacity: !isSupabaseConfigured() ? 0.5 : 1,
                height: '100%'
              }}
              onClick={() => isSupabaseConfigured() && setSelectedMode('cloud')}
            >
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <CloudIcon sx={{ fontSize: 70, color: 'primary.main', mb: 3 }} />
                <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ fontSize: '1.4rem', mb: 2 }}>
                  ☁️ Na Nuvem
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.6, mb: 2 }}>
                  {isSupabaseConfigured() ? 
                    'Acessar de qualquer lugar!<br/>Precisa criar conta!' : 
                    'Não está funcionando<br/>agora 😅'
                  }
                </Typography>
                {selectedMode === 'cloud' && (
                  <Zoom in timeout={300}>
                    <Box>
                      <CheckCircle sx={{ color: 'success.main', fontSize: 40, mt: 2 }} />
                      <Typography variant="body2" color="success.main" fontWeight="bold" sx={{ mt: 1 }}>
                        ✨ Escolhido!
                      </Typography>
                    </Box>
                  </Zoom>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Opção 3: Sala Compartilhada */}
          <Grid item xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: selectedMode === 'shared' ? '4px solid' : '3px solid transparent',
                borderColor: selectedMode === 'shared' ? 'secondary.main' : 'transparent',
                transition: 'all 0.3s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
                height: '100%'
              }}
              onClick={() => setSelectedMode('shared')}
            >
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <SharedIcon sx={{ fontSize: 70, color: 'secondary.main', mb: 3 }} />
                <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ fontSize: '1.4rem', mb: 2 }}>
                  🎮 Sala do Amigo
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.6, mb: 2 }}>
                  Entrar numa sala<br/>que já existe!
                </Typography>
                {selectedMode === 'shared' && (
                  <Zoom in timeout={300}>
                    <Box>
                      <CheckCircle sx={{ color: 'success.main', fontSize: 40, mt: 2 }} />
                      <Typography variant="body2" color="success.main" fontWeight="bold" sx={{ mt: 1 }}>
                        ✨ Escolhido!
                      </Typography>
                    </Box>
                  </Zoom>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Campo para código da sala se modo compartilhado */}
        {selectedMode === 'shared' && (
          <Fade in timeout={500}>
            <Box sx={{ maxWidth: 450, mx: 'auto', mt: 4 }}>
              <Alert severity="info" sx={{ mb: 3, fontSize: '1rem' }}>
                <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                  🔑 <strong>Agora digite o código que seu amigo te deu!</strong>
                </Typography>
              </Alert>
              <TextField
                fullWidth
                label="🔑 Código da Sala do Amigo"
                placeholder="Digite aqui... Ex: ABC123"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                inputProps={{ maxLength: 10 }}
                helperText="Seu amigo precisa te dar esse código primeiro!"
                sx={{
                  '& .MuiInputLabel-root': { fontSize: '1.1rem' },
                  '& .MuiInputBase-input': { fontSize: '1.2rem', textAlign: 'center', fontWeight: 'bold' },
                  '& .MuiFormHelperText-root': { fontSize: '1rem' }
                }}
              />
            </Box>
          </Fade>
        )}

        {/* Informação sobre autenticação para modo nuvem */}
        {selectedMode === 'cloud' && (
          <Fade in timeout={500}>
            <Alert severity="success" sx={{ maxWidth: 500, mx: 'auto', mt: 4, fontSize: '1rem', py: 2 }}>
              <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                🎉 <strong>Que legal!</strong> Depois de finalizar aqui, você vai ver uma tela 
                para criar sua conta ou entrar se já tiver uma! É super fácil! 😊
              </Typography>
            </Alert>
          </Fade>
        )}

        {loading && (
          <Box sx={{ mt: 4 }}>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography variant="h6" textAlign="center" sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              🔧 Preparando tudo para você...
            </Typography>
            <Typography variant="body1" textAlign="center" sx={{ mt: 1, fontSize: '1rem' }}>
              Só um segundinho! ⏳✨
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5 }}>
          <Button
            variant="outlined"
            onClick={() => setCurrentStep(3)}
            startIcon={<BackIcon />}
            disabled={loading}
            sx={{ fontSize: '1rem', px: 3, py: 1.5 }}
          >
            ← Voltar
          </Button>
          <Button
            variant="contained"
            onClick={handleComplete}
            endIcon={<CompleteIcon />}
            disabled={!selectedMode || loading || (selectedMode === 'shared' && !roomCode.trim())}
            size="large"
            sx={{ 
              px: 5, 
              py: 2, 
              fontSize: '1.2rem', 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2 30%, #1BA3D3 90%)',
                transform: 'translateY(-2px)',
                boxShadow: 6
              }
            }}
          >
            {loading ? '🔧 Configurando...' : '🚀 Vamos Começar!'}
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
      case 2: return <InterfaceStep />;
      case 3: return <WorkModesStep />;
      case 4: return <ConfigurationStep />;
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