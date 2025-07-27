import { DataService } from './DataService.js';

/**
 * LocalStorageService - localStorage implementation of DataService
 * Provides persistence using browser's localStorage API
 */
export class LocalStorageService extends DataService {
  constructor(config = {}) {
    super(config);
    
    this.storageKeys = {
      tasks: config.tasksKey || 'tasktracker-tasks',
      config: config.configKey || 'tasktracker-config',
      backup: config.backupKey || 'tasktracker-backup',
      lastSync: config.lastSyncKey || 'tasktracker-last-sync'
    };
    
    this.initialized = false;
  }

  // Initialization
  async initialize() {
    try {
      // Test localStorage availability
      const testKey = 'tasktracker-test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      this.initialized = true;
      this.emit('initialized', { service: 'LocalStorageService' });
      
      return { success: true, message: 'LocalStorageService initialized successfully' };
    } catch (error) {
      throw new Error(`Failed to initialize LocalStorageService: ${error.message}`);
    }
  }

  async disconnect() {
    this.initialized = false;
    this.emit('disconnected', { service: 'LocalStorageService' });
    return { success: true, message: 'LocalStorageService disconnected' };
  }

  // Private helper methods
  _getFromStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading from localStorage key ${key}:`, error);
      return null;
    }
  }

  _saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error saving to localStorage key ${key}:`, error);
      this.emit('error', { error: error.message, operation: 'save', key });
      return false;
    }
  }

  _removeFromStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing localStorage key ${key}:`, error);
      return false;
    }
  }

  _applyFilters(tasks, filters) {
    if (!filters || Object.keys(filters).length === 0) {
      return tasks;
    }

    return tasks.filter(task => {
      // Status filter
      if (filters.status && task.status !== filters.status) {
        return false;
      }

      // Sprint filter
      if (filters.sprint && (!task.sprint || !task.sprint.toLowerCase().includes(filters.sprint.toLowerCase()))) {
        return false;
      }

      // Developer filter
      if (filters.desenvolvedor && (!task.desenvolvedor || !task.desenvolvedor.toLowerCase().includes(filters.desenvolvedor.toLowerCase()))) {
        return false;
      }

      // Epic filter
      if (filters.epico && (!task.epico || !task.epico.toLowerCase().includes(filters.epico.toLowerCase()))) {
        return false;
      }

      // Priority filter
      if (filters.prioridade && task.prioridade !== filters.prioridade) {
        return false;
      }

      // Date range filters
      if (filters.createdAfter && new Date(task.createdAt) < new Date(filters.createdAfter)) {
        return false;
      }

      if (filters.createdBefore && new Date(task.createdAt) > new Date(filters.createdBefore)) {
        return false;
      }

      return true;
    });
  }

  // Task CRUD operations
  async getTasks(filters = {}) {
    if (!this.initialized) {
      throw new Error('LocalStorageService not initialized');
    }

    const tasks = this._getFromStorage(this.storageKeys.tasks) || [];
    let filteredTasks = this._applyFilters(tasks, filters);

    // Apply limit if specified
    if (filters.limit && typeof filters.limit === 'number') {
      filteredTasks = filteredTasks.slice(0, filters.limit);
    }

    // Apply offset if specified
    if (filters.offset && typeof filters.offset === 'number') {
      filteredTasks = filteredTasks.slice(filters.offset);
    }

    return filteredTasks;
  }

  async getTask(id) {
    if (!this.initialized) {
      throw new Error('LocalStorageService not initialized');
    }

    const tasks = this._getFromStorage(this.storageKeys.tasks) || [];
    return tasks.find(task => task.id === id) || null;
  }

  async createTask(taskData) {
    if (!this.initialized) {
      throw new Error('LocalStorageService not initialized');
    }

    this.validateTaskData(taskData);
    const sanitizedTask = this.sanitizeTaskData(taskData);
    
    const tasks = this._getFromStorage(this.storageKeys.tasks) || [];
    tasks.push(sanitizedTask);
    
    if (this._saveToStorage(this.storageKeys.tasks, tasks)) {
      this.emit('taskCreated', { task: sanitizedTask });
      return sanitizedTask;
    } else {
      throw new Error('Failed to save task to localStorage');
    }
  }

  async updateTask(id, updates) {
    if (!this.initialized) {
      throw new Error('LocalStorageService not initialized');
    }

    const tasks = this._getFromStorage(this.storageKeys.tasks) || [];
    const taskIndex = tasks.findIndex(task => task.id === id);
    
    if (taskIndex === -1) {
      throw new Error(`Task with id ${id} not found`);
    }

    const updatedTask = {
      ...tasks[taskIndex],
      ...updates,
      updatedAt: this.generateTimestamp()
    };

    tasks[taskIndex] = updatedTask;
    
    if (this._saveToStorage(this.storageKeys.tasks, tasks)) {
      this.emit('taskUpdated', { task: updatedTask, oldTask: tasks[taskIndex] });
      return updatedTask;
    } else {
      throw new Error('Failed to update task in localStorage');
    }
  }

  async deleteTask(id) {
    if (!this.initialized) {
      throw new Error('LocalStorageService not initialized');
    }

    const tasks = this._getFromStorage(this.storageKeys.tasks) || [];
    const taskIndex = tasks.findIndex(task => task.id === id);
    
    if (taskIndex === -1) {
      throw new Error(`Task with id ${id} not found`);
    }

    const deletedTask = tasks[taskIndex];
    tasks.splice(taskIndex, 1);
    
    if (this._saveToStorage(this.storageKeys.tasks, tasks)) {
      this.emit('taskDeleted', { task: deletedTask });
      return { success: true, deletedTask };
    } else {
      throw new Error('Failed to delete task from localStorage');
    }
  }

  async bulkUpdateTasks(updates) {
    if (!this.initialized) {
      throw new Error('LocalStorageService not initialized');
    }

    const tasks = this._getFromStorage(this.storageKeys.tasks) || [];
    const updatedTasks = [];

    updates.forEach(({ id, updates: taskUpdates }) => {
      const taskIndex = tasks.findIndex(task => task.id === id);
      if (taskIndex !== -1) {
        tasks[taskIndex] = {
          ...tasks[taskIndex],
          ...taskUpdates,
          updatedAt: this.generateTimestamp()
        };
        updatedTasks.push(tasks[taskIndex]);
      }
    });

    if (this._saveToStorage(this.storageKeys.tasks, tasks)) {
      this.emit('tasksBulkUpdated', { tasks: updatedTasks });
      return updatedTasks;
    } else {
      throw new Error('Failed to bulk update tasks in localStorage');
    }
  }

  async bulkDeleteTasks(ids) {
    if (!this.initialized) {
      throw new Error('LocalStorageService not initialized');
    }

    const tasks = this._getFromStorage(this.storageKeys.tasks) || [];
    const deletedTasks = [];
    
    const remainingTasks = tasks.filter(task => {
      if (ids.includes(task.id)) {
        deletedTasks.push(task);
        return false;
      }
      return true;
    });

    if (this._saveToStorage(this.storageKeys.tasks, remainingTasks)) {
      this.emit('tasksBulkDeleted', { tasks: deletedTasks });
      return { success: true, deletedTasks };
    } else {
      throw new Error('Failed to bulk delete tasks from localStorage');
    }
  }

  // Query operations
  async getTasksByStatus(status, filters = {}) {
    return this.getTasks({ ...filters, status });
  }

  async getTasksBySprint(sprint, filters = {}) {
    return this.getTasks({ ...filters, sprint });
  }

  async getTasksByDeveloper(developer, filters = {}) {
    return this.getTasks({ ...filters, desenvolvedor: developer });
  }

  async getTasksByEpic(epic, filters = {}) {
    return this.getTasks({ ...filters, epico: epic });
  }

  // Analytics and aggregations
  async getTasksCount(filters = {}) {
    const tasks = await this.getTasks(filters);
    return tasks.length;
  }

  async getTasksByStatusCount() {
    const tasks = await this.getTasks();
    const counts = {};
    
    tasks.forEach(task => {
      counts[task.status] = (counts[task.status] || 0) + 1;
    });

    return counts;
  }

  async getSprintStatistics(sprint) {
    const tasks = await this.getTasksBySprint(sprint);
    
    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'Done').length,
      inProgress: tasks.filter(t => t.status === 'Doing').length,
      todo: tasks.filter(t => ['Backlog', 'Priorizado'].includes(t.status)).length,
      totalEstimated: tasks.reduce((sum, t) => sum + (t.estimativa || 0), 0),
      totalSpent: tasks.reduce((sum, t) => sum + (t.tempoGasto || 0), 0)
    };

    stats.completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
    
    return stats;
  }

  async getDeveloperStatistics(developer) {
    const tasks = await this.getTasksByDeveloper(developer);
    
    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'Done').length,
      accuracy: 0,
      averageError: 0
    };

    const completedWithTime = tasks.filter(t => t.status === 'Done' && t.tempoGasto && t.estimativa);
    
    if (completedWithTime.length > 0) {
      const totalError = completedWithTime.reduce((sum, t) => sum + Math.abs(t.taxaErro || 0), 0);
      stats.averageError = totalError / completedWithTime.length;
      stats.accuracy = Math.max(0, 100 - stats.averageError);
    }

    return stats;
  }

  // Configuration operations
  async getConfig(key) {
    if (!this.initialized) {
      throw new Error('LocalStorageService not initialized');
    }

    const config = this._getFromStorage(this.storageKeys.config) || {};
    return config[key];
  }

  async setConfig(key, value) {
    if (!this.initialized) {
      throw new Error('LocalStorageService not initialized');
    }

    const config = this._getFromStorage(this.storageKeys.config) || {};
    config[key] = value;
    
    if (this._saveToStorage(this.storageKeys.config, config)) {
      this.emit('configUpdated', { key, value });
      return { success: true };
    } else {
      throw new Error('Failed to save config to localStorage');
    }
  }

  async deleteConfig(key) {
    if (!this.initialized) {
      throw new Error('LocalStorageService not initialized');
    }

    const config = this._getFromStorage(this.storageKeys.config) || {};
    delete config[key];
    
    if (this._saveToStorage(this.storageKeys.config, config)) {
      this.emit('configDeleted', { key });
      return { success: true };
    } else {
      throw new Error('Failed to delete config from localStorage');
    }
  }

  // Data export/import
  async exportData(format = 'json') {
    if (!this.initialized) {
      throw new Error('LocalStorageService not initialized');
    }

    const tasks = await this.getTasks();
    const config = this._getFromStorage(this.storageKeys.config) || {};
    
    const exportData = {
      tasks,
      config,
      exportedAt: this.generateTimestamp(),
      version: '1.0'
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else if (format === 'csv') {
      // Simple CSV export for tasks
      const headers = ['id', 'atividade', 'status', 'desenvolvedor', 'estimativa', 'tempoGasto'];
      const rows = tasks.map(task => 
        headers.map(header => task[header] || '').join(',')
      );
      return [headers.join(','), ...rows].join('\n');
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }
  }

  async importData(data, options = {}) {
    if (!this.initialized) {
      throw new Error('LocalStorageService not initialized');
    }

    try {
      const importData = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (options.merge) {
        // Merge with existing data
        const existingTasks = await this.getTasks();
        const mergedTasks = [...existingTasks];
        
        importData.tasks.forEach(importTask => {
          const existingIndex = mergedTasks.findIndex(t => t.id === importTask.id);
          if (existingIndex !== -1) {
            mergedTasks[existingIndex] = importTask;
          } else {
            mergedTasks.push(importTask);
          }
        });
        
        this._saveToStorage(this.storageKeys.tasks, mergedTasks);
      } else {
        // Replace all data
        this._saveToStorage(this.storageKeys.tasks, importData.tasks || []);
      }

      if (importData.config) {
        this._saveToStorage(this.storageKeys.config, importData.config);
      }

      this.emit('dataImported', { 
        tasksCount: importData.tasks?.length || 0,
        merged: options.merge 
      });

      return { 
        success: true, 
        tasksImported: importData.tasks?.length || 0 
      };
    } catch (error) {
      throw new Error(`Failed to import data: ${error.message}`);
    }
  }

  // Backup and restore
  async createBackup() {
    const backupData = await this.exportData('json');
    const backupKey = `${this.storageKeys.backup}-${Date.now()}`;
    
    if (this._saveToStorage(backupKey, JSON.parse(backupData))) {
      return { success: true, backupKey, timestamp: this.generateTimestamp() };
    } else {
      throw new Error('Failed to create backup');
    }
  }

  async restoreBackup(backupData) {
    return this.importData(backupData, { merge: false });
  }

  // Synchronization
  async sync() {
    // For localStorage, sync just updates the lastSync timestamp
    this._saveToStorage(this.storageKeys.lastSync, this.generateTimestamp());
    this.emit('synced', { timestamp: this.generateTimestamp() });
    return { success: true, message: 'Local sync completed' };
  }

  async getLastSyncTime() {
    return this._getFromStorage(this.storageKeys.lastSync);
  }
}

export default LocalStorageService;