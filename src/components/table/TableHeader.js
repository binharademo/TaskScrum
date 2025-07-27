import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Stack,
  Chip,
  Grid,
  Tooltip,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  GetApp as ExportIcon,
  ShowChart as ShowChartIcon,
  Assessment as AssessmentIcon,
  Analytics as AnalyticsIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useFilterContext } from '../../contexts/FilterContext';
import { useUIContext, TAB_INDICES } from '../../contexts/UIContext';
import { useTaskContext } from '../../contexts/TaskContext';

const TableHeader = ({
  onExport,
  onRefresh,
  showRefresh = false
}) => {
  const { 
    filters, 
    setFilter, 
    clearFilters, 
    getUniqueValues, 
    hasActiveFilters, 
    activeFiltersCount 
  } = useFilterContext();
  
  const { 
    ui, 
    setActiveTab 
  } = useUIContext();
  
  const { tasks } = useTaskContext();

  const handleFilterChange = (field, value) => {
    setFilter(field, value);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderFilterField = (
    label,
    field,
    options = null,
    placeholder = '',
    minWidth = 150
  ) => (
    <TextField
      label={label}
      value={filters[field] || ''}
      onChange={(e) => handleFilterChange(field, e.target.value)}
      select={!!options}
      size="small"
      sx={{ minWidth }}
      placeholder={placeholder}
    >
      {options && options.map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        mb: 2, 
        backgroundColor: '#fafafa',
        borderRadius: 2
      }}
    >
      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={ui.activeTab} 
          onChange={handleTabChange}
          sx={{ px: 2 }}
        >
          <Tab 
            icon={<ShowChartIcon />} 
            label="📈 Burndown Chart" 
            iconPosition="start"
          />
          <Tab 
            icon={<AssessmentIcon />} 
            label="📊 Estatísticas" 
            iconPosition="start"
          />  
          <Tab 
            icon={<AnalyticsIcon />} 
            label="🔮 Análise Preditiva" 
            iconPosition="start"
          />
          <Tab 
            icon={<ShareIcon />} 
            label="🔗 Compartilhar" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Filter Section */}
      <Box sx={{ p: 2 }}>
        {/* Header Title and Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon color="primary" />
            <Typography variant="h6" component="h2">
              Filtros da Tabela
            </Typography>
            {hasActiveFilters && (
              <Chip 
                label={`${activeFiltersCount} filtro${activeFiltersCount > 1 ? 's' : ''}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
          
          <Stack direction="row" spacing={1}>
            {/* Refresh Button (optional) */}
            {showRefresh && (
              <Tooltip title="Atualizar dados">
                <IconButton onClick={onRefresh} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )}

            {/* Export Button */}
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={onExport}
              size="small"
              sx={{ minWidth: 120 }}
            >
              Exportar
            </Button>
          </Stack>
        </Box>

        {/* Filter Fields Grid */}
        <Grid container spacing={2} alignItems="center">
          {/* First Row - Basic Filters */}
          <Grid item xs={12} sm={6} md={2}>
            {renderFilterField(
              "Sprint",
              "sprint",
              getUniqueValues(tasks, 'sprint'),
              "Filtrar por sprint..."
            )}
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            {renderFilterField(
              "Desenvolvedor", 
              "desenvolvedor",
              getUniqueValues(tasks, 'desenvolvedor'),
              "Filtrar por dev..."
            )}
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            {renderFilterField(
              "Prioridade",
              "prioridade",
              ['Baixa', 'Média', 'Alta', 'Crítica'],
              "Filtrar prioridade..."
            )}
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            {renderFilterField(
              "Status",
              "status", 
              ['Backlog', 'Priorizado', 'Doing', 'Done'],
              "Filtrar por status..."
            )}
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            {renderFilterField(
              "Épico",
              "epico",
              getUniqueValues(tasks, 'epico'),
              "Filtrar por épico..."
            )}
          </Grid>

          {/* Second Row - Search Fields */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Buscar em todos os campos"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
              placeholder="Digite para buscar..."
            />
          </Grid>

          <Grid item xs={12} sm={3} md={1}>
            <TextField
              label="Buscar por ID"
              value={filters.searchId || ''}
              onChange={(e) => handleFilterChange('searchId', e.target.value)}
              size="small"
              sx={{ minWidth: 60 }}
              placeholder="#123..."
            />
          </Grid>

          {/* Clear Filters Button */}
          <Grid item xs={12} sm={3} md={2}>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              size="small"
              sx={{ minWidth: 120 }}
            >
              Limpar Filtros
            </Button>
          </Grid>
        </Grid>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Filtros ativos:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {Object.entries(filters)
                .filter(([key, value]) => 
                  value && 
                  !['compactView', 'groupByEpic', 'sortBy', 'sortDirection'].includes(key)
                )
                .map(([key, value]) => (
                  <Chip
                    key={key}
                    label={`${key}: ${value}`}
                    size="small"
                    onDelete={() => handleFilterChange(key, '')}
                    deleteIcon={<ClearIcon />}
                    variant="outlined"
                    color="primary"
                  />
                ))}
            </Stack>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default TableHeader;