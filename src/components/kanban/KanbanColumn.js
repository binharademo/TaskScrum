import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Badge,
  Chip,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import EpicGroup from './EpicGroup';
import TaskCard from './TaskCard';
import { useUIContext } from '../../contexts/UIContext';
import { validateWipLimits } from '../WIPControl';

// Column configurations
const columnConfigs = {
  'Backlog': {
    title: 'Backlog',
    color: '#e3f2fd',
    headerColor: '#1976d2',
    icon: AssignmentIcon,
    description: 'Tarefas aguardando priorização'
  },
  'Priorizado': {
    title: 'Priorizado',
    color: '#fff3e0',
    headerColor: '#f57c00',
    icon: ScheduleIcon,
    description: 'Tarefas priorizadas para desenvolvimento'
  },
  'Doing': {
    title: 'Doing',
    color: '#e8f5e8',
    headerColor: '#388e3c',
    icon: ScheduleIcon,
    description: 'Tarefas em desenvolvimento'
  },
  'Done': {
    title: 'Done',
    color: '#f3e5f5',
    headerColor: '#7b1fa2',
    icon: CheckCircleIcon,
    description: 'Tarefas concluídas'
  }
};

const KanbanColumn = ({ 
  column, 
  tasks, 
  onStatusChange 
}) => {
  const { ui } = useUIContext();
  
  const config = columnConfigs[column.id] || {
    title: column.title,
    color: '#f5f5f5',
    headerColor: '#666666',
    icon: AssignmentIcon,
    description: ''
  };

  // Get WIP limits from localStorage
  const wipLimits = useMemo(() => {
    try {
      const saved = localStorage.getItem('tasktracker-wip-limits');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }, []);

  // Calculate column statistics
  const columnStats = useMemo(() => {
    const totalTasks = tasks.length;
    const wipLimit = wipLimits[column.id] || null;
    const isOverLimit = wipLimit && totalTasks > wipLimit;
    const utilizationPercentage = wipLimit ? Math.round((totalTasks / wipLimit) * 100) : 0;
    
    // Group by epic
    const epicGroups = tasks.reduce((groups, task) => {
      const epic = task.epico || 'Sem Épico';
      if (!groups[epic]) {
        groups[epic] = [];
      }
      groups[epic].push(task);
      return groups;
    }, {});

    // Calculate effort statistics
    const totalEffort = tasks.reduce((sum, task) => sum + (task.estimativa || 0), 0);
    const avgEffort = totalTasks > 0 ? (totalEffort / totalTasks).toFixed(1) : 0;

    return {
      totalTasks,
      wipLimit,
      isOverLimit,
      utilizationPercentage,
      epicGroups,
      epicCount: Object.keys(epicGroups).length,
      totalEffort,
      avgEffort
    };
  }, [tasks, wipLimits, column.id]);

  const HeaderIcon = config.icon;

  // Get WIP status color
  const getWipStatusColor = () => {
    if (!columnStats.wipLimit) return 'default';
    if (columnStats.isOverLimit) return 'error';
    if (columnStats.utilizationPercentage > 80) return 'warning';
    return 'success';
  };

  // Render tasks grouped by epic or flat
  const renderTasks = () => {
    if (ui.groupByEpic && columnStats.epicCount > 1) {
      return Object.entries(columnStats.epicGroups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([epic, epicTasks]) => (
          <EpicGroup
            key={epic}
            epic={epic}
            tasks={epicTasks}
            onStatusChange={onStatusChange}
          />
        ));
    } else {
      // Flat list of tasks
      return tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onStatusChange={onStatusChange}
        />
      ));
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        minHeight: '600px',
        backgroundColor: config.color,
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Column Header */}
      <Box
        sx={{
          backgroundColor: config.headerColor,
          color: 'white',
          p: ui.compactView ? 1.5 : 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: ui.compactView ? 56 : 72
        }}
      >
        {/* Left side - Title and icon */}
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <HeaderIcon sx={{ mr: 1, fontSize: ui.compactView ? 20 : 24 }} />
          
          <Box>
            <Typography 
              variant={ui.compactView ? "body1" : "h6"} 
              fontWeight="bold"
              sx={{ lineHeight: 1.2 }}
            >
              {config.title}
            </Typography>
            
            {!ui.compactView && config.description && (
              <Typography 
                variant="caption" 
                sx={{ 
                  opacity: 0.8, 
                  fontSize: '0.7rem',
                  display: 'block'
                }}
              >
                {config.description}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Right side - Statistics */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Task count badge */}
          <Badge
            badgeContent={columnStats.totalTasks}
            color="default"
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: config.headerColor,
                fontWeight: 'bold',
                fontSize: '0.7rem'
              }
            }}
          >
            <AssignmentIcon />
          </Badge>

          {/* WIP Limit indicator */}
          {columnStats.wipLimit && (
            <Tooltip
              title={
                `WIP Limit: ${columnStats.totalTasks}/${columnStats.wipLimit} ` +
                `(${columnStats.utilizationPercentage}%)`
              }
            >
              <Chip
                label={`${columnStats.totalTasks}/${columnStats.wipLimit}`}
                size="small"
                color={getWipStatusColor()}
                icon={columnStats.isOverLimit ? <WarningIcon /> : undefined}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  color: config.headerColor,
                  fontSize: '0.7rem',
                  '& .MuiChip-icon': {
                    color: 'inherit'
                  }
                }}
              />
            </Tooltip>
          )}

          {/* Epic count (if grouping) */}
          {ui.groupByEpic && columnStats.epicCount > 1 && (
            <Tooltip title={`${columnStats.epicCount} épicos`}>
              <Chip
                label={columnStats.epicCount}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  color: config.headerColor,
                  fontSize: '0.7rem',
                  minWidth: 24,
                  height: 20
                }}
              />
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* WIP Progress bar */}
      {columnStats.wipLimit && (
        <LinearProgress
          variant="determinate"
          value={Math.min(columnStats.utilizationPercentage, 100)}
          sx={{
            height: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: columnStats.isOverLimit ? '#f44336' : 
                              columnStats.utilizationPercentage > 80 ? '#ff9800' : '#4caf50'
            }
          }}
        />
      )}

      {/* Column Body - Tasks */}
      <Box
        sx={{
          flex: 1,
          p: ui.compactView ? 1 : 2,
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 200px)'
        }}
      >
        {tasks.length === 0 ? (
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
            <HeaderIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
            <Typography variant="body2" sx={{ opacity: 0.7, textAlign: 'center' }}>
              Nenhuma tarefa em<br />{config.title}
            </Typography>
          </Box>
        ) : (
          renderTasks()
        )}
      </Box>

      {/* Column Footer - Summary stats */}
      {!ui.compactView && columnStats.totalTasks > 0 && (
        <Box
          sx={{
            p: 1.5,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderTop: '1px solid rgba(0, 0, 0, 0.1)'
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Total: {columnStats.totalEffort}h | 
            Média: {columnStats.avgEffort}h por tarefa
            {ui.groupByEpic && columnStats.epicCount > 1 && 
              ` | ${columnStats.epicCount} épicos`
            }
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default KanbanColumn;