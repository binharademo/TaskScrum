import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTaskContext } from '../../contexts/TaskContext';
import { useFilterContext } from '../../contexts/FilterContext';

// Colors for charts
const STATUS_COLORS = {
  'Backlog': '#e3f2fd',
  'Priorizado': '#fff3e0', 
  'Doing': '#e8f5e8',
  'Done': '#f3e5f5'
};

const PRIORITY_COLORS = {
  'Baixa': '#4caf50',
  'Média': '#ff9800',
  'Alta': '#f44336',
  'Crítica': '#d32f2f'
};

const StatisticsPanel = () => {
  const { tasks } = useTaskContext();
  const { applyFilters } = useFilterContext();

  // Apply filters to get current task set
  const filteredTasks = applyFilters(tasks);

  // Calculate general statistics
  const generalStats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(task => task.status === 'Done').length;
    const inProgress = filteredTasks.filter(task => task.status === 'Doing').length;
    const pending = filteredTasks.filter(task => ['Backlog', 'Priorizado'].includes(task.status)).length;
    
    const totalHours = filteredTasks.reduce((sum, task) => sum + (task.estimativa || 0), 0);
    const completedHours = filteredTasks
      .filter(task => task.status === 'Done')
      .reduce((sum, task) => sum + (task.estimativa || 0), 0);
    
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    const hoursCompletionRate = totalHours > 0 ? (completedHours / totalHours) * 100 : 0;

    return {
      total,
      completed,
      inProgress,
      pending,
      totalHours,
      completedHours,
      remainingHours: totalHours - completedHours,
      completionRate,
      hoursCompletionRate
    };
  }, [filteredTasks]);

  // Calculate status distribution
  const statusDistribution = useMemo(() => {
    const distribution = filteredTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(distribution).map(([status, count]) => ({
      name: status,
      value: count,
      color: STATUS_COLORS[status] || '#666666'
    }));
  }, [filteredTasks]);

  // Calculate priority distribution
  const priorityDistribution = useMemo(() => {
    const distribution = filteredTasks.reduce((acc, task) => {
      const priority = task.prioridade || 'Não definida';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(distribution).map(([priority, count]) => ({
      name: priority,
      value: count,
      color: PRIORITY_COLORS[priority] || '#666666'
    }));
  }, [filteredTasks]);

  // Calculate developer statistics
  const developerStats = useMemo(() => {
    const devStats = filteredTasks.reduce((acc, task) => {
      const dev = task.desenvolvedor || 'Não atribuído';
      if (!acc[dev]) {
        acc[dev] = {
          total: 0,
          completed: 0,
          inProgress: 0,
          pending: 0,
          totalHours: 0,
          completedHours: 0,
          averageAccuracy: 0,
          tasksWithTime: 0
        };
      }

      acc[dev].total++;
      acc[dev].totalHours += (task.estimativa || 0);

      if (task.status === 'Done') {
        acc[dev].completed++;
        acc[dev].completedHours += (task.estimativa || 0);
        
        if (task.tempoGasto && task.estimativa) {
          acc[dev].tasksWithTime++;
          // Calculate accuracy (inverse of error rate)
          const errorRate = Math.abs(((task.tempoGasto / task.estimativa) - 1) * 100);
          const accuracy = Math.max(0, 100 - errorRate);
          acc[dev].averageAccuracy += accuracy;
        }
      } else if (task.status === 'Doing') {
        acc[dev].inProgress++;
      } else {
        acc[dev].pending++;
      }

      return acc;
    }, {});

    // Calculate average accuracy
    Object.keys(devStats).forEach(dev => {
      if (devStats[dev].tasksWithTime > 0) {
        devStats[dev].averageAccuracy = devStats[dev].averageAccuracy / devStats[dev].tasksWithTime;
      }
    });

    return Object.entries(devStats)
      .map(([name, stats]) => ({
        name,
        ...stats,
        completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
      }))
      .sort((a, b) => b.completionRate - a.completionRate);
  }, [filteredTasks]);

  // Calculate epic statistics
  const epicStats = useMemo(() => {
    const epicData = filteredTasks.reduce((acc, task) => {
      const epic = task.epico || 'Sem Épico';
      if (!acc[epic]) {
        acc[epic] = {
          total: 0,
          completed: 0,
          totalHours: 0,
          completedHours: 0
        };
      }

      acc[epic].total++;
      acc[epic].totalHours += (task.estimativa || 0);

      if (task.status === 'Done') {
        acc[epic].completed++;
        acc[epic].completedHours += (task.estimativa || 0);
      }

      return acc;
    }, {});

    return Object.entries(epicData)
      .map(([name, stats]) => ({
        name,
        ...stats,
        completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
      }))
      .sort((a, b) => b.completionRate - a.completionRate);
  }, [filteredTasks]);

  // Custom tooltip for pie charts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ p: 1, border: '1px solid #ccc' }}>
          <Typography variant="body2" fontWeight="bold">
            {data.name}: {data.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {((data.value / filteredTasks.length) * 100).toFixed(1)}%
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  if (filteredTasks.length === 0) {
    return (
      <Alert severity="info">
        <Typography variant="body1">
          Nenhuma tarefa disponível para análise estatística.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box>
      {/* General Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssignmentIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" color="primary">
                {generalStats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total de Tarefas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" color="success.main">
                {generalStats.completed}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Concluídas ({generalStats.completionRate.toFixed(1)}%)
              </Typography>
              <LinearProgress
                variant="determinate"
                value={generalStats.completionRate}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ScheduleIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" color="warning.main">
                {generalStats.inProgress}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Em Progresso
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <SpeedIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" color="info.main">
                {generalStats.totalHours.toFixed(1)}h
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Horas Estimadas
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {generalStats.completedHours.toFixed(1)}h concluídas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Status Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 350 }}>
            <Typography variant="h6" gutterBottom>
              Distribuição por Status
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Priority Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 350 }}>
            <Typography variant="h6" gutterBottom>
              Distribuição por Prioridade
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={priorityDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                >
                  {priorityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Developer Statistics Table */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2, pb: 0 }}>
          <Typography variant="h6" gutterBottom>
            Estatísticas por Desenvolvedor
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Desenvolvedor</TableCell>
                <TableCell align="center">Total</TableCell>
                <TableCell align="center">Concluídas</TableCell>
                <TableCell align="center">Em Progresso</TableCell>
                <TableCell align="center">Taxa Conclusão</TableCell>
                <TableCell align="center">Horas</TableCell>
                <TableCell align="center">Precisão Média</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {developerStats.map((dev) => (
                <TableRow key={dev.name}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ fontSize: 16 }} />
                      {dev.name}
                    </Box>
                  </TableCell>
                  <TableCell align="center">{dev.total}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={dev.completed}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={dev.inProgress}
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {dev.completionRate >= 80 ? (
                        <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                      ) : dev.completionRate >= 50 ? (
                        <TrendingFlatIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                      ) : (
                        <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                      )}
                      {dev.completionRate.toFixed(1)}%
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {dev.completedHours.toFixed(1)}/{dev.totalHours.toFixed(1)}h
                  </TableCell>
                  <TableCell align="center">
                    {dev.tasksWithTime > 0 ? (
                      <Chip
                        label={`${dev.averageAccuracy.toFixed(1)}%`}
                        size="small"
                        color={dev.averageAccuracy >= 80 ? "success" : 
                               dev.averageAccuracy >= 60 ? "warning" : "error"}
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Epic Statistics Table */}
      <Paper>
        <Box sx={{ p: 2, pb: 0 }}>
          <Typography variant="h6" gutterBottom>
            Estatísticas por Épico
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Épico</TableCell>
                <TableCell align="center">Total</TableCell>
                <TableCell align="center">Concluídas</TableCell>
                <TableCell align="center">Taxa Conclusão</TableCell>
                <TableCell align="center">Horas</TableCell>
                <TableCell align="center">Progresso</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {epicStats.map((epic) => (
                <TableRow key={epic.name}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AssignmentIcon sx={{ fontSize: 16 }} />
                      {epic.name}
                    </Box>
                  </TableCell>
                  <TableCell align="center">{epic.total}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={epic.completed}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {epic.completionRate.toFixed(1)}%
                  </TableCell>
                  <TableCell align="center">
                    {epic.completedHours.toFixed(1)}/{epic.totalHours.toFixed(1)}h
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ width: 100 }}>
                      <LinearProgress
                        variant="determinate"
                        value={epic.completionRate}
                        color={epic.completionRate >= 80 ? "success" : 
                               epic.completionRate >= 50 ? "warning" : "error"}
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default StatisticsPanel;