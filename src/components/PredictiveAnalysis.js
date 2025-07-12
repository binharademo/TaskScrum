import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  Alert,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Badge,
  Container
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Person as PersonIcon,
  Psychology as PsychologyIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

const PredictiveAnalysis = ({ tasks }) => {
  const [selectedSprint, setSelectedSprint] = useState('');
  const [teamConfig] = useState({
    developers: 3,
    hoursPerDay: 8,
    sprintDays: 10
  });

  const sprints = [...new Set(tasks.map(task => task.sprint).filter(Boolean))];

  useEffect(() => {
    if (sprints.length > 0 && !selectedSprint) {
      setSelectedSprint(sprints[0]);
    }
  }, [sprints, selectedSprint]);

  const calculatePredictiveAnalysis = (sprintName) => {
    const sprintTasks = tasks.filter(task => task.sprint === sprintName);
    if (sprintTasks.length === 0) return null;

    const analysis = {
      trends: [],
      overallTrend: 0,
      riskLevel: 'low',
      predictedDelivery: null,
      confidence: 0
    };

    // Analisar tendência por desenvolvedor
    const devAnalysis = {};
    
    sprintTasks.forEach(task => {
      const dev = task.desenvolvedor || 'Não atribuído';
      if (!devAnalysis[dev]) {
        devAnalysis[dev] = {
          tasks: [],
          totalVariation: 0,
          avgDailyChange: 0,
          riskScore: 0
        };
      }
      
      // Calcular variação das reestimativas
      const reestimativas = task.reestimativas || [];
      const estimativaInicial = task.estimativa || 0;
      const variations = [];
      
      for (let i = 0; i < reestimativas.length; i++) {
        const currentValue = reestimativas[i] || estimativaInicial;
        const previousValue = i === 0 ? estimativaInicial : (reestimativas[i-1] || estimativaInicial);
        const variation = currentValue - previousValue;
        variations.push(variation);
      }
      
      // Calcular tendência (regressão linear simples)
      const n = variations.length;
      const x = variations.map((_, i) => i + 1);
      const y = variations;
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
      const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
      
      const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0;
      const intercept = (sumY - slope * sumX) / n;
      
      devAnalysis[dev].tasks.push({
        id: task.id,
        atividade: task.atividade,
        variations,
        trend: slope,
        intercept,
        totalVariation: reestimativas[reestimativas.length - 1] - estimativaInicial
      });
      
      devAnalysis[dev].totalVariation += reestimativas[reestimativas.length - 1] - estimativaInicial;
      devAnalysis[dev].avgDailyChange += slope;
    });

    // Calcular análise geral
    let totalTrendScore = 0;
    let totalTasks = 0;
    
    Object.keys(devAnalysis).forEach(dev => {
      const devData = devAnalysis[dev];
      devData.avgDailyChange /= devData.tasks.length;
      devData.riskScore = Math.abs(devData.avgDailyChange) * devData.tasks.length;
      
      analysis.trends.push({
        desenvolvedor: dev,
        avgDailyChange: devData.avgDailyChange,
        totalVariation: devData.totalVariation,
        riskScore: devData.riskScore,
        tasksCount: devData.tasks.length
      });
      
      totalTrendScore += devData.avgDailyChange * devData.tasks.length;
      totalTasks += devData.tasks.length;
    });

    // Calcular tendência geral
    analysis.overallTrend = totalTasks > 0 ? totalTrendScore / totalTasks : 0;
    
    // Determinar nível de risco
    if (Math.abs(analysis.overallTrend) < 0.5) {
      analysis.riskLevel = 'low';
    } else if (Math.abs(analysis.overallTrend) < 1.5) {
      analysis.riskLevel = 'medium';
    } else {
      analysis.riskLevel = 'high';
    }
    
    // Calcular previsão de entrega
    const currentTotalHours = sprintTasks.reduce((sum, task) => {
      const reestimativas = task.reestimativas || [];
      return sum + (reestimativas[reestimativas.length - 1] || task.estimativa || 0);
    }, 0);
    
    const teamCapacity = teamConfig.developers * teamConfig.hoursPerDay;
    const daysRemaining = Math.ceil(currentTotalHours / teamCapacity);
    
    // Projetar tendência futura
    const projectedDailyChange = analysis.overallTrend;
    const projectedTotalHours = currentTotalHours + (projectedDailyChange * teamConfig.sprintDays);
    const projectedDaysNeeded = Math.ceil(projectedTotalHours / teamCapacity);
    
    analysis.predictedDelivery = {
      currentDaysNeeded: daysRemaining,
      projectedDaysNeeded,
      projectedTotalHours,
      willDeliver: projectedDaysNeeded <= teamConfig.sprintDays ? 'early' : 'late',
      daysVariation: projectedDaysNeeded - teamConfig.sprintDays
    };
    
    // Calcular confiança baseada na consistência das tendências
    const trendVariance = analysis.trends.reduce((sum, trend) => {
      return sum + Math.pow(trend.avgDailyChange - analysis.overallTrend, 2);
    }, 0) / analysis.trends.length;
    
    analysis.confidence = Math.max(0, Math.min(100, 100 - (trendVariance * 20)));

    return analysis;
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return <CheckCircleIcon />;
      case 'medium': return <WarningIcon />;
      case 'high': return <ErrorIcon />;
      default: return <CheckCircleIcon />;
    }
  };

  const getTrendIcon = (change) => {
    return change > 0 ? <TrendingUpIcon color="error" /> : <TrendingDownIcon color="success" />;
  };

  const predictiveAnalysis = selectedSprint ? calculatePredictiveAnalysis(selectedSprint) : null;

  if (!predictiveAnalysis) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="info">
          Nenhum dado disponível para análise preditiva. Selecione um sprint com tarefas.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <PsychologyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Análise Preditiva
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Inteligência artificial aplicada ao gerenciamento de projetos
          </Typography>
        </Box>
      </Box>

      {/* Sprint Selector */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <FormControl fullWidth>
            <InputLabel>Sprint</InputLabel>
            <Select
              value={selectedSprint}
              onChange={(e) => setSelectedSprint(e.target.value)}
              label="Sprint"
            >
              {sprints.map(sprint => (
                <MenuItem key={sprint} value={sprint}>{sprint}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Main Analysis Cards */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {/* Overall Prediction */}
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              height: '100%', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimelineIcon sx={{ fontSize: 32, mr: 2 }} />
                <Typography variant="h5" fontWeight="bold">
                  Previsão de Entrega
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                  {predictiveAnalysis.predictedDelivery.willDeliver === 'early' ? 'No Prazo' : 'Atraso'}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  {predictiveAnalysis.predictedDelivery.projectedDaysNeeded} dias necessários
                  {predictiveAnalysis.predictedDelivery.daysVariation !== 0 && (
                    <span>
                      {' '}({predictiveAnalysis.predictedDelivery.daysVariation > 0 ? '+' : ''}
                      {predictiveAnalysis.predictedDelivery.daysVariation} dias)
                    </span>
                  )}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                  Confiança da Previsão
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={predictiveAnalysis.confidence} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'white'
                    }
                  }}
                />
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                  {Math.round(predictiveAnalysis.confidence)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Risk Analysis */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SpeedIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
                <Typography variant="h5" fontWeight="bold">
                  Análise de Risco
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Chip 
                  icon={getRiskIcon(predictiveAnalysis.riskLevel)}
                  label={`Risco ${predictiveAnalysis.riskLevel === 'low' ? 'Baixo' : 
                               predictiveAnalysis.riskLevel === 'medium' ? 'Médio' : 'Alto'}`}
                  color={getRiskColor(predictiveAnalysis.riskLevel)}
                  size="large"
                  sx={{ fontSize: '1.1rem', p: 2 }}
                />
              </Box>

              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Tendência Geral:</strong>{' '}
                {predictiveAnalysis.overallTrend > 0 ? 'Aumento' : 'Redução'} de{' '}
                <strong>{Math.abs(predictiveAnalysis.overallTrend).toFixed(2)}h/dia</strong>
              </Typography>

              <Typography variant="body1">
                <strong>Horas Projetadas:</strong>{' '}
                {Math.round(predictiveAnalysis.predictedDelivery.projectedTotalHours)}h
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Developer Analysis */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
            Análise por Desenvolvedor
          </Typography>

          <List>
            {predictiveAnalysis.trends
              .sort((a, b) => Math.abs(b.riskScore) - Math.abs(a.riskScore))
              .map((trend, index) => (
                <React.Fragment key={trend.desenvolvedor}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Badge
                        badgeContent={trend.tasksCount}
                        color="primary"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      >
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <PersonIcon />
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Typography variant="h6" fontWeight="bold">
                          {trend.desenvolvedor}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Variação total: {trend.totalVariation > 0 ? '+' : ''}
                            {trend.totalVariation.toFixed(1)}h
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Mudança média diária: {trend.avgDailyChange > 0 ? '+' : ''}
                            {trend.avgDailyChange.toFixed(2)}h/dia
                          </Typography>
                        </Box>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title={`Score de risco: ${trend.riskScore.toFixed(1)}`}>
                          <Chip
                            size="small"
                            label={trend.riskScore < 1 ? 'Baixo' : trend.riskScore < 3 ? 'Médio' : 'Alto'}
                            color={trend.riskScore < 1 ? 'success' : trend.riskScore < 3 ? 'warning' : 'error'}
                          />
                        </Tooltip>
                        {getTrendIcon(trend.avgDailyChange)}
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  {index < predictiveAnalysis.trends.length - 1 && <Divider />}
                </React.Fragment>
              ))}
          </List>
        </CardContent>
      </Card>
    </Container>
  );
};

export default PredictiveAnalysis;