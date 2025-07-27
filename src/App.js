import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Box, 
  Tabs, 
  Tab,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle,
  Collapse,
  Fade,
  Chip,
  CircularProgress
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  ShowChart as BurndownIcon,
  Speed as SpeedIcon,
  Psychology as PsychologyIcon,
  Upload as UploadIcon,
  Brightness4,
  Brightness7,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Group as GroupIcon,
  CloudSync as CloudSyncIcon,
  Share as ShareIcon,
  Google as GoogleIcon
} from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import SimpleKanban from './components/SimpleKanban';
import TableView from './components/TableView';
import WIPControl from './components/WIPControl';
import PredictiveAnalysis from './components/PredictiveAnalysis';
import GoogleSheetsSimple from './components/GoogleSheetsSimple';
import ProjectSharing from './components/ProjectSharing';
import DemoModeInfo from './components/DemoModeInfo';
import { loadTasksFromStorage, saveTasksToStorage, getCurrentRoom, setCurrentRoom } from './utils/storage';
import RoomSelector from './components/RoomSelector';
import { importExcelFile } from './utils/excelImport';
import { loadSampleData } from './utils/sampleData';
// Removido: simpleSheets - usando abordagem mais simples
import { generateDemoData, getDemoDescription } from './services/demoData';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [currentRoom, setCurrentRoomState] = useState('');
  const [roomSelectorOpen, setRoomSelectorOpen] = useState(false);
  
  // Google Sheets integration
  const [user, setUser] = useState(null);
  const [projectInfo, setProjectInfo] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [showGoogleAuth, setShowGoogleAuth] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoDescription, setDemoDescription] = useState(null);

  // Função para calcular violações WIP globalmente
  const calculateWIPViolations = () => {
    const savedConfig = localStorage.getItem('wipConfig');
    if (!savedConfig) return [];

    const config = JSON.parse(savedConfig);
    const limits = config.limits || {};
    
    const statusCounts = {
      'Backlog': 0,
      'Priorizado': 0,
      'Doing': 0,
      'Done': 0
    };

    tasks.forEach(task => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    });

    const violations = [];
    Object.entries(limits).forEach(([status, limit]) => {
      if (limit && statusCounts[status] > limit) {
        violations.push({
          status,
          current: statusCounts[status],
          limit,
          excess: statusCounts[status] - limit
        });
      }
    });

    return violations;
  };

  const wipViolations = calculateWIPViolations();

  useEffect(() => {
    const initializeApp = async () => {
      // Modo local por padrão - só mostra Google se usuário solicitar
      // Limpar configuração anterior se houver
      const shouldShowGoogle = localStorage.getItem('useGoogleSheets') === 'true';
      setShowGoogleAuth(shouldShowGoogle);
      
      // Se não for para mostrar Google, continue com modo local
      if (shouldShowGoogle) {
        return;
      }
      
      // Verificar sala atual
      const room = getCurrentRoom();
      setCurrentRoomState(room || '');
      
      // Se não há sala selecionada, abrir seletor
      if (!room) {
        setRoomSelectorOpen(true);
        return;
      }
      
      // Carregar dados da sala atual
      const savedTasks = loadTasksFromStorage();
      const wasCleared = localStorage.getItem('tasksCleared') === 'true';
      
      if (savedTasks.length > 0) {
        // Migrar tarefas existentes para incluir reestimativas
        const migratedTasks = savedTasks.map(task => ({
          ...task,
          reestimativas: task.reestimativas || Array.from({ length: 10 }, () => task.estimativa || 0)
        }));
        setTasks(migratedTasks);
        saveTasksToStorage(migratedTasks);
      } else if (!wasCleared) {
        // Só carrega dados de exemplo se não foi zerado pelo usuário
        const sampleTasks = await loadSampleData();
        if (sampleTasks.length > 0) {
          // Garantir que todas as tarefas tenham o campo reestimativas
          const tasksWithReestimativas = sampleTasks.map(task => ({
            ...task,
            reestimativas: task.reestimativas || Array.from({ length: 10 }, () => task.estimativa || 0)
          }));
          setTasks(tasksWithReestimativas);
          saveTasksToStorage(tasksWithReestimativas);
        }
      }
      
      const savedTheme = localStorage.getItem('darkMode');
      if (savedTheme) {
        setDarkMode(JSON.parse(savedTheme));
      }
      
      // Verificar se está no modo demo específico da sala atual
      if (room) {
        const roomDemoMode = localStorage.getItem(`demoMode_${room}`) === 'true';
        setIsDemoMode(roomDemoMode);
        
        if (roomDemoMode) {
          const roomDemoDescription = localStorage.getItem(`demoDescription_${room}`);
          if (roomDemoDescription) {
            setDemoDescription(JSON.parse(roomDemoDescription));
          }
        }
      } else {
        // Verificar modo demo global (legado)
        const demoMode = localStorage.getItem('demoMode') === 'true';
        setIsDemoMode(demoMode);
        
        if (demoMode) {
          const savedDescription = localStorage.getItem('demoDescription');
          if (savedDescription) {
            setDemoDescription(JSON.parse(savedDescription));
          }
        }
      }
    };
    
    initializeApp();
    
    // Monitorar status de conexão
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Monitorar sincronização
    const handleSyncComplete = (event) => {
      setSyncStatus('success');
      setTasks(event.detail.tasks);
      setTimeout(() => setSyncStatus(null), 3000);
    };
    
    const handleSyncError = (event) => {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus(null), 5000);
    };
    
    window.addEventListener('tasktracker-sync-complete', handleSyncComplete);
    window.addEventListener('tasktracker-sync-error', handleSyncError);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('tasktracker-sync-complete', handleSyncComplete);
      window.removeEventListener('tasktracker-sync-error', handleSyncError);
    };
  }, []);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleTasksUpdate = (updatedTasks) => {
    // Garantir que todas as tarefas tenham timestamps
    const tasksWithTimestamps = updatedTasks.map(task => ({
      ...task,
      updatedAt: task.updatedAt || new Date().toISOString(),
      createdAt: task.createdAt || new Date().toISOString(),
      dataAtualizacao: new Date().toISOString()
    }));
    
    setTasks(tasksWithTimestamps);
    saveTasksToStorage(tasksWithTimestamps);
    
    // Se carregando novos dados, remover flag de "zerado"
    if (tasksWithTimestamps.length > 0) {
      localStorage.removeItem('tasksCleared');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const importedTasks = await importExcelFile(file);
        handleTasksUpdate(importedTasks);
      } catch (error) {
        console.error('Error importing Excel file:', error);
      }
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
  };

  const handleClearTasks = () => {
    if (window.confirm('Tem certeza que deseja zerar todas as atividades? Esta ação não pode ser desfeita.')) {
      setTasks([]);
      saveTasksToStorage([]);
      // Marcar que a base foi zerada para não recarregar dados de exemplo
      localStorage.setItem('tasksCleared', 'true');
      // Remover modo demo se estiver ativo na sala atual
      if (currentRoom) {
        localStorage.removeItem(`demoMode_${currentRoom}`);
        localStorage.removeItem(`demoDescription_${currentRoom}`);
      }
      // Remover modo demo global (legado)
      localStorage.removeItem('demoMode');
      localStorage.removeItem('demoDescription');
      setIsDemoMode(false);
      setDemoDescription(null);
    }
  };

  const handleRoomSelected = (roomCode) => {
    setCurrentRoomState(roomCode);
    setRoomSelectorOpen(false);
    
    // Carregar dados da nova sala
    const roomTasks = loadTasksFromStorage(roomCode);
    const migratedTasks = roomTasks.map(task => ({
      ...task,
      reestimativas: task.reestimativas || Array.from({ length: 10 }, () => task.estimativa || 0)
    }));
    setTasks(migratedTasks);
    
    // Verificar se a nova sala tem modo demo específico
    const roomDemoMode = localStorage.getItem(`demoMode_${roomCode}`) === 'true';
    setIsDemoMode(roomDemoMode);
    
    if (roomDemoMode) {
      const roomDemoDescription = localStorage.getItem(`demoDescription_${roomCode}`);
      if (roomDemoDescription) {
        setDemoDescription(JSON.parse(roomDemoDescription));
      }
    } else {
      setDemoDescription(null);
    }
  };

  const handleOpenRoomSelector = () => {
    setRoomSelectorOpen(true);
  };

  const handleDownloadData = () => {
    const dataToExport = {
      tasks,
      exportDate: new Date().toISOString(),
      totalTasks: tasks.length,
      metadata: {
        version: '1.0',
        source: 'TaskTracker'
      }
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `tasktracker-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Handlers para Google Sheets - versão simplificada
  const handleGoogleAuthSuccess = async (user, project) => {
    setUser(user);
    setProjectInfo(project);
    setShowGoogleAuth(false);
  };
  
  const handleGoogleAuthError = (error) => {
    console.error('Erro na autenticação Google:', error);
  };
  
  const handleToggleGoogleSheets = () => {
    if (showGoogleAuth) {
      // Voltar para modo local
      setShowGoogleAuth(false);
      localStorage.removeItem('useGoogleSheets');
      setUser(null);
      setProjectInfo(null);
    } else {
      // Ir para modo Google
      setShowGoogleAuth(true);
      localStorage.setItem('useGoogleSheets', 'true');
    }
  };
  
  const handleManualSync = () => {
    // Versão simplificada - apenas mostra opção Google Sheets
    setShowGoogleAuth(true);
  };
  
  const handleDemoMode = () => {
    // Carregar dados de demonstração
    const demoTasks = generateDemoData();
    const demoDescription = getDemoDescription();
    
    // Criar uma sala específica para demo
    const demoRoomCode = 'DEMO-' + Date.now();
    setCurrentRoomState(demoRoomCode);
    setCurrentRoom(demoRoomCode);
    
    // Salvar dados demo na sala específica
    handleTasksUpdate(demoTasks);
    
    // Salvar flag de modo demo específico por sala
    localStorage.setItem(`demoMode_${demoRoomCode}`, 'true');
    localStorage.setItem(`demoDescription_${demoRoomCode}`, JSON.stringify(demoDescription));
    setIsDemoMode(true);
    setDemoDescription(demoDescription);
    
    // Sair do modo Google Auth
    setShowGoogleAuth(false);
    localStorage.removeItem('useGoogleSheets');
    
    // Mostrar notificação de sucesso
    console.log('Modo Demo ativado com', demoTasks.length, 'tarefas de exemplo');
  };
  
  const handleCloseDemoInfo = () => {
    setDemoDescription(null);
  };

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              TaskTracker - Gestão de Tarefas
              {currentRoom && (
                <Typography variant="caption" sx={{ ml: 2, opacity: 0.8 }}>
                  Sala: {currentRoom}
                </Typography>
              )}
              {isDemoMode && (
                <Chip
                  label="MODO DEMO"
                  color="success"
                  size="small"
                  sx={{ ml: 2, fontWeight: 'bold' }}
                />
              )}
            </Typography>
            
            {!showGoogleAuth && (
              <Tooltip title="Trocar de sala">
                <IconButton color="inherit" onClick={handleOpenRoomSelector}>
                  <GroupIcon />
                </IconButton>
              </Tooltip>
            )}
            
            <Tooltip title={showGoogleAuth ? "Modo Local" : "Modo Google Sheets"}>
              <IconButton color="inherit" onClick={handleToggleGoogleSheets}>
                <GoogleIcon />
              </IconButton>
            </Tooltip>
            
            {user && (
              <>
                <Tooltip title="Sincronizar agora">
                  <IconButton color="inherit" onClick={handleManualSync} disabled={!isOnline}>
                    {syncStatus === 'syncing' ? <CircularProgress size={20} /> : <CloudSyncIcon />}
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Compartilhar projeto">
                  <IconButton color="inherit" onClick={() => setCurrentTab(4)}>
                    <ShareIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
            
            {/* Status de sincronização */}
            {syncStatus && (
              <Box sx={{ ml: 1 }}>
                <Chip
                  label={
                    syncStatus === 'syncing' ? 'Sincronizando...' :
                    syncStatus === 'success' ? 'Sincronizado' :
                    syncStatus === 'error' ? 'Erro na sincronização' : ''
                  }
                  color={
                    syncStatus === 'syncing' ? 'info' :
                    syncStatus === 'success' ? 'success' :
                    syncStatus === 'error' ? 'error' : 'default'
                  }
                  size="small"
                />
              </Box>
            )}
            
            {!isOnline && (
              <Chip
                label="Offline"
                color="warning"
                size="small"
                sx={{ ml: 1 }}
              />
            )}
            
            <input
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              id="excel-upload"
              type="file"
              onChange={handleFileUpload}
            />
            <label htmlFor="excel-upload">
              <Tooltip title="Importar Excel/CSV">
                <IconButton color="inherit" component="span">
                  <UploadIcon />
                </IconButton>
              </Tooltip>
            </label>
            
            <Tooltip title="Download de todos os dados">
              <IconButton color="inherit" onClick={handleDownloadData}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Zerar todas as atividades">
              <IconButton color="inherit" onClick={handleClearTasks}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Alternar tema">
              <IconButton color="inherit" onClick={toggleDarkMode}>
                {darkMode ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>
        
        {/* Alertas WIP Globais */}
        <Fade in={wipViolations.length > 0}>
          <Box sx={{ 
            position: 'sticky', 
            top: 64, 
            zIndex: 1000,
            mx: 2,
            mt: 1
          }}>
            <Alert 
              severity="warning" 
              sx={{ 
                boxShadow: 3,
                borderRadius: 2,
                border: '1px solid #ed6c02'
              }}
            >
              <AlertTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  ⚠️ Limites WIP Violados
                  <Box 
                    component="span" 
                    sx={{ 
                      backgroundColor: 'warning.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {wipViolations.length}
                  </Box>
                </Box>
              </AlertTitle>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {wipViolations.map((violation, index) => (
                  <Typography key={violation.status} variant="body2">
                    • <strong>{violation.status}</strong>: {violation.current} tarefas 
                    (limite: {violation.limit}) - 
                    <span style={{ color: 'red', fontWeight: 'bold' }}> 
                      {violation.excess} acima do limite
                    </span>
                  </Typography>
                ))}
              </Box>
            </Alert>
          </Box>
        </Fade>
        
        <Container maxWidth="xl">
          {showGoogleAuth ? (
            <Box sx={{ mt: 4 }}>
              <GoogleSheetsSimple 
                onBackToLocal={handleToggleGoogleSheets}
                onDemoMode={handleDemoMode}
              />
            </Box>
          ) : (
            <>
              {/* Informações do Modo Demo */}
              {demoDescription && (
                <DemoModeInfo
                  demoDescription={demoDescription}
                  onClose={handleCloseDemoInfo}
                />
              )}
              
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={currentTab} onChange={handleTabChange}>
                  <Tab 
                    icon={<DashboardIcon />} 
                    label="Kanban" 
                    iconPosition="start"
                  />
                  <Tab 
                    icon={<BurndownIcon />} 
                    label="Burndown" 
                    iconPosition="start"
                  />
                  <Tab 
                    icon={<SpeedIcon />} 
                    label="WIP" 
                    iconPosition="start"
                  />
                  <Tab 
                    icon={<PsychologyIcon />} 
                    label="Análise Preditiva" 
                    iconPosition="start"
                  />
                  {user && (
                    <Tab 
                      icon={<ShareIcon />} 
                      label="Compartilhar" 
                      iconPosition="start"
                    />
                  )}
                </Tabs>
              </Box>
              
              <TabPanel value={currentTab} index={0}>
                <SimpleKanban tasks={tasks} onTasksUpdate={handleTasksUpdate} />
              </TabPanel>
              
              <TabPanel value={currentTab} index={1}>
                <TableView tasks={tasks} onTasksUpdate={handleTasksUpdate} />
              </TabPanel>
              
              <TabPanel value={currentTab} index={2}>
                <WIPControl tasks={tasks} onTasksUpdate={handleTasksUpdate} />
              </TabPanel>
              
              <TabPanel value={currentTab} index={3}>
                <PredictiveAnalysis tasks={tasks} />
              </TabPanel>
              
              {user && (
                <TabPanel value={currentTab} index={4}>
                  <ProjectSharing 
                    projectInfo={projectInfo} 
                    onUpdate={setProjectInfo}
                  />
                </TabPanel>
              )}
            </>
          )}
        </Container>
        
        {!showGoogleAuth && (
          <RoomSelector 
            open={roomSelectorOpen}
            onRoomSelected={handleRoomSelected}
          />
        )}
      </Box>
    </ThemeProvider>
  );
}

export default App;