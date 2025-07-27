import React, { useState, useEffect } from 'react';
import {
  TableRow,
  TableCell,
  TextField,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Box,
  Avatar
} from '@mui/material';
import {
  Edit as EditIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useTaskContext } from '../../contexts/TaskContext';
import { useUIContext, MODAL_TYPES } from '../../contexts/UIContext';

// Priority colors
const priorityColors = {
  'Alta': '#f44336',
  'Crítica': '#d32f2f',
  'Média': '#ff9800', 
  'Baixa': '#4caf50'
};

const getInitials = (name) => {
  if (!name) return '';
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
};

const TaskTableRow = ({ 
  task, 
  isTotal = false,
  onReestimativaChange 
}) => {
  const { updateTask } = useTaskContext();
  const { openModal } = useUIContext();
  
  const [localReestimativas, setLocalReestimativas] = useState([]);
  const [editingCell, setEditingCell] = useState(null);

  // Initialize local reestimativas
  useEffect(() => {
    if (task?.reestimativas) {
      setLocalReestimativas([...task.reestimativas]);
    } else if (!isTotal) {
      // Initialize with estimativa for regular tasks
      const initialArray = Array(10).fill(task?.estimativa || 0);
      setLocalReestimativas(initialArray);
    }
  }, [task?.reestimativas, task?.estimativa, isTotal]);

  const handleReestimativaChange = (dayIndex, value) => {
    if (isTotal) return; // Total row is read-only
    
    const numValue = parseFloat(value) || 0;
    const newReestimativas = [...localReestimativas];
    
    // Update the specific day
    newReestimativas[dayIndex] = numValue;
    
    // Replicate to following days (replication logic)
    for (let i = dayIndex + 1; i < 10; i++) {
      newReestimativas[i] = numValue;
    }
    
    setLocalReestimativas(newReestimativas);
    
    // Update task in context
    updateTask(task.id, { reestimativas: newReestimativas });
    
    // Call parent callback if provided
    if (onReestimativaChange) {
      onReestimativaChange(task.id, dayIndex, numValue);
    }
  };

  const handleEstimativaChange = (value) => {
    if (isTotal) return;
    
    const numValue = parseFloat(value) || 0;
    updateTask(task.id, { estimativa: numValue });
    
    // Also update Day 1 if it matches current estimativa
    if (localReestimativas[0] === task.estimativa) {
      handleReestimativaChange(0, numValue);
    }
  };

  const handleTaskClick = () => {
    if (isTotal) return;
    openModal(MODAL_TYPES.TASK_DETAILS, task);
  };

  const getPriorityColor = (priority) => priorityColors[priority] || '#757575';

  const renderEditableCell = (value, onChange, dayIndex = null) => {
    const cellKey = dayIndex !== null ? `day-${dayIndex}` : 'estimativa';
    const isEditing = editingCell === cellKey;
    
    if (isTotal || !onChange) {
      return (
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: isTotal ? 'bold' : 'normal',
            color: isTotal ? 'primary.main' : 'inherit'
          }}
        >
          {typeof value === 'number' ? value.toFixed(1) : value}
        </Typography>
      );
    }

    return (
      <TextField
        value={value || 0}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setEditingCell(cellKey)}
        onBlur={() => setEditingCell(null)}
        size="small"
        type="number"
        inputProps={{ 
          min: 0, 
          step: 0.5,
          style: { 
            textAlign: 'center',
            padding: '4px 8px',
            fontSize: '0.75rem'
          }
        }}
        sx={{
          width: '60px',
          '& .MuiOutlinedInput-root': {
            backgroundColor: dayIndex !== null && dayIndex > 0 && 
                           localReestimativas[dayIndex] === localReestimativas[dayIndex - 1] 
              ? '#e3f2fd' : 'transparent'
          },
          '& input[type=number]': {
            '-moz-appearance': 'textfield'
          },
          '& input[type=number]::-webkit-outer-spin-button': {
            '-webkit-appearance': 'none',
            margin: 0
          },
          '& input[type=number]::-webkit-inner-spin-button': {
            '-webkit-appearance': 'none',
            margin: 0
          }
        }}
      />
    );
  };

  const renderActivityCell = () => {
    if (isTotal) {
      return (
        <Typography variant="subtitle2" fontWeight="bold" color="primary">
          TOTAL
        </Typography>
      );
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography
          variant="body2"
          sx={{
            cursor: 'pointer',
            color: 'primary.main',
            textDecoration: 'underline',
            '&:hover': {
              backgroundColor: 'action.hover'
            },
            maxWidth: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
          title={task.atividade}
          onClick={handleTaskClick}
        >
          {task.atividade}
        </Typography>

        {/* Status indicators */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {task.status === 'Done' && task.tempoGastoValidado && (
            <Tooltip title={`Tempo validado: ${task.tempoGasto}h`}>
              <CheckCircleIcon 
                sx={{ fontSize: 14, color: 'success.main' }} 
              />
            </Tooltip>
          )}
          
          {task.taxaErro && task.taxaErro > 20 && (
            <Tooltip title={`Taxa de erro: ${task.taxaErro.toFixed(1)}%`}>
              <ErrorIcon 
                sx={{ fontSize: 14, color: 'error.main' }} 
              />
            </Tooltip>
          )}

          {task.observacoes && (
            <Tooltip title="Possui observações">
              <InfoIcon 
                sx={{ fontSize: 14, color: 'info.main' }} 
              />
            </Tooltip>
          )}
        </Box>
      </Box>
    );
  };

  const renderDeveloperCell = () => {
    if (isTotal) return null;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar 
          sx={{ 
            width: 20, 
            height: 20, 
            fontSize: '0.7rem',
            backgroundColor: getPriorityColor(task.prioridade)
          }}
        >
          {getInitials(task.desenvolvedor)}
        </Avatar>
        <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
          {task.desenvolvedor}
        </Typography>
      </Box>
    );
  };

  const renderPriorityChip = () => {
    if (isTotal) return null;
    
    return (
      <Chip
        label={task.prioridade}
        size="small"
        sx={{
          backgroundColor: getPriorityColor(task.prioridade),
          color: 'white',
          fontSize: '0.65rem',
          height: 20
        }}
      />
    );
  };

  return (
    <TableRow
      sx={{
        backgroundColor: isTotal ? 'action.hover' : 'inherit',
        '&:hover': {
          backgroundColor: isTotal ? 'action.hover' : 'action.hover'
        },
        borderTop: isTotal ? '2px solid #1976d2' : 'none'
      }}
    >
      {/* ID */}
      <TableCell sx={{ padding: '4px 8px', width: '60px' }}>
        {!isTotal && (
          <Typography variant="caption" color="text.secondary">
            #{task.originalId}
          </Typography>
        )}
      </TableCell>

      {/* Atividade */}
      <TableCell sx={{ padding: '4px 8px', width: '30%' }}>
        {renderActivityCell()}
      </TableCell>

      {/* Desenvolvedor */}
      <TableCell sx={{ padding: '4px 8px', width: '120px' }}>
        {renderDeveloperCell()}
      </TableCell>

      {/* Prioridade */}
      <TableCell sx={{ padding: '4px 8px', width: '80px' }}>
        {renderPriorityChip()}
      </TableCell>

      {/* Est. Inicial */}
      <TableCell sx={{ padding: '4px 8px', width: '8%' }}>
        {renderEditableCell(
          task.estimativa,
          isTotal ? null : handleEstimativaChange
        )}
      </TableCell>

      {/* Dias 1-10 */}
      {Array.from({ length: 10 }, (_, index) => (
        <TableCell 
          key={`day-${index + 1}`} 
          sx={{ 
            padding: '4px 8px', 
            width: '6.2%',
            backgroundColor: !isTotal && index > 0 && 
                           localReestimativas[index] === localReestimativas[index - 1] 
              ? '#e3f2fd' : 'transparent'
          }}
        >
          {renderEditableCell(
            isTotal ? task[`dia${index + 1}`] : localReestimativas[index],
            isTotal ? null : (value) => handleReestimativaChange(index, value),
            index
          )}
        </TableCell>
      ))}

      {/* Actions */}
      <TableCell sx={{ padding: '4px 8px', width: '60px' }}>
        {!isTotal && (
          <Tooltip title="Ver detalhes">
            <IconButton 
              size="small" 
              onClick={handleTaskClick}
              sx={{ p: 0.5 }}
            >
              <InfoIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
};

export default TaskTableRow;
export { TaskTableRow };