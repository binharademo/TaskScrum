import React, { useState, useEffect } from 'react';
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
  Select
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
  Category as CategoryIcon
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

const TaskCard = ({ task, onStatusChange, onTasksUpdate, allTasks }) => {
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

const EpicGroup = ({ epic, tasks, onStatusChange, onTasksUpdate, allTasks }) => {
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
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

const KanbanColumn = ({ column, tasks, onStatusChange, onTasksUpdate, allTasks }) => {
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
          />
        ))}
      </Box>
    </Paper>
  );
};

const SimpleKanban = ({ tasks, onTasksUpdate }) => {
  const [filteredTasks, setFilteredTasks] = useState(tasks);
  const [filters, setFilters] = useState({
    sprint: '',
    desenvolvedor: '',
    prioridade: '',
    epico: '',
    search: ''
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
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SimpleKanban;