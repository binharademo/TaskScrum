import React, { useEffect } from 'react';
import {
  Box,
  Grid,
  Alert,
  Snackbar,
  Typography
} from '@mui/material';
import {
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';

// Import modular components
import KanbanHeader from './kanban/KanbanHeader';
import KanbanColumn from './kanban/KanbanColumn';
import TaskModals from './kanban/TaskModals';

// Import contexts
import { useTaskContext } from '../contexts/TaskContext';
import { useFilterContext } from '../contexts/FilterContext';
import { useUIContext, MODAL_TYPES } from '../contexts/UIContext';

// Column configuration
const columns = [
  { id: 'Backlog', title: 'Backlog' },
  { id: 'Priorizado', title: 'Priorizado' },
  { id: 'Doing', title: 'Doing' },
  { id: 'Done', title: 'Done' }
];

const SimpleKanbanModular = () => {
  const { 
    tasks, 
    updateTask, 
    loading, 
    error, 
    tasksCount 
  } = useTaskContext();

  const { 
    applyFilters,
    hasActiveFilters 
  } = useFilterContext();

  const { 
    ui, 
    openModal, 
    showNotification, 
    hideNotification,
    hasNotification 
  } = useUIContext();

  // Apply filters to tasks
  const filteredTasks = applyFilters(tasks);

  // Handle status change with WIP validation
  const handleStatusChange = (taskId, newStatus) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        showNotification('Tarefa não encontrada', 'error');
        return;
      }

      // Special validation for Done status
      if (newStatus === 'Done') {
        if (!task.tempoGastoValidado || task.tempoGasto === null) {
          openModal(MODAL_TYPES.TIME_VALIDATION, task);
          return;
        }
      }

      // Check WIP limits
      const wipLimits = getWipLimits();
      const tasksInStatus = filteredTasks.filter(t => t.status === newStatus).length;
      const wipLimit = wipLimits[newStatus];

      if (wipLimit && tasksInStatus >= wipLimit && task.status !== newStatus) {
        showNotification(
          `Limite WIP para ${newStatus} atingido (${tasksInStatus}/${wipLimit})`,
          'warning'
        );
        return;
      }

      // Update task status
      updateTask(taskId, { status: newStatus });
      showNotification(
        `Tarefa movida para ${newStatus}`,
        'success',
        { duration: 2000 }
      );

    } catch (error) {
      console.error('Error changing task status:', error);
      showNotification('Erro ao mover tarefa', 'error');
    }
  };

  // Handle new task creation
  const handleNewTask = () => {
    openModal(MODAL_TYPES.TASK_DETAILS, { isNewTask: true });
  };

  // Handle refresh (for future use with external data sources)
  const handleRefresh = () => {
    // For now, just show a notification
    showNotification('Dados atualizados', 'info', { duration: 1500 });
  };

  // Get WIP limits from localStorage
  const getWipLimits = () => {
    try {
      const saved = localStorage.getItem('tasktracker-wip-limits');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  // Get tasks by status
  const getTasksByStatus = (status) => {
    return filteredTasks.filter(task => task.status === status);
  };

  // Auto-hide notifications
  useEffect(() => {
    if (error) {
      showNotification(error, 'error');
    }
  }, [error, showNotification]);

  // Show loading state
  if (loading.global) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px' 
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Carregando tarefas...
        </Typography>
      </Box>
    );
  }

  // Get notification icon
  const getNotificationIcon = (severity) => {
    switch (severity) {
      case 'error': return <ErrorIcon fontSize="inherit" />;
      case 'warning': return <WarningIcon fontSize="inherit" />;
      case 'success': return <SuccessIcon fontSize="inherit" />;
      case 'info': return <InfoIcon fontSize="inherit" />;
      default: return <InfoIcon fontSize="inherit" />;
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {/* Header with filters and controls */}
      <KanbanHeader
        onNewTaskClick={handleNewTask}
        onRefresh={handleRefresh}
        showRefresh={false}
      />

      {/* Active filters info */}
      {hasActiveFilters && (
        <Alert 
          severity="info" 
          sx={{ mb: 2 }}
        >
          <Typography variant="body2">
            Exibindo {filteredTasks.length} de {tasksCount} tarefas 
            {hasActiveFilters && ' (filtros aplicados)'}
          </Typography>
        </Alert>
      )}

      {/* Main Kanban Board */}
      <Grid container spacing={2} sx={{ height: 'calc(100vh - 300px)' }}>
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          
          return (
            <Grid item xs={12} sm={6} md={3} key={column.id}>
              <KanbanColumn
                column={column}
                tasks={columnTasks}
                onStatusChange={handleStatusChange}
              />
            </Grid>
          );
        })}
      </Grid>

      {/* Empty state */}
      {filteredTasks.length === 0 && !hasActiveFilters && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '300px',
            color: 'text.secondary'
          }}
        >
          <Typography variant="h6" gutterBottom>
            Nenhuma tarefa encontrada
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Comece criando sua primeira tarefa
          </Typography>
        </Box>
      )}

      {/* No results with filters */}
      {filteredTasks.length === 0 && hasActiveFilters && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: 'text.secondary'
          }}
        >
          <Typography variant="h6" gutterBottom>
            Nenhuma tarefa corresponde aos filtros
          </Typography>
          <Typography variant="body2">
            Ajuste os filtros para ver mais resultados
          </Typography>
        </Box>
      )}

      {/* All Modals */}
      <TaskModals />

      {/* Global Notification Snackbar */}
      <Snackbar
        open={hasNotification}
        autoHideDuration={ui.notification.duration}
        onClose={hideNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={hideNotification}
          severity={ui.notification.severity}
          icon={getNotificationIcon(ui.notification.severity)}
          sx={{ width: '100%' }}
        >
          {ui.notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SimpleKanbanModular;