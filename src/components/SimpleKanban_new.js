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

const TaskEditModal = ({ task, open, onClose, onSave }) => {
  const [editedTask, setEditedTask] = useState(task);

  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  if (!task) return null;

  const handleFieldChange = (field, value) => {
    setEditedTask(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    if (editedTask && onSave) {
      onSave(editedTask);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Editar Tarefa #{task.originalId}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Épico"
              value={editedTask?.epico || ''}
              onChange={(e) => handleFieldChange('epico', e.target.value)}
              fullWidth
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="Sprint"
              value={editedTask?.sprint || ''}
              onChange={(e) => handleFieldChange('sprint', e.target.value)}
              fullWidth
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="História do Usuário"
              value={editedTask?.userStory || ''}
              onChange={(e) => handleFieldChange('userStory', e.target.value)}
              fullWidth
              multiline
              rows={2}
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Atividade"
              value={editedTask?.atividade || ''}
              onChange={(e) => handleFieldChange('atividade', e.target.value)}
              fullWidth
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Detalhamento"
              value={editedTask?.detalhamento || ''}
              onChange={(e) => handleFieldChange('detalhamento', e.target.value)}
              fullWidth
              multiline
              rows={2}
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="Desenvolvedor"
              value={editedTask?.desenvolvedor || ''}
              onChange={(e) => handleFieldChange('desenvolvedor', e.target.value)}
              fullWidth
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Status"
              value={editedTask?.status || ''}
              onChange={(e) => handleFieldChange('status', e.target.value)}
              fullWidth
              variant="outlined"
            >
              {columns.map(column => (
                <MenuItem key={column.id} value={column.id}>
                  {column.title}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Prioridade"
              value={editedTask?.prioridade || ''}
              onChange={(e) => handleFieldChange('prioridade', e.target.value)}
              fullWidth
              variant="outlined"
            >
              <MenuItem value="Baixa">Baixa</MenuItem>
              <MenuItem value="Média">Média</MenuItem>
              <MenuItem value="Alta">Alta</MenuItem>
              <MenuItem value="Crítica">Crítica</MenuItem>
            </TextField>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="Estimativa (horas)"
              type="number"
              value={editedTask?.estimativa || 0}
              onChange={(e) => handleFieldChange('estimativa', parseFloat(e.target.value) || 0)}
              fullWidth
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Observações"
              value={editedTask?.observacoes || ''}
              onChange={(e) => handleFieldChange('observacoes', e.target.value)}
              fullWidth
              multiline
              rows={2}
              variant="outlined"
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancelar
        </Button>
        <Button 
          onClick={handleSave} 
          color="primary" 
          variant="contained"
          disabled={!editedTask?.atividade?.trim()}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskEditModal;