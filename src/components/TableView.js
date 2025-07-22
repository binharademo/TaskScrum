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
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';
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
    epico: '',
    search: '',
    searchId: ''
  });
  
  const [teamConfig, setTeamConfig] = useState({
    developers: 3,
    hoursPerDay: 8,
    sprintDays: 10
  });
  
  const [activeTab, setActiveTab] = useState(0);
  const [timeValidationModal, setTimeValidationModal] = useState({
    open: false,
    task: null
  });

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
    const newValue = isNaN(parseFloat(value)) ? 0 : parseFloat(value);
    
    // Primeiro, criar as tarefas atualizadas
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        // Garantir que existe um array de reestimativas
        const existingReestimativas = task.reestimativas || Array.from({ length: 10 }, () => task.estimativa || 0);
        const newReestimativas = [...existingReestimativas];
        
        // Garantir que o array tem 10 elementos
        while (newReestimativas.length < 10) {
          newReestimativas.push(task.estimativa || 0);
        }
        
        // Definir o valor no dia específico (NUNCA alterar estimativa inicial)
        newReestimativas[dayIndex] = newValue;
        
        // Se o valor for zero, zerar APENAS os dias subsequentes
        if (newValue === 0) {
          for (let i = dayIndex + 1; i < 10; i++) {
            newReestimativas[i] = 0;
          }
        } else {
          // Replicar o valor APENAS para os dias subsequentes
          for (let i = dayIndex + 1; i < 10; i++) {
            newReestimativas[i] = newValue;
          }
        }
        
        return { 
          ...task, 
          reestimativas: newReestimativas, 
          updatedAt: new Date().toISOString() 
        };
      }
      return task;
    });
    
    // Atualizar as tarefas primeiro
    onTasksUpdate(updatedTasks);
    setShowSaveMessage(true);
    
    // Se o valor for zero, abrir modal de tempo gasto
    if (newValue === 0) {
      const updatedTask = updatedTasks.find(task => task.id === taskId);
      setTimeValidationModal({
        open: true,
        task: updatedTask
      });
    }
    
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
    setFilters({ sprint: '', desenvolvedor: '', prioridade: '', status: '', epico: '', search: '', searchId: '' });
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
        if (key === 'search') {
          const searchTerm = filters[key].toLowerCase();
          filtered = filtered.filter(task => 
            Object.values(task).some(value => 
              value && value.toString().toLowerCase().includes(searchTerm)
            )
          );
        } else if (key === 'searchId') {
          const idTerm = filters[key].replace('#', '').toLowerCase();
          filtered = filtered.filter(task => 
            (task.originalId && task.originalId.toString().toLowerCase() === idTerm) ||
            (task.id && task.id.toString().toLowerCase() === idTerm)
          );
        } else {
          filtered = filtered.filter(task => task[key] === filters[key]);
        }
      }
    });
    
    return filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Tratar valores nulos/undefined
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';
      
      // Tratamento especial para campos numéricos
      if (sortBy === 'originalId' || sortBy === 'estimativa') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        // Converter para string apenas se ambos forem strings (exceto originalId)
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

  const handleTimeValidationSave = (updatedTask) => {
    // Atualizar tarefa com tempo gasto e alterar status para Done
    const tasksWithUpdate = tasks.map(task => 
      task.id === updatedTask.id 
        ? { 
            ...updatedTask, 
            status: 'Done',
            tempoGastoValidado: true,
            updatedAt: new Date().toISOString() 
          }
        : task
    );
    
    onTasksUpdate(tasksWithUpdate);
    setTimeValidationModal({ open: false, task: null });
    setShowSaveMessage(true);
    
    // Forçar atualização do gráfico
    if (selectedSprint) {
      const data = calculateSprintData(selectedSprint);
      setChartData(data);
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
          
          <TextField
            label="Buscar por ID"
            value={filters.searchId}
            onChange={(e) => handleFilterChange('searchId', e.target.value)}
            size="small"
            sx={{ minWidth: 60 }}
            placeholder="#123..."
          />
          
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
                  active={sortBy === 'originalId'}
                  direction={sortBy === 'originalId' ? sortDirection : 'asc'}
                  onClick={() => handleSort('originalId')}
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
                    #{task.originalId} - {task.atividade || 'Sem atividade'}
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
                  // Usar sempre o valor das reestimativas para todos os dias (incluindo Dia 1)
                  const currentValue = (taskWithReestimativas.reestimativas && taskWithReestimativas.reestimativas[i] !== undefined) 
                    ? taskWithReestimativas.reestimativas[i] 
                    : (task.estimativa || 0);
                  
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

      {/* Modal de Validação de Tempo Gasto */}
      <TimeValidationModal
        open={timeValidationModal.open}
        task={timeValidationModal.task}
        onClose={() => setTimeValidationModal({ open: false, task: null })}
        onSave={handleTimeValidationSave}
      />
    </Box>
  );
};

// Componente de Análise Preditiva
const AnalisisPreditivaContent = ({ tasks, selectedSprint }) => {
  // Filtrar tarefas do sprint selecionado que têm tempo gasto
  const tasksWithTimeSpent = tasks.filter(task => 
    task.tempoGasto && 
    task.tempoGastoValidado && 
    (!selectedSprint || task.sprint === selectedSprint)
  );

  // Calcular dados para gráficos
  const estimativeVsRealData = tasksWithTimeSpent.map(task => ({
    id: task.originalId,
    atividade: task.atividade,
    estimativa: task.estimativa,
    tempoReal: task.tempoGasto,
    taxaErro: task.taxaErro || 0,
    motivoErro: task.motivoErro,
    desenvolvedor: task.desenvolvedor
  }));

  // Separar tarefas por qualidade de estimativa
  const estimativasPrecisas = estimativeVsRealData.filter(task => Math.abs(task.taxaErro) <= 20);
  const estimativasRuins = estimativeVsRealData.filter(task => task.taxaErro > 20);
  const estimativasOtimas = estimativeVsRealData.filter(task => task.taxaErro < -10); // Subestimadas

  // Dados para gráfico de barras (Estimativa vs Real)
  const barChartData = estimativeVsRealData.slice(0, 10).map(task => ({
    name: `#${task.id}`,
    Estimativa: task.estimativa,
    'Tempo Real': task.tempoReal,
    taxaErro: task.taxaErro
  }));

  // Dados para gráfico scatter (Taxa de Erro vs Estimativa)
  const scatterData = estimativeVsRealData.map(task => ({
    x: task.estimativa,
    y: task.taxaErro,
    id: task.id,
    atividade: task.atividade,
    motivoErro: task.motivoErro
  }));

  return (
    <Box>
      {tasksWithTimeSpent.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Nenhuma tarefa finalizada com tempo gasto encontrada para análise.
          {selectedSprint && ` Sprint selecionado: ${selectedSprint}`}
        </Alert>
      ) : (
        <>
          {/* Estatísticas Resumo */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">{estimativasPrecisas.length}</Typography>
                  <Typography variant="body2">Estimativas Precisas</Typography>
                  <Typography variant="caption">(±20% da estimativa)</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">{estimativasRuins.length}</Typography>
                  <Typography variant="body2">Estimativas Ruins</Typography>
                  <Typography variant="caption">(+20% acima)</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">{estimativasOtimas.length}</Typography>
                  <Typography variant="body2">Subestimadas</Typography>
                  <Typography variant="caption">(-10% abaixo)</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Gráficos */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Gráfico de Barras: Estimativa vs Real */}
            <Grid item xs={12} lg={8}>
              <Card>
                <CardHeader title="📊 Estimativa vs Tempo Real" subheader="Comparação das últimas 10 tarefas finalizadas" />
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="Estimativa" fill="#8884d8" />
                      <Bar dataKey="Tempo Real" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Gráfico Scatter: Taxa de Erro vs Estimativa */}
            <Grid item xs={12} lg={4}>
              <Card>
                <CardHeader title="🎯 Taxa de Erro" subheader="Precisão por estimativa" />
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart data={scatterData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="x" name="Estimativa" />
                      <YAxis dataKey="y" name="Taxa Erro %" />
                      <RechartsTooltip 
                        formatter={(value, name) => [
                          name === 'y' ? `${value.toFixed(1)}%` : `${value}h`,
                          name === 'y' ? 'Taxa de Erro' : 'Estimativa'
                        ]}
                      />
                      <Scatter dataKey="y" fill="#ff7300" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Lista de Tarefas com Estimativas Ruins */}
          <EstimativasRuinsList tasks={estimativasRuins} />
        </>
      )}
    </Box>
  );
};

// Componente Lista de Estimativas Ruins
const EstimativasRuinsList = ({ tasks }) => {
  if (tasks.length === 0) {
    return (
      <Alert severity="success" sx={{ mb: 2 }}>
        🎉 Parabéns! Nenhuma tarefa com estimativa ruim (>20% de erro) encontrada.
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader 
        title="⚠️ Tarefas com Estimativas Ruins" 
        subheader={`${tasks.length} tarefa${tasks.length !== 1 ? 's' : ''} com taxa de erro acima de 20%`}
      />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {tasks.map(task => (
            <Tooltip
              key={task.id}
              title={
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    #{task.id} - {task.atividade}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Desenvolvedor: {task.desenvolvedor}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Estimativa: {task.estimativa}h → Real: {task.tempoReal}h
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Taxa de Erro: {task.taxaErro.toFixed(1)}%
                  </Typography>
                  {task.motivoErro && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                        Motivo do Atraso:
                      </Typography>
                      <Typography variant="body2">
                        {task.motivoErro}
                      </Typography>
                    </Box>
                  )}
                </Box>
              }
              arrow
              placement="top"
            >
              <Paper
                sx={{
                  p: 2,
                  bgcolor: task.taxaErro > 50 ? 'error.light' : 'warning.light',
                  color: task.taxaErro > 50 ? 'error.contrastText' : 'warning.contrastText',
                  cursor: 'pointer',
                  '&:hover': { 
                    opacity: 0.8,
                    transform: 'translateY(-1px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2">
                      #{task.id} - {task.atividade}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {task.desenvolvedor} | {task.estimativa}h → {task.tempoReal}h
                    </Typography>
                  </Box>
                  <Chip
                    label={`+${task.taxaErro.toFixed(1)}%`}
                    size="small"
                    sx={{
                      bgcolor: task.taxaErro > 50 ? 'error.dark' : 'warning.dark',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
              </Paper>
            </Tooltip>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

// Componente Modal de Validação de Tempo Gasto
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

export default TableView;