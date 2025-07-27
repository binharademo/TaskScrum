/**
 * Abstract DataService class
 * Defines the interface for all data persistence implementations
 * Implementations: LocalStorageService, SupabaseService (future)
 */
export class DataService {
  constructor(config = {}) {
    if (this.constructor === DataService) {
      throw new Error('DataService is abstract and cannot be instantiated directly');
    }
    this.config = config;
    this.initialized = false;
  }

  // Initialization
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  async disconnect() {
    throw new Error('disconnect() must be implemented by subclass');
  }

  // Task CRUD operations
  async getTasks(filters = {}) {
    throw new Error('getTasks() must be implemented by subclass');
  }

  async getTask(id) {
    throw new Error('getTask() must be implemented by subclass');
  }

  async createTask(taskData) {
    throw new Error('createTask() must be implemented by subclass');
  }

  async updateTask(id, updates) {
    throw new Error('updateTask() must be implemented by subclass');
  }

  async deleteTask(id) {
    throw new Error('deleteTask() must be implemented by subclass');
  }

  async bulkUpdateTasks(updates) {
    throw new Error('bulkUpdateTasks() must be implemented by subclass');
  }

  async bulkDeleteTasks(ids) {
    throw new Error('bulkDeleteTasks() must be implemented by subclass');
  }

  // Query operations
  async getTasksByStatus(status, filters = {}) {
    throw new Error('getTasksByStatus() must be implemented by subclass');
  }

  async getTasksBySprint(sprint, filters = {}) {
    throw new Error('getTasksBySprint() must be implemented by subclass');
  }

  async getTasksByDeveloper(developer, filters = {}) {
    throw new Error('getTasksByDeveloper() must be implemented by subclass');
  }

  async getTasksByEpic(epic, filters = {}) {
    throw new Error('getTasksByEpic() must be implemented by subclass');
  }

  // Analytics and aggregations
  async getTasksCount(filters = {}) {
    throw new Error('getTasksCount() must be implemented by subclass');
  }

  async getTasksByStatusCount() {
    throw new Error('getTasksByStatusCount() must be implemented by subclass');
  }

  async getSprintStatistics(sprint) {
    throw new Error('getSprintStatistics() must be implemented by subclass');
  }

  async getDeveloperStatistics(developer) {
    throw new Error('getDeveloperStatistics() must be implemented by subclass');
  }

  // Configuration operations
  async getConfig(key) {
    throw new Error('getConfig() must be implemented by subclass');
  }

  async setConfig(key, value) {
    throw new Error('setConfig() must be implemented by subclass');
  }

  async deleteConfig(key) {
    throw new Error('deleteConfig() must be implemented by subclass');
  }

  // Data export/import
  async exportData(format = 'json') {
    throw new Error('exportData() must be implemented by subclass');
  }

  async importData(data, options = {}) {
    throw new Error('importData() must be implemented by subclass');
  }

  // Backup and restore
  async createBackup() {
    throw new Error('createBackup() must be implemented by subclass');
  }

  async restoreBackup(backupData) {
    throw new Error('restoreBackup() must be implemented by subclass');
  }

  // Synchronization (for distributed services)
  async sync() {
    throw new Error('sync() must be implemented by subclass');
  }

  async getLastSyncTime() {
    throw new Error('getLastSyncTime() must be implemented by subclass');
  }

  // Utility methods (implemented in base class)
  generateTaskId() {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateTimestamp() {
    return new Date().toISOString();
  }

  validateTaskData(taskData) {
    if (!taskData) {
      throw new Error('Task data is required');
    }

    if (!taskData.atividade && !taskData.userStory) {
      throw new Error('Either atividade or userStory is required');
    }

    // Add more validation as needed
    return true;
  }

  sanitizeTaskData(taskData) {
    const sanitized = { ...taskData };
    
    // Ensure required fields have defaults
    sanitized.id = sanitized.id || this.generateTaskId();
    sanitized.status = sanitized.status || 'Backlog';
    sanitized.prioridade = sanitized.prioridade || 'Média';
    sanitized.estimativa = sanitized.estimativa || 0;
    sanitized.createdAt = sanitized.createdAt || this.generateTimestamp();
    sanitized.updatedAt = this.generateTimestamp();

    // Ensure reestimativas array
    if (!sanitized.reestimativas || !Array.isArray(sanitized.reestimativas)) {
      sanitized.reestimativas = Array(10).fill(sanitized.estimativa || 0);
    }

    // Ensure array is exactly 10 elements
    while (sanitized.reestimativas.length < 10) {
      sanitized.reestimativas.push(sanitized.estimativa || 0);
    }
    sanitized.reestimativas = sanitized.reestimativas.slice(0, 10);

    return sanitized;
  }

  // Event system for data changes
  addEventListener(event, callback) {
    if (!this._listeners) {
      this._listeners = {};
    }
    
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    
    this._listeners[event].push(callback);
  }

  removeEventListener(event, callback) {
    if (!this._listeners || !this._listeners[event]) {
      return;
    }
    
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this._listeners || !this._listeners[event]) {
      return;
    }
    
    this._listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  // Health check
  async healthCheck() {
    try {
      await this.getTasks({ limit: 1 });
      return { status: 'healthy', timestamp: this.generateTimestamp() };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error.message, 
        timestamp: this.generateTimestamp() 
      };
    }
  }

  // Service information
  getServiceInfo() {
    return {
      name: this.constructor.name,
      initialized: this.initialized,
      config: { ...this.config },
      timestamp: this.generateTimestamp()
    };
  }
}

export default DataService;