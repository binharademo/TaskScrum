import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Storage as StorageIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

// Services
import { loadTasksFromStorage, getAvailableRooms, saveTasksToStorage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { SupabaseService } from '../services/SupabaseService';
import { isSupabaseConfigured } from '../config/supabase';

const MigrationWizard = ({ open, onClose, onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [localData, setLocalData] = useState({
    rooms: [],
    totalTasks: 0,
    tasksByRoom: {}
  });
  const [migrationResults, setMigrationResults] = useState({
    roomsCreated: 0,
    tasksMigrated: 0,
    errors: []
  });

  const auth = useAuth();
  const supabaseService = new SupabaseService();

  const steps = [
    'Analisar Dados Locais',
    'Confirmar Migração', 
    'Executar Migração',
    'Concluído'
  ];

  // Carregar dados locais para análise
  useEffect(() => {
    if (open && activeStep === 0) {
      analyzeLocalData();
    }
  }, [open, activeStep]);

  const analyzeLocalData = () => {
    try {
      setLoading(true);
      
      const availableRooms = getAvailableRooms();
      const tasksByRoom = {};
      let totalTasks = 0;

      availableRooms.forEach(roomCode => {
        const tasks = loadTasksFromStorage(roomCode);
        tasksByRoom[roomCode] = tasks;
        totalTasks += tasks.length;
      });

      setLocalData({
        rooms: availableRooms,
        totalTasks,
        tasksByRoom
      });

      setActiveStep(1);
    } catch (error) {
      setError('Erro ao analisar dados locais: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const executeMigration = async () => {
    try {
      setLoading(true);
      setError('');
      
      const results = {
        roomsCreated: 0,
        tasksMigrated: 0,
        errors: []
      };

      // Para cada sala local
      for (const roomCode of localData.rooms) {
        try {
          // Verificar se sala já existe no Supabase
          let room = await supabaseService.findRoomByCode(roomCode);
          
          if (!room) {
            // Criar sala no Supabase
            room = await supabaseService.createRoom({
              name: `Sala ${roomCode}`,
              room_code: roomCode,
              is_public: false
            });
            results.roomsCreated++;
          }

          // Migrar tarefas da sala
          const tasks = localData.tasksByRoom[roomCode];
          
          for (const task of tasks) {
            try {
              // Adaptar formato para Supabase
              const supabaseTask = {
                ...task,
                room_id: room.id,
                // Garantir campos obrigatórios
                atividade: task.atividade || 'Tarefa migrada',
                status: task.status || 'Backlog',
                estimativa: task.estimativa || 0,
                created_at: task.createdAt || new Date().toISOString(),
                updated_at: task.updatedAt || new Date().toISOString()
              };

              await supabaseService.createTask(supabaseTask);
              results.tasksMigrated++;
              
            } catch (taskError) {
              console.error('Erro ao migrar tarefa:', taskError);
              results.errors.push(`Tarefa "${task.atividade}": ${taskError.message}`);
            }
          }
          
        } catch (roomError) {
          console.error('Erro ao migrar sala:', roomError);
          results.errors.push(`Sala "${roomCode}": ${roomError.message}`);
        }
      }

      setMigrationResults(results);
      setActiveStep(3); // Concluído
      
    } catch (error) {
      setError('Erro na migração: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 1) {
      setActiveStep(2);
      setTimeout(() => executeMigration(), 500);
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleClose = () => {
    if (activeStep === 3 && onComplete) {
      onComplete(migrationResults);
    }
    onClose();
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Analisando dados locais...</Typography>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Dados encontrados no localStorage:</strong>
              </Typography>
              <Typography variant="body2">
                • {localData.rooms.length} salas
                <br />
                • {localData.totalTasks} tarefas total
              </Typography>
            </Alert>

            <Typography variant="h6" gutterBottom>
              📁 Salas que serão migradas:
            </Typography>
            
            <List dense>
              {localData.rooms.map(roomCode => (
                <ListItem key={roomCode}>
                  <ListItemText
                    primary={roomCode}
                    secondary={`${localData.tasksByRoom[roomCode]?.length || 0} tarefas`}
                  />
                  <Chip 
                    label={`${localData.tasksByRoom[roomCode]?.length || 0} tarefas`}
                    size="small"
                    color="primary"
                  />
                </ListItem>
              ))}
            </List>

            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>⚠️ Importante:</strong>
                <br />
                • A migração criará salas e tarefas no Supabase
                <br />
                • Os dados locais serão mantidos como backup
                <br />
                • Certifique-se de estar conectado à internet
              </Typography>
            </Alert>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Migrando dados para o Supabase...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Isso pode levar alguns minutos dependendo da quantidade de dados.
            </Typography>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <CheckIcon sx={{ fontSize: 60, color: 'success.main', mb: 1 }} />
              <Typography variant="h5" gutterBottom>
                Migração Concluída!
              </Typography>
            </Box>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="success.main">
                  ✅ Resultados da Migração:
                </Typography>
                <Typography>• {migrationResults.roomsCreated} salas criadas</Typography>
                <Typography>• {migrationResults.tasksMigrated} tarefas migradas</Typography>
              </CardContent>
            </Card>

            {migrationResults.errors.length > 0 && (
              <Alert severity="warning">
                <Typography variant="body2" gutterBottom>
                  <strong>⚠️ Alguns erros ocorreram:</strong>
                </Typography>
                {migrationResults.errors.slice(0, 5).map((error, index) => (
                  <Typography key={index} variant="body2" sx={{ fontSize: '0.8rem' }}>
                    • {error}
                  </Typography>
                ))}
                {migrationResults.errors.length > 5 && (
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontStyle: 'italic' }}>
                    ... e mais {migrationResults.errors.length - 5} erros
                  </Typography>
                )}
              </Alert>
            )}

            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>🎉 Próximos passos:</strong>
                <br />
                • Seus dados agora estão no Supabase
                <br />
                • Continue usando o TaskTracker normalmente
                <br />
                • Os dados serão automaticamente sincronizados
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Migração não Disponível</DialogTitle>
        <DialogContent>
          <Alert severity="error">
            <Typography>
              Supabase não está configurado. Configure as credenciais no arquivo .env.local para usar a migração.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fechar</Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (!auth?.isAuthenticated) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Login Necessário</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            <Typography>
              Você precisa estar logado no Supabase para migrar os dados. Faça login primeiro.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fechar</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <UploadIcon />
        Migração para Supabase
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {renderStepContent()}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          {activeStep === 3 ? 'Finalizar' : 'Cancelar'}
        </Button>
        
        {activeStep === 1 && (
          <Button 
            onClick={handleNext} 
            variant="contained"
            disabled={loading || localData.totalTasks === 0}
            startIcon={<UploadIcon />}
          >
            Iniciar Migração
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MigrationWizard;