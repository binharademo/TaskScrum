import React, { createContext, useContext, useReducer, useEffect } from 'react';

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

  // Action Creators
  const actions = {
    loadTasks: (tasks) => {
      dispatch({ type: TASK_ACTIONS.LOAD_TASKS, payload: tasks });
    },

    addTask: (task) => {
      const newTask = {
        ...task,
        id: task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: task.createdAt || new Date().toISOString(),
        updatedAt: task.updatedAt || new Date().toISOString()
      };
      dispatch({ type: TASK_ACTIONS.ADD_TASK, payload: newTask });
      return newTask;
    },

    updateTask: (id, updates) => {
      dispatch({ 
        type: TASK_ACTIONS.UPDATE_TASK, 
        payload: { id, updates } 
      });
    },

    deleteTask: (id) => {
      dispatch({ type: TASK_ACTIONS.DELETE_TASK, payload: id });
    },

    bulkUpdate: (tasks) => {
      dispatch({ type: TASK_ACTIONS.BULK_UPDATE, payload: tasks });
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