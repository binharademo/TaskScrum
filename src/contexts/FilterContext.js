import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Filter Action Types
export const FILTER_ACTIONS = {
  SET_FILTER: 'SET_FILTER',
  SET_MULTIPLE_FILTERS: 'SET_MULTIPLE_FILTERS',
  CLEAR_FILTERS: 'CLEAR_FILTERS',
  CLEAR_SINGLE_FILTER: 'CLEAR_SINGLE_FILTER',
  SET_SEARCH: 'SET_SEARCH',
  SET_SEARCH_ID: 'SET_SEARCH_ID',
  SET_SORT: 'SET_SORT',
  RESET_TO_DEFAULTS: 'RESET_TO_DEFAULTS'
};

// Default filter state
const defaultFilters = {
  // Basic filters
  sprint: '',
  desenvolvedor: '',
  prioridade: '',
  status: '',  
  epico: '',
  
  // Search filters
  search: '',
  searchId: '',
  
  // Sort configuration
  sortBy: 'createdAt',
  sortDirection: 'desc',
  
  // View preferences
  compactView: false,
  groupByEpic: true,
  
  // WIP filters
  showWipViolations: false,
  hideCompletedTasks: false
};

// Filter Reducer
const filterReducer = (state, action) => {
  switch (action.type) {
    case FILTER_ACTIONS.SET_FILTER:
      return {
        ...state,
        [action.filterName]: action.value
      };

    case FILTER_ACTIONS.SET_MULTIPLE_FILTERS:
      return {
        ...state,
        ...action.filters
      };

    case FILTER_ACTIONS.CLEAR_FILTERS:
      return {
        ...defaultFilters,
        // Preserve view preferences
        compactView: state.compactView,
        groupByEpic: state.groupByEpic,
        sortBy: state.sortBy,
        sortDirection: state.sortDirection
      };

    case FILTER_ACTIONS.CLEAR_SINGLE_FILTER:
      return {
        ...state,
        [action.filterName]: defaultFilters[action.filterName] || ''
      };

    case FILTER_ACTIONS.SET_SEARCH:
      return {
        ...state,
        search: action.value,
        searchId: '' // Clear ID search when text search is used
      };

    case FILTER_ACTIONS.SET_SEARCH_ID:
      return {
        ...state,
        searchId: action.value,
        search: '' // Clear text search when ID search is used
      };

    case FILTER_ACTIONS.SET_SORT:
      return {
        ...state,
        sortBy: action.sortBy,
        sortDirection: action.sortDirection
      };

    case FILTER_ACTIONS.RESET_TO_DEFAULTS:
      return { ...defaultFilters };

    default:
      return state;
  }
};

// Context Creation
const FilterContext = createContext();

// Filter Provider Component
export const FilterProvider = ({ children }) => {
  const [state, dispatch] = useReducer(filterReducer, defaultFilters);

  // Action Creators
  const actions = {
    setFilter: (filterName, value) => {
      dispatch({ 
        type: FILTER_ACTIONS.SET_FILTER, 
        filterName, 
        value 
      });
    },

    setMultipleFilters: (filters) => {
      dispatch({ 
        type: FILTER_ACTIONS.SET_MULTIPLE_FILTERS, 
        filters 
      });
    },

    clearFilters: () => {
      dispatch({ type: FILTER_ACTIONS.CLEAR_FILTERS });
    },

    clearSingleFilter: (filterName) => {
      dispatch({ 
        type: FILTER_ACTIONS.CLEAR_SINGLE_FILTER, 
        filterName 
      });
    },

    setSearch: (value) => {
      dispatch({ 
        type: FILTER_ACTIONS.SET_SEARCH, 
        value 
      });
    },

    setSearchId: (value) => {
      dispatch({ 
        type: FILTER_ACTIONS.SET_SEARCH_ID, 
        value 
      });
    },

    setSort: (sortBy, sortDirection = 'asc') => {
      dispatch({ 
        type: FILTER_ACTIONS.SET_SORT, 
        sortBy, 
        sortDirection 
      });
    },

    toggleSort: (sortBy) => {
      const newDirection = state.sortBy === sortBy && state.sortDirection === 'asc' 
        ? 'desc' 
        : 'asc';
      
      dispatch({ 
        type: FILTER_ACTIONS.SET_SORT, 
        sortBy, 
        sortDirection: newDirection 
      });
    },

    resetToDefaults: () => {
      dispatch({ type: FILTER_ACTIONS.RESET_TO_DEFAULTS });
    }
  };

  // Filter application function
  const applyFilters = (tasks) => {
    if (!tasks || !Array.isArray(tasks)) return [];

    let filtered = [...tasks];

    // Basic filters
    if (state.sprint) {
      filtered = filtered.filter(task => 
        task.sprint && task.sprint.toLowerCase().includes(state.sprint.toLowerCase())
      );
    }

    if (state.desenvolvedor) {
      filtered = filtered.filter(task => 
        task.desenvolvedor && task.desenvolvedor.toLowerCase().includes(state.desenvolvedor.toLowerCase())
      );
    }

    if (state.prioridade) {
      filtered = filtered.filter(task => task.prioridade === state.prioridade);
    }

    if (state.status) {
      filtered = filtered.filter(task => task.status === state.status);
    }

    if (state.epico) {
      filtered = filtered.filter(task => 
        task.epico && task.epico.toLowerCase().includes(state.epico.toLowerCase())
      );
    }

    // Text search (all fields)
    if (state.search) {
      const searchTerm = state.search.toLowerCase();
      filtered = filtered.filter(task => 
        Object.values(task).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm)
        )
      );
    }

    // ID search (exact match)
    if (state.searchId) {
      const searchId = state.searchId.replace('#', '');
      filtered = filtered.filter(task => 
        task.originalId === parseInt(searchId) || 
        task.id === searchId
      );
    }

    // Special filters
    if (state.hideCompletedTasks) {
      filtered = filtered.filter(task => task.status !== 'Done');
    }

    if (state.showWipViolations) {
      // This would need WIP limit configuration to work
      // For now, just return all tasks
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      let aValue = a[state.sortBy];
      let bValue = b[state.sortBy];
      
      // Null safety
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';
      
      // Type safety for strings
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      // Sort comparison
      const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return state.sortDirection === 'asc' ? result : -result;
    });

    return filtered;
  };

  // Get unique values for filter dropdowns
  const getUniqueValues = (tasks, field) => {
    if (!tasks || !Array.isArray(tasks)) return [];
    
    const values = tasks
      .map(task => task[field])
      .filter(value => value && value.toString().trim())
      .map(value => value.toString());
    
    return [...new Set(values)].sort();
  };

  // Debug logging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const activeFilters = Object.entries(state)
        .filter(([key, value]) => 
          value && value !== defaultFilters[key] && 
          !['compactView', 'groupByEpic', 'sortBy', 'sortDirection'].includes(key)
        )
        .map(([key, value]) => ({ [key]: value }));

      if (activeFilters.length > 0) {
        console.log('FilterContext Active Filters:', activeFilters);
      }
    }
  }, [state]);

  const contextValue = {
    // Filter state
    filters: state,
    
    // Filter actions
    ...actions,
    
    // Filter utilities
    applyFilters,
    getUniqueValues,
    
    // Computed values
    hasActiveFilters: Object.entries(state).some(([key, value]) => 
      value && value !== defaultFilters[key] && 
      !['compactView', 'groupByEpic', 'sortBy', 'sortDirection'].includes(key)
    ),
    
    activeFiltersCount: Object.entries(state)
      .filter(([key, value]) => 
        value && value !== defaultFilters[key] && 
        !['compactView', 'groupByEpic', 'sortBy', 'sortDirection'].includes(key)
      ).length
  };

  return (
    <FilterContext.Provider value={contextValue}>
      {children}
    </FilterContext.Provider>
  );
};

// Custom Hook
export const useFilterContext = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilterContext must be used within FilterProvider');
  }
  return context;
};

export default FilterContext;