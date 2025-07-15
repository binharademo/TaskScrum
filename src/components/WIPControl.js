import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Chip,
  Alert,
  AlertTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  TextField,
  Button,
  Divider,
  Avatar,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const WIPControl = ({ tasks, onTasksUpdate }) => {
  const [wipLimits, setWipLimits] = useState({
    'Priorizado': 10,
    'Doing': 8,
    'Done': null
  });
  const [showSettings, setShowSettings] = useState(false);
  const [enforceWipLimits, setEnforceWipLimits] = useState(false);

  // Calcular estatísticas atuais
  const calculateWIPStats = () => {
    const statusCounts = {
      'Backlog': 0,
      'Priorizado': 0,
      'Doing': 0,
      'Done': 0
    };

    const developerWorkload = {};
    const epicProgress = {};

    tasks.forEach(task => {
      // Contagem por status
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;

      // Workload por desenvolvedor
      if (task.desenvolvedor) {
        if (!developerWorkload[task.desenvolvedor]) {
          developerWorkload[task.desenvolvedor] = {
            name: task.desenvolvedor,
            backlog: 0,
            priorizado: 0,
            doing: 0,
            done: 0,
            totalTasks: 0,
            totalHours: 0
          };
        }
        developerWorkload[task.desenvolvedor][task.status.toLowerCase()] += 1;
        developerWorkload[task.desenvolvedor].totalTasks += 1;
        developerWorkload[task.desenvolvedor].totalHours += task.estimativa || 0;
      }

      // Progresso por épico
      if (task.epico) {
        if (!epicProgress[task.epico]) {
          epicProgress[task.epico] = {
            name: task.epico,
            total: 0,
            done: 0,
            inProgress: 0,
            totalHours: 0,
            completedHours: 0
          };
        }
        epicProgress[task.epico].total += 1;
        epicProgress[task.epico].totalHours += task.estimativa || 0;
        
        if (task.status === 'Done') {
          epicProgress[task.epico].done += 1;
          epicProgress[task.epico].completedHours += task.estimativa || 0;
        } else if (task.status === 'Doing') {
          epicProgress[task.epico].inProgress += 1;
        }
      }
    });

    return {
      statusCounts,
      developerWorkload: Object.values(developerWorkload),
      epicProgress: Object.values(epicProgress)
    };
  };

  const stats = calculateWIPStats();

  // Verificar limites WIP
  const checkWIPLimits = () => {
    const violations = [];
    Object.entries(wipLimits).forEach(([status, limit]) => {
      if (limit && stats.statusCounts[status] > limit) {
        violations.push({
          status,
          current: stats.statusCounts[status],
          limit,
          excess: stats.statusCounts[status] - limit
        });
      }
    });
    return violations;
  };

  const wipViolations = checkWIPLimits();

  // Cores para gráficos
  const statusColors = {
    'Backlog': '#e3f2fd',
    'Priorizado': '#fff3e0', 
    'Doing': '#e8f5e8',
    'Done': '#f3e5f5'
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleWIPLimitChange = (status, value) => {
    setWipLimits(prev => ({
      ...prev,
      [status]: value === '' ? null : parseInt(value)
    }));
  };

  // Função para validar movimento WIP (será exportada)
  const validateWipMove = (currentTasks, targetStatus) => {
    if (!enforceWipLimits) {
      return { allowed: true, isEnforced: false };
    }

    const currentCount = currentTasks.filter(task => task.status === targetStatus).length;
    const limit = wipLimits[targetStatus];

    if (limit && currentCount >= limit) {
      return {
        allowed: false,
        isEnforced: true,
        message: `Limite WIP atingido para ${targetStatus}`,
        details: `Atual: ${currentCount}/${limit} tarefas`,
        suggestion: `Finalize algumas tarefas em ${targetStatus} antes de adicionar novas`
      };
    }

    return { allowed: true, isEnforced: true };
  };

  // Persistir configurações no localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('wipConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setWipLimits(config.limits || wipLimits);
      setEnforceWipLimits(config.enforceWipLimits || false);
    }
  }, []);

  useEffect(() => {
    const config = {
      limits: wipLimits,
      enforceWipLimits: enforceWipLimits
    };
    localStorage.setItem('wipConfig', JSON.stringify(config));
  }, [wipLimits, enforceWipLimits]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          <SpeedIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          WIP Control Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<SettingsIcon />}
          onClick={() => setShowSettings(!showSettings)}
        >
          Configurar Limites
        </Button>
      </Box>

      {/* Alertas de WIP locais (opcional - já exibidos globalmente) */}
      {wipViolations.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>📊 Detalhes dos Limites WIP</AlertTitle>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Os alertas WIP também são exibidos globalmente no topo da aplicação.
          </Typography>
          {wipViolations.map(violation => (
            <Typography key={violation.status} variant="body2">
              • <strong>{violation.status}</strong>: {violation.current} tarefas (limite: {violation.limit}) - {violation.excess} acima do limite
            </Typography>
          ))}
        </Alert>
      )}

      {/* Configurações WIP */}
      {showSettings && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Configuração de Limites WIP
          </Typography>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={enforceWipLimits}
                onChange={(e) => setEnforceWipLimits(e.target.checked)}
                color="primary"
              />
            }
            label="Limite de WIP obrigatório"
            sx={{ mb: 2 }}
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {enforceWipLimits ? 
              '🔒 Desenvolvedores não poderão mover cards se excederem os limites' : 
              '⚠️ Apenas alertas serão exibidos, movimentação livre permitida'
            }
          </Typography>
          
          <Grid container spacing={2}>
            {Object.entries(wipLimits).map(([status, limit]) => (
              <Grid item xs={12} sm={3} key={status}>
                <TextField
                  label={`Limite ${status}`}
                  type="number"
                  value={limit || ''}
                  onChange={(e) => handleWIPLimitChange(status, e.target.value)}
                  fullWidth
                  size="small"
                  helperText={`Atual: ${stats.statusCounts[status] || 0}`}
                />
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* Cards de Status */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            📊 Status das Tarefas
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(stats.statusCounts).map(([status, count]) => {
              const limit = wipLimits[status];
              const isViolated = limit && count > limit;
              const utilizationRate = limit ? (count / limit) * 100 : 0;
              
              return (
                <Grid item xs={12} sm={6} md={3} key={status}>
                  <Card sx={{ 
                    bgcolor: statusColors[status],
                    border: isViolated ? '2px solid #f44336' : '1px solid #e0e0e0'
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">{status}</Typography>
                        {isViolated && <WarningIcon color="error" />}
                      </Box>
                      <Typography variant="h3" component="div" sx={{ my: 1 }}>
                        {count}
                      </Typography>
                      {limit && (
                        <>
                          <Typography variant="body2" color="text.secondary">
                            Limite: {limit}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(utilizationRate, 100)}
                            sx={{ 
                              mt: 1,
                              '& .MuiLinearProgress-bar': {
                                bgcolor: isViolated ? 'error.main' : 'primary.main'
                              }
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {utilizationRate.toFixed(0)}% utilizado
                          </Typography>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Grid>

        {/* Workload por Desenvolvedor */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              avatar={<PersonIcon />}
              title="Workload por Desenvolvedor"
              subheader="Distribuição de tarefas por desenvolvedor"
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.developerWorkload}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="backlog" stackId="a" fill="#e3f2fd" name="Backlog" />
                  <Bar dataKey="priorizado" stackId="a" fill="#fff3e0" name="Priorizado" />
                  <Bar dataKey="doing" stackId="a" fill="#e8f5e8" name="Doing" />
                  <Bar dataKey="done" stackId="a" fill="#f3e5f5" name="Done" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Distribuição por Status */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              avatar={<TrendingUpIcon />}
              title="Distribuição Geral"
              subheader="Proporção de tarefas por status"
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(stats.statusCounts).map(([status, count]) => ({
                      name: status,
                      value: count
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(stats.statusCounts).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Tabela de Desenvolvedores */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              avatar={<WorkIcon />}
              title="Detalhes por Desenvolvedor"
              subheader="Análise detalhada da carga de trabalho"
            />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Desenvolvedor</TableCell>
                      <TableCell align="center">Total Tarefas</TableCell>
                      <TableCell align="center">Total Horas</TableCell>
                      <TableCell align="center">Backlog</TableCell>
                      <TableCell align="center">Priorizado</TableCell>
                      <TableCell align="center">Doing</TableCell>
                      <TableCell align="center">Done</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.developerWorkload.map((dev) => {
                      const activeWork = dev.priorizado + dev.doing;
                      const isOverloaded = activeWork > 6; // Limite sugerido: 6 tarefas ativas
                      
                      return (
                        <TableRow key={dev.name}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                                {getInitials(dev.name)}
                              </Avatar>
                              {dev.name}
                            </Box>
                          </TableCell>
                          <TableCell align="center">{dev.totalTasks}</TableCell>
                          <TableCell align="center">{dev.totalHours}h</TableCell>
                          <TableCell align="center">{dev.backlog}</TableCell>
                          <TableCell align="center">{dev.priorizado}</TableCell>
                          <TableCell align="center">{dev.doing}</TableCell>
                          <TableCell align="center">{dev.done}</TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={isOverloaded ? 'Sobrecarregado' : 'Normal'}
                              color={isOverloaded ? 'error' : 'success'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Progresso dos Épicos */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              avatar={<AssignmentIcon />}
              title="Progresso dos Épicos"
              subheader="Status de conclusão por épico"
            />
            <CardContent>
              <Grid container spacing={2}>
                {stats.epicProgress.map((epic) => {
                  const progress = (epic.done / epic.total) * 100;
                  const hoursProgress = (epic.completedHours / epic.totalHours) * 100;
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={epic.name}>
                      <Paper sx={{ p: 2, border: '1px solid #e0e0e0' }}>
                        <Typography variant="h6" gutterBottom>
                          {epic.name}
                        </Typography>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Tarefas: {epic.done}/{epic.total} ({progress.toFixed(0)}%)
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Horas: {epic.completedHours}/{epic.totalHours}h ({hoursProgress.toFixed(0)}%)
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={hoursProgress}
                            sx={{ mt: 0.5 }}
                            color="secondary"
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Em andamento: {epic.inProgress} tarefas
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Função utilitária para validar WIP que pode ser importada por outros componentes
export const validateWipLimits = (tasks, targetStatus) => {
  const savedConfig = localStorage.getItem('wipConfig');
  if (!savedConfig) {
    return { allowed: true, isEnforced: false };
  }

  const config = JSON.parse(savedConfig);
  if (!config.enforceWipLimits) {
    return { allowed: true, isEnforced: false };
  }

  const currentCount = tasks.filter(task => task.status === targetStatus).length;
  const limit = config.limits?.[targetStatus];

  if (limit && currentCount >= limit) {
    return {
      allowed: false,
      isEnforced: true,
      message: `Limite WIP atingido para ${targetStatus}`,
      details: `Atual: ${currentCount}/${limit} tarefas`,
      suggestion: `Finalize algumas tarefas em ${targetStatus} antes de adicionar novas`
    };
  }

  return { allowed: true, isEnforced: true };
};

export default WIPControl;