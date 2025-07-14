import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  IconButton,
  Tooltip,
  TableSortLabel,
  TablePagination,
  Toolbar,
  Typography,
  Snackbar,
  Alert,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  GetApp as ExportIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  TimeScale
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format, differenceInDays, addDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportToExcel } from '../utils/excelImport';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  TimeScale
);

const priorityColors = {
  'Alta': '#f44336',
  'Média': '#ff9800',
  'Baixa': '#4caf50'
};

const statusColors = {
  'Backlog': '#757575',
  'Priorizado': '#ff9800',
  'Doing': '#4caf50',
  'Done': '#9c27b0'
};

const TableView = ({ tasks, onTasksUpdate }) => {
  const [sortBy, setSortBy] = useState('originalId');
  const [sortDirection, setSortDirection] = useState('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [showSaveMessage, setShowSaveMessage] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState('');
  const [chartData, setChartData] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filters, setFilters] = useState({
    sprint: '',
    desenvolvedor: '',
    prioridade: '',
    status: '',
    epico: ''
  });
  
  const [teamConfig, setTeamConfig] = useState({
    developers: 3,
    hoursPerDay: 8,
    sprintDays: 10
  });
  
  const [activeTab, setActiveTab] = useState(0);

  const handleSort = (field) => {
    const isAsc = sortBy === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortBy(field);
  };

  const handleValueChange = (taskId, field, value) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const updatedTask = { ...task, [field]: value, updatedAt: new Date().toISOString() };
        
        // Se alterou a estimativa inicial, inicializar reestimativas se não existir
        if (field === 'estimativa') {
          if (!task.reestimativas || task.reestimativas.length === 0) {
            updatedTask.reestimativas = Array.from({ length: 10 }, () => value);
          }
        }
        
        return updatedTask;
      }
      return task;
    });
    onTasksUpdate(updatedTasks);
    setShowSaveMessage(true);
    
    // Forçar atualização do gráfico se alterou estimativa
    if (field === 'estimativa' && selectedSprint) {
      const data = calculateSprintData(selectedSprint);
      setChartData(data);
    }
  };

  const handleReestimativaChange = (taskId, dayIndex, value) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        // Garantir que existe um array de reestimativas
        const existingReestimativas = task.reestimativas || Array.from({ length: 10 }, () => task.estimativa || 0);
        const newReestimativas = [...existingReestimativas];
        
        // Garantir que o array tem 10 elementos
        while (newReestimativas.length < 10) {
          newReestimativas.push(task.estimativa || 0);
        }
        
        const newValue = parseFloat(value) || 0;
        
        // Se for Dia 1 (índice 0), atualizar a estimativa inicial
        let updatedTask = { ...task };
        if (dayIndex === 0) {
          updatedTask.estimativa = newValue;
        } else {
          // Para outros dias, definir o valor nas reestimativas
          newReestimativas[dayIndex] = newValue;
        }
        
        // Se o valor for zero, zerar todas as posições seguintes
        if (newValue === 0) {
          for (let i = dayIndex + 1; i < 10; i++) {
            newReestimativas[i] = 0;
          }
        } else {
          // Replicar o valor para todos os dias subsequentes (comportamento normal)
          for (let i = dayIndex + 1; i < 10; i++) {
            newReestimativas[i] = newValue;
          }
        }
        
        return { 
          ...updatedTask, 
          reestimativas: newReestimativas, 
          updatedAt: new Date().toISOString() 
        };
      }
      return task;
    });
    onTasksUpdate(updatedTasks);
    setShowSaveMessage(true);
    
    // Forçar atualização do gráfico imediatamente
    if (selectedSprint) {
      const data = calculateSprintData(selectedSprint);
      setChartData(data);
    }
  };

  // Garantir que as reestimativas sejam inicializadas corretamente
  const ensureReestimativas = (task) => {
    if (!task.reestimativas || task.reestimativas.length < 10) {
      const newReestimativas = Array.from({ length: 10 }, (_, index) => {
        if (task.reestimativas && task.reestimativas[index] !== undefined) {
          return task.reestimativas[index];
        }
        return task.estimativa || 0;
      });
      
      return {
        ...task,
        reestimativas: newReestimativas
      };
    }
    
    return task;
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({ sprint: '', desenvolvedor: '', prioridade: '', status: '', epico: '' });
  };

  const getUniqueValues = (field) => {
    return [...new Set(tasks.map(task => task[field]).filter(Boolean))];
  };

  const calculateSprintData = (sprintName) => {
    const sprintTasks = tasks.filter(task => task.sprint === sprintName);
    if (sprintTasks.length === 0) return null;

    const totalHours = sprintTasks.reduce((sum, task) => sum + (task.estimativa || 0), 0);
    const sprintDays = teamConfig.sprintDays;
    
    // Capacidade total da equipe por dia
    const teamCapacityPerDay = teamConfig.developers * teamConfig.hoursPerDay;
    
    // Calcular quantos dias são necessários para completar baseado na capacidade
    const daysNeeded = Math.ceil(totalHours / teamCapacityPerDay);
    
    // Usar o maior valor entre dias do sprint configurado e dias necessários
    const maxDays = Math.max(sprintDays, daysNeeded);
    
    const labels = [];
    const idealLine = [];
    const actualLine = [];
    const capacityLine = [];

    for (let i = 0; i <= maxDays; i++) {
      // Labels como "Dia 0", "Dia 1", etc.
      labels.push(`Dia ${i}`);

      // Linha ideal - usar mesma lógica da LINHA IDEAL da tabela
      if (i === 0) {
        idealLine.push(totalHours);
      } else {
        // Capacidade acumulada até o dia i
        const capacidadeAcumulada = teamCapacityPerDay * i;
        // Trabalho restante = total inicial - capacidade consumida
        const trabalhoRestante = Math.max(0, totalHours - capacidadeAcumulada);
        idealLine.push(trabalhoRestante);
      }

      // Linha real - usar exatamente o mesmo cálculo da tabela
      if (i === 0) {
        // Dia 0 = total inicial
        actualLine.push(totalHours);
        capacityLine.push(totalHours);
      } else {
        const dayIndex = i - 1; // Dia 1 = index 0, Dia 2 = index 1, etc.
        
        // Usar o somatório das reestimativas para este dia (mesma lógica da tabela)
        let dayTotal = 0;
        sprintTasks.forEach(task => {
          const taskWithReestimativas = ensureReestimativas(task);
          const dayValue = dayIndex === 0 
            ? task.estimativa || 0
            : (taskWithReestimativas.reestimativas && taskWithReestimativas.reestimativas[dayIndex] !== undefined 
                ? taskWithReestimativas.reestimativas[dayIndex] 
                : task.estimativa || 0);
          dayTotal += dayValue;
        });
        
        actualLine.push(Math.max(0, dayTotal));
        
        // Linha de previsão da equipe - baseada no progresso real atual
        // Calcular velocidade real baseada no trabalho já executado
        let workExecuted = 0;
        sprintTasks.forEach(task => {
          const taskWithReestimativas = ensureReestimativas(task);
          const estimativaOriginal = task.estimativa || 0;
          
          // Verificar se a tarefa foi finalizada até o dia anterior
          for (let d = 0; d < dayIndex && d < 10; d++) {
            const dayValue = d === 0 
              ? task.estimativa || 0
              : (taskWithReestimativas.reestimativas && taskWithReestimativas.reestimativas[d] !== undefined 
                  ? taskWithReestimativas.reestimativas[d] 
                  : task.estimativa || 0);
            
            if (dayValue === 0 && d < dayIndex) {
              workExecuted += estimativaOriginal;
              break;
            }
          }
        });
        
        // Velocidade real = trabalho executado / dias decorridos
        const realVelocity = dayIndex > 0 ? workExecuted / dayIndex : teamCapacityPerDay;
        
        // Projeção baseada na velocidade real
        const projectedWork = totalHours - (realVelocity * i);
        capacityLine.push(Math.max(0, projectedWork));
      }
    }

    return {
      labels,
      datasets: [
        {
          label: 'Linha Ideal',
          data: idealLine,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderDash: [5, 5],
          tension: 0.1
        },
        {
          label: 'Executado',
          data: actualLine,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1
        },
        {
          label: 'Projeção Real (baseada na velocidade atual)',
          data: capacityLine,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderDash: [10, 5],
          tension: 0.1
        }
      ],
      daysNeeded,
      willOverflow: daysNeeded > sprintDays
    };
  };


  const calculateSprintStats = (sprintName) => {
    const sprintTasks = tasks.filter(task => task.sprint === sprintName);
    if (sprintTasks.length === 0) return {};

    const totalTasks = sprintTasks.length;
    const completedTasks = sprintTasks.filter(task => task.status === 'Done').length;
    const totalHours = sprintTasks.reduce((sum, task) => sum + task.estimativa, 0);
    
    // Calcular trabalho executado baseado nas finalizações (zeros)
    let hoursExecuted = 0;
    sprintTasks.forEach(task => {
      const taskWithReestimativas = ensureReestimativas(task);
      const estimativaOriginal = task.estimativa || 0;
      
      // Verificar se a tarefa foi finalizada em algum dia
      for (let d = 0; d < 10; d++) {
        const dayValue = d === 0 
          ? task.estimativa || 0
          : (taskWithReestimativas.reestimativas && taskWithReestimativas.reestimativas[d] !== undefined 
              ? taskWithReestimativas.reestimativas[d] 
              : task.estimativa || 0);
        
        if (dayValue === 0) {
          hoursExecuted += estimativaOriginal;
          break;
        }
      }
    });

    const hoursRemaining = totalHours - hoursExecuted;
    const executionRate = totalHours > 0 ? (hoursExecuted / totalHours) * 100 : 0;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Cálculos de previsão baseados na capacidade atual
    const sprintDays = teamConfig.sprintDays;
    const hoursPerDay = teamConfig.hoursPerDay;
    const currentDevs = teamConfig.developers;
    const currentCapacity = currentDevs * hoursPerDay * sprintDays;
    
    // Quantos devs são necessários para cumprir o prazo
    const devsNeeded = Math.ceil(totalHours / (sprintDays * hoursPerDay));
    
    // Velocidade atual (horas executadas por dia)
    const currentVelocity = hoursExecuted / Math.max(1, sprintDays); // evitar divisão por zero
    const idealVelocity = totalHours / sprintDays;
    
    // Previsão de conclusão baseada na velocidade atual
    const daysToComplete = currentVelocity > 0 ? Math.ceil(hoursRemaining / currentVelocity) : sprintDays;
    
    // Status do projeto
    const isOnTrack = executionRate >= (100 / sprintDays) * Math.min(sprintDays, 10);
    const riskLevel = executionRate < 50 ? 'Alto' : executionRate < 80 ? 'Médio' : 'Baixo';

    return {
      totalTasks,
      completedTasks,
      totalHours,
      hoursExecuted,
      hoursRemaining,
      executionRate,
      completionRate,
      currentVelocity,
      idealVelocity,
      daysToComplete,
      devsNeeded,
      currentCapacity,
      isOnTrack,
      riskLevel
    };
  };

  useEffect(() => {
    if (selectedSprint) {
      const data = calculateSprintData(selectedSprint);
      setChartData(data);
    }
  }, [selectedSprint, tasks, teamConfig]);

  useEffect(() => {
    const sprints = getUniqueValues('sprint');
    if (sprints.length > 0 && !selectedSprint) {
      setSelectedSprint(sprints[0]);
    }
  }, [tasks]);

  const getFilteredAndSortedTasks = () => {
    let filtered = tasks;
    
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        filtered = filtered.filter(task => task[key] === filters[key]);
      }
    });
    
    return filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  const filteredTasks = getFilteredAndSortedTasks();
  
  // Calcular valor medido para uma tarefa (somatório dos valores dos 10 dias)
  // Só calcula a soma quando um dos dias tiver valor zero
  const calculateValorMedido = (task) => {
    const taskWithReestimativas = ensureReestimativas(task);
    let hasZero = false;
    let total = 0;
    
    // Verificar se algum dia tem valor zero
    for (let i = 0; i < 10; i++) {
      // Dia 1 (índice 0) sempre usa a estimativa inicial
      const dayValue = i === 0 
        ? task.estimativa || 0
        : (taskWithReestimativas.reestimativas && taskWithReestimativas.reestimativas[i] !== undefined 
            ? taskWithReestimativas.reestimativas[i] 
            : task.estimativa || 0);
      
      if (dayValue === 0) {
        hasZero = true;
      }
      total += dayValue;
    }
    
    // Só retorna a soma se houver pelo menos um zero
    return hasZero ? total : 0;
  };

  // Calcular trabalho restante por dia (burndown real - decresce conforme tarefas são finalizadas)
  const calculateExecutado = () => {
    const totalHours = filteredTasks.reduce((sum, task) => sum + (task.estimativa || 0), 0);
    const executado = [];
    
    for (let dayIndex = 0; dayIndex < 10; dayIndex++) {
      let trabalhoRestante = totalHours;
      
      // Para cada tarefa, verificar se foi finalizada até este dia
      filteredTasks.forEach(task => {
        const taskWithReestimativas = ensureReestimativas(task);
        const estimativaOriginal = task.estimativa || 0;
        
        // Verificar se a tarefa foi finalizada até este dia
        for (let d = 0; d <= dayIndex && d < 10; d++) {
          const dayValue = d === 0 
            ? task.estimativa || 0
            : (taskWithReestimativas.reestimativas && taskWithReestimativas.reestimativas[d] !== undefined 
                ? taskWithReestimativas.reestimativas[d] 
                : task.estimativa || 0);
          
          // Se o valor chegou a zero neste dia, a tarefa foi concluída
          if (dayValue === 0 && d <= dayIndex) {
            trabalhoRestante -= estimativaOriginal;
            break; // Tarefa já foi contabilizada como concluída
          }
        }
      });
      
      executado.push(Math.max(0, trabalhoRestante));
    }
    
    return executado;
  };

  // Calcular linha ideal baseado na capacidade da equipe
  const calculateLinhaIdeal = () => {
    const teamCapacityPerDay = teamConfig.developers * teamConfig.hoursPerDay;
    const totalHours = filteredTasks.reduce((sum, task) => sum + (task.estimativa || 0), 0);
    
    const linhaIdeal = [];
    for (let i = 0; i < 10; i++) {
      // Capacidade acumulada até o dia i+1
      const capacidadeAcumulada = teamCapacityPerDay * (i + 1);
      // Trabalho restante = total inicial - capacidade consumida
      const trabalhoRestante = Math.max(0, totalHours - capacidadeAcumulada);
      linhaIdeal.push(trabalhoRestante);
    }
    
    return linhaIdeal;
  };

  // Calcular somatórios por coluna
  const calculateColumnTotals = () => {
    const totals = {
      estimativa: 0,
      dias: Array.from({ length: 10 }, () => 0),
      valorMedido: 0
    };
    
    filteredTasks.forEach(task => {
      const taskWithReestimativas = ensureReestimativas(task);
      totals.estimativa += task.estimativa || 0;
      totals.valorMedido += calculateValorMedido(task);
      
      for (let i = 0; i < 10; i++) {
        // Dia 1 (índice 0) sempre usa a estimativa inicial
        const dayValue = i === 0 
          ? task.estimativa || 0 
          : (taskWithReestimativas.reestimativas && taskWithReestimativas.reestimativas[i] !== undefined 
              ? taskWithReestimativas.reestimativas[i] 
              : task.estimativa || 0);
        totals.dias[i] += dayValue;
      }
    });
    
    return totals;
  };

  const columnTotals = calculateColumnTotals();
  const linhaIdeal = calculateLinhaIdeal();
  const executado = calculateExecutado();
  const paginatedTasks = filteredTasks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExport = () => {
    exportToExcel(filteredTasks);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedTask(null);
  };

  const handleTaskUpdate = (field, value) => {
    if (selectedTask) {
      setSelectedTask({ ...selectedTask, [field]: value });
    }
  };

  const handleSaveTask = () => {
    if (selectedTask) {
      const updatedTasks = tasks.map(task => 
        task.id === selectedTask.id 
          ? { ...selectedTask, updatedAt: new Date().toISOString() }
          : task
      );
      onTasksUpdate(updatedTasks);
      setShowSaveMessage(true);
      setDetailsOpen(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Burndown Chart - Sprint ${selectedSprint}`
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed && context.parsed.y ? context.parsed.y : 0;
            return `${context.dataset.label}: ${Number(value).toFixed(1)}h`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Dias do Sprint'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Horas Restantes'
        },
        beginAtZero: true
      }
    }
  };

  const EditableCell = ({ task, field, type = 'text', options = [] }) => {
    const value = task[field];
    
    if (type === 'select') {
      return (
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={value}
            onChange={(e) => handleValueChange(task.id, field, e.target.value)}
            variant="standard"
          >
            {options.map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }
    
    if (field === 'prioridade') {
      return (
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <Select
            value={value}
            onChange={(e) => handleValueChange(task.id, field, e.target.value)}
            variant="standard"
            renderValue={(selected) => (
              <Chip
                label={selected}
                size="small"
                sx={{
                  bgcolor: priorityColors[selected],
                  color: 'white',
                  height: 20
                }}
              />
            )}
          >
            {['Alta', 'Média', 'Baixa'].map(priority => (
              <MenuItem key={priority} value={priority}>
                <Chip
                  label={priority}
                  size="small"
                  sx={{
                    bgcolor: priorityColors[priority],
                    color: 'white'
                  }}
                />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }
    
    if (field === 'status') {
      return (
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <Select
            value={value}
            onChange={(e) => handleValueChange(task.id, field, e.target.value)}
            variant="standard"
            renderValue={(selected) => (
              <Chip
                label={selected}
                size="small"
                sx={{
                  bgcolor: statusColors[selected],
                  color: 'white',
                  height: 20
                }}
              />
            )}
          >
            {['Backlog', 'Priorizado', 'Doing', 'Done'].map(status => (
              <MenuItem key={status} value={status}>
                <Chip
                  label={status}
                  size="small"
                  sx={{
                    bgcolor: statusColors[status],
                    color: 'white'
                  }}
                />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }
    
    return (
      <TextField
        size="small"
        type={type}
        value={value}
        onChange={(e) => handleValueChange(task.id, field, e.target.value)}
        variant="standard"
        sx={{ minWidth: 100 }}
        fullWidth
      />
    );
  };

  const ReestimativaCell = ({ task, dayIndex }) => {
    const value = task.reestimativas[dayIndex];
    
    // Verificar se este valor é igual ao valor do dia anterior (indicando replicação)
    const isReplicated = dayIndex > 0 && task.reestimativas[dayIndex] === task.reestimativas[dayIndex - 1];
    
    return (
      <TextField
        size="small"
        type="number"
        value={value || 0}
        onChange={(e) => handleReestimativaChange(task.id, dayIndex, e.target.value)}
        variant="standard"
        sx={{ 
          width: 70,
          '& .MuiInputBase-input': {
            backgroundColor: isReplicated ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
            borderRadius: '4px'
          }
        }}
        inputProps={{ 
          min: 0, 
          step: 0.5,
          style: { textAlign: 'center' }
        }}
        title={isReplicated ? 'Valor replicado do dia anterior' : 'Valor original'}
      />
    );
  };

  const sprintStats = calculateSprintStats(selectedSprint);

  return (
    <Box>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Tarefas ({filteredTasks.length})
        </Typography>
        <Button
          startIcon={<ExportIcon />}
          onClick={handleExport}
          variant="outlined"
          size="small"
        >
          Exportar
        </Button>
      </Toolbar>

      {/* Abas Principais */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
            <Tab label="📈 Burndown Chart" />
          </Tabs>
          
          {/* Burndown Chart */}
          {(
            <Box>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Burndown Chart
                </Typography>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <Select
                    value={selectedSprint}
                    onChange={(e) => setSelectedSprint(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">Selecione um Sprint</MenuItem>
                    {getUniqueValues('sprint').map(sprint => (
                      <MenuItem key={sprint} value={sprint}>{sprint}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary">
                  Configuração:
                </Typography>
                <TextField
                  label="Desenvolvedores"
                  type="number"
                  size="small"
                  value={teamConfig.developers}
                  onChange={(e) => setTeamConfig({...teamConfig, developers: parseInt(e.target.value) || 1})}
                  sx={{ width: 120 }}
                  inputProps={{ min: 1, max: 20 }}
                />
                <TextField
                  label="Horas/dia"
                  type="number"
                  size="small"
                  value={teamConfig.hoursPerDay}
                  onChange={(e) => setTeamConfig({...teamConfig, hoursPerDay: parseInt(e.target.value) || 1})}
                  sx={{ width: 100 }}
                  inputProps={{ min: 1, max: 24 }}
                />
                <TextField
                  label="Dias Sprint"
                  type="number"
                  size="small"
                  value={teamConfig.sprintDays}
                  onChange={(e) => setTeamConfig({...teamConfig, sprintDays: parseInt(e.target.value) || 1})}
                  sx={{ width: 100 }}
                  inputProps={{ min: 1, max: 50 }}
                />
                <Typography variant="body2" color="primary">
                  Capacidade: {teamConfig.developers * teamConfig.hoursPerDay}h/dia
                </Typography>
              </Box>
              
              {/* Layout de duas colunas: Gráfico + Estatísticas */}
              <Grid container spacing={3}>
                {/* Coluna do Gráfico */}
                <Grid item xs={12} lg={8}>
                  <Box sx={{ height: 400 }}>
                    {chartData && selectedSprint ? (
                      <Line data={chartData} options={chartOptions} />
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Typography color="text.secondary">
                          Selecione um sprint para visualizar o burndown
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
                
                {/* Coluna das Estatísticas */}
                <Grid item xs={12} lg={4}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    📊 Estatísticas do Sprint
                    {selectedSprint && (
                      <Chip 
                        label={selectedSprint} 
                        size="small" 
                        color="primary" 
                        sx={{ ml: 2 }}
                      />
                    )}
                  </Typography>
                  
                  {selectedSprint && sprintStats.totalTasks > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: 350, overflowY: 'auto' }}>
                      {/* Informações Básicas */}
                      <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                          📋 Informações Gerais
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">Progresso</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {sprintStats.completionRate.toFixed(1)}%
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Sprint</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{selectedSprint}</Typography>
                        </Box>
                      </Card>
                      
                      {/* Tarefas */}
                      <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                          ✅ Tarefas
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">Total</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{sprintStats.totalTasks}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Concluídas</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {sprintStats.completedTasks}
                          </Typography>
                        </Box>
                      </Card>
                      
                      {/* Horas */}
                      <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                          ⏱️ Horas
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">Estimadas</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{sprintStats.totalHours}h</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Concluídas</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {sprintStats.completedHours}h
                          </Typography>
                        </Box>
                      </Card>
                      
                      {/* Status do Prazo */}
                      {chartData && chartData.daysNeeded && (
                        <Card variant="outlined" sx={{ 
                          p: 2, 
                          bgcolor: chartData.willOverflow ? 'error.light' : 'success.light',
                          borderColor: chartData.willOverflow ? 'error.main' : 'success.main'
                        }}>
                          <Typography variant="subtitle2" sx={{ 
                            color: chartData.willOverflow ? 'error.dark' : 'success.dark',
                            fontWeight: 'bold',
                            mb: 1
                          }}>
                            {chartData.willOverflow ? '⚠️ PRAZO ESTOURADO' : '✅ PRAZO OK'}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">Necessários</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{chartData.daysNeeded} dias</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Sprint</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{teamConfig.sprintDays} dias</Typography>
                          </Box>
                        </Card>
                      )}
                    </Box>
                  ) : (
                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      Selecione um sprint para ver as estatísticas
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
      
      
      <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
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
            label="Status"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {getUniqueValues('status').map(status => (
              <MenuItem key={status} value={status}>{status}</MenuItem>
            ))}
          </TextField>
          
          <IconButton onClick={clearFilters} size="small">
            <ClearIcon />
          </IconButton>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          💡 Dica: Ao alterar um dia, o valor será automaticamente replicado para todos os dias subsequentes. 
          Campos com fundo azul claro indicam valores replicados.
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
        <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '30%', minWidth: 200 }}>
                <TableSortLabel
                  active={sortBy === 'atividade'}
                  direction={sortBy === 'atividade' ? sortDirection : 'asc'}
                  onClick={() => handleSort('atividade')}
                >
                  Atividade
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ width: '8%', textAlign: 'center', minWidth: 80 }}>
                <TableSortLabel
                  active={sortBy === 'estimativa'}
                  direction={sortBy === 'estimativa' ? sortDirection : 'asc'}
                  onClick={() => handleSort('estimativa')}
                >
                  Est. Inicial
                </TableSortLabel>
              </TableCell>
              {Array.from({ length: 10 }, (_, i) => (
                <TableCell key={i} sx={{ width: '6.2%', textAlign: 'center', minWidth: 65, fontSize: '0.75rem' }}>
                  Dia {i + 1}
                </TableCell>
              ))}
              <TableCell sx={{ width: '8%', textAlign: 'center', minWidth: 80, fontSize: '0.75rem' }}>
                Valor Medido
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Linha de somatórios */}
            <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)', fontWeight: 'bold' }}>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>TOTAL</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.875rem' }}>
                {columnTotals.estimativa.toFixed(1)}h
              </TableCell>
              {Array.from({ length: 10 }, (_, i) => (
                <TableCell key={i} sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.875rem', padding: '8px 2px' }}>
                  {columnTotals.dias[i].toFixed(1)}h
                </TableCell>
              ))}
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.875rem' }}>
                {columnTotals.valorMedido ? columnTotals.valorMedido.toFixed(1) : '0.0'}h
              </TableCell>
            </TableRow>
            {/* Linha Ideal */}
            <TableRow sx={{ backgroundColor: 'rgba(25, 118, 210, 0.08)', fontWeight: 'bold' }}>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem', color: '#1976d2' }}>LINHA IDEAL</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.875rem', color: '#1976d2' }}>
                {filteredTasks.reduce((sum, task) => sum + (task.estimativa || 0), 0).toFixed(1)}h
              </TableCell>
              {Array.from({ length: 10 }, (_, i) => (
                <TableCell key={i} sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.875rem', padding: '8px 2px', color: '#1976d2' }}>
                  {linhaIdeal[i].toFixed(1)}h
                </TableCell>
              ))}
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.875rem', color: '#1976d2' }}>
                -
              </TableCell>
            </TableRow>
            {/* Linha Executado */}
            <TableRow sx={{ backgroundColor: 'rgba(255, 99, 132, 0.08)', fontWeight: 'bold' }}>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem', color: '#d32f2f' }}>EXECUTADO</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.875rem', color: '#d32f2f' }}>
                {filteredTasks.reduce((sum, task) => sum + (task.estimativa || 0), 0).toFixed(1)}h
              </TableCell>
              {Array.from({ length: 10 }, (_, i) => (
                <TableCell key={i} sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.875rem', padding: '8px 2px', color: '#d32f2f' }}>
                  {executado[i].toFixed(1)}h
                </TableCell>
              ))}
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.875rem', color: '#d32f2f' }}>
                {executado[9] ? executado[9].toFixed(1) : '0.0'}h
              </TableCell>
            </TableRow>
            {paginatedTasks.map((task) => (
              <TableRow key={task.id} hover>
                <TableCell sx={{ padding: '8px 12px' }}>
                  <Link 
                    component="button" 
                    variant="body2" 
                    onClick={() => handleTaskClick(task)}
                    sx={{ 
                      textAlign: 'left',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                    sx={{ 
                      textAlign: 'left',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      lineHeight: 1.2,
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    {task.atividade || 'Sem atividade'}
                  </Link>
                </TableCell>
                <TableCell sx={{ padding: '8px 4px' }}>
                  <TextField
                    size="small"
                    type="number"
                    value={task.estimativa || 0}
                    onChange={(e) => handleValueChange(task.id, 'estimativa', parseFloat(e.target.value) || 0)}
                    onFocus={(e) => e.target.select()}
                    variant="standard"
                    sx={{ 
                      width: '100%',
                      '& .MuiInputBase-input': {
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        padding: '2px 4px'
                      }
                    }}
                    InputProps={{
                      disableUnderline: false,
                      sx: {
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
                      }
                    }}
                    inputProps={{ 
                      min: 0, 
                      step: 0.5,
                      style: { textAlign: 'center' }
                    }}
                  />
                </TableCell>
                {Array.from({ length: 10 }, (_, i) => {
                  const taskWithReestimativas = ensureReestimativas(task);
                  // Dia 1 (índice 0) sempre usa a estimativa inicial
                  const currentValue = i === 0 
                    ? task.estimativa || 0
                    : (taskWithReestimativas.reestimativas && taskWithReestimativas.reestimativas[i] !== undefined 
                        ? taskWithReestimativas.reestimativas[i] 
                        : task.estimativa || 0);
                  
                  return (
                    <TableCell key={i} sx={{ textAlign: 'center', padding: '8px 2px' }}>
                      <TextField
                        size="small"
                        type="number"
                        value={currentValue}
                        onChange={(e) => handleReestimativaChange(task.id, i, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        variant="standard"
                        sx={{ 
                          width: '100%',
                          '& .MuiInputBase-input': {
                            backgroundColor: i > 0 && taskWithReestimativas.reestimativas[i] === taskWithReestimativas.reestimativas[i - 1] ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                            borderRadius: '4px',
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            padding: '2px 4px',
                            transition: 'background-color 0.2s ease'
                          },
                          '& .MuiInputBase-input:focus': {
                            backgroundColor: 'rgba(25, 118, 210, 0.12)'
                          }
                        }}
                        InputProps={{
                          disableUnderline: false,
                          sx: {
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
                          }
                        }}
                        inputProps={{ 
                          min: 0, 
                          step: 0.5,
                          style: { textAlign: 'center' }
                        }}
                        title={`Alterar este valor replica para os dias seguintes`}
                      />
                    </TableCell>
                  );
                })}
                <TableCell sx={{ textAlign: 'center', padding: '8px 4px' }}>
                  <span style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 'bold',
                    color: '#1976d2'
                  }}>
                    {calculateValorMedido(task).toFixed(1)}h
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        component="div"
        count={filteredTasks.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Itens por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />
      
      <Snackbar
        open={showSaveMessage}
        autoHideDuration={2000}
        onClose={() => setShowSaveMessage(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setShowSaveMessage(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          Dados salvos e replicados para dias subsequentes!
        </Alert>
      </Snackbar>

      {/* Modal de Detalhes */}
      <Dialog 
        open={detailsOpen} 
        onClose={handleCloseDetails} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Editar Tarefa #{selectedTask?.originalId}
            </Typography>
            <IconButton onClick={handleCloseDetails}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Épico"
                    value={selectedTask.epico || ''}
                    onChange={(e) => handleTaskUpdate('epico', e.target.value)}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Sprint"
                    value={selectedTask.sprint || ''}
                    onChange={(e) => handleTaskUpdate('sprint', e.target.value)}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="User Story"
                    value={selectedTask.userStory || ''}
                    onChange={(e) => handleTaskUpdate('userStory', e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Atividade"
                    value={selectedTask.atividade || ''}
                    onChange={(e) => handleTaskUpdate('atividade', e.target.value)}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Detalhamento"
                    value={selectedTask.detalhamento || ''}
                    onChange={(e) => handleTaskUpdate('detalhamento', e.target.value)}
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Desenvolvedor"
                    value={selectedTask.desenvolvedor || ''}
                    onChange={(e) => handleTaskUpdate('desenvolvedor', e.target.value)}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={selectedTask.status || ''}
                      onChange={(e) => handleTaskUpdate('status', e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="Backlog">Backlog</MenuItem>
                      <MenuItem value="Priorizado">Priorizado</MenuItem>
                      <MenuItem value="Doing">Doing</MenuItem>
                      <MenuItem value="Done">Done</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Prioridade</InputLabel>
                    <Select
                      value={selectedTask.prioridade || ''}
                      onChange={(e) => handleTaskUpdate('prioridade', e.target.value)}
                      label="Prioridade"
                    >
                      <MenuItem value="Alta">Alta</MenuItem>
                      <MenuItem value="Média">Média</MenuItem>
                      <MenuItem value="Baixa">Baixa</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Estimativa (horas)"
                    type="number"
                    value={selectedTask.estimativa || 0}
                    onChange={(e) => handleTaskUpdate('estimativa', parseFloat(e.target.value) || 0)}
                    fullWidth
                    variant="outlined"
                    inputProps={{ min: 0, step: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Observações"
                    value={selectedTask.observacoes || ''}
                    onChange={(e) => handleTaskUpdate('observacoes', e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails} color="secondary">
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveTask} 
            color="primary" 
            variant="contained"
            disabled={!selectedTask?.atividade?.trim()}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TableView;