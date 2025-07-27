import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Paper,
  Chip,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Divider,
  IconButton
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Close as CloseIcon,
  AccessTime as TimeIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useUIContext, MODAL_TYPES } from '../../contexts/UIContext';
import { useTaskContext } from '../../contexts/TaskContext';
import { useFilterContext } from '../../contexts/FilterContext';

// Color constants
const priorityColors = {
  'Alta': '#f44336',
  'Crítica': '#d32f2f', 
  'Média': '#ff9800',
  'Baixa': '#4caf50'
};

const epicColors = {
  'Autenticação': '#e91e63',
  'Componentes': '#9c27b0',
  'Cadastros': '#3f51b5',
  'Parâmetros': '#2196f3',
  'Exames': '#009688',
  'Gráficos': '#4caf50',
  'Sistema de Login': '#e91e63',
  'Dashboard Analytics': '#9c27b0',
  'API REST': '#3f51b5',
  'Interface Mobile': '#2196f3',
  'Relatórios': '#009688'
};

// Task Details Modal Component
const TaskDetailsModal = () => {
  const { ui, isModalOpen, getModalData, closeModal } = useUIContext();
  const { tasks, addTask, updateTask } = useTaskContext();
  const { getUniqueValues } = useFilterContext();

  const isOpen = isModalOpen(MODAL_TYPES.TASK_DETAILS);
  const modalData = getModalData(MODAL_TYPES.TASK_DETAILS);
  const isNewTask = modalData?.isNewTask || false;
  const task = modalData?.task || modalData;

  const [editedTask, setEditedTask] = useState(task || {});
  const [isEditing, setIsEditing] = useState(isNewTask);

  useEffect(() => {
    if (isNewTask) {
      // Default values for new task
      const newTaskDefaults = {
        id: null,
        originalId: null,
        epico: '',
        userStory: '',
        atividade: '',
        detalhamento: '',
        desenvolvedor: '',
        sprint: '',
        status: 'Backlog',
        prioridade: 'Média',
        estimativa: 0,
        tipoAtividade: '',
        tamanhoStory: '',
        tela: '',
        observacoes: '',
        horasMedidas: 0,
        reestimativas: Array(10).fill(0),
        tempoGasto: null,
        taxaErro: null,
        tempoGastoValidado: false,
        motivoErro: null
      };
      setEditedTask(newTaskDefaults);
      setIsEditing(true);
    } else if (task) {
      setEditedTask({ ...task });
      setIsEditing(false);
    }
  }, [task, isNewTask]);

  const getEpicColor = (epic) => epicColors[epic] || '#666666';
  const getPriorityColor = (priority) => priorityColors[priority] || '#757575';

  const handleFieldChange = (field, value) => {
    setEditedTask(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    if (isNewTask) {
      // Create new task
      const newTask = addTask(editedTask);
      closeModal(MODAL_TYPES.TASK_DETAILS);
    } else {
      // Update existing task
      updateTask(editedTask.id, editedTask);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (isNewTask) {
      closeModal(MODAL_TYPES.TASK_DETAILS);
    } else {
      setEditedTask({ ...task });
      setIsEditing(false);
    }
  };

  const handleClose = () => {
    closeModal(MODAL_TYPES.TASK_DETAILS);
  };

  const isValid = editedTask.atividade?.trim() || editedTask.userStory?.trim();

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {isNewTask ? 'Nova Tarefa' : (isEditing ? 'Editando Tarefa' : `Tarefa #${task?.originalId}`)}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!isNewTask && !isEditing && (
              <IconButton
                size="small"
                onClick={() => setIsEditing(true)}
                color="primary"
              >
                <EditIcon />
              </IconButton>
            )}
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Informações Básicas
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Épico"
              value={editedTask.epico || ''}
              onChange={(e) => handleFieldChange('epico', e.target.value)}
              fullWidth
              disabled={!isEditing}
              select={isEditing}
            >
              {isEditing && getUniqueValues(tasks, 'epico').map((epic) => (
                <MenuItem key={epic} value={epic}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box 
                      sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        backgroundColor: getEpicColor(epic) 
                      }} 
                    />
                    {epic}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Sprint"
              value={editedTask.sprint || ''}
              onChange={(e) => handleFieldChange('sprint', e.target.value)}
              fullWidth
              disabled={!isEditing}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="História do Usuário"
              value={editedTask.userStory || ''}
              onChange={(e) => handleFieldChange('userStory', e.target.value)}
              fullWidth
              multiline
              rows={3}
              disabled={!isEditing}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Atividade *"
              value={editedTask.atividade || ''}
              onChange={(e) => handleFieldChange('atividade', e.target.value)}
              fullWidth
              disabled={!isEditing}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Detalhamento"
              value={editedTask.detalhamento || ''}
              onChange={(e) => handleFieldChange('detalhamento', e.target.value)}
              fullWidth
              multiline
              rows={3}
              disabled={!isEditing}
            />
          </Grid>

          {/* Task Details */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Detalhes da Tarefa
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Prioridade</InputLabel>
              <Select
                value={editedTask.prioridade || 'Média'}
                onChange={(e) => handleFieldChange('prioridade', e.target.value)}
                label="Prioridade"
              >
                <MenuItem value="Baixa">Baixa</MenuItem>
                <MenuItem value="Média">Média</MenuItem>
                <MenuItem value="Alta">Alta</MenuItem>
                <MenuItem value="Crítica">Crítica</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Desenvolvedor"
              value={editedTask.desenvolvedor || ''}
              onChange={(e) => handleFieldChange('desenvolvedor', e.target.value)}
              fullWidth
              disabled={!isEditing}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Tipo da Atividade"
              value={editedTask.tipoAtividade || ''}
              onChange={(e) => handleFieldChange('tipoAtividade', e.target.value)}
              fullWidth
              disabled={!isEditing}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Tamanho da Story</InputLabel>
              <Select
                value={editedTask.tamanhoStory || ''}
                onChange={(e) => handleFieldChange('tamanhoStory', e.target.value)}
                label="Tamanho da Story"
              >
                <MenuItem value="">-</MenuItem>
                <MenuItem value="XS">XS</MenuItem>
                <MenuItem value="S">S</MenuItem>
                <MenuItem value="M">M</MenuItem>
                <MenuItem value="L">L</MenuItem>
                <MenuItem value="XL">XL</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Tela"
              value={editedTask.tela || ''}
              onChange={(e) => handleFieldChange('tela', e.target.value)}
              fullWidth
              disabled={!isEditing}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Estimativa (horas)"
              type="number"
              value={editedTask.estimativa || 0}
              onChange={(e) => handleFieldChange('estimativa', parseFloat(e.target.value) || 0)}
              fullWidth
              disabled={!isEditing}
              inputProps={{ min: 0, step: 0.5 }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Observações"
              value={editedTask.observacoes || ''}
              onChange={(e) => handleFieldChange('observacoes', e.target.value)}
              fullWidth
              multiline
              rows={3}
              disabled={!isEditing}
            />
          </Grid>

          {/* Status and Movement (only for existing tasks) */}
          {!isNewTask && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Status e Movimentação
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Chip
                  label={`Status: ${task?.status}`}
                  color="primary"
                  variant="outlined"
                />
              </Grid>
            </>
          )}

          {/* Time Tracking (only for completed tasks) */}
          {!isNewTask && task?.tempoGastoValidado && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Tempo Gasto e Taxa de Erro
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <TimeIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        Tempo Gasto: <strong>{task.tempoGasto}h</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography 
                        variant="body2" 
                        color={task.taxaErro > 20 ? 'error.main' : 'success.main'}
                      >
                        Taxa de Erro: <strong>{task.taxaErro?.toFixed(1)}%</strong>
                      </Typography>
                    </Grid>
                    {task.motivoErro && (
                      <Grid item xs={12}>
                        <Alert severity="warning" sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            <strong>Motivo do erro:</strong> {task.motivoErro}
                          </Typography>
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>
            </>
          )}

          {/* Timestamps (only for existing tasks) */}
          {!isNewTask && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Informações do Sistema
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Criado em: {task?.createdAt ? new Date(task.createdAt).toLocaleString() : 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Atualizado em: {task?.updatedAt ? new Date(task.updatedAt).toLocaleString() : 'N/A'}
                </Typography>
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        {isEditing ? (
          <>
            <Button
              onClick={handleCancel}
              startIcon={<CancelIcon />}
              color="inherit"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              startIcon={isNewTask ? <AddIcon /> : <SaveIcon />}
              variant="contained"
              disabled={!isValid}
            >
              {isNewTask ? 'Criar Tarefa' : 'Salvar Alterações'}
            </Button>
          </>
        ) : (
          <Button onClick={handleClose} color="primary">
            Fechar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// Time Validation Modal Component
const TimeValidationModal = () => {
  const { isModalOpen, getModalData, closeModal } = useUIContext();
  const { updateTask } = useTaskContext();

  const isOpen = isModalOpen(MODAL_TYPES.TIME_VALIDATION);
  const task = getModalData(MODAL_TYPES.TIME_VALIDATION);

  const [tempoGasto, setTempoGasto] = useState('');
  const [motivoErro, setMotivoErro] = useState('');

  useEffect(() => {
    if (task) {
      setTempoGasto(task.tempoGasto || '');
      setMotivoErro(task.motivoErro || '');
    }
  }, [task]);

  const taxaErro = tempoGasto && task?.estimativa ? 
    ((tempoGasto / task.estimativa - 1) * 100) : 0;
  const taxaErroPositiva = Math.max(0, taxaErro);

  const handleSave = () => {
    const updatedTask = {
      ...task,
      tempoGasto: parseFloat(tempoGasto),
      taxaErro: taxaErroPositiva,
      tempoGastoValidado: true,
      motivoErro: taxaErroPositiva > 20 ? motivoErro : null,
      status: 'Done'
    };

    updateTask(task.id, updatedTask);
    closeModal(MODAL_TYPES.TIME_VALIDATION);

    // Reset form
    setTempoGasto('');
    setMotivoErro('');
  };

  const isValid = tempoGasto && (taxaErroPositiva <= 20 || motivoErro.trim());

  if (!isOpen || !task) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={() => closeModal(MODAL_TYPES.TIME_VALIDATION)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Validação Obrigatória - Tempo Gasto
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Para finalizar a tarefa "<strong>{task.atividade}</strong>", 
          é obrigatório informar o tempo gasto.
        </Alert>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Estimativa inicial: <strong>{task.estimativa}h</strong>
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Tempo Gasto (horas) *"
              type="number"
              value={tempoGasto}
              onChange={(e) => setTempoGasto(e.target.value)}
              fullWidth
              required
              inputProps={{ min: 0.1, step: 0.1 }}
            />
          </Grid>

          {tempoGasto && (
            <Grid item xs={12}>
              <TextField
                label="Taxa de Erro Calculada"
                value={`${taxaErroPositiva.toFixed(1)}%`}
                fullWidth
                disabled
                color={taxaErroPositiva > 20 ? 'error' : 'success'}
              />
            </Grid>
          )}

          {taxaErroPositiva > 20 && (
            <Grid item xs={12}>
              <TextField
                label="Motivo do Erro (obrigatório para taxas > 20%) *"
                value={motivoErro}
                onChange={(e) => setMotivoErro(e.target.value)}
                fullWidth
                multiline
                rows={3}
                required
                helperText="Explique o que causou a diferença significativa entre estimativa e tempo real"
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <Alert severity="info">
              O preenchimento correto do tempo gasto é fundamental para melhorar 
              a precisão das estimativas futuras da equipe.
            </Alert>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={() => closeModal(MODAL_TYPES.TIME_VALIDATION)}
          color="inherit"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!isValid}
          startIcon={<SaveIcon />}
        >
          Finalizar Tarefa
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Main TaskModals component that renders all modals
const TaskModals = () => {
  return (
    <>
      <TaskDetailsModal />
      <TimeValidationModal />
    </>
  );
};

export default TaskModals;
export { TaskDetailsModal, TimeValidationModal };