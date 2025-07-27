import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert,
  Tooltip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Psychology as PsychologyIcon,
  Speed as SpeedIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell
} from 'recharts';
import { useTaskContext } from '../../contexts/TaskContext';
import { useFilterContext } from '../../contexts/FilterContext';

const PredictiveAnalysisModular = () => {
  const { tasks } = useTaskContext();
  const { applyFilters, getUniqueValues } = useFilterContext();
  
  const [selectedSprint, setSelectedSprint] = useState('');

  // Get filtered tasks
  const filteredTasks = applyFilters(tasks);
  
  // Get available sprints
  const sprints = getUniqueValues(filteredTasks, 'sprint');

  useEffect(() => {
    if (sprints.length > 0 && !selectedSprint) {
      setSelectedSprint(sprints[0]);
    }
  }, [sprints, selectedSprint]);

  // Filter tasks by selected sprint
  const sprintTasks = useMemo(() => {
    if (!selectedSprint) return filteredTasks;
    return filteredTasks.filter(task => task.sprint === selectedSprint);
  }, [filteredTasks, selectedSprint]);

  // Tasks with validated time spent
  const tasksWithTimeSpent = useMemo(() => {
    return sprintTasks.filter(task => 
      task.tempoGasto && 
      task.tempoGastoValidado
    );
  }, [sprintTasks]);

  // Analyze deadlines and schedule
  const deadlineAnalysis = useMemo(() => {
    const today = new Date();
    const totalTasks = sprintTasks.length;
    const doneTasks = sprintTasks.filter(task => task.status === 'Done').length;
    const remainingTasks = totalTasks - doneTasks;
    
    // Calculate average velocity (tasks/day) based on Done tasks
    const doneTasksWithTime = tasksWithTimeSpent.filter(task => task.status === 'Done');
    const totalDaysWorked = doneTasksWithTime.length > 0 ? 
      Math.max(...doneTasksWithTime.map(task => {
        const created = new Date(task.createdAt);
        const completed = new Date(task.updatedAt);
        return Math.ceil((completed - created) / (1000 * 60 * 60 * 24));
      })) : 10;
    
    const velocity = doneTasks > 0 ? doneTasks / Math.max(totalDaysWorked, 1) : 0.5;
    const estimatedDaysRemaining = remainingTasks > 0 ? Math.ceil(remainingTasks / velocity) : 0;
    
    // Calculate remaining hours
    const totalHours = sprintTasks.reduce((sum, task) => sum + (task.estimativa || 0), 0);
    const completedHours = tasksWithTimeSpent
      .filter(task => task.status === 'Done')
      .reduce((sum, task) => sum + (task.tempoGasto || 0), 0);
    const remainingHours = totalHours - completedHours;
    
    return {
      totalTasks,
      doneTasks,
      remainingTasks,
      completionPercentage: totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0,
      velocity: velocity.toFixed(2),
      estimatedDaysRemaining,
      totalHours: totalHours.toFixed(1),
      completedHours: completedHours.toFixed(1),
      remainingHours: remainingHours.toFixed(1),
      isOnTrack: estimatedDaysRemaining <= 10,
      estimatedCompletionDate: new Date(today.getTime() + estimatedDaysRemaining * 24 * 60 * 60 * 1000)
    };
  }, [sprintTasks, tasksWithTimeSpent]);

  // Analyze developer performance
  const developerPerformance = useMemo(() => {
    const developers = {};
    
    tasksWithTimeSpent.forEach(task => {
      const dev = task.desenvolvedor || 'Não atribuído';
      if (!developers[dev]) {
        developers[dev] = {
          name: dev,
          tasks: [],
          totalTasks: 0,
          accurateTasks: 0,
          overestimatedTasks: 0,
          underestimatedTasks: 0,
          averageAccuracy: 0,
          trend: 'stable'
        };
      }
      
      developers[dev].tasks.push(task);
      developers[dev].totalTasks++;
      
      // Calculate accuracy
      const errorRate = Math.abs(((task.tempoGasto / task.estimativa) - 1) * 100);
      const accuracy = Math.max(0, 100 - errorRate);
      
      if (errorRate <= 20) {
        developers[dev].accurateTasks++;
      } else if (task.tempoGasto < task.estimativa) {
        developers[dev].overestimatedTasks++;
      } else {
        developers[dev].underestimatedTasks++;
      }
      
      developers[dev].averageAccuracy += accuracy;
    });
    
    // Calculate final stats and trends
    Object.keys(developers).forEach(dev => {
      const devData = developers[dev];
      devData.averageAccuracy = devData.totalTasks > 0 ? 
        devData.averageAccuracy / devData.totalTasks : 0;
      
      // Analyze trend (compare recent vs older tasks)
      if (devData.tasks.length >= 4) {
        const sortedTasks = devData.tasks.sort((a, b) => 
          new Date(a.updatedAt) - new Date(b.updatedAt)
        );
        
        const recentTasks = sortedTasks.slice(-3);
        const olderTasks = sortedTasks.slice(0, Math.min(3, sortedTasks.length - 3));
        
        const recentAccuracy = recentTasks.reduce((sum, task) => 
          sum + Math.max(0, 100 - Math.abs(((task.tempoGasto / task.estimativa) - 1) * 100)), 0
        ) / recentTasks.length;
        
        const olderAccuracy = olderTasks.reduce((sum, task) => 
          sum + Math.max(0, 100 - Math.abs(((task.tempoGasto / task.estimativa) - 1) * 100)), 0
        ) / olderTasks.length;
        
        if (recentAccuracy > olderAccuracy + 10) {
          devData.trend = 'improving';
        } else if (recentAccuracy < olderAccuracy - 10) {
          devData.trend = 'declining';
        } else {
          devData.trend = 'stable';
        }
      }
    });
    
    return Object.values(developers).sort((a, b) => b.averageAccuracy - a.averageAccuracy);
  }, [tasksWithTimeSpent]);

  // Analyze WIP predictive
  const wipPrediction = useMemo(() => {
    // Get WIP limits from localStorage
    const getWipLimits = () => {
      try {
        const saved = localStorage.getItem('tasktracker-wip-limits');
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    };

    const wipLimits = getWipLimits();
    const statusCounts = sprintTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    // Predict next 5 days
    const predictions = [];
    const donePerDay = tasksWithTimeSpent.filter(task => task.status === 'Done').length / 10;
    
    for (let day = 1; day <= 5; day++) {
      const predictedDone = Math.min(statusCounts['Doing'] || 0, Math.ceil(donePerDay * day));
      const predictedDoing = Math.max(0, (statusCounts['Doing'] || 0) - predictedDone);
      
      predictions.push({
        day: `Dia ${day}`,
        Backlog: statusCounts['Backlog'] || 0,
        Priorizado: statusCounts['Priorizado'] || 0,
        Doing: predictedDoing,
        Done: (statusCounts['Done'] || 0) + predictedDone
      });
    }

    return {
      predictions,
      currentStatus: statusCounts,
      wipLimits,
      violations: Object.keys(wipLimits).filter(status => 
        statusCounts[status] > wipLimits[status]
      )
    };
  }, [sprintTasks, tasksWithTimeSpent]);

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return <TrendingUpIcon sx={{ color: 'success.main' }} />;
      case 'declining': return <TrendingDownIcon sx={{ color: 'error.main' }} />;
      default: return <TrendingFlatIcon sx={{ color: 'info.main' }} />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improving': return 'success';
      case 'declining': return 'error';
      default: return 'info';
    }
  };

  if (sprintTasks.length === 0) {
    return (
      <Alert severity="info">
        <Typography variant="body1">
          Selecione um sprint ou adicione tarefas para ver a análise preditiva.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Sprint Selection */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sprint</InputLabel>
              <Select
                value={selectedSprint}
                onChange={(e) => setSelectedSprint(e.target.value)}
                label="Sprint"
              >
                {sprints.map((sprint) => (
                  <MenuItem key={sprint} value={sprint}>
                    {sprint}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={9}>
            <Typography variant="body1" color="text.secondary">
              <strong>{sprintTasks.length}</strong> tarefas no sprint selecionado | 
              <strong> {tasksWithTimeSpent.length}</strong> com tempo validado
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Schedule Status */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardHeader 
              title="📊 Status do Cronograma"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Progresso das Tarefas
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {deadlineAnalysis.doneTasks}/{deadlineAnalysis.totalTasks}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={deadlineAnalysis.completionPercentage}
                    sx={{ mt: 1 }}
                    color={deadlineAnalysis.isOnTrack ? "success" : "error"}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {deadlineAnalysis.completionPercentage.toFixed(1)}% completo
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Horas Trabalhadas
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {deadlineAnalysis.completedHours}h
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    de {deadlineAnalysis.totalHours}h estimadas
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {deadlineAnalysis.remainingHours}h restantes
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Alert 
                    severity={deadlineAnalysis.isOnTrack ? "success" : "warning"}
                    sx={{ mt: 1 }}
                  >
                    {deadlineAnalysis.isOnTrack ? (
                      <>
                        <CheckCircleIcon sx={{ mr: 1 }} />
                        <strong>No prazo:</strong> Estimativa de conclusão em {deadlineAnalysis.estimatedDaysRemaining} dias
                      </>
                    ) : (
                      <>
                        <WarningIcon sx={{ mr: 1 }} />
                        <strong>Risco de atraso:</strong> {deadlineAnalysis.estimatedDaysRemaining} dias necessários
                      </>
                    )}
                  </Alert>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Developer Performance */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardHeader 
              title="👥 Performance dos Desenvolvedores"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              {developerPerformance.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nenhum desenvolvedor com tarefas finalizadas
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                  {developerPerformance.map((dev) => (
                    <Box key={dev.name} sx={{ mb: 2, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon sx={{ fontSize: 16 }} />
                          <Typography variant="body2" fontWeight="medium">
                            {dev.name}
                          </Typography>
                          {getTrendIcon(dev.trend)}
                        </Box>
                        <Chip
                          label={`${dev.averageAccuracy.toFixed(1)}%`}
                          size="small"
                          color={dev.averageAccuracy >= 80 ? "success" : 
                                 dev.averageAccuracy >= 60 ? "warning" : "error"}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {dev.accurateTasks} precisas | {dev.overestimatedTasks} superestimadas | {dev.underestimatedTasks} subestimadas
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* WIP Prediction */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="📈 Previsão WIP (Próximos 5 Dias)"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              {wipPrediction.violations.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <strong>Violação WIP detectada:</strong> {wipPrediction.violations.join(', ')}
                </Alert>
              )}
              
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={wipPrediction.predictions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="Backlog" stackId="a" fill="#e3f2fd" />
                  <Bar dataKey="Priorizado" stackId="a" fill="#fff3e0" />
                  <Bar dataKey="Doing" stackId="a" fill="#e8f5e8" />
                  <Bar dataKey="Done" stackId="a" fill="#f3e5f5" />
                </BarChart>
              </ResponsiveContainer>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Estado atual: {Object.entries(wipPrediction.currentStatus)
                  .map(([status, count]) => `${status}: ${count}`)
                  .join(' | ')
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PredictiveAnalysisModular;