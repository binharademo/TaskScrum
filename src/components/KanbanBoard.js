import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
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
  Badge
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Comment as CommentIcon,
  Attachment as AttachmentIcon,
  Warning as WarningIcon
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

const TaskCard = ({ task, index }) => {
  const getPriorityColor = (priority) => priorityColors[priority] || '#757575';
  
  const isOverdue = () => {
    if (!task.sprint) return false;
    const today = new Date();
    const sprintEnd = new Date(task.sprint);
    return today > sprintEnd;
  };

  // Ensure task has valid ID
  if (!task.id) {
    console.error('Task without ID:', task);
    return null;
  }

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            mb: 1,
            cursor: 'grab',
            transform: snapshot.isDragging ? 'rotate(5deg)' : 'none',
            boxShadow: snapshot.isDragging ? 4 : 1,
            '&:hover': { boxShadow: 3 }
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                #{task.originalId}
              </Typography>
              {isOverdue() && (
                <Tooltip title="Prazo vencido">
                  <WarningIcon color="error" fontSize="small" />
                </Tooltip>
              )}
            </Box>
            
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
              {task.userStory}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
              <Chip
                label={task.prioridade}
                size="small"
                sx={{
                  bgcolor: getPriorityColor(task.prioridade),
                  color: 'white',
                  fontSize: '0.7rem'
                }}
              />
              {task.estimativa > 0 && (
                <Chip
                  label={`${task.estimativa}h`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {task.desenvolvedor}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Badge badgeContent={0} color="primary">
                  <CommentIcon fontSize="small" color="action" />
                </Badge>
                <Badge badgeContent={0} color="primary">
                  <AttachmentIcon fontSize="small" color="action" />
                </Badge>
              </Box>
            </Box>
            
            {task.sprint && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Sprint: {task.sprint}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};

const KanbanColumn = ({ column, tasks }) => {
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
      
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              minHeight: '60vh',
              bgcolor: snapshot.isDraggingOver ? 'rgba(0,0,0,0.1)' : 'transparent',
              borderRadius: 1,
              transition: 'background-color 0.2s'
            }}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </Paper>
  );
};

const KanbanBoard = ({ tasks, onTasksUpdate }) => {
  const [filteredTasks, setFilteredTasks] = useState(tasks);
  const [filters, setFilters] = useState({
    sprint: '',
    desenvolvedor: '',
    prioridade: ''
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for tasks to be loaded
    if (tasks.length > 0) {
      setIsReady(true);
    }
  }, [tasks]);

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
    
    setFilteredTasks(filtered);
  }, [tasks, filters]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.droppableId === destination.droppableId) {
      return;
    }

    const taskId = result.draggableId;
    const updatedTasks = tasks.map(task => {
      if (String(task.id) === taskId) {
        return { ...task, status: destination.droppableId, updatedAt: new Date().toISOString() };
      }
      return task;
    });
    
    onTasksUpdate(updatedTasks);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({ sprint: '', desenvolvedor: '', prioridade: '' });
  };

  const getUniqueValues = (field) => {
    return [...new Set(tasks.map(task => task[field]).filter(Boolean))];
  };

  const getTasksByStatus = (status) => {
    return filteredTasks.filter(task => task.status === status);
  };

  if (!isReady) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Carregando tarefas...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FilterIcon />
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
          
          <IconButton onClick={clearFilters} size="small">
            <ClearIcon />
          </IconButton>
        </Box>
      </Box>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Grid container spacing={2}>
          {columns.map(column => (
            <Grid item xs={12} sm={6} md={3} key={column.id}>
              <KanbanColumn
                column={column}
                tasks={getTasksByStatus(column.id)}
              />
            </Grid>
          ))}
        </Grid>
      </DragDropContext>
    </Box>
  );
};

export default KanbanBoard;