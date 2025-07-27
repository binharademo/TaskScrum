import React, { createContext, useContext, useReducer, useEffect } from 'react';

// UI Action Types
export const UI_ACTIONS = {
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  SET_MODAL_STATE: 'SET_MODAL_STATE',
  CLOSE_ALL_MODALS: 'CLOSE_ALL_MODALS',
  SET_LOADING: 'SET_LOADING',
  SET_NOTIFICATION: 'SET_NOTIFICATION',
  CLEAR_NOTIFICATION: 'CLEAR_NOTIFICATION',
  SET_SIDEBAR_OPEN: 'SET_SIDEBAR_OPEN',
  SET_COMPACT_VIEW: 'SET_COMPACT_VIEW',
  SET_GROUP_BY_EPIC: 'SET_GROUP_BY_EPIC',
  SET_WIP_CONFIG_OPEN: 'SET_WIP_CONFIG_OPEN',
  TOGGLE_DEBUG_MODE: 'TOGGLE_DEBUG_MODE',
  SET_THEME: 'SET_THEME'
};

// Modal types
export const MODAL_TYPES = {
  TASK_DETAILS: 'taskDetails',
  NEW_TASK: 'newTask',
  TIME_VALIDATION: 'timeValidation',
  WIP_CONFIG: 'wipConfig',
  BULK_EDIT: 'bulkEdit',
  EXPORT_DATA: 'exportData',
  IMPORT_DATA: 'importData',
  PROJECT_SETTINGS: 'projectSettings'
};

// Tab indices
export const TAB_INDICES = {
  KANBAN: 0,
  BURNDOWN: 1,
  WIP: 2,
  PREDICTIVE_ANALYSIS: 3,
  SHARING: 4
};

// Default UI state
const defaultUIState = {
  // Navigation
  activeTab: TAB_INDICES.KANBAN,
  previousTab: null,
  
  // Modals
  activeModal: null,
  modalData: null,
  modals: {
    [MODAL_TYPES.TASK_DETAILS]: { open: false, data: null },
    [MODAL_TYPES.NEW_TASK]: { open: false, data: null },
    [MODAL_TYPES.TIME_VALIDATION]: { open: false, data: null },
    [MODAL_TYPES.WIP_CONFIG]: { open: false, data: null },
    [MODAL_TYPES.BULK_EDIT]: { open: false, data: null },
    [MODAL_TYPES.EXPORT_DATA]: { open: false, data: null },
    [MODAL_TYPES.IMPORT_DATA]: { open: false, data: null },
    [MODAL_TYPES.PROJECT_SETTINGS]: { open: false, data: null }
  },
  
  // Loading states
  loading: {
    global: false,
    tasks: false,
    export: false,
    import: false,
    sync: false
  },
  
  // Notifications
  notification: {
    open: false,
    message: '',
    severity: 'info', // 'success', 'error', 'warning', 'info'
    autoHide: true,
    duration: 4000
  },
  
  // Layout preferences
  sidebarOpen: false,
  compactView: false,
  groupByEpic: true,
  
  // WIP Configuration
  wipConfigOpen: false,
  
  // Debug and development
  debugMode: process.env.NODE_ENV === 'development',
  
  // Theme
  theme: 'light' // 'light', 'dark', 'auto'
};

// UI Reducer
const uiReducer = (state, action) => {
  switch (action.type) {
    case UI_ACTIONS.SET_ACTIVE_TAB:
      return {
        ...state,
        previousTab: state.activeTab,
        activeTab: action.tabIndex
      };

    case UI_ACTIONS.SET_MODAL_STATE:
      return {
        ...state,
        activeModal: action.open ? action.modalType : null,
        modalData: action.open ? action.data : null,
        modals: {
          ...state.modals,
          [action.modalType]: {
            open: action.open,
            data: action.data || null
          }
        }
      };

    case UI_ACTIONS.CLOSE_ALL_MODALS:
      const closedModals = {};
      Object.keys(state.modals).forEach(modalType => {
        closedModals[modalType] = { open: false, data: null };
      });
      
      return {
        ...state,
        activeModal: null,
        modalData: null,
        modals: closedModals
      };

    case UI_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.loadingType]: action.isLoading
        }
      };

    case UI_ACTIONS.SET_NOTIFICATION:
      return {
        ...state,
        notification: {
          open: true,
          message: action.message,
          severity: action.severity || 'info',
          autoHide: action.autoHide !== undefined ? action.autoHide : true,
          duration: action.duration || 4000
        }
      };

    case UI_ACTIONS.CLEAR_NOTIFICATION:
      return {
        ...state,
        notification: {
          ...state.notification,
          open: false
        }
      };

    case UI_ACTIONS.SET_SIDEBAR_OPEN:
      return {
        ...state,
        sidebarOpen: action.open
      };

    case UI_ACTIONS.SET_COMPACT_VIEW:
      return {
        ...state,
        compactView: action.compact
      };

    case UI_ACTIONS.SET_GROUP_BY_EPIC:
      return {
        ...state,
        groupByEpic: action.groupByEpic
      };

    case UI_ACTIONS.SET_WIP_CONFIG_OPEN:
      return {
        ...state,
        wipConfigOpen: action.open
      };

    case UI_ACTIONS.TOGGLE_DEBUG_MODE:
      return {
        ...state,
        debugMode: !state.debugMode
      };

    case UI_ACTIONS.SET_THEME:
      return {
        ...state,
        theme: action.theme
      };

    default:
      return state;
  }
};

// Context Creation
const UIContext = createContext();

// UI Provider Component
export const UIProvider = ({ children }) => {
  const [state, dispatch] = useReducer(uiReducer, defaultUIState);

  // Action Creators
  const actions = {
    setActiveTab: (tabIndex) => {
      dispatch({ 
        type: UI_ACTIONS.SET_ACTIVE_TAB, 
        tabIndex 
      });
    },

    openModal: (modalType, data = null) => {
      dispatch({ 
        type: UI_ACTIONS.SET_MODAL_STATE, 
        modalType, 
        open: true, 
        data 
      });
    },

    closeModal: (modalType) => {
      dispatch({ 
        type: UI_ACTIONS.SET_MODAL_STATE, 
        modalType, 
        open: false, 
        data: null 
      });
    },

    closeAllModals: () => {
      dispatch({ type: UI_ACTIONS.CLOSE_ALL_MODALS });
    },

    setLoading: (loadingType, isLoading) => {
      dispatch({ 
        type: UI_ACTIONS.SET_LOADING, 
        loadingType, 
        isLoading 
      });
    },

    showNotification: (message, severity = 'info', options = {}) => {
      dispatch({ 
        type: UI_ACTIONS.SET_NOTIFICATION, 
        message, 
        severity,
        autoHide: options.autoHide,
        duration: options.duration
      });
    },

    hideNotification: () => {
      dispatch({ type: UI_ACTIONS.CLEAR_NOTIFICATION });
    },

    setSidebarOpen: (open) => {
      dispatch({ 
        type: UI_ACTIONS.SET_SIDEBAR_OPEN, 
        open 
      });
    },

    toggleSidebar: () => {
      dispatch({ 
        type: UI_ACTIONS.SET_SIDEBAR_OPEN, 
        open: !state.sidebarOpen 
      });
    },

    setCompactView: (compact) => {
      dispatch({ 
        type: UI_ACTIONS.SET_COMPACT_VIEW, 
        compact 
      });
    },

    toggleCompactView: () => {
      dispatch({ 
        type: UI_ACTIONS.SET_COMPACT_VIEW, 
        compact: !state.compactView 
      });
    },

    setGroupByEpic: (groupByEpic) => {
      dispatch({ 
        type: UI_ACTIONS.SET_GROUP_BY_EPIC, 
        groupByEpic 
      });
    },

    toggleGroupByEpic: () => {
      dispatch({ 
        type: UI_ACTIONS.SET_GROUP_BY_EPIC, 
        groupByEpic: !state.groupByEpic 
      });
    },

    setWipConfigOpen: (open) => {
      dispatch({ 
        type: UI_ACTIONS.SET_WIP_CONFIG_OPEN, 
        open 
      });
    },

    toggleWipConfig: () => {
      dispatch({ 
        type: UI_ACTIONS.SET_WIP_CONFIG_OPEN, 
        open: !state.wipConfigOpen 
      });
    },

    toggleDebugMode: () => {
      dispatch({ type: UI_ACTIONS.TOGGLE_DEBUG_MODE });
    },

    setTheme: (theme) => {
      dispatch({ 
        type: UI_ACTIONS.SET_THEME, 
        theme 
      });
    }
  };

  // Auto-hide notification effect
  useEffect(() => {
    if (state.notification.open && state.notification.autoHide) {
      const timer = setTimeout(() => {
        dispatch({ type: UI_ACTIONS.CLEAR_NOTIFICATION });
      }, state.notification.duration);

      return () => clearTimeout(timer);
    }
  }, [state.notification.open, state.notification.autoHide, state.notification.duration]);

  // Save UI preferences to localStorage
  useEffect(() => {
    const preferences = {
      compactView: state.compactView,
      groupByEpic: state.groupByEpic,
      theme: state.theme,
      sidebarOpen: state.sidebarOpen
    };
    
    localStorage.setItem('tasktracker-ui-preferences', JSON.stringify(preferences));
  }, [state.compactView, state.groupByEpic, state.theme, state.sidebarOpen]);

  // Load UI preferences from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tasktracker-ui-preferences');
      if (saved) {
        const preferences = JSON.parse(saved);
        
        if (preferences.compactView !== undefined) {
          dispatch({ type: UI_ACTIONS.SET_COMPACT_VIEW, compact: preferences.compactView });
        }
        if (preferences.groupByEpic !== undefined) {
          dispatch({ type: UI_ACTIONS.SET_GROUP_BY_EPIC, groupByEpic: preferences.groupByEpic });
        }
        if (preferences.theme) {
          dispatch({ type: UI_ACTIONS.SET_THEME, theme: preferences.theme });
        }
        if (preferences.sidebarOpen !== undefined) {
          dispatch({ type: UI_ACTIONS.SET_SIDEBAR_OPEN, open: preferences.sidebarOpen });
        }
      }
    } catch (error) {
      console.warn('Failed to load UI preferences:', error);
    }
  }, []);

  // Debug logging in development
  useEffect(() => {
    if (state.debugMode) {
      console.log('UIContext State Update:', {
        activeTab: state.activeTab,
        activeModal: state.activeModal,
        loading: Object.entries(state.loading).filter(([_, isLoading]) => isLoading),
        notification: state.notification.open ? state.notification.message : null
      });
    }
  }, [state.activeTab, state.activeModal, state.loading, state.notification, state.debugMode]);

  const contextValue = {
    // UI State
    ui: state,
    
    // Actions
    ...actions,
    
    // Computed values
    isAnyModalOpen: state.activeModal !== null,
    isLoading: Object.values(state.loading).some(isLoading => isLoading),
    hasNotification: state.notification.open,
    
    // Helper functions
    isModalOpen: (modalType) => state.modals[modalType]?.open || false,
    getModalData: (modalType) => state.modals[modalType]?.data || null,
    isTabActive: (tabIndex) => state.activeTab === tabIndex
  };

  return (
    <UIContext.Provider value={contextValue}>
      {children}
    </UIContext.Provider>
  );
};

// Custom Hook
export const useUIContext = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUIContext must be used within UIProvider');
  }
  return context;
};

export default UIContext;