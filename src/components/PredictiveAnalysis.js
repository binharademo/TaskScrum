import React, { useState, useEffect } from 'react';
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
  Container,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Psychology as PsychologyIcon,
  Speed as SpeedIcon
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
  Scatter
} from 'recharts';

const PredictiveAnalysis = ({ tasks }) => {
  const [selectedSprint, setSelectedSprint] = useState('');
  
  const sprints = [...new Set(tasks.map(task => task.sprint).filter(Boolean))];

  useEffect(() => {
    if (sprints.length > 0 && !selectedSprint) {
      setSelectedSprint(sprints[0]);
    }
  }, [sprints, selectedSprint]);

  // Filtrar tarefas do sprint selecionado
  const sprintTasks = tasks.filter(task => 
    !selectedSprint || task.sprint === selectedSprint
  );

  // Filtrar tarefas do sprint selecionado que têm tempo gasto
  const tasksWithTimeSpent = sprintTasks.filter(task => 
    task.tempoGasto && 
    task.tempoGastoValidado
  );

  // Análise de prazo e cronograma
  const analyzeDeadlines = () => {
    const today = new Date();
    const totalTasks = sprintTasks.length;
    const doneTasks = sprintTasks.filter(task => task.status === 'Done').length;
    const remainingTasks = totalTasks - doneTasks;
    
    // Calcular velocidade média (tarefas/dia) baseada nas tarefas Done
    const doneTasksWithTime = tasksWithTimeSpent.filter(task => task.status === 'Done');
    const totalDaysWorked = doneTasksWithTime.length > 0 ? 
      Math.max(...doneTasksWithTime.map(task => {
        const created = new Date(task.createdAt);
        const completed = new Date(task.updatedAt);
        return Math.ceil((completed - created) / (1000 * 60 * 60 * 24));
      })) : 10; // default 10 dias
    
    const velocity = doneTasks > 0 ? doneTasks / Math.max(totalDaysWorked, 1) : 0.5;
    const estimatedDaysRemaining = remainingTasks > 0 ? Math.ceil(remainingTasks / velocity) : 0;
    
    // Calcular horas restantes
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
      velocity,
      estimatedDaysRemaining,
      totalHours,
      completedHours,
      remainingHours,
      isOnTrack: estimatedDaysRemaining <= 10, // Assumindo sprint de 10 dias
      estimatedCompletionDate: new Date(today.getTime() + estimatedDaysRemaining * 24 * 60 * 60 * 1000)
    };
  };

  // Análise de performance dos desenvolvedores
  const analyzeDeveloperPerformance = () => {
    const developers = {};
    
    tasksWithTimeSpent.forEach(task => {
      if (!task.desenvolvedor) return;
      
      if (!developers[task.desenvolvedor]) {
        developers[task.desenvolvedor] = {
          name: task.desenvolvedor,
          tasks: [],
          totalTasks: 0,
          accurateEstimates: 0,
          underestimates: 0,
          overestimates: 0,
          averageAccuracy: 0,
          trend: 'stable' // improving, declining, stable
        };
      }
      
      const dev = developers[task.desenvolvedor];
      dev.tasks.push(task);
      dev.totalTasks++;
      
      const accuracy = task.taxaErro || 0;
      if (Math.abs(accuracy) <= 20) dev.accurateEstimates++;
      else if (accuracy > 20) dev.overestimates++;
      else dev.underestimates++;
    });
    
    // Calcular métricas e tendências
    Object.values(developers).forEach(dev => {
      if (dev.totalTasks > 0) {
        dev.averageAccuracy = dev.accurateEstimates / dev.totalTasks * 100;
        
        // Analisar tendência baseada nas últimas tarefas
        const recentTasks = dev.tasks
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, Math.min(3, dev.tasks.length));
          
        const recentAccuracy = recentTasks.reduce((sum, task) => 
          sum + Math.abs(task.taxaErro || 0), 0) / recentTasks.length;
        
        const olderTasks = dev.tasks.slice(3);
        if (olderTasks.length > 0) {
          const olderAccuracy = olderTasks.reduce((sum, task) => 
            sum + Math.abs(task.taxaErro || 0), 0) / olderTasks.length;
          
          if (recentAccuracy < olderAccuracy - 10) dev.trend = 'improving';
          else if (recentAccuracy > olderAccuracy + 10) dev.trend = 'declining';
          else dev.trend = 'stable';
        }
      }
    });
    
    return Object.values(developers);
  };

  // Análise WIP preditiva
  const analyzeWIPPredictive = () => {
    const wipLimitsConfig = JSON.parse(localStorage.getItem('wipConfig') || '{}');
    const limits = wipLimitsConfig.limits || {};
    
    const statusCounts = {
      'Backlog': 0,
      'Priorizado': 0,
      'Doing': 0,
      'Done': 0
    };

    sprintTasks.forEach(task => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    });

    // Prever movimentação baseada na velocidade atual
    const donePerDay = tasksWithTimeSpent.filter(task => task.status === 'Done').length / 10; // últimos 10 dias
    const wipPredictions = [];
    
    // Prever próximos 5 dias
    for (let day = 1; day <= 5; day++) {
      const predictedDone = Math.min(
        statusCounts['Doing'], 
        Math.ceil(donePerDay * day)
      );
      const predictedDoing = Math.min(
        statusCounts['Priorizado'], 
        limits['Doing'] || 999
      );
      
      wipPredictions.push({
        day: `Dia +${day}`,
        priorizado: Math.max(0, statusCounts['Priorizado'] - predictedDoing),
        doing: predictedDoing,
        done: statusCounts['Done'] + predictedDone,
        wipViolation: predictedDoing > (limits['Doing'] || 999)
      });
    }
    
    return {
      current: statusCounts,
      limits,
      predictions: wipPredictions,
      bottleneck: statusCounts['Doing'] > (limits['Doing'] || 999) ? 'Doing' : null
    };
  };

  const deadlineAnalysis = analyzeDeadlines();
  const developerPerformance = analyzeDeveloperPerformance();
  const wipAnalysis = analyzeWIPPredictive();

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
    <Container maxWidth="xl">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PsychologyIcon fontSize="large" color="primary" />
          Análise Preditiva de Estimativas
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Análise de precisão das estimativas baseada em dados históricos de tempo gasto
        </Typography>
      </Box>

      {/* Seletor de Sprint */}
      <Box sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Sprint para Análise</InputLabel>
          <Select
            value={selectedSprint}
            onChange={(e) => setSelectedSprint(e.target.value)}
            label="Sprint para Análise"
          >
            <MenuItem value="">Todos os Sprints</MenuItem>
            {sprints.map(sprint => (
              <MenuItem key={sprint} value={sprint}>{sprint}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Análise de Cronograma e Prazos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card sx={{ 
            bgcolor: deadlineAnalysis.isOnTrack ? 'success.light' : 'error.light',
            color: deadlineAnalysis.isOnTrack ? 'success.contrastText' : 'error.contrastText'
          }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {deadlineAnalysis.isOnTrack ? <CheckCircleIcon /> : <WarningIcon />}
                  Status do Cronograma
                </Box>
              }
              subheader={`Sprint: ${selectedSprint || 'Todos os sprints'}`}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <Typography variant="h4">{deadlineAnalysis.doneTasks}/{deadlineAnalysis.totalTasks}</Typography>
                  <Typography variant="body2">Tarefas Concluídas</Typography>
                  <Typography variant="caption">
                    {deadlineAnalysis.completionPercentage.toFixed(1)}% completo
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="h4">{deadlineAnalysis.estimatedDaysRemaining}</Typography>
                  <Typography variant="body2">Dias Restantes</Typography>
                  <Typography variant="caption">
                    Velocidade: {deadlineAnalysis.velocity.toFixed(1)} tarefas/dia
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="h4">{deadlineAnalysis.remainingHours.toFixed(0)}h</Typography>
                  <Typography variant="body2">Horas Restantes</Typography>
                  <Typography variant="caption">
                    {deadlineAnalysis.completedHours.toFixed(0)}h de {deadlineAnalysis.totalHours.toFixed(0)}h
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="h6">
                    {deadlineAnalysis.estimatedCompletionDate.toLocaleDateString('pt-BR')}
                  </Typography>
                  <Typography variant="body2">Previsão de Entrega</Typography>
                  <Typography variant="caption">
                    {deadlineAnalysis.isOnTrack ? '✅ No prazo' : '⚠️ Risco de atraso'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance dos Desenvolvedores */}
      {developerPerformance.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon />
                    Performance dos Desenvolvedores
                  </Box>
                }
                subheader="Análise de tendências e precisão das estimativas por desenvolvedor"
              />
              <CardContent>
                <Grid container spacing={2}>
                  {developerPerformance.map(dev => (
                    <Grid item xs={12} sm={6} md={4} key={dev.name}>
                      <Paper sx={{ 
                        p: 2, 
                        bgcolor: dev.trend === 'improving' ? 'success.light' : 
                                dev.trend === 'declining' ? 'error.light' : 'info.light',
                        color: dev.trend === 'improving' ? 'success.contrastText' : 
                               dev.trend === 'declining' ? 'error.contrastText' : 'info.contrastText'
                      }}>
                        <Typography variant="h6" gutterBottom>
                          👤 {dev.name}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Precisão:</strong> {dev.averageAccuracy.toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Tendência:</strong> {
                            dev.trend === 'improving' ? '📈 Melhorando' :
                            dev.trend === 'declining' ? '📉 Piorando' : '➡️ Estável'
                          }
                        </Typography>
                        <Typography variant="caption">
                          ✅ {dev.accurateEstimates} | ⚠️ {dev.overestimates} | ⬇️ {dev.underestimates}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            label={`${dev.totalTasks} tarefas`}
                            size="small"
                            sx={{ opacity: 0.8 }}
                          />
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Análise Preditiva WIP */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SpeedIcon />
                  Previsão WIP - Próximos 5 Dias
                </Box>
              }
              subheader={wipAnalysis.bottleneck ? `⚠️ Gargalo identificado em: ${wipAnalysis.bottleneck}` : '✅ Fluxo sem gargalos'}
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={wipAnalysis.predictions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="priorizado" stackId="a" fill="#fff3e0" name="Priorizado" />
                  <Bar dataKey="doing" stackId="a" fill="#e8f5e8" name="Doing" />
                  <Bar dataKey="done" stackId="a" fill="#f3e5f5" name="Done" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title="Estado Atual WIP"
              subheader="Limites configurados vs atual"
            />
            <CardContent>
              {Object.entries(wipAnalysis.current).map(([status, count]) => {
                const limit = wipAnalysis.limits[status];
                const isViolated = limit && count > limit;
                const percentage = limit ? (count / limit) * 100 : 0;
                
                return (
                  <Box key={status} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{status}</Typography>
                      <Typography variant="body2" color={isViolated ? 'error.main' : 'text.primary'}>
                        {count}{limit ? `/${limit}` : ''}
                      </Typography>
                    </Box>
                    {limit && (
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(percentage, 100)}
                        sx={{
                          '& .MuiLinearProgress-bar': {
                            bgcolor: isViolated ? 'error.main' : 'primary.main'
                          }
                        }}
                      />
                    )}
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {tasksWithTimeSpent.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            📊 Análises baseadas em tarefas finalizadas ainda não disponíveis
          </Typography>
          <Typography>
            As análises de estimativas precisam de tarefas finalizadas com tempo gasto validado.
            {selectedSprint && ` Sprint selecionado: ${selectedSprint}`}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              💡 <strong>Como gerar dados:</strong> Finalize tarefas zerando os valores na tabela burndown ou movendo para "Done" no Kanban.
            </Typography>
          </Box>
        </Alert>
      ) : (
        <>
          {/* Estatísticas Resumo de Estimativas */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText', height: '100%' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <CheckCircleIcon sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h3">{estimativasPrecisas.length}</Typography>
                  <Typography variant="h6" gutterBottom>Estimativas Precisas</Typography>
                  <Typography variant="body2">(±20% da estimativa inicial)</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {tasksWithTimeSpent.length > 0 ? 
                      `${((estimativasPrecisas.length / tasksWithTimeSpent.length) * 100).toFixed(1)}% do total` : 
                      '0% do total'
                    }
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText', height: '100%' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <WarningIcon sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h3">{estimativasRuins.length}</Typography>
                  <Typography variant="h6" gutterBottom>Estimativas Ruins</Typography>
                  <Typography variant="body2">(Mais de 20% acima do previsto)</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {tasksWithTimeSpent.length > 0 ? 
                      `${((estimativasRuins.length / tasksWithTimeSpent.length) * 100).toFixed(1)}% do total` : 
                      '0% do total'
                    }
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText', height: '100%' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrendingUpIcon sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h3">{estimativasOtimas.length}</Typography>
                  <Typography variant="h6" gutterBottom>Subestimadas</Typography>
                  <Typography variant="body2">(10% abaixo - concluídas mais rápido)</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {tasksWithTimeSpent.length > 0 ? 
                      `${((estimativasOtimas.length / tasksWithTimeSpent.length) * 100).toFixed(1)}% do total` : 
                      '0% do total'
                    }
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Gráficos */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Gráfico de Barras: Estimativa vs Real */}
            <Grid item xs={12} lg={8}>
              <Card sx={{ height: '100%' }}>
                <CardHeader 
                  title="📊 Estimativa vs Tempo Real" 
                  subheader={`Comparação das últimas ${Math.min(10, barChartData.length)} tarefas finalizadas`}
                />
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis label={{ value: 'Horas', angle: -90, position: 'insideLeft' }} />
                      <RechartsTooltip 
                        formatter={(value, name) => [
                          `${value}h`, 
                          name
                        ]}
                        labelFormatter={(label) => `Tarefa ${label}`}
                      />
                      <Bar dataKey="Estimativa" fill="#8884d8" name="Estimativa" />
                      <Bar dataKey="Tempo Real" fill="#82ca9d" name="Tempo Real" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Gráfico Scatter: Taxa de Erro vs Estimativa */}
            <Grid item xs={12} lg={4}>
              <Card sx={{ height: '100%' }}>
                <CardHeader 
                  title="🎯 Dispersão de Erros" 
                  subheader="Taxa de erro por tamanho da estimativa"
                />
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <ScatterChart data={scatterData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="x" 
                        name="Estimativa" 
                        label={{ value: 'Estimativa (h)', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        dataKey="y" 
                        name="Taxa Erro %" 
                        label={{ value: 'Taxa Erro (%)', angle: -90, position: 'insideLeft' }}
                      />
                      <RechartsTooltip 
                        formatter={(value, name) => [
                          name === 'y' ? `${value.toFixed(1)}%` : `${value}h`,
                          name === 'y' ? 'Taxa de Erro' : 'Estimativa'
                        ]}
                        labelFormatter={() => 'Precisão da Estimativa'}
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
    </Container>
  );
};

// Componente Lista de Estimativas Ruins
const EstimativasRuinsList = ({ tasks }) => {
  if (tasks.length === 0) {
    return (
      <Alert severity="success" sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          🎉 Parabéns! Nenhuma tarefa com estimativa ruim encontrada!
        </Typography>
        <Typography>
          Todas as tarefas finalizadas tiveram uma taxa de erro dentro do limite aceitável de ±20%.
          Isso indica uma boa capacidade de estimativa da equipe.
        </Typography>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader 
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="error" />
            <Typography variant="h6">
              Tarefas com Estimativas Ruins
            </Typography>
          </Box>
        }
        subheader={`${tasks.length} tarefa${tasks.length !== 1 ? 's' : ''} com taxa de erro acima de 20% - Clique para ver o motivo do atraso`}
      />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tasks.map(task => (
            <Tooltip
              key={task.id}
              title={
                <Box sx={{ maxWidth: 400 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ color: 'primary.light' }}>
                    #{task.id} - {task.atividade}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Desenvolvedor:</strong> {task.desenvolvedor}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Estimativa:</strong> {task.estimativa}h → <strong>Real:</strong> {task.tempoReal}h
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Taxa de Erro:</strong> +{task.taxaErro.toFixed(1)}%
                  </Typography>
                  {task.motivoErro ? (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1, border: '1px solid rgba(255,255,255,0.2)' }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'warning.light' }}>
                        💡 Motivo do Atraso:
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {task.motivoErro}
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ mt: 2, p: 1, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        Motivo do atraso não informado
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
                  p: 3,
                  bgcolor: task.taxaErro > 50 ? 'error.light' : 'warning.light',
                  color: task.taxaErro > 50 ? 'error.contrastText' : 'warning.contrastText',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': { 
                    opacity: 0.9,
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>
                      #{task.id} - {task.atividade}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      👤 {task.desenvolvedor}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      ⏱️ {task.estimativa}h estimado → {task.tempoReal}h real
                    </Typography>
                    {task.motivoErro && (
                      <Typography variant="caption" sx={{ opacity: 0.7, fontStyle: 'italic' }}>
                        {task.motivoErro.length > 50 ? `${task.motivoErro.substring(0, 50)}...` : task.motivoErro}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ textAlign: 'center', ml: 2 }}>
                    <Chip
                      label={`+${task.taxaErro.toFixed(1)}%`}
                      size="large"
                      sx={{
                        bgcolor: task.taxaErro > 50 ? 'error.dark' : 'warning.dark',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        minWidth: 80
                      }}
                    />
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
                      {task.taxaErro > 50 ? 'Crítico' : 'Alto'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Tooltip>
          ))}
        </Box>
        
        {tasks.length > 0 && (
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              💡 <strong>Dica:</strong> Use essas informações para melhorar futuras estimativas. 
              Identifique padrões nos motivos de atraso e considere fatores como complexidade técnica, 
              mudanças de requisitos e dependências externas.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default PredictiveAnalysis;