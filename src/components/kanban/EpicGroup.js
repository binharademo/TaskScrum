import React, { useState } from 'react';
import {
  Box,
  Typography,
  Collapse,
  IconButton,
  Chip,
  Badge,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  BookmarkBorder as EpicIcon,
  Assignment as TaskIcon
} from '@mui/icons-material';
import TaskCard from './TaskCard';
import { useUIContext } from '../../contexts/UIContext';

// Epic colors for consistent styling
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

const EpicGroup = ({ 
  epic, 
  tasks, 
  onStatusChange 
}) => {
  const [expanded, setExpanded] = useState(true);
  const { ui } = useUIContext();

  const getEpicColor = (epicName) => epicColors[epicName] || '#666666';

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Calcular estatísticas do épico
  const epicStats = {
    total: tasks.length,
    done: tasks.filter(task => task.status === 'Done').length,
    doing: tasks.filter(task => task.status === 'Doing').length,
    todo: tasks.filter(task => ['Backlog', 'Priorizado'].includes(task.status)).length
  };

  const completionPercentage = epicStats.total > 0 
    ? Math.round((epicStats.done / epicStats.total) * 100) 
    : 0;

  // Cores para os chips de status
  const getStatusColor = (count, type) => {
    if (count === 0) return 'default';
    switch (type) {
      case 'done': return 'success';
      case 'doing': return 'warning';
      case 'todo': return 'info';
      default: return 'default';
    }
  };

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: ui.compactView ? 1 : 2 }}>
      {/* Header do Épico */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: ui.compactView ? 1 : 1.5,
          backgroundColor: getEpicColor(epic),
          color: 'white',
          borderRadius: 1,
          mb: 1,
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: `${getEpicColor(epic)}dd`,
            transform: 'translateY(-1px)',
            boxShadow: 2
          },
          transition: 'all 0.2s ease-in-out'
        }}
        onClick={handleToggleExpanded}
      >
        {/* Left side - Epic name and icon */}
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <EpicIcon sx={{ mr: 1, fontSize: ui.compactView ? 16 : 20 }} />
          <Typography 
            variant={ui.compactView ? "body2" : "subtitle1"} 
            fontWeight="medium"
            sx={{ mr: 2 }}
          >
            {epic}
          </Typography>

          {/* Progress indicator */}
          <Chip
            label={`${completionPercentage}%`}
            size="small"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontSize: '0.7rem',
              height: ui.compactView ? 16 : 20
            }}
          />
        </Box>

        {/* Middle - Task statistics */}
        <Box sx={{ display: 'flex', gap: 0.5, mr: 2 }}>
          {/* Total tasks */}
          <Tooltip title="Total de tarefas">
            <Badge 
              badgeContent={epicStats.total} 
              color="default"
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  fontSize: '0.6rem'
                }
              }}
            >
              <TaskIcon sx={{ fontSize: ui.compactView ? 14 : 16 }} />
            </Badge>
          </Tooltip>

          {/* Status breakdown for larger view */}
          {!ui.compactView && (
            <>
              {epicStats.done > 0 && (
                <Chip
                  label={`✓ ${epicStats.done}`}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(76, 175, 80, 0.3)',
                    color: 'white',
                    fontSize: '0.65rem',
                    height: 18
                  }}
                />
              )}
              
              {epicStats.doing > 0 && (
                <Chip
                  label={`⟳ ${epicStats.doing}`}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255, 152, 0, 0.3)',
                    color: 'white',
                    fontSize: '0.65rem',
                    height: 18
                  }}
                />
              )}
              
              {epicStats.todo > 0 && (
                <Chip
                  label={`◦ ${epicStats.todo}`}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(33, 150, 243, 0.3)',
                    color: 'white',
                    fontSize: '0.65rem',
                    height: 18
                  }}
                />
              )}
            </>
          )}
        </Box>

        {/* Right side - Expand/Collapse button */}
        <Tooltip title={expanded ? "Recolher épico" : "Expandir épico"}>
          <IconButton
            size="small"
            sx={{ 
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            {expanded ? (
              <ExpandLessIcon sx={{ fontSize: ui.compactView ? 16 : 20 }} />
            ) : (
              <ExpandMoreIcon sx={{ fontSize: ui.compactView ? 16 : 20 }} />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Tasks do Épico */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ 
          pl: ui.compactView ? 1 : 2, 
          pt: 1,
          borderLeft: `3px solid ${getEpicColor(epic)}40`,
          ml: 1
        }}>
          {tasks.length === 0 ? (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontStyle: 'italic', 
                textAlign: 'center', 
                py: 2 
              }}
            >
              Nenhuma tarefa neste épico
            </Typography>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={onStatusChange}
              />
            ))
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default EpicGroup;