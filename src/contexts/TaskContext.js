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

  // Inicializar e configurar SupabaseService se ativo
  useEffect(() => {
    const initializeSupabase = async () => {
      if (isSupabaseMode && supabaseService) {
        try {
          console.log('🔧 TaskContext - Inicializando SupabaseService...');
          await supabaseService.initialize();
          
          // Configurar room_id baseado na sala atual
          const currentRoom = getCurrentRoom();
          if (currentRoom) {
            // Buscar sala por código para obter o ID
            const room = await supabaseService.findRoomByCode(currentRoom);
            if (room) {
              supabaseService.setCurrentRoom(room.id);
              console.log('✅ TaskContext - SupabaseService configurado para sala:', room.id);
            }
          }
        } catch (error) {
          console.error('❌ TaskContext - Erro ao inicializar SupabaseService:', error);
        }
      }
    };

    initializeSupabase();
  }, [isSupabaseMode, supabaseService]);

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
      console.log('📂 TaskContext.loadTasks - INICIANDO carregamento...');
      console.log('🔧 Modo Supabase ativo:', isSupabaseMode);
      console.log('🏠 Sala atual:', getCurrentRoom());
      
      dispatch({ type: TASK_ACTIONS.SET_LOADING, payload: true });

      if (isSupabaseMode && supabaseService) {
        try {
          console.log('☁️ TaskContext.loadTasks - Carregando do Supabase...');
          console.log('🎯 Room ID configurado:', supabaseService.currentRoomId);
          
          // Garantir que o service está inicializado
          if (!supabaseService.initialized) {
            console.log('⚡ TaskContext.loadTasks - Inicializando SupabaseService...');
            await supabaseService.initialize();
          }
          
          // Garantir que room_id está configurado
          if (!supabaseService.currentRoomId) {
            const currentRoom = getCurrentRoom();
            if (currentRoom) {
              const room = await supabaseService.findRoomByCode(currentRoom);
              if (room) {
                supabaseService.setCurrentRoom(room.id);
                console.log('🏠 TaskContext.loadTasks - Room ID configurado:', room.id);
              }
            }
          }

          // Carregar do Supabase (modo nuvem)
          const supabaseTasks = await supabaseService.getTasks();
          dispatch({ type: TASK_ACTIONS.LOAD_TASKS, payload: supabaseTasks });
          
          // Sincronizar com localStorage para compatibilidade
          const currentRoom = getCurrentRoom();
          saveTasksToStorage(supabaseTasks, currentRoom);
          
          console.log('✅ TaskContext.loadTasks - Carregadas do Supabase:', supabaseTasks.length, 'tarefas');
          return supabaseTasks;
        } catch (supabaseError) {
          console.error('❌ TaskContext.loadTasks - Erro no Supabase, fallback para localStorage:', supabaseError);
          
          // Fallback para localStorage em caso de erro
          const currentRoom = getCurrentRoom();
          const localTasks = loadTasksFromStorage(currentRoom);
          dispatch({ type: TASK_ACTIONS.LOAD_TASKS, payload: localTasks });
          
          console.log('⚡ TaskContext.loadTasks - Fallback localStorage:', localTasks.length, 'tarefas');
          return localTasks;
        }
      } else {
        // Carregar do localStorage (modo local)
        console.log('💾 TaskContext.loadTasks - Carregando do localStorage...');
        const currentRoom = getCurrentRoom();
        const localTasks = loadTasksFromStorage(currentRoom);
        dispatch({ type: TASK_ACTIONS.LOAD_TASKS, payload: localTasks });
        
        console.log('✅ TaskContext.loadTasks - Carregadas do localStorage:', localTasks.length, 'tarefas');
        return localTasks;
      }
    } catch (error) {
      console.error('💥 TaskContext.loadTasks - ERRO GERAL:', error);
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
        console.log('📝 TaskContext.addTask - INICIANDO:', task.atividade);
        console.log('🔧 Modo Supabase ativo:', isSupabaseMode);
        console.log('🏠 Sala atual:', getCurrentRoom());

        const newTask = {
          ...task,
          // Só gerar ID customizado se não estiver em modo Supabase
          id: isSupabaseMode ? undefined : (task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`),
          createdAt: task.createdAt || new Date().toISOString(),
          updatedAt: task.updatedAt || new Date().toISOString()
        };

        let finalTask = newTask;

        // Persistir no Supabase PRIMEIRO se necessário
        if (isSupabaseMode && supabaseService) {
          try {
            console.log('☁️ TaskContext.addTask - Salvando no Supabase...');
            console.log('🎯 Room ID configurado:', supabaseService.currentRoomId);
            
            // Garantir que o service está inicializado
            if (!supabaseService.initialized) {
              console.log('⚡ TaskContext.addTask - Inicializando SupabaseService...');
              await supabaseService.initialize();
            }
            
            // Garantir que room_id está configurado
            if (!supabaseService.currentRoomId) {
              const currentRoom = getCurrentRoom();
              if (currentRoom) {
                const room = await supabaseService.findRoomByCode(currentRoom);
                if (room) {
                  supabaseService.setCurrentRoom(room.id);
                  console.log('🏠 TaskContext.addTask - Room ID configurado:', room.id);
                }
              }
            }

            const createdTask = await supabaseService.createTask(newTask);
            finalTask = createdTask; // Use task criada no Supabase (com ID real)
            console.log('✅ TaskContext.addTask - Salva no Supabase:', createdTask.id);
          } catch (supabaseError) {
            console.error('❌ TaskContext.addTask - Erro no Supabase:', supabaseError);
            // Continuar com modo local em caso de erro
          }
        }

        // Dispatch para estado local
        dispatch({ type: TASK_ACTIONS.ADD_TASK, payload: finalTask });

        // Sempre persistir no localStorage
        const updatedTasks = [...state.tasks, finalTask];
        await persistTasks(updatedTasks);

        console.log('🎉 TaskContext.addTask - CONCLUÍDO:', finalTask.id);
        return finalTask;
      } catch (error) {
        console.error('💥 TaskContext.addTask - ERRO GERAL:', error);
        dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    updateTask: async (id, updates) => {
      try {
        console.log('🔄 TaskContext.updateTask - INICIANDO:', id, updates);
        console.log('🔧 Modo Supabase ativo:', isSupabaseMode);
        console.log('🏠 Sala atual:', getCurrentRoom());

        // Atualizar no Supabase PRIMEIRO se necessário
        if (isSupabaseMode && supabaseService) {
          try {
            console.log('☁️ TaskContext.updateTask - Salvando no Supabase...');
            console.log('🎯 Room ID configurado:', supabaseService.currentRoomId);
            
            // Garantir que o service está inicializado
            if (!supabaseService.initialized) {
              console.log('⚡ TaskContext.updateTask - Inicializando SupabaseService...');
              await supabaseService.initialize();
            }
            
            // Garantir que room_id está configurado
            if (!supabaseService.currentRoomId) {
              const currentRoom = getCurrentRoom();
              if (currentRoom) {
                const room = await supabaseService.findRoomByCode(currentRoom);
                if (room) {
                  supabaseService.setCurrentRoom(room.id);
                  console.log('🏠 TaskContext.updateTask - Room ID configurado:', room.id);
                }
              }
            }

            await supabaseService.updateTask(id, updates);
            console.log('✅ TaskContext.updateTask - Atualizada no Supabase');
          } catch (supabaseError) {
            console.error('❌ TaskContext.updateTask - Erro no Supabase:', supabaseError);
            // Continuar com modo local em caso de erro
          }
        }

        // Dispatch para estado local
        dispatch({ 
          type: TASK_ACTIONS.UPDATE_TASK, 
          payload: { id, updates } 
        });

        // Sempre persistir no localStorage
        const updatedTasks = state.tasks.map(task => 
          task.id === id 
            ? { ...task, ...updates, updatedAt: new Date().toISOString() }
            : task
        );
        await persistTasks(updatedTasks);

        console.log('🎉 TaskContext.updateTask - CONCLUÍDO:', id);
        return updatedTasks.find(task => task.id === id);
      } catch (error) {
        console.error('💥 TaskContext.updateTask - ERRO GERAL:', error);
        dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    deleteTask: async (id) => {
      try {
        console.log('🗑️ TaskContext.deleteTask - INICIANDO:', id);
        console.log('🔧 Modo Supabase ativo:', isSupabaseMode);
        console.log('🏠 Sala atual:', getCurrentRoom());

        // Deletar no Supabase PRIMEIRO se necessário
        if (isSupabaseMode && supabaseService) {
          try {
            console.log('☁️ TaskContext.deleteTask - Deletando no Supabase...');
            console.log('🎯 Room ID configurado:', supabaseService.currentRoomId);
            
            // Garantir que o service está inicializado
            if (!supabaseService.initialized) {
              console.log('⚡ TaskContext.deleteTask - Inicializando SupabaseService...');
              await supabaseService.initialize();
            }
            
            // Garantir que room_id está configurado
            if (!supabaseService.currentRoomId) {
              const currentRoom = getCurrentRoom();
              if (currentRoom) {
                const room = await supabaseService.findRoomByCode(currentRoom);
                if (room) {
                  supabaseService.setCurrentRoom(room.id);
                  console.log('🏠 TaskContext.deleteTask - Room ID configurado:', room.id);
                }
              }
            }

            await supabaseService.deleteTask(id);
            console.log('✅ TaskContext.deleteTask - Deletada no Supabase');
          } catch (supabaseError) {
            console.error('❌ TaskContext.deleteTask - Erro no Supabase:', supabaseError);
            // Continuar com modo local em caso de erro
          }
        }

        // Dispatch para estado local
        dispatch({ type: TASK_ACTIONS.DELETE_TASK, payload: id });

        // Sempre persistir no localStorage
        const updatedTasks = state.tasks.filter(t => t.id !== id);
        await persistTasks(updatedTasks);

        console.log('🎉 TaskContext.deleteTask - CONCLUÍDO:', id);
      } catch (error) {
        console.error('💥 TaskContext.deleteTask - ERRO GERAL:', error);
        dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    bulkUpdate: async (tasks) => {
      try {
        console.log('🔄 TaskContext.bulkUpdate - INICIANDO:', tasks.length, 'tarefas');
        console.log('🔧 Modo Supabase ativo:', isSupabaseMode);
        console.log('🏠 Sala atual:', getCurrentRoom());

        // Bulk update no Supabase se necessário
        if (isSupabaseMode && supabaseService) {
          try {
            console.log('☁️ TaskContext.bulkUpdate - Sincronizando com Supabase...');
            console.log('🎯 Room ID configurado:', supabaseService.currentRoomId);
            
            // Garantir que o service está inicializado
            if (!supabaseService.initialized) {
              console.log('⚡ TaskContext.bulkUpdate - Inicializando SupabaseService...');
              await supabaseService.initialize();
            }
            
            // Garantir que room_id está configurado
            if (!supabaseService.currentRoomId) {
              const currentRoom = getCurrentRoom();
              if (currentRoom) {
                const room = await supabaseService.findRoomByCode(currentRoom);
                if (room) {
                  supabaseService.setCurrentRoom(room.id);
                  console.log('🏠 TaskContext.bulkUpdate - Room ID configurado:', room.id);
                }
              }
            }

            // Implementar bulk update através de updates individuais
            console.log('🔄 TaskContext.bulkUpdate - Atualizando tarefas individualmente no Supabase...');
            const currentTasks = await supabaseService.getTasks();
            const currentTasksMap = new Map(currentTasks.map(t => [t.id, t]));
            
            for (const task of tasks) {
              const existingTask = currentTasksMap.get(task.id);
              if (existingTask) {
                // Tarefa existe - atualizar
                await supabaseService.updateTask(task.id, {
                  ...task,
                  updatedAt: new Date().toISOString()
                });
              } else {
                // Tarefa nova - criar
                await supabaseService.createTask(task);
              }
            }
            
            console.log('✅ TaskContext.bulkUpdate - Sincronizado com Supabase');
          } catch (supabaseError) {
            console.error('❌ TaskContext.bulkUpdate - Erro no Supabase:', supabaseError);
            // Continuar com modo local em caso de erro
          }
        }

        // Dispatch para estado local
        dispatch({ type: TASK_ACTIONS.BULK_UPDATE, payload: tasks });

        // Sempre persistir no localStorage
        await persistTasks(tasks);

        console.log('🎉 TaskContext.bulkUpdate - CONCLUÍDO:', tasks.length, 'tarefas');
      } catch (error) {
        console.error('💥 TaskContext.bulkUpdate - ERRO GERAL:', error);
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