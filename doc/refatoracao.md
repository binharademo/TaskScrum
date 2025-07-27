# 🚀 PLANO DE REFATORAÇÃO CRÍTICA - PREPARAÇÃO PARA SUPABASE
*Roadmap detalhado para transformar arquitetura monolítica em sistema modular*

---

## 🎯 **OBJETIVO ESTRATÉGICO**

Refatorar a arquitetura atual do TaskTracker para suportar **Supabase** como persistência distribuída, eliminando componentes monolíticos e props drilling que impedem escalabilidade.

### **Antes vs Depois**
```
❌ ANTES: Monólito + Props Drilling
App.js (674 linhas)
├── SimpleKanban.js (1.726 linhas) ← MONOLITO
└── TableView.js (1.891 linhas)    ← MONOLITO

✅ DEPOIS: Modular + Context API  
App.js (200 linhas)
├── contexts/ (estado global)
├── hooks/ (lógica reutilizável)
└── components/ (< 300 linhas cada)
```

---

## 📋 **CRONOGRAMA EXECUTIVO**

| Fase | Duração | Objetivo | Dependência |
|------|---------|----------|-------------|
| **FASE 1** | Semana 1-2 | Context API + Service Layer | Nenhuma |
| **FASE 2** | Semana 3-4 | Quebrar SimpleKanban | FASE 1 completa |
| **FASE 3** | Semana 5-6 | Quebrar TableView | FASE 2 completa |
| **FASE 4** | Semana 7 | Integração Supabase | FASE 3 completa |

**Total: 7 semanas** com checkpoints semanais

---

## 🔥 **FASE 1: FOUNDATION (Semanas 1-2)**
*Criar base sólida para arquitetura modular*

### **SEMANA 1: Context API e Hooks Foundation**

#### **DIA 1: Setup e Preparação**
```bash
# 1.1 - Backup e Branch
git checkout -b refactor/context-api
git push -u origin refactor/context-api

# 1.2 - Estrutura de Pastas
mkdir -p src/contexts src/hooks src/services src/types

# 1.3 - Instalar Dependências
npm install --save-dev @types/react @types/react-dom
# (Preparação para TypeScript futuro)
```

#### **DIA 2-3: Criar Contexts Base**

**🎯 TaskContext.js** (Estado global de tarefas)
```javascript
// src/contexts/TaskContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Types
const TASK_ACTIONS = {
  LOAD_TASKS: 'LOAD_TASKS',
  ADD_TASK: 'ADD_TASK', 
  UPDATE_TASK: 'UPDATE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  BULK_UPDATE: 'BULK_UPDATE',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR'
};

// Reducer
const taskReducer = (state, action) => {
  switch (action.type) {
    case TASK_ACTIONS.LOAD_TASKS:
      return { ...state, tasks: action.payload, loading: false };
    case TASK_ACTIONS.ADD_TASK:
      return { ...state, tasks: [...state.tasks, action.payload] };
    case TASK_ACTIONS.UPDATE_TASK:
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload.id 
            ? { ...task, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : task
        )
      };
    case TASK_ACTIONS.DELETE_TASK:
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
    case TASK_ACTIONS.BULK_UPDATE:
      return { ...state, tasks: action.payload };
    case TASK_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case TASK_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

// Initial State
const initialState = {
  tasks: [],
  loading: false,
  error: null,
  lastSync: null
};

// Context
const TaskContext = createContext();

// Provider
export const TaskProvider = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  // Actions
  const actions = {
    loadTasks: (tasks) => dispatch({ type: TASK_ACTIONS.LOAD_TASKS, payload: tasks }),
    addTask: (task) => dispatch({ type: TASK_ACTIONS.ADD_TASK, payload: task }),
    updateTask: (id, updates) => dispatch({ type: TASK_ACTIONS.UPDATE_TASK, payload: { id, updates } }),
    deleteTask: (id) => dispatch({ type: TASK_ACTIONS.DELETE_TASK, payload: id }),
    bulkUpdate: (tasks) => dispatch({ type: TASK_ACTIONS.BULK_UPDATE, payload: tasks }),
    setLoading: (loading) => dispatch({ type: TASK_ACTIONS.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: error })
  };

  return (
    <TaskContext.Provider value={{ ...state, ...actions }}>
      {children}
    </TaskContext.Provider>
  );
};

// Hook
export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within TaskProvider');
  }
  return context;
};

export { TASK_ACTIONS };
```

**🎯 FilterContext.js** (Filtros compartilhados)
```javascript
// src/contexts/FilterContext.js
import React, { createContext, useContext, useState } from 'react';

const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    sprint: '',
    desenvolvedor: '',
    status: '',
    prioridade: '',
    epico: '',
    search: '',
    searchId: ''
  });

  const [quickFilters, setQuickFilters] = useState({
    showOnlyMine: false,
    showOnlyHighPriority: false,
    showOnlyOverdue: false
  });

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const updateQuickFilter = (key, value) => {
    setQuickFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      sprint: '', desenvolvedor: '', status: '', 
      prioridade: '', epico: '', search: '', searchId: ''
    });
    setQuickFilters({
      showOnlyMine: false, showOnlyHighPriority: false, showOnlyOverdue: false
    });
  };

  return (
    <FilterContext.Provider value={{
      filters,
      quickFilters,
      updateFilter,
      updateQuickFilter,
      clearAllFilters
    }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilterContext = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilterContext must be used within FilterProvider');
  }
  return context;
};
```

**🎯 UIContext.js** (Estado da interface)
```javascript
// src/contexts/UIContext.js
import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
  const [ui, setUI] = useState({
    activeTab: 0,
    isCompactView: false,
    isDemoMode: false,
    currentRoom: '',
    showGoogleAuth: false,
    darkMode: JSON.parse(localStorage.getItem('darkMode') || 'false')
  });

  const updateUI = (updates) => {
    setUI(prev => ({ ...prev, ...updates }));
  };

  const toggleCompactView = () => {
    updateUI({ isCompactView: !ui.isCompactView });
  };

  const toggleDarkMode = () => {
    const newDarkMode = !ui.darkMode;
    updateUI({ darkMode: newDarkMode });
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
  };

  const setActiveTab = (tab) => {
    updateUI({ activeTab: tab });
  };

  return (
    <UIContext.Provider value={{
      ...ui,
      updateUI,
      toggleCompactView,
      toggleDarkMode,
      setActiveTab
    }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUIContext = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUIContext must be used within UIProvider');
  }
  return context;
};
```

#### **DIA 4-5: Service Layer Abstrato**

**🎯 DataService.js** (Interface abstrata para persistência)
```javascript
// src/services/DataService.js
// Interface abstrata que localStorage E Supabase implementarão

export class DataService {
  // CRUD Operations
  async getTasks() {
    throw new Error('getTasks must be implemented');
  }

  async createTask(task) {
    throw new Error('createTask must be implemented');
  }

  async updateTask(taskId, updates) {
    throw new Error('updateTask must be implemented');
  }

  async deleteTask(taskId) {
    throw new Error('deleteTask must be implemented');
  }

  async bulkUpdate(tasks) {
    throw new Error('bulkUpdate must be implemented');
  }

  // Sync Operations (preparação para Supabase)
  async syncTasks() {
    throw new Error('syncTasks must be implemented');
  }

  async subscribe(callback) {
    throw new Error('subscribe must be implemented');
  }

  async unsubscribe() {
    throw new Error('unsubscribe must be implemented');
  }

  // Configuration
  async getConfig(key) {
    throw new Error('getConfig must be implemented');
  }

  async setConfig(key, value) {
    throw new Error('setConfig must be implemented');
  }
}
```

**🎯 LocalStorageService.js** (Implementação localStorage)
```javascript
// src/services/LocalStorageService.js
import { DataService } from './DataService';

export class LocalStorageService extends DataService {
  constructor() {
    super();
    this.storageKey = 'tasktracker_tasks';
    this.configKey = 'tasktracker_config';
  }

  async getTasks() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading tasks from localStorage:', error);
      return [];
    }
  }

  async createTask(task) {
    const tasks = await this.getTasks();
    const newTask = {
      ...task,
      id: task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    await this.bulkUpdate(tasks);
    return newTask;
  }

  async updateTask(taskId, updates) {
    const tasks = await this.getTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    
    if (index === -1) {
      throw new Error(`Task with id ${taskId} not found`);
    }

    tasks[index] = {
      ...tasks[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.bulkUpdate(tasks);
    return tasks[index];
  }

  async deleteTask(taskId) {
    const tasks = await this.getTasks();
    const filteredTasks = tasks.filter(t => t.id !== taskId);
    await this.bulkUpdate(filteredTasks);
    return true;
  }

  async bulkUpdate(tasks) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(tasks));
      return tasks;
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error);
      throw error;
    }
  }

  async syncTasks() {
    // localStorage não precisa sync - retorna dados locais
    return await this.getTasks();
  }

  async subscribe(callback) {
    // localStorage não tem subscriptions - callback imediato
    const tasks = await this.getTasks();
    callback(tasks);
    return () => {}; // unsubscribe function
  }

  async unsubscribe() {
    // No-op para localStorage
    return true;
  }

  async getConfig(key) {
    try {
      const config = JSON.parse(localStorage.getItem(this.configKey) || '{}');
      return config[key];
    } catch (error) {
      return null;
    }
  }

  async setConfig(key, value) {
    try {
      const config = JSON.parse(localStorage.getItem(this.configKey) || '{}');
      config[key] = value;
      localStorage.setItem(this.configKey, JSON.stringify(config));
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      return false;
    }
  }
}
```

### **SEMANA 2: Custom Hooks e Integração**

#### **DIA 6-7: Custom Hooks Essenciais**

**🎯 useTaskOperations.js** (CRUD de tarefas)
```javascript
// src/hooks/useTaskOperations.js
import { useCallback } from 'react';
import { useTaskContext } from '../contexts/TaskContext';
import { LocalStorageService } from '../services/LocalStorageService';

const dataService = new LocalStorageService();

export const useTaskOperations = () => {
  const { tasks, addTask, updateTask, deleteTask, bulkUpdate, setLoading, setError } = useTaskContext();

  const createTask = useCallback(async (taskData) => {
    try {
      setLoading(true);
      const newTask = await dataService.createTask(taskData);
      addTask(newTask);
      return newTask;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [addTask, setLoading, setError]);

  const editTask = useCallback(async (taskId, updates) => {
    try {
      setLoading(true);
      const updatedTask = await dataService.updateTask(taskId, updates);
      updateTask(taskId, updates);
      return updatedTask;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [updateTask, setLoading, setError]);

  const removeTask = useCallback(async (taskId) => {
    try {
      setLoading(true);
      await dataService.deleteTask(taskId);
      deleteTask(taskId);
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [deleteTask, setLoading, setError]);

  const syncTasks = useCallback(async () => {
    try {
      setLoading(true);
      const syncedTasks = await dataService.syncTasks();
      bulkUpdate(syncedTasks);
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [bulkUpdate, setLoading, setError]);

  return {
    tasks,
    createTask,
    editTask,
    removeTask,
    syncTasks
  };
};
```

**🎯 useTaskFilters.js** (Filtros compartilhados)
```javascript
// src/hooks/useTaskFilters.js
import { useMemo } from 'react';
import { useTaskContext } from '../contexts/TaskContext';
import { useFilterContext } from '../contexts/FilterContext';

export const useTaskFilters = () => {
  const { tasks } = useTaskContext();
  const { filters, quickFilters } = useFilterContext();

  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Filtros básicos
    if (filters.sprint) {
      result = result.filter(task => task.sprint === filters.sprint);
    }

    if (filters.desenvolvedor) {
      result = result.filter(task => task.desenvolvedor === filters.desenvolvedor);
    }

    if (filters.status) {
      result = result.filter(task => task.status === filters.status);
    }

    if (filters.prioridade) {
      result = result.filter(task => task.prioridade === filters.prioridade);
    }

    if (filters.epico) {
      result = result.filter(task => task.epico === filters.epico);
    }

    // Busca textual
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(task =>
        Object.values(task).some(value =>
          value && value.toString().toLowerCase().includes(searchTerm)
        )
      );
    }

    // Busca por ID
    if (filters.searchId) {
      const searchId = filters.searchId.replace('#', '');
      result = result.filter(task =>
        task.originalId?.toString() === searchId || task.id === searchId
      );
    }

    // Quick filters
    if (quickFilters.showOnlyHighPriority) {
      result = result.filter(task => ['Alta', 'Crítica'].includes(task.prioridade));
    }

    if (quickFilters.showOnlyOverdue) {
      const now = new Date();
      result = result.filter(task => {
        if (!task.deadline) return false;
        return new Date(task.deadline) < now && task.status !== 'Done';
      });
    }

    return result;
  }, [tasks, filters, quickFilters]);

  // Estatísticas dos filtros
  const filterStats = useMemo(() => {
    return {
      total: tasks.length,
      filtered: filteredTasks.length,
      byStatus: filteredTasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {}),
      byPriority: filteredTasks.reduce((acc, task) => {
        acc[task.prioridade] = (acc[task.prioridade] || 0) + 1;
        return acc;
      }, {})
    };
  }, [tasks, filteredTasks]);

  return {
    filteredTasks,
    filterStats
  };
};
```

#### **DIA 8-10: Integração com App.js**

**🎯 App.js Refatorado** (Eliminando props drilling)
```javascript
// src/App.js (VERSÃO REFATORADA)
import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

// Context Providers
import { TaskProvider } from './contexts/TaskContext';
import { FilterProvider } from './contexts/FilterContext';
import { UIProvider } from './contexts/UIContext';

// Components
import AppHeader from './components/layout/AppHeader';
import MainContent from './components/layout/MainContent';
import { useUIContext } from './contexts/UIContext';

// Theme Hook
const useAppTheme = () => {
  const { darkMode } = useUIContext();
  
  return createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: '#1976d2' },
      secondary: { main: '#dc004e' }
    }
  });
};

// App Component interno (com acesso aos contexts)
const AppContent = () => {
  const theme = useAppTheme();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppHeader />
        <MainContent />
      </Box>
    </ThemeProvider>
  );
};

// App Component principal (providers wrapper)
function App() {
  return (
    <UIProvider>
      <TaskProvider>
        <FilterProvider>
          <AppContent />
        </FilterProvider>
      </TaskProvider>
    </UIProvider>
  );
}

export default App;
```

---

## 🔥 **FASE 2: QUEBRAR SIMPLEKANBAN (Semanas 3-4)**
*Transformar monólito de 1.726 linhas em 6 componentes modulares*

### **SEMANA 3: Componentização Base**

#### **DIA 11-12: Estrutura de Componentes Kanban**

**🎯 Nova Estrutura de Pastas**
```
src/components/kanban/
├── KanbanBoard.js          # Board principal (200 linhas)
├── KanbanColumn.js         # Coluna individual (150 linhas)  
├── TaskCard.js             # Card de tarefa (250 linhas)
├── TaskModal.js            # Modal de edição (300 linhas)
├── FilterBar.js            # Barra de filtros (200 linhas)
├── CompactTaskCard.js      # Visão compacta (150 linhas)
└── index.js                # Exports centralizados
```

**🎯 KanbanBoard.js** (Componente principal)
```javascript
// src/components/kanban/KanbanBoard.js
import React from 'react';
import { Grid } from '@mui/material';
import { useTaskFilters } from '../../hooks/useTaskFilters';
import { useTaskOperations } from '../../hooks/useTaskOperations';
import KanbanColumn from './KanbanColumn';
import FilterBar from './FilterBar';

const columns = [
  { id: 'Backlog', title: 'Backlog', color: '#e3f2fd' },
  { id: 'Priorizado', title: 'Priorizado', color: '#fff3e0' },
  { id: 'Doing', title: 'Doing', color: '#e8f5e8' },
  { id: 'Done', title: 'Done', color: '#f3e5f5' }
];

const KanbanBoard = () => {
  const { filteredTasks } = useTaskFilters();
  const { editTask } = useTaskOperations();

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await editTask(taskId, { status: newStatus });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const groupTasksByEpic = (tasks) => {
    return tasks.reduce((groups, task) => {
      const epic = task.epico || 'Sem Épico';
      if (!groups[epic]) groups[epic] = [];
      groups[epic].push(task);
      return groups;
    }, {});
  };

  return (
    <>
      <FilterBar />
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {columns.map(column => {
          const columnTasks = filteredTasks.filter(task => task.status === column.id);
          const groupedTasks = groupTasksByEpic(columnTasks);
          
          return (
            <Grid item xs={12} md={3} key={column.id}>
              <KanbanColumn
                column={column}
                groupedTasks={groupedTasks}
                onStatusChange={handleStatusChange}
              />
            </Grid>
          );
        })}
      </Grid>
    </>
  );
};

export default KanbanBoard;
```

**🎯 KanbanColumn.js** (Coluna individual)
```javascript
// src/components/kanban/KanbanColumn.js
import React from 'react';
import { Paper, Typography, Box, Divider } from '@mui/material';
import TaskCard from './TaskCard';

const KanbanColumn = ({ column, groupedTasks, onStatusChange }) => {
  const totalTasks = Object.values(groupedTasks).flat().length;

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        minHeight: '70vh',
        backgroundColor: column.color,
        borderRadius: 2
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
        {column.title} ({totalTasks})
      </Typography>
      
      <Divider sx={{ mb: 2 }} />
      
      {Object.entries(groupedTasks).map(([epic, tasks]) => (
        <EpicGroup 
          key={epic}
          epic={epic}
          tasks={tasks}
          onStatusChange={onStatusChange}
        />
      ))}
    </Paper>
  );
};

const EpicGroup = ({ epic, tasks, onStatusChange }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography 
        variant="subtitle2" 
        sx={{ 
          fontWeight: 'bold', 
          color: 'text.secondary',
          mb: 1,
          textTransform: 'uppercase'
        }}
      >
        {epic} ({tasks.length})
      </Typography>
      
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onStatusChange={onStatusChange}
        />
      ))}
    </Box>
  );
};

export default KanbanColumn;
```

#### **DIA 13-14: TaskCard e Modal**

**🎯 TaskCard.js** (Card de tarefa)
```javascript
// src/components/kanban/TaskCard.js
import React, { useState } from 'react';
import { 
  Card, CardContent, Typography, Chip, Avatar, 
  IconButton, Box, Tooltip 
} from '@mui/material';
import { 
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { useUIContext } from '../../contexts/UIContext';
import TaskModal from './TaskModal';
import CompactTaskCard from './CompactTaskCard';

const TaskCard = ({ task, onStatusChange }) => {
  const { isCompactView } = useUIContext();
  const [modalOpen, setModalOpen] = useState(false);

  if (isCompactView) {
    return (
      <CompactTaskCard 
        task={task}
        onStatusChange={onStatusChange}
        onCardClick={() => setModalOpen(true)}
      />
    );
  }

  const handleCardClick = () => {
    setModalOpen(true);
  };

  const handleStatusChange = (newStatus) => {
    onStatusChange(task.id, newStatus);
  };

  return (
    <>
      <Card 
        sx={{ 
          mb: 2, 
          cursor: 'pointer',
          '&:hover': { elevation: 4 },
          transition: 'all 0.2s ease-in-out'
        }}
        onClick={handleCardClick}
      >
        <CardContent sx={{ p: 2 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              #{task.originalId}
            </Typography>
            <Chip 
              label={task.prioridade} 
              size="small"
              color={getPriorityColor(task.prioridade)}
            />
          </Box>

          {/* Title */}
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {task.atividade}
          </Typography>

          {/* Details */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption">
              {task.estimativa}h
            </Typography>
          </Box>

          {/* Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
              {getInitials(task.desenvolvedor)}
            </Avatar>
            
            <Box>
              <NavigationButtons 
                task={task}
                onStatusChange={handleStatusChange}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      <TaskModal
        task={task}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(updates) => {
          onStatusChange(task.id, updates);
          setModalOpen(false);
        }}
      />
    </>
  );
};

const NavigationButtons = ({ task, onStatusChange }) => {
  const canMoveBack = task.status !== 'Backlog';
  const canMoveForward = task.status !== 'Done';

  const getNextStatus = (currentStatus) => {
    const sequence = ['Backlog', 'Priorizado', 'Doing', 'Done'];
    const currentIndex = sequence.indexOf(currentStatus);
    return sequence[currentIndex + 1];
  };

  const getPrevStatus = (currentStatus) => {
    const sequence = ['Backlog', 'Priorizado', 'Doing', 'Done'];
    const currentIndex = sequence.indexOf(currentStatus);
    return sequence[currentIndex - 1];
  };

  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      {canMoveBack && (
        <Tooltip title="Mover para trás">
          <IconButton 
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(getPrevStatus(task.status));
            }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      
      {canMoveForward && (
        <Tooltip title="Mover para frente">
          <IconButton 
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(getNextStatus(task.status));
            }}
          >
            <ArrowForwardIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

// Helper functions
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'Crítica': return 'error';
    case 'Alta': return 'warning';
    case 'Média': return 'info';
    case 'Baixa': return 'success';
    default: return 'default';
  }
};

const getInitials = (name) => {
  return name?.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2) || '';
};

export default TaskCard;
```

### **SEMANA 4: Finalização Kanban**

#### **DIA 15-17: FilterBar e CompactTaskCard**

**🎯 FilterBar.js** (Barra de filtros)
```javascript
// src/components/kanban/FilterBar.js
import React from 'react';
import { 
  Box, TextField, MenuItem, IconButton, Tooltip, 
  Button, Grid, Collapse, Typography
} from '@mui/material';
import { 
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ViewCompact as ViewCompactIcon,
  ViewList as ViewListIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useFilterContext } from '../../contexts/FilterContext';
import { useUIContext } from '../../contexts/UIContext';
import { useTaskFilters } from '../../hooks/useTaskFilters';

const FilterBar = () => {
  const { filters, updateFilter, clearAllFilters } = useFilterContext();
  const { isCompactView, toggleCompactView } = useUIContext();
  const { filterStats } = useTaskFilters();
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  // Get unique values for dropdowns
  const uniqueValues = React.useMemo(() => ({
    sprints: [...new Set(filterStats.allTasks?.map(t => t.sprint).filter(Boolean))],
    developers: [...new Set(filterStats.allTasks?.map(t => t.desenvolvedor).filter(Boolean))],
    epics: [...new Set(filterStats.allTasks?.map(t => t.epico).filter(Boolean))]
  }), [filterStats.allTasks]);

  return (
    <Box sx={{ mb: 2 }}>
      {/* Quick Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Kanban Board ({filterStats.filtered} de {filterStats.total} tarefas)
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {/* TODO: Open new task modal */}}
            sx={{ minWidth: 140 }}
          >
            Nova Tarefa
          </Button>
          
          <Tooltip title={isCompactView ? "Visão Expandida" : "Visão Compacta"}>
            <IconButton onClick={toggleCompactView} color="primary">
              {isCompactView ? <ViewListIcon /> : <ViewCompactIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Filtros Avançados">
            <IconButton 
              onClick={() => setShowAdvanced(!showAdvanced)}
              color={showAdvanced ? "primary" : "default"}
            >
              <FilterIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Basic Filters */}
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            label="Sprint"
            select
            size="small"
            fullWidth
            value={filters.sprint}
            onChange={(e) => updateFilter('sprint', e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            {uniqueValues.sprints.map(sprint => (
              <MenuItem key={sprint} value={sprint}>{sprint}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <TextField
            label="Desenvolvedor"
            select
            size="small"
            fullWidth
            value={filters.desenvolvedor}
            onChange={(e) => updateFilter('desenvolvedor', e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            {uniqueValues.developers.map(dev => (
              <MenuItem key={dev} value={dev}>{dev}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <TextField
            label="Status"
            select
            size="small"
            fullWidth
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="Backlog">Backlog</MenuItem>
            <MenuItem value="Priorizado">Priorizado</MenuItem>
            <MenuItem value="Doing">Doing</MenuItem>
            <MenuItem value="Done">Done</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Buscar em todos os campos"
            size="small"
            fullWidth
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Digite para buscar..."
          />
        </Grid>

        <Grid item xs={12} sm={6} md={1}>
          <TextField
            label="ID"
            size="small"
            fullWidth
            value={filters.searchId}
            onChange={(e) => updateFilter('searchId', e.target.value)}
            placeholder="#123"
            sx={{ minWidth: 60 }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Button
            variant="outlined"
            onClick={clearAllFilters}
            startIcon={<ClearIcon />}
            size="small"
            fullWidth
          >
            Limpar Filtros
          </Button>
        </Grid>
      </Grid>

      {/* Advanced Filters */}
      <Collapse in={showAdvanced}>
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom>Filtros Avançados</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Prioridade"
                select
                size="small"
                fullWidth
                value={filters.prioridade}
                onChange={(e) => updateFilter('prioridade', e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="Crítica">Crítica</MenuItem>
                <MenuItem value="Alta">Alta</MenuItem>
                <MenuItem value="Média">Média</MenuItem>
                <MenuItem value="Baixa">Baixa</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Épico"
                select
                size="small"
                fullWidth
                value={filters.epico}
                onChange={(e) => updateFilter('epico', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {uniqueValues.epics.map(epic => (
                  <MenuItem key={epic} value={epic}>{epic}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Box>
  );
};

export default FilterBar;
```

#### **DIA 18-20: Integration Testing**

**🎯 index.js** (Exports centralizados)
```javascript
// src/components/kanban/index.js
export { default as KanbanBoard } from './KanbanBoard';
export { default as KanbanColumn } from './KanbanColumn';
export { default as TaskCard } from './TaskCard';
export { default as TaskModal } from './TaskModal';
export { default as FilterBar } from './FilterBar';
export { default as CompactTaskCard } from './CompactTaskCard';
```

**🎯 Atualizar App.js** (Usar novo KanbanBoard)
```javascript
// src/App.js - Atualizar imports
import { KanbanBoard } from './components/kanban';

// Em MainContent.js:
<TabPanel value={activeTab} index={0}>
  <KanbanBoard />
</TabPanel>
```

---

## 🔥 **FASE 3: QUEBRAR TABLEVIEW (Semanas 5-6)**
*Transformar monólito de 1.891 linhas em 5 componentes especializados*

### **SEMANA 5: Componentização TableView**

#### **DIA 21-22: Estrutura Base**

**🎯 Nova Estrutura TableView**
```
src/components/table/
├── TableView.js            # Component wrapper (100 linhas)
├── BurndownTab.js          # Aba burndown chart (400 linhas)
├── StatisticsTab.js        # Aba estatísticas (300 linhas)
├── PredictiveTab.js        # Aba análise preditiva (200 linhas)
├── TaskTable.js            # Tabela de tarefas (500 linhas)
├── TeamConfig.js           # Configuração da equipe (150 linhas)
└── index.js                # Exports
```

### **SEMANA 6: Hooks Especializados**

#### **DIA 26-30: Custom Hooks para TableView**

**🎯 useBurndownChart.js**
```javascript
// src/hooks/useBurndownChart.js
import { useMemo } from 'react';
import { useTaskContext } from '../contexts/TaskContext';

export const useBurndownChart = (selectedSprint, teamConfig) => {
  const { tasks } = useTaskContext();

  const chartData = useMemo(() => {
    const sprintTasks = tasks.filter(task => task.sprint === selectedSprint);
    
    // Cálculo de burndown
    const calculateBurndown = () => {
      // Lógica existente mais limpa
      const days = Array.from({ length: 11 }, (_, i) => `Dia ${i}`);
      const ideal = calculateIdealLine(sprintTasks);
      const real = calculateRealLine(sprintTasks);
      const teamPrediction = calculateTeamPrediction(sprintTasks, teamConfig);

      return {
        labels: days,
        datasets: [
          {
            label: 'Linha Ideal',
            data: ideal,
            borderColor: '#2196f3',
            backgroundColor: 'transparent'
          },
          {
            label: 'Linha Real',
            data: real,
            borderColor: '#f44336',
            backgroundColor: 'transparent'
          },
          {
            label: 'Previsão Equipe',
            data: teamPrediction,
            borderColor: '#4caf50',
            backgroundColor: 'transparent',
            borderDash: [5, 5]
          }
        ]
      };
    };

    return calculateBurndown();
  }, [tasks, selectedSprint, teamConfig]);

  return { chartData };
};
```

---

## 🔥 **FASE 4: INTEGRAÇÃO SUPABASE (Semana 7)**
*Adicionar persistência distribuída à arquitetura modular*

### **DIA 31-35: Supabase Service**

**🎯 SupabaseService.js** (Implementa DataService)
```javascript
// src/services/SupabaseService.js
import { createClient } from '@supabase/supabase-js';
import { DataService } from './DataService';

export class SupabaseService extends DataService {
  constructor() {
    super();
    this.supabase = createClient(
      process.env.REACT_APP_SUPABASE_URL,
      process.env.REACT_APP_SUPABASE_ANON_KEY
    );
    this.tableName = 'tasks';
  }

  async getTasks() {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createTask(task) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert([task])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateTask(taskId, updates) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteTask(taskId) {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', taskId);
    
    if (error) throw error;
    return true;
  }

  async subscribe(callback) {
    const subscription = this.supabase
      .channel('tasks_channel')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: this.tableName },
          (payload) => {
            callback(payload);
          }
      )
      .subscribe();

    return () => {
      this.supabase.removeChannel(subscription);
    };
  }

  async syncTasks() {
    return await this.getTasks();
  }
}
```

**🎯 useDataService.js** (Hook para escolher persistência)
```javascript
// src/hooks/useDataService.js
import { useMemo } from 'react';
import { LocalStorageService } from '../services/LocalStorageService';
import { SupabaseService } from '../services/SupabaseService';

export const useDataService = () => {
  const dataService = useMemo(() => {
    // Decidir qual service usar baseado em config/env
    const useSupabase = process.env.REACT_APP_USE_SUPABASE === 'true';
    
    return useSupabase 
      ? new SupabaseService()
      : new LocalStorageService();
  }, []);

  return dataService;
};
```

---

## 📋 **CRONOGRAMA DETALHADO COM CHECKPOINTS**

### **Checkpoints Obrigatórios**

| Checkpoint | Data | Critério de Sucesso | Ação se Falhar |
|------------|------|-------------------|-----------------|
| **CP1** | Fim Semana 1 | Context API funcional + Service layer | Revisar implementação, +2 dias |
| **CP2** | Fim Semana 2 | Hooks essenciais + App.js migrado | Simplificar hooks, +1 dia |
| **CP3** | Fim Semana 3 | KanbanBoard componentizado | Manter funcionalidade mínima |
| **CP4** | Fim Semana 4 | SimpleKanban 100% refatorado | Aceitar bugs menores |
| **CP5** | Fim Semana 5 | TableView componentizado | Focar em funcionalidade core |
| **CP6** | Fim Semana 6 | Refatoração completa | Bug fixing final |
| **CP7** | Fim Semana 7 | Supabase integrado | Rollback para localStorage |

### **Critérios de Qualidade**

#### **Por Fase:**
- **FASE 1**: Todos os contexts criados e funcionais
- **FASE 2**: Nenhum componente > 300 linhas
- **FASE 3**: Props drilling eliminado 100%
- **FASE 4**: Switch localStorage ↔ Supabase transparente

#### **Métricas de Sucesso:**
- ✅ **Complexidade**: Componente máximo 300 linhas
- ✅ **Manutenibilidade**: Mudança isolada por componente
- ✅ **Performance**: Não regredir tempo de carregamento
- ✅ **Funcionalidade**: Zero breaking changes para usuário

---

## 🚨 **PLANOS DE CONTINGÊNCIA**

### **Se Semana 1-2 Atrasar (Context API)**
- **Plano B**: Implementar apenas TaskContext + UIContext
- **Plano C**: Manter props drilling temporariamente, focar na quebra de componentes
- **Impacto**: +1 semana no cronograma

### **Se Semana 3-4 Atrasar (SimpleKanban)**
- **Plano B**: Quebrar apenas em 3 componentes (Board, Card, Modal)
- **Plano C**: Manter SimpleKanban original, focar em TableView
- **Impacto**: Supabase funciona mas com componente grande

### **Se Semana 5-6 Atrasar (TableView)**
- **Plano B**: Quebrar apenas em 2 componentes (Table + Chart)
- **Plano C**: Manter TableView original
- **Impacto**: Arquitetura mista (bom Kanban, TableView monolítico)

### **Se Semana 7 Atrasar (Supabase)**
- **Plano B**: Implementar apenas CRUD básico
- **Plano C**: Manter localStorage, preparar estrutura para Supabase
- **Impacto**: Arquitetura pronta, Supabase em próxima iteração

---

## 🎯 **COMANDOS DE EXECUÇÃO**

### **Setup Inicial**
```bash
# 1. Backup e Branch
git checkout -b refactor/modular-architecture
git push -u origin refactor/modular-architecture

# 2. Estrutura de Pastas
mkdir -p src/{contexts,hooks,services,types}
mkdir -p src/components/{kanban,table,layout}

# 3. Instalar Dependências Futuras
npm install @supabase/supabase-js
npm install --save-dev @types/react @types/react-dom
```

### **Comandos de Teste por Fase**
```bash
# Testar FASE 1 (Context API)
npm start
# Verificar: App carrega sem errors no console

# Testar FASE 2 (Kanban)
# Verificar: Kanban funciona identicamente ao anterior

# Testar FASE 3 (TableView)  
# Verificar: Todas as abas funcionam

# Testar FASE 4 (Supabase)
# Verificar: Dados persistem no Supabase
```

### **Rollback Commands**
```bash
# Se algo der errado, rollback para versão estável
git checkout main
git branch -D refactor/modular-architecture

# Ou rollback parcial
git reset --hard HEAD~X  # X = número de commits para voltar
```

---

## 🏆 **RESULTADO ESPERADO**

### **Antes da Refatoração**
```
❌ 2 componentes monolíticos (3.617 linhas)
❌ Props drilling em 15+ níveis
❌ Estado duplicado em múltiplos lugares
❌ Impossível adicionar Supabase de forma limpa
```

### **Depois da Refatoração**
```
✅ 15+ componentes modulares (< 300 linhas cada)
✅ Estado global gerenciado por Context API
✅ Lógica reutilizável em custom hooks
✅ Service layer preparado para Supabase
✅ Arquitetura escalável e manutenível
```

### **Benefícios Imediatos**
- 🚀 **Desenvolvimento**: Mudanças isoladas e rápidas
- 🐛 **Debugging**: Bugs localizados em componentes pequenos
- 👥 **Onboarding**: Código legível e bem organizado
- 🧪 **Testing**: Componentes testáveis individualmente
- ⚡ **Performance**: Re-renders otimizados

### **Preparação para Futuro**
- 🔄 **Supabase**: Integração transparente
- 🌍 **Real-time**: WebSocket ready
- 📱 **Mobile**: Componentes reutilizáveis
- 🔧 **TypeScript**: Migração facilitada

---

**Este plano transforma o TaskTracker de uma aplicação monolítica em um sistema modular preparado para Supabase em apenas 7 semanas, com checkpoints semanais e planos de contingência para garantir o sucesso da refatoração.**

---

*Documento criado em 27/07/2025 - TaskTracker Refactoring Plan v1.0*  
*Próxima revisão: Início da FASE 1*