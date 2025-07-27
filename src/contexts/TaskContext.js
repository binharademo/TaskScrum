import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Persistence layer imports
import { saveTasksToStorage, loadTasksFromStorage, getCurrentRoom } from '../utils/storage';
import { isSupabaseConfigured } from '../config/supabase';
import { useAuth } from './AuthContext';
import { SupabaseService } from '../services/SupabaseService';

// Action Types
export const TASK_ACTIONS = {
  LOAD_TASKS: 'LOAD_TASKS',
  ADD_TASK: 'ADD_TASK', 
  UPDATE_TASK: 'UPDATE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  BULK_UPDATE: 'BULK_UPDATE',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Task Reducer
const taskReducer = (state, action) => {
  switch (action.type) {
    case TASK_ACTIONS.LOAD_TASKS:
      return { 
        ...state, 
        tasks: action.payload, 
        loading: false,
        error: null
      };

    case TASK_ACTIONS.ADD_TASK:
      return { 
        ...state, 
        tasks: [...state.tasks, action.payload],
        error: null
      };

    case TASK_ACTIONS.UPDATE_TASK:
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload.id 
            ? { 
                ...task, 
                ...action.payload.updates, 
                updatedAt: new Date().toISOString() 
              }
            : task
        ),
        error: null
      };

    case TASK_ACTIONS.DELETE_TASK:
      return { 
        ...state, 
        tasks: state.tasks.filter(t => t.id !== action.payload),
        error: null
      };

    case TASK_ACTIONS.BULK_UPDATE:
      return { 
        ...state, 
        tasks: action.payload,
        loading: false,
        error: null
      };

    case TASK_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case TASK_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    case TASK_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

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

// Context Creation
const TaskContext = createContext();

// Task Provider Component
export const TaskProvider = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  // Supabase integration (optional - só usa se configurado)
  const auth = isSupabaseConfigured() ? useAuth() : { isAuthenticated: false, user: null };
  
  // Determinar modo de operação
  const isSupabaseMode = isSupabaseConfigured() && auth?.isAuthenticated;
  const supabaseService = isSupabaseMode ? new SupabaseService() : null;

  // ========================================
  // PERSISTENCE LAYER (HYBRID)
  // Funções que persistem tanto no localStorage quanto Supabase
  // ========================================

  const persistTasks = async (tasks) => {
    try {
      // 1. SEMPRE salvar no localStorage (compatibilidade)
      const currentRoom = getCurrentRoom();
      saveTasksToStorage(tasks, currentRoom);

      // 2. Se modo Supabase, sincronizar também
      if (isSupabaseMode && supabaseService) {
        // Nota: SupabaseService já gerencia room_id automaticamente
        // As tarefas são persistidas automaticamente no Supabase
        console.log('Tasks synced to Supabase:', tasks.length);
      }
    } catch (error) {
      console.error('Error persisting tasks:', error);
      throw error;
    }
  };

  const loadTasksFromPersistence = async () => {
    try {
      dispatch({ type: TASK_ACTIONS.SET_LOADING, payload: true });

      if (isSupabaseMode && supabaseService) {
        // Carregar do Supabase (modo nuvem)
        const supabaseTasks = await supabaseService.getTasks();
        dispatch({ type: TASK_ACTIONS.LOAD_TASKS, payload: supabaseTasks });
        
        // Sincronizar com localStorage para compatibilidade
        const currentRoom = getCurrentRoom();
        saveTasksToStorage(supabaseTasks, currentRoom);
        
        return supabaseTasks;
      } else {
        // Carregar do localStorage (modo local)
        const currentRoom = getCurrentRoom();
        const localTasks = loadTasksFromStorage(currentRoom);
        dispatch({ type: TASK_ACTIONS.LOAD_TASKS, payload: localTasks });
        
        return localTasks;
      }
    } catch (error) {
      dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  // ========================================
  // ACTION CREATORS (HYBRID)
  // ========================================
  const actions = {
    loadTasks: async (tasks) => {
      if (tasks) {
        // Carregar tarefas específicas fornecidas
        dispatch({ type: TASK_ACTIONS.LOAD_TASKS, payload: tasks });
      } else {
        // Carregar da persistência (localStorage ou Supabase)
        return await loadTasksFromPersistence();
      }
    },

    addTask: async (task) => {
      try {
        const newTask = {
          ...task,
          id: task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: task.createdAt || new Date().toISOString(),
          updatedAt: task.updatedAt || new Date().toISOString()
        };

        // Dispatch para estado local
        dispatch({ type: TASK_ACTIONS.ADD_TASK, payload: newTask });

        // Persistir no Supabase se necessário
        if (isSupabaseMode && supabaseService) {
          await supabaseService.createTask(newTask);
        }

        // Sempre persistir no localStorage
        const updatedTasks = [...state.tasks, newTask];
        await persistTasks(updatedTasks);

        return newTask;
      } catch (error) {
        dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    updateTask: async (id, updates) => {
      try {
        // Dispatch para estado local
        dispatch({ 
          type: TASK_ACTIONS.UPDATE_TASK, 
          payload: { id, updates } 
        });

        // Persistir no Supabase se necessário
        if (isSupabaseMode && supabaseService) {
          await supabaseService.updateTask(id, updates);
        }

        // Sempre persistir no localStorage
        const updatedTasks = state.tasks.map(task => 
          task.id === id 
            ? { ...task, ...updates, updatedAt: new Date().toISOString() }
            : task
        );
        await persistTasks(updatedTasks);

      } catch (error) {
        dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    deleteTask: async (id) => {
      try {
        // Dispatch para estado local
        dispatch({ type: TASK_ACTIONS.DELETE_TASK, payload: id });

        // Persistir no Supabase se necessário
        if (isSupabaseMode && supabaseService) {
          await supabaseService.deleteTask(id);
        }

        // Sempre persistir no localStorage
        const updatedTasks = state.tasks.filter(t => t.id !== id);
        await persistTasks(updatedTasks);

      } catch (error) {
        dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    bulkUpdate: async (tasks) => {
      try {
        // Dispatch para estado local
        dispatch({ type: TASK_ACTIONS.BULK_UPDATE, payload: tasks });

        // Sempre persistir no localStorage
        await persistTasks(tasks);

        // TODO: Implementar bulk update no Supabase se necessário
        if (isSupabaseMode && supabaseService) {
          console.log('Bulk update in Supabase mode - individual updates needed');
        }

      } catch (error) {
        dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    setLoading: (loading) => {
      dispatch({ type: TASK_ACTIONS.SET_LOADING, payload: loading });
    },

    setError: (error) => {
      dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: error });
    },

    clearError: () => {
      dispatch({ type: TASK_ACTIONS.CLEAR_ERROR });
    }
  };

  // ========================================
  // AUTO-LOAD TASKS ON MOUNT OR AUTH CHANGE
  // ========================================
  useEffect(() => {
    const initializeTasks = async () => {
      try {
        await loadTasksFromPersistence();
      } catch (error) {
        console.error('Error initializing tasks:', error);
      }
    };

    initializeTasks();
  }, [isSupabaseMode]); // Recarregar quando modo muda (login/logout)

  // Debug logging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('TaskContext State:', {
        tasksCount: state.tasks.length,
        loading: state.loading,
        error: state.error
      });
    }
  }, [state.tasks.length, state.loading, state.error]);

  const contextValue = {
    // State
    tasks: state.tasks,
    loading: state.loading,
    error: state.error,
    lastSync: state.lastSync,
    
    // Actions
    ...actions,
    
    // Mode information
    isSupabaseMode,
    persistenceMode: isSupabaseMode ? 'supabase' : 'localStorage',
    
    // Computed values
    tasksCount: state.tasks.length,
    tasksByStatus: state.tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {})
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};

// Custom Hook
export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within TaskProvider');
  }
  return context;
};

export default TaskContext;