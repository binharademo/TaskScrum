import { DataService } from './DataService.js';
import { supabase } from '../config/supabase.js';

/**
 * SupabaseService - Supabase implementation of DataService
 * Provides persistence using Supabase PostgreSQL + RLS
 * Multi-room support with room-based data isolation
 */
export class SupabaseService extends DataService {
  constructor(config = {}) {
    super(config);
    
    this.supabase = supabase;
    this.currentRoomId = config.roomId || null;
    this.initialized = false;

    if (!this.supabase) {
      throw new Error('Supabase not configured. Check environment variables.');
    }
  }

  // ===============================================
  // CONNECTION METHODS
  // ===============================================

  async initialize() {
    try {
      console.log('🔧 SupabaseService.initialize() - iniciando...');
      console.log('🔗 URL:', this.supabase?.supabaseUrl);
      console.log('🔑 Key configurada:', !!this.supabase?.supabaseKey);
      
      // Test connection with a simple query
      console.log('📡 Testando conexão com query simples...');
      const { data, error } = await this.supabase
        .from('rooms')
        .select('count', { count: 'exact', head: true });

      console.log('📊 Resposta do Supabase - data:', data);
      console.log('⚠️ Resposta do Supabase - error:', error);

      if (error) {
        console.error('❌ Erro na query:', error.code, error.message, error.details, error.hint);
        throw new Error(`Supabase connection failed: ${error.message} (code: ${error.code})`);
      }

      this.initialized = true;
      this.emit('initialized', { service: 'SupabaseService' });
      
      console.log('✅ SupabaseService inicializado com sucesso!');
      return { success: true, message: 'SupabaseService initialized successfully' };
    } catch (error) {
      console.error('💥 Erro na inicialização do SupabaseService:', error);
      throw new Error(`Failed to initialize SupabaseService: ${error.message}`);
    }
  }

  async disconnect() {
    this.initialized = false;
    this.emit('disconnected', { service: 'SupabaseService' });
    return { success: true, message: 'SupabaseService disconnected' };
  }

  async healthCheck() {
    try {
      const { data, error } = await this.supabase
        .from('rooms')
        .select('id')
        .limit(1);

      if (error) {
        return { 
          status: 'unhealthy', 
          error: error.message, 
          timestamp: this.generateTimestamp() 
        };
      }

      return { status: 'healthy', timestamp: this.generateTimestamp() };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error.message, 
        timestamp: this.generateTimestamp() 
      };
    }
  }

  // ===============================================
  // ROOM MANAGEMENT
  // ===============================================

  async getRooms(filters = {}) {
    if (!this.initialized) {
      throw new Error('SupabaseService not initialized');
    }

    try {
      let query = this.supabase
        .from('rooms')
        .select(`
          *,
          room_access!inner(role),
          tasks(count)
        `);

      // Apply filters
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      if (filters.is_public !== undefined) {
        query = query.eq('is_public', filters.is_public);
      }

      // Order by updated_at desc
      query = query.order('updated_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get rooms: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`Failed to get rooms: ${error.message}`);
    }
  }

  async createRoom(roomData) {
    if (!this.initialized) {
      throw new Error('SupabaseService not initialized');
    }

    try {
      // Get current user
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const roomToCreate = {
        name: roomData.name || 'Nova Sala',
        description: roomData.description || null,
        is_public: roomData.is_public || false,
        owner_id: user.id,
        room_code: roomData.room_code || '' // Será gerado automaticamente pelo trigger se vazio
      };

      const { data, error } = await this.supabase
        .from('rooms')
        .insert([roomToCreate])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create room: ${error.message}`);
      }

      this.emit('roomCreated', { room: data });
      return data;
    } catch (error) {
      throw new Error(`Failed to create room: ${error.message}`);
    }
  }

  async joinRoom(roomCode) {
    if (!this.initialized) {
      throw new Error('SupabaseService not initialized');
    }

    try {
      // Get current user
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Find room by code
      const { data: room, error: roomError } = await this.supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .single();

      if (roomError || !room) {
        throw new Error('Sala não encontrada');
      }

      // Check if user already has access
      const { data: existingAccess } = await this.supabase
        .from('room_access')
        .select('*')
        .eq('room_id', room.id)
        .eq('user_id', user.id)
        .single();

      if (existingAccess) {
        return room; // Already has access
      }

      // Add user access
      const { error: accessError } = await this.supabase
        .from('room_access')
        .insert([{
          room_id: room.id,
          user_id: user.id,
          role: 'member',
          granted_by: room.owner_id
        }]);

      if (accessError) {
        throw new Error(`Failed to join room: ${accessError.message}`);
      }

      this.emit('roomJoined', { room, user });
      return room;
    } catch (error) {
      throw new Error(`Failed to join room: ${error.message}`);
    }
  }

  setCurrentRoom(roomId) {
    this.currentRoomId = roomId;
    this.emit('roomChanged', { roomId });
  }

  async getUserRooms(filters = {}) {
    if (!this.initialized) {
      throw new Error('SupabaseService not initialized');
    }

    try {
      // Get current user
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      let query = this.supabase
        .from('rooms')
        .select(`
          *,
          room_access!inner(role)
        `)
        .eq('room_access.user_id', user.id);

      // Apply filters
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      if (filters.is_public !== undefined) {
        query = query.eq('is_public', filters.is_public);
      }

      // Order by updated_at desc
      query = query.order('updated_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get user rooms: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`Failed to get user rooms: ${error.message}`);
    }
  }

  async findRoomByCode(roomCode) {
    if (!this.initialized) {
      throw new Error('SupabaseService not initialized');
    }

    try {
      const { data, error } = await this.supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to find room: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to find room: ${error.message}`);
    }
  }

  async deleteRoom(roomId) {
    if (!this.initialized) {
      throw new Error('SupabaseService not initialized');
    }
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get room data before deleting for verification
      const { data: room, error: roomError } = await this.supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) {
        if (roomError.code === 'PGRST116') {
          throw new Error('Room not found');
        }
        throw new Error(`Failed to get room: ${roomError.message}`);
      }

      // Check if user is the owner or has permission to delete
      if (room.owner_id !== user.id) {
        // Check if user has admin access to the room
        const { data: access, error: accessError } = await this.supabase
          .from('room_access')
          .select('role')
          .eq('room_id', roomId)
          .eq('user_id', user.id)
          .single();

        if (accessError || !access || access.role !== 'admin') {
          throw new Error('Insufficient permissions to delete room');
        }
      }

      // Delete room (cascade will handle related records)
      const { error: deleteError } = await this.supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);

      if (deleteError) {
        throw new Error(`Failed to delete room: ${deleteError.message}`);
      }

      this.emit('roomDeleted', { room });
      return { success: true, deletedRoom: room };
    } catch (error) {
      throw new Error(`Failed to delete room: ${error.message}`);
    }
  }

  // ===============================================
  // TASK CRUD OPERATIONS
  // ===============================================

  async getTasks(filters = {}) {
    if (!this.initialized) {
      throw new Error('SupabaseService not initialized');
    }

    if (!this.currentRoomId) {
      throw new Error('No room selected');
    }

    try {
      let query = this.supabase
        .from('tasks')
        .select('*')
        .eq('room_id', this.currentRoomId);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.sprint) {
        query = query.ilike('sprint', `%${filters.sprint}%`);
      }

      if (filters.desenvolvedor) {
        query = query.ilike('desenvolvedor', `%${filters.desenvolvedor}%`);
      }

      if (filters.epico) {
        query = query.ilike('epico', `%${filters.epico}%`);
      }

      if (filters.prioridade) {
        query = query.eq('prioridade', filters.prioridade);
      }

      // Apply limit and offset
      if (filters.limit && typeof filters.limit === 'number') {
        query = query.limit(filters.limit);
      }

      if (filters.offset && typeof filters.offset === 'number') {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      // Order by created_at desc
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get tasks: ${error.message}`);
      }

      // Convert to TaskTracker format
      return (data || []).map(this._convertFromSupabaseFormat);
    } catch (error) {
      throw new Error(`Failed to get tasks: ${error.message}`);
    }
  }

  async getTask(id) {
    if (!this.initialized) {
      throw new Error('SupabaseService not initialized');
    }

    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to get task: ${error.message}`);
      }

      return this._convertFromSupabaseFormat(data);
    } catch (error) {
      throw new Error(`Failed to get task: ${error.message}`);
    }
  }

  async createTask(taskData) {
    if (!this.initialized) {
      throw new Error('SupabaseService not initialized');
    }

    if (!this.currentRoomId) {
      throw new Error('No room selected');
    }

    try {
      // Get current user
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Validate and sanitize task data
      this.validateTaskData(taskData);
      const sanitizedTask = this.sanitizeTaskData(taskData);

      // Convert to Supabase format
      const supabaseTask = this._convertToSupabaseFormat(sanitizedTask);
      supabaseTask.room_id = this.currentRoomId;
      supabaseTask.created_by = user.id;
      supabaseTask.updated_by = user.id;
      
      // Remove timestamps and custom IDs - let database generate them
      delete supabaseTask.created_at;
      delete supabaseTask.updated_at;
      delete supabaseTask.createdAt;
      delete supabaseTask.updatedAt;
      delete supabaseTask.id; // Let Supabase generate UUID

      const { data, error } = await this.supabase
        .from('tasks')
        .insert([supabaseTask])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create task: ${error.message}`);
      }

      const createdTask = this._convertFromSupabaseFormat(data);
      this.emit('taskCreated', { task: createdTask });
      return createdTask;
    } catch (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }
  }

  async updateTask(id, updates) {
    if (!this.initialized) {
      throw new Error('SupabaseService not initialized');
    }

    try {
      // Get current user
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Convert updates to Supabase format
      const supabaseUpdates = this._convertToSupabaseFormat(updates);
      supabaseUpdates.updated_by = user.id;
      
      // Remove timestamp fields - let database generate them
      delete supabaseUpdates.updated_at;
      delete supabaseUpdates.updatedAt;

      const { data, error } = await this.supabase
        .from('tasks')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update task: ${error.message}`);
      }

      const updatedTask = this._convertFromSupabaseFormat(data);
      this.emit('taskUpdated', { task: updatedTask });
      return updatedTask;
    } catch (error) {
      throw new Error(`Failed to update task: ${error.message}`);
    }
  }

  async deleteTask(id) {
    if (!this.initialized) {
      throw new Error('SupabaseService not initialized');
    }

    try {
      // Get task before deleting for the event
      const taskToDelete = await this.getTask(id);
      if (!taskToDelete) {
        throw new Error(`Task with id ${id} not found`);
      }

      const { error } = await this.supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete task: ${error.message}`);
      }

      this.emit('taskDeleted', { task: taskToDelete });
      return { success: true, deletedTask: taskToDelete };
    } catch (error) {
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  }

  async bulkUpdateTasks(updates) {
    if (!this.initialized) {
      throw new Error('SupabaseService not initialized');
    }

    try {
      // Get current user
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const updatedTasks = [];
      
      // Process updates one by one (could be optimized with upsert)
      for (const { id, updates: taskUpdates } of updates) {
        const supabaseUpdates = this._convertToSupabaseFormat(taskUpdates);
        supabaseUpdates.updated_by = user.id;
        supabaseUpdates.updated_at = this.generateTimestamp();

        const { data, error } = await this.supabase
          .from('tasks')
          .update(supabaseUpdates)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error(`Failed to update task ${id}:`, error);
          continue;
        }

        updatedTasks.push(this._convertFromSupabaseFormat(data));
      }

      this.emit('tasksBulkUpdated', { tasks: updatedTasks });
      return updatedTasks;
    } catch (error) {
      throw new Error(`Failed to bulk update tasks: ${error.message}`);
    }
  }

  async bulkDeleteTasks(ids) {
    if (!this.initialized) {
      throw new Error('SupabaseService not initialized');
    }

    try {
      // Get tasks before deleting for the event
      const { data: tasksToDelete, error: selectError } = await this.supabase
        .from('tasks')
        .select('*')
        .in('id', ids);

      if (selectError) {
        throw new Error(`Failed to get tasks for deletion: ${selectError.message}`);
      }

      const { error } = await this.supabase
        .from('tasks')
        .delete()
        .in('id', ids);

      if (error) {
        throw new Error(`Failed to bulk delete tasks: ${error.message}`);
      }

      const deletedTasks = (tasksToDelete || []).map(this._convertFromSupabaseFormat);
      this.emit('tasksBulkDeleted', { tasks: deletedTasks });
      return { success: true, deletedTasks };
    } catch (error) {
      throw new Error(`Failed to bulk delete tasks: ${error.message}`);
    }
  }

  // ===============================================
  // QUERY OPERATIONS
  // ===============================================

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

  // ===============================================
  // ANALYTICS AND AGGREGATIONS
  // ===============================================

  async getTasksCount(filters = {}) {
    if (!this.initialized) {
      throw new Error('SupabaseService not initialized');
    }

    if (!this.currentRoomId) {
      return 0;
    }

    try {
      let query = this.supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', this.currentRoomId);

      // Apply same filters as getTasks
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.sprint) {
        query = query.ilike('sprint', `%${filters.sprint}%`);
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to count tasks: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      throw new Error(`Failed to count tasks: ${error.message}`);
    }
  }

  async getTasksByStatusCount() {
    if (!this.initialized) {
      throw new Error('SupabaseService not initialized');
    }

    if (!this.currentRoomId) {
      return {};
    }

    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select('status')
        .eq('room_id', this.currentRoomId);

      if (error) {
        throw new Error(`Failed to get status counts: ${error.message}`);
      }

      const counts = {};
      (data || []).forEach(task => {
        counts[task.status] = (counts[task.status] || 0) + 1;
      });

      return counts;
    } catch (error) {
      throw new Error(`Failed to get status counts: ${error.message}`);
    }
  }

  // ===============================================
  // FORMAT CONVERSION HELPERS
  // ===============================================

  _convertToSupabaseFormat(taskData) {
    // Convert TaskTracker format to Supabase column names
    const converted = { ...taskData };
    
    // Convert camelCase to snake_case for special fields
    if (converted.userStory) {
      converted.user_story = converted.userStory;
      delete converted.userStory;
    }

    if (converted.createdAt) {
      converted.created_at = converted.createdAt;
      delete converted.createdAt;
    }

    if (converted.updatedAt) {
      converted.updated_at = converted.updatedAt;
      delete converted.updatedAt;
    }

    return converted;
  }

  _convertFromSupabaseFormat(supabaseData) {
    // Convert Supabase format to TaskTracker format
    const converted = { ...supabaseData };
    
    // Convert snake_case to camelCase for compatibility
    if (converted.user_story) {
      converted.userStory = converted.user_story;
      delete converted.user_story;
    }

    if (converted.created_at) {
      converted.createdAt = converted.created_at;
      delete converted.created_at;
    }

    if (converted.updated_at) {
      converted.updatedAt = converted.updated_at;
      delete converted.updated_at;
    }

    // Ensure reestimativas is always an array
    if (!converted.reestimativas || !Array.isArray(converted.reestimativas)) {
      converted.reestimativas = Array(10).fill(converted.estimativa || 0);
    }

    return converted;
  }

  // ===============================================
  // CONFIGURATION AND SYNC
  // ===============================================

  async getConfig(key) {
    if (!this.initialized) {
      throw new Error('SupabaseService not initialized');
    }

    if (!this.currentRoomId) {
      return null;
    }

    try {
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('user_settings')
        .select('setting_value')
        .eq('user_id', user.id)
        .eq('room_id', this.currentRoomId)
        .eq('setting_key', key)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to get config: ${error.message}`);
      }

      return data?.setting_value;
    } catch (error) {
      throw new Error(`Failed to get config: ${error.message}`);
    }
  }

  async setConfig(key, value) {
    if (!this.initialized) {
      throw new Error('SupabaseService not initialized');
    }

    if (!this.currentRoomId) {
      throw new Error('No room selected');
    }

    try {
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { error } = await this.supabase
        .from('user_settings')
        .upsert([{
          user_id: user.id,
          room_id: this.currentRoomId,
          setting_key: key,
          setting_value: value
        }]);

      if (error) {
        throw new Error(`Failed to set config: ${error.message}`);
      }

      this.emit('configUpdated', { key, value });
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to set config: ${error.message}`);
    }
  }

  async deleteConfig(key) {
    if (!this.initialized) {
      throw new Error('SupabaseService not initialized');
    }

    if (!this.currentRoomId) {
      throw new Error('No room selected');
    }

    try {
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { error } = await this.supabase
        .from('user_settings')
        .delete()
        .eq('user_id', user.id)
        .eq('room_id', this.currentRoomId)
        .eq('setting_key', key);

      if (error) {
        throw new Error(`Failed to delete config: ${error.message}`);
      }

      this.emit('configDeleted', { key });
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete config: ${error.message}`);
    }
  }

  // ===============================================
  // SYNC AND BACKUP
  // ===============================================

  async sync() {
    // For Supabase, sync means refresh data from server
    this.emit('synced', { timestamp: this.generateTimestamp() });
    return { success: true, message: 'Supabase sync completed' };
  }

  async getLastSyncTime() {
    return this.generateTimestamp(); // Always current time for Supabase
  }

  async exportData(format = 'json') {
    const tasks = await this.getTasks();
    
    const exportData = {
      tasks,
      roomId: this.currentRoomId,
      exportedAt: this.generateTimestamp(),
      version: '1.0',
      source: 'Supabase'
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else if (format === 'csv') {
      const headers = ['id', 'atividade', 'status', 'desenvolvedor', 'estimativa', 'tempo_gasto'];
      const rows = tasks.map(task => 
        headers.map(header => task[header] || '').join(',')
      );
      return [headers.join(','), ...rows].join('\n');
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }
  }

  async importData(data, options = {}) {
    throw new Error('Import not implemented for SupabaseService - use migration tools instead');
  }
}

export default SupabaseService;