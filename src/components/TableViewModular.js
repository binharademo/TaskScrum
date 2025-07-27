import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  GetApp as ExportIcon
} from '@mui/icons-material';

// Import modular components
import TableHeader from './table/TableHeader';
import TaskTableRow from './table/TableRow';
import BurndownChart from './table/BurndownChart';
import StatisticsPanel from './table/StatisticsPanel';
import PredictiveAnalysisModular from './table/PredictiveAnalysisModular';

// Import contexts
import { useTaskContext } from '../contexts/TaskContext';
import { useFilterContext } from '../contexts/FilterContext';
import { useUIContext, TAB_INDICES } from '../contexts/UIContext';

const TableViewModular = () => {
  const { 
    tasks, 
    loading, 
    error 
  } = useTaskContext();

  const { 
    filters,
    applyFilters,
    toggleSort
  } = useFilterContext();

  const { 
    ui,
    showNotification 
  } = useUIContext();

  // Pagination state
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(50);

  // Apply filters and sorting
  const filteredAndSortedTasks = useMemo(() => {
    return applyFilters(tasks);
  }, [tasks, applyFilters]);

  // Calculate totals for the filtered tasks
  const calculateColumnTotals = useMemo(() => {
    if (filteredAndSortedTasks.length === 0) {
      return {
        estimativa: 0,
        dia1: 0, dia2: 0, dia3: 0, dia4: 0, dia5: 0,
        dia6: 0, dia7: 0, dia8: 0, dia9: 0, dia10: 0
      };
    }

    return filteredAndSortedTasks.reduce((totals, task) => {
      const reestimativas = task.reestimativas || Array(10).fill(task.estimativa || 0);
      
      return {
        estimativa: totals.estimativa + (task.estimativa || 0),
        dia1: totals.dia1 + (reestimativas[0] || task.estimativa || 0),
        dia2: totals.dia2 + (reestimativas[1] || task.estimativa || 0),
        dia3: totals.dia3 + (reestimativas[2] || task.estimativa || 0),
        dia4: totals.dia4 + (reestimativas[3] || task.estimativa || 0),
        dia5: totals.dia5 + (reestimativas[4] || task.estimativa || 0),
        dia6: totals.dia6 + (reestimativas[5] || task.estimativa || 0),
        dia7: totals.dia7 + (reestimativas[6] || task.estimativa || 0),
        dia8: totals.dia8 + (reestimativas[7] || task.estimativa || 0),
        dia9: totals.dia9 + (reestimativas[8] || task.estimativa || 0),
        dia10: totals.dia10 + (reestimativas[9] || task.estimativa || 0)
      };
    }, {
      estimativa: 0,
      dia1: 0, dia2: 0, dia3: 0, dia4: 0, dia5: 0,
      dia6: 0, dia7: 0, dia8: 0, dia9: 0, dia10: 0
    });
  }, [filteredAndSortedTasks]);

  // Paginated tasks
  const paginatedTasks = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredAndSortedTasks.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedTasks, page, rowsPerPage]);

  // Handle export to CSV
  const handleExport = () => {
    if (filteredAndSortedTasks.length === 0) {
      showNotification('Nenhuma tarefa para exportar', 'warning');
      return;
    }

    try {
      const headers = [
        'ID', 'Atividade', 'Desenvolvedor', 'Prioridade', 'Status', 'Sprint',
        'Estimativa', 'Dia1', 'Dia2', 'Dia3', 'Dia4', 'Dia5',
        'Dia6', 'Dia7', 'Dia8', 'Dia9', 'Dia10'
      ];

      const csvContent = [
        headers.join(','),
        ...filteredAndSortedTasks.map(task => {
          const reestimativas = task.reestimativas || Array(10).fill(task.estimativa || 0);
          return [
            task.originalId || task.id,
            `"${(task.atividade || '').replace(/"/g, '""')}"`,
            `"${(task.desenvolvedor || '').replace(/"/g, '""')}"`,
            task.prioridade || '',
            task.status || '',
            `"${(task.sprint || '').replace(/"/g, '""')}"`,
            task.estimativa || 0,
            ...reestimativas.slice(0, 10)
          ].join(',');
        })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `tasktracker-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showNotification(`${filteredAndSortedTasks.length} tarefas exportadas`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      showNotification('Erro ao exportar dados', 'error');
    }
  };

  // Handle refresh (for future use)
  const handleRefresh = () => {
    showNotification('Dados atualizados', 'info', { duration: 1500 });
  };

  // Handle sort
  const handleSort = (field) => {
    toggleSort(field);
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Show loading state
  if (loading.global) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Typography variant="h6" color="text.secondary">
          Carregando dados...
        </Typography>
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        <Typography variant="body1">
          Erro ao carregar dados: {error}
        </Typography>
      </Alert>
    );
  }

  // Render different tabs based on activeTab
  const renderTabContent = () => {
    switch (ui.activeTab) {
      case TAB_INDICES.BURNDOWN:
        return <BurndownChart />;
      
      case TAB_INDICES.WIP:
        return <StatisticsPanel />;
      
      case TAB_INDICES.PREDICTIVE_ANALYSIS:
        return <PredictiveAnalysisModular />;
      
      case TAB_INDICES.SHARING:
        return (
          <Alert severity="info">
            <Typography variant="body1">
              Funcionalidade de compartilhamento em desenvolvimento.
            </Typography>
          </Alert>
        );
      
      default:
        return <BurndownChart />;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header with tabs and filters */}
      <TableHeader
        onExport={handleExport}
        onRefresh={handleRefresh}
        showRefresh={false}
      />

      {/* Tab Content */}
      <Box sx={{ mt: 2 }}>
        {renderTabContent()}
      </Box>

      {/* Data Table (always visible but can be hidden in future versions) */}
      {ui.activeTab === TAB_INDICES.BURNDOWN && (
        <Paper elevation={2} sx={{ mt: 3 }}>
          <Box sx={{ p: 2, pb: 1 }}>
            <Typography variant="h6" gutterBottom>
              Tabela de Tarefas ({filteredAndSortedTasks.length} itens)
            </Typography>
          </Box>

          <TableContainer sx={{ maxHeight: 600 }}>
            <Table 
              stickyHeader 
              size="small"
              sx={{ 
                tableLayout: 'fixed',
                minWidth: 1200
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '60px', padding: '4px 8px' }}>
                    <Typography variant="caption" fontWeight="bold">
                      ID
                    </Typography>
                  </TableCell>
                  
                  <TableCell 
                    sx={{ width: '30%', padding: '4px 8px', cursor: 'pointer' }}
                    onClick={() => handleSort('atividade')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="caption" fontWeight="bold">
                        Atividade
                      </Typography>
                      {filters.sortBy === 'atividade' && (
                        <IconButton size="small" sx={{ ml: 0.5 }}>
                          {filters.sortDirection === 'asc' ? 
                            <KeyboardArrowUpIcon fontSize="small" /> : 
                            <KeyboardArrowDownIcon fontSize="small" />
                          }
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>

                  <TableCell sx={{ width: '120px', padding: '4px 8px' }}>
                    <Typography variant="caption" fontWeight="bold">
                      Desenvolvedor
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ width: '80px', padding: '4px 8px' }}>
                    <Typography variant="caption" fontWeight="bold">
                      Prioridade
                    </Typography>
                  </TableCell>

                  <TableCell 
                    sx={{ width: '8%', padding: '4px 8px', cursor: 'pointer' }}
                    onClick={() => handleSort('estimativa')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="caption" fontWeight="bold">
                        Est. Inicial
                      </Typography>
                      {filters.sortBy === 'estimativa' && (
                        <IconButton size="small" sx={{ ml: 0.5 }}>
                          {filters.sortDirection === 'asc' ? 
                            <KeyboardArrowUpIcon fontSize="small" /> : 
                            <KeyboardArrowDownIcon fontSize="small" />
                          }
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>

                  {/* Days 1-10 */}
                  {Array.from({ length: 10 }, (_, index) => (
                    <TableCell 
                      key={`day-${index + 1}`}
                      sx={{ width: '6.2%', padding: '4px 8px' }}
                    >
                      <Typography 
                        variant="caption" 
                        fontWeight="bold" 
                        sx={{ fontSize: '0.65rem' }}
                      >
                        Dia {index + 1}
                      </Typography>
                    </TableCell>
                  ))}

                  <TableCell sx={{ width: '60px', padding: '4px 8px' }}>
                    <Typography variant="caption" fontWeight="bold">
                      Ações
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {/* Total Row */}
                <TaskTableRow
                  task={calculateColumnTotals}
                  isTotal={true}
                />

                {/* Data Rows */}
                {paginatedTasks.map((task) => (
                  <TaskTableRow
                    key={task.id}
                    task={task}
                  />
                ))}

                {/* Empty state */}
                {paginatedTasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={16} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        Nenhuma tarefa encontrada
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {filteredAndSortedTasks.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={filteredAndSortedTasks.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Linhas por página:"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
              }
            />
          )}
        </Paper>
      )}
    </Box>
  );
};

export default TableViewModular;