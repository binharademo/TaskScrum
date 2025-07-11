import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Chip
} from '@mui/material';
import { format, differenceInDays, addDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const BurndownChart = ({ tasks }) => {
  const [selectedSprint, setSelectedSprint] = useState('');
  const [chartData, setChartData] = useState(null);
  const [sprintStats, setSprintStats] = useState({});

  const getUniqueValues = (field) => {
    return [...new Set(tasks.map(task => task[field]).filter(Boolean))];
  };

  const calculateSprintData = (sprintName) => {
    const sprintTasks = tasks.filter(task => task.sprint === sprintName);
    if (sprintTasks.length === 0) return null;

    const totalHours = sprintTasks.reduce((sum, task) => sum + task.estimativa, 0);
    const completedHours = sprintTasks
      .filter(task => task.status === 'Done')
      .reduce((sum, task) => sum + task.estimativa, 0);

    const sprintDays = 10;
    const today = new Date();
    const sprintStart = new Date(today.getTime() - (Math.random() * 5 * 24 * 60 * 60 * 1000));
    const sprintEnd = addDays(sprintStart, sprintDays);

    const labels = [];
    const idealLine = [];
    const actualLine = [];

    for (let i = 0; i <= sprintDays; i++) {
      const currentDate = addDays(sprintStart, i);
      labels.push(format(currentDate, 'dd/MM', { locale: ptBR }));

      // Linha ideal - decréscimo linear
      const idealRemaining = totalHours - (totalHours / sprintDays) * i;
      idealLine.push(Math.max(0, idealRemaining));

      // Linha real baseada nas reestimativas
      if (i === 0) {
        // Primeiro dia - estimativa inicial
        actualLine.push(totalHours);
      } else if (i <= sprintDays) {
        // Usar reestimativas dos dias anteriores
        const dayIndex = i - 1;
        const remainingHours = sprintTasks.reduce((sum, task) => {
          if (task.status === 'Done') return sum; // Tarefa concluída = 0 horas
          if (task.reestimativas && task.reestimativas[dayIndex] !== undefined) {
            return sum + task.reestimativas[dayIndex];
          }
          return sum + task.estimativa; // Fallback para estimativa inicial
        }, 0);
        actualLine.push(Math.max(0, remainingHours));
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
          label: 'Reestimativas Reais',
          data: actualLine,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1
        }
      ]
    };
  };

  const calculateSprintStats = (sprintName) => {
    const sprintTasks = tasks.filter(task => task.sprint === sprintName);
    if (sprintTasks.length === 0) return {};

    const totalTasks = sprintTasks.length;
    const completedTasks = sprintTasks.filter(task => task.status === 'Done').length;
    const inProgressTasks = sprintTasks.filter(task => task.status === 'Doing').length;
    const totalHours = sprintTasks.reduce((sum, task) => sum + task.estimativa, 0);
    const completedHours = sprintTasks
      .filter(task => task.status === 'Done')
      .reduce((sum, task) => sum + task.estimativa, 0);
    const hoursWorked = sprintTasks.reduce((sum, task) => sum + task.horasMedidas, 0);

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const hoursCompletionRate = totalHours > 0 ? (completedHours / totalHours) * 100 : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      totalHours,
      completedHours,
      hoursWorked,
      completionRate,
      hoursCompletionRate
    };
  };

  useEffect(() => {
    if (selectedSprint) {
      const data = calculateSprintData(selectedSprint);
      setChartData(data);
      setSprintStats(calculateSprintStats(selectedSprint));
    }
  }, [selectedSprint, tasks]);

  useEffect(() => {
    const sprints = getUniqueValues('sprint');
    if (sprints.length > 0 && !selectedSprint) {
      setSelectedSprint(sprints[0]);
    }
  }, [tasks]);

  const chartOptions = {
    responsive: true,
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
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}h`;
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

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Sprint</InputLabel>
          <Select
            value={selectedSprint}
            onChange={(e) => setSelectedSprint(e.target.value)}
          >
            {getUniqueValues('sprint').map(sprint => (
              <MenuItem key={sprint} value={sprint}>{sprint}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {selectedSprint && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              {chartData && (
                <Line data={chartData} options={chartOptions} />
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Resumo do Sprint
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Tarefas:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {sprintStats.completedTasks}/{sprintStats.totalTasks}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Taxa de conclusão:</Typography>
                        <Chip 
                          label={`${sprintStats.completionRate?.toFixed(1)}%`}
                          color={sprintStats.completionRate >= 80 ? 'success' : sprintStats.completionRate >= 60 ? 'warning' : 'error'}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Horas
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Estimadas:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {sprintStats.totalHours}h
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Concluídas:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {sprintStats.completedHours}h
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Trabalhadas:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {sprintStats.hoursWorked}h
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Progresso:</Typography>
                        <Chip 
                          label={`${sprintStats.hoursCompletionRate?.toFixed(1)}%`}
                          color={sprintStats.hoursCompletionRate >= 80 ? 'success' : sprintStats.hoursCompletionRate >= 60 ? 'warning' : 'error'}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Status das Tarefas
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Concluídas:</Typography>
                        <Chip label={sprintStats.completedTasks} color="success" size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Em andamento:</Typography>
                        <Chip label={sprintStats.inProgressTasks} color="warning" size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Restantes:</Typography>
                        <Chip 
                          label={sprintStats.totalTasks - sprintStats.completedTasks - sprintStats.inProgressTasks} 
                          color="error" 
                          size="small" 
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default BurndownChart;