import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Card,
  CardContent,
  Alert,
  Divider
} from '@mui/material';
import {
  Line,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart
} from 'recharts';
import { useTaskContext } from '../../contexts/TaskContext';
import { useFilterContext } from '../../contexts/FilterContext';

const BurndownChart = () => {
  const { tasks } = useTaskContext();
  const { filters, applyFilters } = useFilterContext();

  // Team configuration state
  const [teamConfig, setTeamConfig] = React.useState({
    developers: 3,
    hoursPerDay: 8,
    sprintDays: 10
  });

  // Apply filters to get current task set
  const filteredTasks = applyFilters(tasks);

  // Calculate sprint data for burndown chart
  const sprintData = useMemo(() => {
    if (filteredTasks.length === 0) {
      return [];
    }

    // Calculate totals for each day
    const calculateColumnTotals = (tasksToCalculate) => {
      return tasksToCalculate.reduce((totals, task) => {
        if (!task.reestimativas || task.reestimativas.length < 10) {
          return {
            estimativa: totals.estimativa + (task.estimativa || 0),
            ...Array.from({ length: 10 }, (_, i) => ({
              [`dia${i + 1}`]: totals[`dia${i + 1}`] + (task.estimativa || 0)
            })).reduce((acc, curr) => ({ ...acc, ...curr }), {})
          };
        }

        return {
          estimativa: totals.estimativa + (task.estimativa || 0),
          ...Array.from({ length: 10 }, (_, i) => ({
            [`dia${i + 1}`]: totals[`dia${i + 1}`] + (task.reestimativas[i] || 0)
          })).reduce((acc, curr) => ({ ...acc, ...curr }), {})
        };
      }, {
        estimativa: 0,
        ...Array.from({ length: 10 }, (_, i) => ({ [`dia${i + 1}`]: 0 }))
          .reduce((acc, curr) => ({ ...acc, ...curr }), {})
      });
    };

    const totals = calculateColumnTotals(filteredTasks);
    const chartData = [];

    // Day 0 (initial)
    chartData.push({
      day: 'Dia 0',
      'Linha Ideal': totals.estimativa,
      'Linha Real': totals.estimativa,
      'Previsão Equipe': totals.estimativa
    });

    // Days 1-10
    for (let i = 1; i <= 10; i++) {
      const idealValue = totals.estimativa * (1 - i / 10);
      const realValue = totals[`dia${i}`] || 0;
      
      // Team prediction calculation
      const teamCapacity = teamConfig.developers * teamConfig.hoursPerDay;
      const teamPrediction = Math.max(0, totals.estimativa - (teamCapacity * i));

      chartData.push({
        day: `Dia ${i}`,
        'Linha Ideal': Math.max(0, idealValue),
        'Linha Real': realValue,
        'Previsão Equipe': teamPrediction
      });
    }

    return chartData;
  }, [filteredTasks, teamConfig]);

  // Calculate sprint statistics
  const sprintStats = useMemo(() => {
    if (filteredTasks.length === 0) {
      return {
        totalTasks: 0,
        totalHours: 0,
        completedTasks: 0,
        completedHours: 0,
        remainingHours: 0,
        teamCapacity: 0,
        daysNeeded: 0,
        isOnTrack: true
      };
    }

    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(task => task.status === 'Done').length;
    const totalHours = filteredTasks.reduce((sum, task) => sum + (task.estimativa || 0), 0);
    const completedHours = filteredTasks
      .filter(task => task.status === 'Done')
      .reduce((sum, task) => sum + (task.estimativa || 0), 0);
    const remainingHours = totalHours - completedHours;
    
    const teamCapacity = teamConfig.developers * teamConfig.hoursPerDay;
    const daysNeeded = teamCapacity > 0 ? Math.ceil(remainingHours / teamCapacity) : 0;
    const isOnTrack = daysNeeded <= teamConfig.sprintDays;

    return {
      totalTasks,
      totalHours,
      completedTasks,
      completedHours,
      remainingHours,
      teamCapacity,
      daysNeeded,
      isOnTrack
    };
  }, [filteredTasks, teamConfig]);

  const handleTeamConfigChange = (field, value) => {
    const numValue = parseInt(value) || 1;
    setTeamConfig(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1, border: '1px solid #ccc' }}>
          <Typography variant="body2" fontWeight="bold">
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography 
              key={index}
              variant="body2" 
              sx={{ color: entry.color }}
            >
              {entry.name}: {entry.value.toFixed(1)}h
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box>
      {/* Team Configuration */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Configuração da Equipe
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              label="Desenvolvedores"
              type="number"
              value={teamConfig.developers}
              onChange={(e) => handleTeamConfigChange('developers', e.target.value)}
              size="small"
              inputProps={{ min: 1, max: 20 }}
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              label="Horas/dia"
              type="number"
              value={teamConfig.hoursPerDay}
              onChange={(e) => handleTeamConfigChange('hoursPerDay', e.target.value)}
              size="small"
              inputProps={{ min: 1, max: 24 }}
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              label="Dias Sprint"
              type="number"
              value={teamConfig.sprintDays}
              onChange={(e) => handleTeamConfigChange('sprintDays', e.target.value)}
              size="small"
              inputProps={{ min: 1, max: 50 }}
              fullWidth
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Capacidade Total:</strong> {sprintStats.teamCapacity}h/dia × {teamConfig.sprintDays} dias = {sprintStats.teamCapacity * teamConfig.sprintDays}h
          </Typography>
        </Box>
      </Paper>

      {/* Sprint Status Alert */}
      {filteredTasks.length > 0 && (
        <Alert 
          severity={sprintStats.isOnTrack ? "success" : "warning"} 
          sx={{ mb: 2 }}
        >
          <Typography variant="body2">
            {sprintStats.isOnTrack 
              ? `✅ Sprint no prazo - ${sprintStats.daysNeeded} dias necessários de ${teamConfig.sprintDays} disponíveis`
              : `⚠️ Risco de atraso - ${sprintStats.daysNeeded} dias necessários, apenas ${teamConfig.sprintDays} disponíveis`
            }
          </Typography>
        </Alert>
      )}

      {/* Burndown Chart */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Gráfico Burndown
        </Typography>
        
        {sprintData.length > 0 ? (
          <Box sx={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <LineChart data={sprintData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ 
                    value: 'Horas', 
                    angle: -90, 
                    position: 'insideLeft' 
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                <Line
                  type="monotone"
                  dataKey="Linha Ideal"
                  stroke="#2196f3"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#2196f3', strokeWidth: 1, r: 4 }}
                />
                
                <Line
                  type="monotone"
                  dataKey="Linha Real"
                  stroke="#f44336"
                  strokeWidth={3}
                  dot={{ fill: '#f44336', strokeWidth: 2, r: 5 }}
                />
                
                <Line
                  type="monotone"
                  dataKey="Previsão Equipe"
                  stroke="#4caf50"
                  strokeWidth={2}
                  strokeDasharray="10 5"
                  dot={{ fill: '#4caf50', strokeWidth: 1, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: 200,
              color: 'text.secondary'
            }}
          >
            <Typography variant="body1">
              Nenhum dado disponível para o gráfico
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Sprint Summary Cards */}
      {filteredTasks.length > 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {sprintStats.totalTasks}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tarefas Totais
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {sprintStats.completedTasks}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tarefas Concluídas
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {sprintStats.totalHours.toFixed(1)}h
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Horas Estimadas
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography 
                  variant="h4" 
                  color={sprintStats.isOnTrack ? "success.main" : "warning.main"}
                >
                  {sprintStats.remainingHours.toFixed(1)}h
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Horas Restantes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default BurndownChart;