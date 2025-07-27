import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Box,
  Stack
} from '@mui/material';
import {
  Comment as CommentIcon,
  Attachment as AttachmentIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useUIContext } from '../../contexts/UIContext';
import { useTaskContext } from '../../contexts/TaskContext';

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
  'Gráficos': '#4caf50'
};

const columns = [
  { id: 'Backlog', title: 'Backlog' },
  { id: 'Priorizado', title: 'Priorizado' },
  { id: 'Doing', title: 'Doing' },
  { id: 'Done', title: 'Done' }
];

const getInitials = (name) => {
  if (!name) return '';
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
};

const CompactTaskCard = ({ task, onStatusChange }) => {
  const { openModal } = useUIContext();
  const { updateTask } = useTaskContext();

  const getPriorityColor = (priority) => priorityColors[priority] || '#757575';

  const handleCardClick = (e) => {
    e.stopPropagation();
    openModal('taskDetails', task);
  };

  const handleMoveTask = (newStatus) => {
    if (newStatus === 'Done' && (!task.tempoGastoValidado || task.tempoGasto === null)) {
      openModal('timeValidation', task);
      return;
    }
    onStatusChange(task.id, newStatus);
  };

  const getNextStatus = () => {
    const currentIndex = columns.findIndex(col => col.id === task.status);
    return currentIndex < columns.length - 1 ? columns[currentIndex + 1].id : null;
  };

  const getPreviousStatus = () => {
    const currentIndex = columns.findIndex(col => col.id === task.status);
    return currentIndex > 0 ? columns[currentIndex - 1].id : null;
  };

  return (
    <Card 
      sx={{ 
        mb: 1, 
        cursor: 'pointer',
        minHeight: 60,
        '&:hover': { 
          backgroundColor: '#f5f5f5',
          transform: 'translateY(-1px)',
          boxShadow: 2
        },
        transition: 'all 0.2s ease-in-out'
      }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
        {/* Primeira linha: ID + Atividade */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              fontWeight: 'bold', 
              mr: 1, 
              minWidth: 'auto',
              fontSize: '0.65rem'
            }}
          >
            #{task.originalId}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              flex: 1, 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '0.8rem',
              lineHeight: 1.2
            }}
            title={task.atividade}
          >
            {task.atividade}
          </Typography>
        </Box>

        {/* Segunda linha: Prioridade + Horas + Avatar + Navegação */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            {/* Prioridade */}
            <Chip
              label={task.prioridade}
              size="small"
              sx={{
                backgroundColor: getPriorityColor(task.prioridade),
                color: 'white',
                fontSize: '0.6rem',
                height: 16,
                '& .MuiChip-label': {
                  px: 0.5
                }
              }}
            />

            {/* Estimativa */}
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontSize: '0.7rem' }}
            >
              {task.estimativa}h
            </Typography>

            {/* Avatar do desenvolvedor */}
            <Avatar
              sx={{ 
                width: 20, 
                height: 20, 
                fontSize: '0.65rem',
                backgroundColor: '#1976d2'
              }}
            >
              {getInitials(task.desenvolvedor)}
            </Avatar>
          </Stack>

          {/* Botões de navegação */}
          <Stack direction="row" spacing={0}>
            {getPreviousStatus() && (
              <Tooltip title={`Mover para ${getPreviousStatus()}`}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveTask(getPreviousStatus());
                  }}
                  sx={{ p: 0.25 }}
                >
                  <ArrowBackIcon sx={{ fontSize: 12 }} />
                </IconButton>
              </Tooltip>
            )}
            
            {getNextStatus() && (
              <Tooltip title={`Mover para ${getNextStatus()}`}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveTask(getNextStatus());
                  }}
                  sx={{ p: 0.25 }}
                >
                  <ArrowForwardIcon sx={{ fontSize: 12 }} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};

const ExpandedTaskCard = ({ task, onStatusChange }) => {
  const { openModal } = useUIContext();
  
  const getPriorityColor = (priority) => priorityColors[priority] || '#757575';
  const getEpicColor = (epic) => epicColors[epic] || '#666666';

  const handleMoveTask = (newStatus) => {
    if (newStatus === 'Done' && (!task.tempoGastoValidado || task.tempoGasto === null)) {
      openModal('timeValidation', task);
      return;
    }
    onStatusChange(task.id, newStatus);
  };

  const handleCardClick = (e) => {
    e.stopPropagation();
    openModal('taskDetails', task);
  };

  const getNextStatus = () => {
    const currentIndex = columns.findIndex(col => col.id === task.status);
    return currentIndex < columns.length - 1 ? columns[currentIndex + 1].id : null;
  };

  const getPreviousStatus = () => {
    const currentIndex = columns.findIndex(col => col.id === task.status);
    return currentIndex > 0 ? columns[currentIndex - 1].id : null;
  };

  const hasTimeSpent = task.tempoGasto && task.tempoGasto > 0;
  const hasHighErrorRate = task.taxaErro && task.taxaErro > 20;

  return (
    <Card 
      sx={{ 
        mb: 2, 
        cursor: 'pointer', 
        '&:hover': { 
          backgroundColor: '#f5f5f5',
          transform: 'translateY(-2px)',
          boxShadow: 3
        },
        transition: 'all 0.2s ease-in-out'
      }}
      onClick={handleCardClick}
    >
      <CardContent>
        {/* Header com ID e Épico */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            #{task.originalId}
          </Typography>
          {task.epico && (
            <Chip
              label={task.epico}
              size="small"
              sx={{
                backgroundColor: getEpicColor(task.epico),
                color: 'white',
                fontSize: '0.7rem'
              }}
            />
          )}
        </Box>

        {/* Título da atividade */}
        <Typography 
          variant="body2" 
          fontWeight="medium" 
          sx={{ mb: 1, lineHeight: 1.3 }}
        >
          {task.atividade}
        </Typography>

        {/* User Story (se existir) */}
        {task.userStory && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ mb: 1, fontSize: '0.8rem', fontStyle: 'italic' }}
          >
            {task.userStory}
          </Typography>
        )}

        {/* Informações principais */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          {/* Prioridade */}
          <Chip
            label={task.prioridade}
            size="small"
            sx={{
              backgroundColor: getPriorityColor(task.prioridade),
              color: 'white'
            }}
          />

          {/* Estimativa */}
          <Chip
            icon={<TimeIcon />}
            label={`${task.estimativa}h`}
            size="small"
            variant="outlined"
          />

          {/* Tempo gasto (se validado) */}
          {hasTimeSpent && (
            <Chip
              icon={<TimeIcon />}
              label={`${task.tempoGasto}h`}
              size="small"
              color={hasHighErrorRate ? "error" : "success"}
              variant="outlined"
            />
          )}

          {/* Desenvolvedor */}
          {task.desenvolvedor && (
            <Chip
              avatar={
                <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                  {getInitials(task.desenvolvedor)}
                </Avatar>
              }
              label={task.desenvolvedor}
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        {/* Indicadores especiais */}
        <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
          {task.observacoes && (
            <Tooltip title="Possui observações">
              <CommentIcon color="action" fontSize="small" />
            </Tooltip>
          )}
          
          {task.detalhamento && (
            <Tooltip title="Possui detalhamento">
              <AttachmentIcon color="action" fontSize="small" />
            </Tooltip>
          )}
          
          {hasHighErrorRate && (
            <Tooltip title={`Taxa de erro: ${task.taxaErro.toFixed(1)}%`}>
              <WarningIcon color="warning" fontSize="small" />
            </Tooltip>
          )}
        </Box>

        {/* Botões de navegação */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Box>
            {getPreviousStatus() && (
              <Tooltip title={`Mover para ${getPreviousStatus()}`}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveTask(getPreviousStatus());
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <Box>
            {getNextStatus() && (
              <Tooltip title={`Mover para ${getNextStatus()}`}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveTask(getNextStatus());
                  }}
                >
                  <ArrowForwardIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const TaskCard = ({ task, onStatusChange }) => {
  const { ui } = useUIContext();

  if (ui.compactView) {
    return (
      <CompactTaskCard 
        task={task} 
        onStatusChange={onStatusChange}
      />
    );
  }

  return (
    <ExpandedTaskCard 
      task={task} 
      onStatusChange={onStatusChange}
    />
  );
};

export default TaskCard;
export { CompactTaskCard, ExpandedTaskCard };