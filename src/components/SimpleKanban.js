import React, { useState, useEffect } from 'react';
import { validateWipLimits } from './WIPControl';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Badge,
  Button,
  Collapse,
  Divider,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  FormControl,
  InputLabel,
  Select,
  Alert
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Comment as CommentIcon,
  Attachment as AttachmentIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  BookmarkBorder as EpicIcon,
  Assignment as TaskIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Schedule as ScheduleIcon,
  Category as CategoryIcon,
  ViewCompact as ViewCompactIcon,
  ViewList as ViewListIcon
} from '@mui/icons-material';

const columns = [
  { id: 'Backlog', title: 'Backlog', color: '#e3f2fd' },
  { id: 'Priorizado', title: 'Priorizado', color: '#fff3e0' },
  { id: 'Doing', title: 'Doing', color: '#e8f5e8' },
  { id: 'Done', title: 'Done', color: '#f3e5f5' }
];

const priorityColors = {
  'Alta': '#f44336',
  'Média': '#ff9800',
  'Baixa': '#4caf50'
};

const epicColors = {
  'Autenticação': '#e91e63',
  'Componentes': '#9c27b0',
  'Cadastros': '#3f51b5',
  'Parâmetros': '#2196f3',
  'Exames': '#009688',
  'Gráficos': '#4caf50'
};

const getInitials = (name) => {
  if (!name) return '';
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
};

const TaskDetailsModal = ({ task, open, onClose, onStatusChange, onTasksUpdate }) => {
  const [editedTask, setEditedTask] = useState(task);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setEditedTask(task);
    setIsEditing(false); // Reset editing mode when task changes
  }, [task]);

  if (!task) return null;

  const getEpicColor = (epic) => epicColors[epic] || '#666666';
  const getPriorityColor = (priority) => priorityColors[priority] || '#757575';

  const handleFieldChange = (field, value) => {
    setEditedTask(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    if (editedTask && onTasksUpdate) {
      // Chamar a função de atualização diretamente
      onTasksUpdate(editedTask);
      setIsEditing(false);
      onClose();
    }
  };

  const handleCancel = () => {
    setEditedTask(task); // Reset changes
    setIsEditing(false);
  };

  const handleMoveTask = (newStatus) => {
    onStatusChange(task.id, newStatus);
    onClose(); // Fechar modal após mover
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon color="primary" />
            <Typography variant="h6">
              {isEditing ? 'Editando' : 'Detalhes da'} Tarefa #{task.originalId}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant={isEditing ? "contained" : "outlined"}
              size="small"
              onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
              startIcon={<EditIcon />}
            >
              {isEditing ? 'Cancelar' : 'Editar'}
            </Button>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3}>
          {/* Épico */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <EpicIcon sx={{ color: getEpicColor(isEditing ? editedTask.epico : task.epico) }} />
              {isEditing ? (
                <TextField
                  select
                  label="Épico"
                  value={editedTask.epico || ''}
                  onChange={(e) => handleFieldChange('epico', e.target.value)}
                  size="small"
                  sx={{ minWidth: 200 }}
                >
                  {Object.keys(epicColors).map(epic => (
                    <MenuItem key={epic} value={epic}>{epic}</MenuItem>
                  ))}
                </TextField>
              ) : (
                <Typography variant="h6" sx={{ color: getEpicColor(task.epico) }}>
                  {task.epico}
                </Typography>
              )}
            </Box>
            <Chip
              label={isEditing ? editedTask.epico : task.epico}
              sx={{
                bgcolor: getEpicColor(isEditing ? editedTask.epico : task.epico),
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          </Box>

          {/* User Story */}
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              História do Usuário
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                multiline
                rows={3}
                value={editedTask.userStory || ''}
                onChange={(e) => handleFieldChange('userStory', e.target.value)}
                variant="outlined"
                placeholder="Descreva a história do usuário..."
              />
            ) : (
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body1">
                  {task.userStory}
                </Typography>
              </Paper>
            )}
          </Box>

          {/* Atividade */}
          {(task.atividade || isEditing) && (
            <Box>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Atividade
              </Typography>
              {isEditing ? (
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={editedTask.atividade || ''}
                  onChange={(e) => handleFieldChange('atividade', e.target.value)}
                  variant="outlined"
                  placeholder="Descreva a atividade..."
                />
              ) : (
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body1">
                    {task.atividade}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}

          {/* Detalhamento */}
          {(task.detalhamento || isEditing) && (
            <Box>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Detalhamento
              </Typography>
              {isEditing ? (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={editedTask.detalhamento || ''}
                  onChange={(e) => handleFieldChange('detalhamento', e.target.value)}
                  variant="outlined"
                  placeholder="Adicione detalhes técnicos..."
                />
              ) : (
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body1">
                    {task.detalhamento}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}

          {/* Informações Gerais */}
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Informações Gerais
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Prioridade:
                  </Typography>
                  {isEditing ? (
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={editedTask.prioridade || ''}
                        onChange={(e) => handleFieldChange('prioridade', e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="Baixa">Baixa</MenuItem>
                        <MenuItem value="Média">Média</MenuItem>
                        <MenuItem value="Alta">Alta</MenuItem>
                        <MenuItem value="Crítica">Crítica</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Chip
                      label={task.prioridade}
                      size="small"
                      sx={{
                        bgcolor: getPriorityColor(task.prioridade),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CategoryIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Tipo:
                  </Typography>
                  <Typography variant="body2">
                    {task.tipoAtividade || 'Não especificado'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Desenvolvedor:
                  </Typography>
                  {isEditing ? (
                    <TextField
                      size="small"
                      value={editedTask.desenvolvedor || ''}
                      onChange={(e) => handleFieldChange('desenvolvedor', e.target.value)}
                      sx={{ minWidth: 120 }}
                      placeholder="Nome do desenvolvedor"
                    />
                  ) : (
                    <>
                      <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                        {getInitials(task.desenvolvedor)}
                      </Avatar>
                      <Typography variant="body2">
                        {task.desenvolvedor}
                      </Typography>
                    </>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ScheduleIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Sprint:
                  </Typography>
                  <Typography variant="body2">
                    {task.sprint || 'Não atribuído'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Tamanho:
                  </Typography>
                  <Typography variant="body2">
                    {task.tamanhoStory || 'Não definido'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Tela:
                  </Typography>
                  <Typography variant="body2">
                    {task.tela || 'Não especificado'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Progresso de Horas */}
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Progresso de Horas
            </Typography>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Estimativa: {task.estimativa || 0}h
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Trabalhado: {task.horasMedidas || 0}h
                </Typography>
              </Box>
              {task.estimativa > 0 && (
                <LinearProgress
                  variant="determinate"
                  value={Math.min(((task.horasMedidas || 0) / task.estimativa) * 100, 100)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    '& .MuiLinearProgress-bar': {
                      bgcolor: task.horasMedidas > task.estimativa ? 'error.main' : 'success.main'
                    }
                  }}
                />
              )}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {task.horasMedidas > task.estimativa ? 
                  `${((task.horasMedidas / task.estimativa - 1) * 100).toFixed(1)}% acima da estimativa` :
                  `${((task.horasMedidas || 0) / task.estimativa * 100).toFixed(1)}% concluído`
                }
              </Typography>
            </Paper>
          </Box>

          {/* Tempo Gasto e Taxa de Erro */}
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Tempo Gasto e Taxa de Erro
            </Typography>
            <Paper sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Tempo Gasto:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {task.tempoGasto ? `${task.tempoGasto}h` : 'Não informado'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Taxa de Erro:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight="bold"
                      color={task.taxaErro > 20 ? 'error.main' : 'success.main'}
                    >
                      {task.taxaErro ? `${task.taxaErro.toFixed(1)}%` : 'Não calculada'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              {task.motivoErro && (
                <Box sx={{ mt: 2, p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Motivo da Taxa de Erro:</strong>
                  </Typography>
                  <Typography variant="body2">
                    {task.motivoErro}
                  </Typography>
                </Box>
              )}
              
              {task.status === 'Done' && !task.tempoGastoValidado && (
                <Box sx={{ mt: 2, p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
                  <Typography variant="body2" color="error.main">
                    ⚠️ Tarefa finalizada sem validação de tempo gasto
                  </Typography>
                </Box>
              )}
              
              {task.status !== 'Done' && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  💡 O tempo gasto será solicitado ao finalizar a tarefa
                </Typography>
              )}
            </Paper>
          </Box>

          {/* Observações */}
          {task.observacoes && (
            <Box>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Observações
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                <Typography variant="body1">
                  {task.observacoes}
                </Typography>
              </Paper>
            </Box>
          )}

          {/* Status e Movimentação */}
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Status e Movimentação
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {columns.map((column) => (
                <Button
                  key={column.id}
                  variant={task.status === column.id ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => handleMoveTask(column.id)}
                  sx={{ minWidth: 100 }}
                >
                  {column.title}
                </Button>
              ))}
            </Box>
          </Box>

          {/* Timestamps */}
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Informações de Sistema
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Criado em: {new Date(task.createdAt).toLocaleString('pt-BR')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Atualizado em: {new Date(task.updatedAt).toLocaleString('pt-BR')}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Fechar
        </Button>
        {isEditing && (
          <Button 
            onClick={handleSave} 
            color="primary" 
            variant="contained"
            disabled={!editedTask?.userStory?.trim()}
          >
            Salvar Alterações
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const CompactTaskCard = ({ task, onStatusChange, onTasksUpdate, allTasks }) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleCardClick = (e) => {
    if (e.target.closest('button')) return;
    setDetailsOpen(true);
  };

  const handleMoveTask = (newStatus) => {
    onStatusChange(task.id, newStatus);
    setDetailsOpen(false);
  };

  const getNextStatus = () => {
    const currentIndex = columns.findIndex(col => col.id === task.status);
    if (currentIndex < columns.length - 1) {
      return columns[currentIndex + 1].id;
    }
    return null;
  };

  const getPreviousStatus = () => {
    const currentIndex = columns.findIndex(col => col.id === task.status);
    if (currentIndex > 0) {
      return columns[currentIndex - 1].id;
    }
    return null;
  };

  const nextStatus = getNextStatus();
  const previousStatus = getPreviousStatus();

  return (
    <>
      <Card 
        onClick={handleCardClick}
        sx={{ 
          mb: 0.5, 
          cursor: 'pointer',
          minHeight: 48,
          '&:hover': { 
            boxShadow: 2,
            transform: 'translateY(-1px)',
            transition: 'all 0.2s ease-in-out'
          },
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1
        }}
      >
        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Lado esquerdo: Atividade */}
            <Box sx={{ flex: 1, mr: 1 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 'medium',
                  fontSize: '0.875rem',
                  lineHeight: 1.2,
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {task.atividade || task.userStory}
              </Typography>
            </Box>
            
            {/* Centro: Avatar do desenvolvedor */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
              <Avatar
                sx={{ 
                  width: 28, 
                  height: 28, 
                  fontSize: '0.75rem',
                  bgcolor: 'primary.main'
                }}
              >
                {getInitials(task.desenvolvedor)}
              </Avatar>
            </Box>
            
            {/* Lado direito: Botões de navegação */}
            <Box sx={{ display: 'flex', gap: 0.25 }}>
              {previousStatus && (
                <Tooltip title={`← ${previousStatus}`}>
                  <IconButton 
                    size="small" 
                    onClick={() => handleMoveTask(previousStatus)}
                    sx={{ 
                      p: 0.25, 
                      width: 24,
                      height: 24,
                      bgcolor: 'action.hover',
                      '&:hover': { bgcolor: 'action.selected' }
                    }}
                  >
                    <ArrowBackIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              )}
              {nextStatus && (
                <Tooltip title={`${nextStatus} →`}>
                  <IconButton 
                    size="small" 
                    onClick={() => handleMoveTask(nextStatus)}
                    sx={{ 
                      p: 0.25, 
                      width: 24,
                      height: 24,
                      bgcolor: 'action.hover',
                      '&:hover': { bgcolor: 'action.selected' }
                    }}
                  >
                    <ArrowForwardIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      <TaskDetailsModal
        task={task}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        onStatusChange={onStatusChange}
        onTasksUpdate={(updatedTask) => {
          const updatedTasks = allTasks.map(t => 
            t.id === updatedTask.id ? { ...updatedTask, updatedAt: new Date().toISOString() } : t
          );
          onTasksUpdate(updatedTasks);
        }}
      />
    </>
  );
};

const TaskCard = ({ task, onStatusChange, onTasksUpdate, allTasks, compactMode = false }) => {
  if (compactMode) {
    return (
      <CompactTaskCard
        task={task}
        onStatusChange={onStatusChange}
        onTasksUpdate={onTasksUpdate}
        allTasks={allTasks}
      />
    );
  }
  const [detailsOpen, setDetailsOpen] = useState(false);
  const getPriorityColor = (priority) => priorityColors[priority] || '#757575';
  const getEpicColor = (epic) => epicColors[epic] || '#666666';
  
  const handleMoveTask = (newStatus) => {
    onStatusChange(task.id, newStatus);
    setDetailsOpen(false); // Fechar modal após mover
  };

  const handleCardClick = (e) => {
    // Não abrir modal se clicou em botão
    if (e.target.closest('button')) return;
    setDetailsOpen(true);
  };

  const getNextStatus = () => {
    const currentIndex = columns.findIndex(col => col.id === task.status);
    if (currentIndex < columns.length - 1) {
      return columns[currentIndex + 1].id;
    }
    return null;
  };

  const getPreviousStatus = () => {
    const currentIndex = columns.findIndex(col => col.id === task.status);
    if (currentIndex > 0) {
      return columns[currentIndex - 1].id;
    }
    return null;
  };

  const nextStatus = getNextStatus();
  const previousStatus = getPreviousStatus();

  return (
    <>
      <Card 
        onClick={handleCardClick}
        sx={{ 
          mb: 1.5, 
          cursor: 'pointer',
          '&:hover': { 
            boxShadow: 4,
            transform: 'translateY(-2px)',
            transition: 'all 0.2s ease-in-out'
          },
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2
        }}
      >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Header com ID e controles */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TaskIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary" fontWeight="bold">
              #{task.originalId}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {previousStatus && (
              <Tooltip title={`← ${previousStatus}`}>
                <IconButton 
                  size="small" 
                  onClick={() => handleMoveTask(previousStatus)}
                  sx={{ 
                    p: 0.5, 
                    bgcolor: 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' }
                  }}
                >
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {nextStatus && (
              <Tooltip title={`${nextStatus} →`}>
                <IconButton 
                  size="small" 
                  onClick={() => handleMoveTask(nextStatus)}
                  sx={{ 
                    p: 0.5, 
                    bgcolor: 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' }
                  }}
                >
                  <ArrowForwardIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Épico */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <EpicIcon 
            fontSize="small" 
            sx={{ color: getEpicColor(task.epico) }}
          />
          <Typography 
            variant="caption" 
            sx={{ 
              color: getEpicColor(task.epico),
              fontWeight: 'bold',
              textTransform: 'uppercase',
              fontSize: '0.65rem'
            }}
          >
            {task.epico}
          </Typography>
        </Box>
        
        {/* User Story */}
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 1.5, 
            fontWeight: 'medium',
            lineHeight: 1.4,
            color: 'text.primary'
          }}
        >
          {task.userStory}
        </Typography>

        {/* Atividade */}
        {task.atividade && (
          <Typography 
            variant="caption" 
            sx={{ 
              mb: 1.5, 
              display: 'block',
              color: 'text.secondary',
              fontStyle: 'italic'
            }}
          >
            {task.atividade}
          </Typography>
        )}
        
        {/* Chips de informações */}
        <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, flexWrap: 'wrap' }}>
          <Chip
            label={task.prioridade}
            size="small"
            sx={{
              bgcolor: getPriorityColor(task.prioridade),
              color: 'white',
              fontSize: '0.7rem',
              fontWeight: 'bold'
            }}
          />
          {task.estimativa > 0 && (
            <Chip
              icon={<TimeIcon fontSize="small" />}
              label={`${task.estimativa}h`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          )}
          {task.tipoAtividade && (
            <Chip
              label={task.tipoAtividade}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          )}
        </Box>

        {/* Progress bar para horas */}
        {task.estimativa > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Progresso
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {task.horasMedidas || 0}h / {task.estimativa}h
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(((task.horasMedidas || 0) / task.estimativa) * 100, 100)}
              sx={{
                height: 4,
                borderRadius: 2,
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': {
                  bgcolor: task.horasMedidas > task.estimativa ? 'error.main' : 'success.main'
                }
              }}
            />
          </Box>
        )}
        
        {/* Footer com desenvolvedor e ações */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{ 
                width: 24, 
                height: 24, 
                fontSize: '0.7rem',
                bgcolor: 'primary.main'
              }}
            >
              {getInitials(task.desenvolvedor)}
            </Avatar>
            <Typography variant="caption" color="text.secondary">
              {task.desenvolvedor}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Badge badgeContent={0} color="primary">
              <CommentIcon fontSize="small" color="action" />
            </Badge>
            <Badge badgeContent={0} color="primary">
              <AttachmentIcon fontSize="small" color="action" />
            </Badge>
          </Box>
        </Box>
        
        {/* Sprint */}
        {task.sprint && (
          <Box sx={{ 
            mt: 1.5, 
            pt: 1, 
            borderTop: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="caption" color="text.secondary">
              Sprint: {task.sprint}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>

    <TaskDetailsModal
      task={task}
      open={detailsOpen}
      onClose={() => setDetailsOpen(false)}
      onStatusChange={onStatusChange}
      onTasksUpdate={(updatedTask) => {
        // Atualizar a tarefa na lista principal
        const updatedTasks = allTasks.map(t => 
          t.id === updatedTask.id ? { ...updatedTask, updatedAt: new Date().toISOString() } : t
        );
        onTasksUpdate(updatedTasks);
      }}
    />
    </>
  );
};

const EpicGroup = ({ epic, tasks, onStatusChange, onTasksUpdate, allTasks, compactMode = false }) => {
  const [expanded, setExpanded] = useState(true);
  const epicColor = epicColors[epic] || '#666666';
  
  const completedTasks = tasks.filter(task => task.status === 'Done').length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <Box sx={{ mb: 2 }}>
      <Paper
        sx={{
          p: 1.5,
          bgcolor: epicColor,
          color: 'white',
          cursor: 'pointer',
          '&:hover': { opacity: 0.9 }
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EpicIcon fontSize="small" />
            <Typography variant="subtitle2" fontWeight="bold">
              {epic}
            </Typography>
            <Chip
              label={`${tasks.length} tarefa${tasks.length !== 1 ? 's' : ''}`}
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontSize: '0.7rem'
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              {completedTasks}/{tasks.length} concluídas
            </Typography>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            mt: 1,
            height: 3,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.3)',
            '& .MuiLinearProgress-bar': {
              bgcolor: 'rgba(255,255,255,0.8)'
            }
          }}
        />
      </Paper>
      
      <Collapse in={expanded}>
        <Box sx={{ mt: 1 }}>
          {tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onStatusChange={onStatusChange} 
              onTasksUpdate={onTasksUpdate}
              allTasks={allTasks}
              compactMode={compactMode}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

const KanbanColumn = ({ column, tasks, onStatusChange, onTasksUpdate, allTasks, compactMode = false }) => {
  // Agrupar tarefas por épico
  const tasksByEpic = tasks.reduce((acc, task) => {
    const epic = task.epico || 'Sem Épico';
    if (!acc[epic]) acc[epic] = [];
    acc[epic].push(task);
    return acc;
  }, {});

  return (
    <Paper sx={{ p: 2, bgcolor: column.color, minHeight: '70vh' }}>
      <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
        {column.title}
        <Chip
          label={tasks.length}
          size="small"
          sx={{ ml: 1 }}
        />
      </Typography>
      
      <Box sx={{ minHeight: '60vh' }}>
        {Object.entries(tasksByEpic).map(([epic, epicTasks]) => (
          <EpicGroup
            key={epic}
            epic={epic}
            tasks={epicTasks}
            onStatusChange={onStatusChange}
            onTasksUpdate={onTasksUpdate}
            allTasks={allTasks}
            compactMode={compactMode}
          />
        ))}
      </Box>
    </Paper>
  );
};

const SimpleKanban = ({ tasks, onTasksUpdate }) => {
  const [filteredTasks, setFilteredTasks] = useState(tasks);
  const [compactMode, setCompactMode] = useState(false);
  const [filters, setFilters] = useState({
    sprint: '',
    desenvolvedor: '',
    prioridade: '',
    epico: '',
    search: ''
  });
  const [timeValidationModal, setTimeValidationModal] = useState({
    open: false,
    task: null
  });
  const [wipAlertModal, setWipAlertModal] = useState({
    open: false,
    message: '',
    details: '',
    suggestion: ''
  });

  useEffect(() => {
    let filtered = tasks;
    
    if (filters.sprint) {
      filtered = filtered.filter(task => task.sprint === filters.sprint);
    }
    if (filters.desenvolvedor) {
      filtered = filtered.filter(task => task.desenvolvedor === filters.desenvolvedor);
    }
    if (filters.prioridade) {
      filtered = filtered.filter(task => task.prioridade === filters.prioridade);
    }
    if (filters.epico) {
      filtered = filtered.filter(task => task.epico === filters.epico);
    }
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(task => 
        Object.values(task).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm)
        )
      );
    }
    
    setFilteredTasks(filtered);
  }, [tasks, filters]);

  const handleStatusChange = (taskId, newStatus) => {
    // Validar limites WIP para Priorizado e Doing
    if (newStatus === 'Priorizado' || newStatus === 'Doing') {
      const wipValidation = validateWipLimits(tasks, newStatus);
      if (!wipValidation.allowed) {
        setWipAlertModal({
          open: true,
          message: wipValidation.message,
          details: wipValidation.details,
          suggestion: wipValidation.suggestion
        });
        return;
      }
    }
    
    // Verificar se está tentando mover para Done sem tempo gasto validado
    if (newStatus === 'Done') {
      const task = tasks.find(t => t.id === taskId);
      if (!task.tempoGastoValidado || task.tempoGasto === null) {
        setTimeValidationModal({
          open: true,
          task: task
        });
        return;
      }
    }
    
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const now = new Date().toISOString();
        const updatedTask = { 
          ...task, 
          status: newStatus, 
          updatedAt: now,
          statusChangedAt: now
        };
        
        // Adicionar movimento ao histórico
        if (!updatedTask.movements) {
          updatedTask.movements = [];
        }
        updatedTask.movements.push({
          timestamp: now,
          from: task.status,
          to: newStatus,
          userId: 'user' // Em um app real, seria o ID do usuário logado
        });
        
        return updatedTask;
      }
      return task;
    });
    
    onTasksUpdate(updatedTasks);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({ sprint: '', desenvolvedor: '', prioridade: '', epico: '', search: '' });
  };

  const getUniqueValues = (field) => {
    return [...new Set(tasks.map(task => task[field]).filter(Boolean))];
  };

  const getTasksByStatus = (status) => {
    return filteredTasks.filter(task => task.status === status);
  };

  const calculateErrorRate = (estimativa, tempoGasto) => {
    if (!tempoGasto || !estimativa) return 0;
    const errorRate = ((tempoGasto / estimativa - 1) * 100);
    return Math.max(0, errorRate);
  };

  const handleTimeValidationSave = (updatedTask) => {
    const now = new Date().toISOString();
    const taskWithTimeData = {
      ...updatedTask,
      tempoGastoValidado: true,
      status: 'Done',
      updatedAt: now,
      statusChangedAt: now
    };

    // Adicionar movimento ao histórico
    if (!taskWithTimeData.movements) {
      taskWithTimeData.movements = [];
    }
    taskWithTimeData.movements.push({
      timestamp: now,
      from: updatedTask.status,
      to: 'Done',
      userId: 'user'
    });

    const updatedTasks = tasks.map(task => 
      task.id === updatedTask.id ? taskWithTimeData : task
    );
    
    onTasksUpdate(updatedTasks);
    setTimeValidationModal({ open: false, task: null });
  };

  return (
    <Box>
      <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FilterIcon />
          <TextField
            select
            label="Épico"
            value={filters.epico}
            onChange={(e) => handleFilterChange('epico', e.target.value)}
            size="small"
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {getUniqueValues('epico').map(epico => (
              <MenuItem key={epico} value={epico}>{epico}</MenuItem>
            ))}
          </TextField>
          
          <TextField
            select
            label="Sprint"
            value={filters.sprint}
            onChange={(e) => handleFilterChange('sprint', e.target.value)}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {getUniqueValues('sprint').map(sprint => (
              <MenuItem key={sprint} value={sprint}>{sprint}</MenuItem>
            ))}
          </TextField>
          
          <TextField
            select
            label="Desenvolvedor"
            value={filters.desenvolvedor}
            onChange={(e) => handleFilterChange('desenvolvedor', e.target.value)}
            size="small"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {getUniqueValues('desenvolvedor').map(dev => (
              <MenuItem key={dev} value={dev}>{dev}</MenuItem>
            ))}
          </TextField>
          
          <TextField
            select
            label="Prioridade"
            value={filters.prioridade}
            onChange={(e) => handleFilterChange('prioridade', e.target.value)}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">Todas</MenuItem>
            {getUniqueValues('prioridade').map(priority => (
              <MenuItem key={priority} value={priority}>{priority}</MenuItem>
            ))}
          </TextField>
          
          <TextField
            label="Buscar em todos os campos"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
            placeholder="Digite para buscar..."
          />
          
          <Tooltip title={compactMode ? "Versão Expandida" : "Versão Compacta"}>
            <IconButton 
              onClick={() => setCompactMode(!compactMode)} 
              size="small"
              color={compactMode ? "primary" : "default"}
              sx={{ 
                bgcolor: compactMode ? 'primary.light' : 'transparent',
                '&:hover': { bgcolor: compactMode ? 'primary.main' : 'action.hover' }
              }}
            >
              {compactMode ? <ViewListIcon /> : <ViewCompactIcon />}
            </IconButton>
          </Tooltip>
          
          <IconButton onClick={clearFilters} size="small">
            <ClearIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {columns.map(column => (
          <Grid item xs={12} sm={6} md={3} key={column.id}>
            <KanbanColumn
              column={column}
              tasks={getTasksByStatus(column.id)}
              onStatusChange={handleStatusChange}
              onTasksUpdate={onTasksUpdate}
              allTasks={filteredTasks}
              compactMode={compactMode}
            />
          </Grid>
        ))}
      </Grid>
      
      <TimeValidationModal
        open={timeValidationModal.open}
        task={timeValidationModal.task}
        onClose={() => setTimeValidationModal({ open: false, task: null })}
        onSave={handleTimeValidationSave}
      />
      
      <WipAlertModal
        open={wipAlertModal.open}
        message={wipAlertModal.message}
        details={wipAlertModal.details}
        suggestion={wipAlertModal.suggestion}
        onClose={() => setWipAlertModal({ open: false, message: '', details: '', suggestion: '' })}
      />
    </Box>
  );
};

// Modal de alerta de limite WIP
const WipAlertModal = ({ open, message, details, suggestion, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          <Typography variant="h6">Limite WIP Atingido</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body1" fontWeight="bold">
            {message}
          </Typography>
        </Alert>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Detalhes:</strong>
          </Typography>
          <Typography variant="body2">
            {details}
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Sugestão:</strong>
          </Typography>
          <Typography variant="body2">
            {suggestion}
          </Typography>
        </Box>
        
        <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="body2" color="info.dark">
            💡 <strong>Dica:</strong> Vá para a tela de WIP Control para ajustar os limites ou desabilitar a validação obrigatória.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Entendi
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Modal de validação de tempo gasto
const TimeValidationModal = ({ open, task, onClose, onSave }) => {
  const [tempoGasto, setTempoGasto] = useState('');
  const [motivoErro, setMotivoErro] = useState('');

  useEffect(() => {
    if (task) {
      setTempoGasto(task.tempoGasto || '');
      setMotivoErro(task.motivoErro || '');
    }
  }, [task]);

  if (!task) return null;

  const taxaErro = tempoGasto && task.estimativa ? 
    ((tempoGasto / task.estimativa - 1) * 100) : 0;
  const taxaErroPositiva = Math.max(0, taxaErro);

  const handleSave = () => {
    const updatedTask = {
      ...task,
      tempoGasto: parseFloat(tempoGasto),
      taxaErro: taxaErroPositiva,
      motivoErro: taxaErroPositiva > 20 ? motivoErro : null
    };
    onSave(updatedTask);
    setTempoGasto('');
    setMotivoErro('');
  };

  const isValid = tempoGasto && (taxaErroPositiva <= 20 || motivoErro.trim());

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">Validação Obrigatória - Tempo Gasto</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Para finalizar a tarefa <strong>"{task.atividade}"</strong>, é obrigatório informar o tempo gasto.
        </Alert>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Estimativa inicial: {task.estimativa}h
          </Typography>
        </Box>
        
        <TextField
          fullWidth
          required
          type="number"
          label="Tempo Gasto (horas)"
          value={tempoGasto}
          onChange={(e) => setTempoGasto(e.target.value)}
          sx={{ mb: 2 }}
          inputProps={{ min: 0.1, step: 0.1 }}
          helperText="Informe o tempo efetivamente gasto na tarefa"
        />
        
        <TextField
          fullWidth
          label="Taxa de Erro Calculada"
          value={`${taxaErroPositiva.toFixed(1)}%`}
          InputProps={{ readOnly: true }}
          sx={{ 
            mb: 2,
            '& .MuiInputBase-input': { 
              color: taxaErroPositiva > 20 ? 'error.main' : 'success.main',
              fontWeight: 'bold'
            }
          }}
          helperText={taxaErroPositiva > 20 ? 
            'Taxa de erro elevada - necessário explicar o motivo' : 
            'Taxa de erro dentro do esperado'
          }
        />
        
        {taxaErroPositiva > 20 && (
          <TextField
            fullWidth
            required
            multiline
            rows={3}
            label="Motivo da Taxa de Erro Elevada"
            value={motivoErro}
            onChange={(e) => setMotivoErro(e.target.value)}
            placeholder="Explique o motivo da taxa de erro (complexidade imprevista, mudanças de requisitos, bugs, etc.)"
            helperText="Obrigatório para taxas de erro acima de 20%"
          />
        )}
        
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            💡 <strong>Dica:</strong> O tempo gasto ajuda a melhorar estimativas futuras e identificar padrões de trabalho.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={!isValid}
          sx={{ minWidth: 140 }}
        >
          Finalizar Tarefa
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SimpleKanban;