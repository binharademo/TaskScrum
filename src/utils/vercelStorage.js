const CURRENT_ROOM_KEY = 'tasktracker_current_room';

// URLs da API (serão definidas automaticamente pelo Vercel)
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
};

// Gerar código único para nova sala
export const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Obter sala atual (ainda usa localStorage para controle local)
export const getCurrentRoom = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CURRENT_ROOM_KEY) || null;
};

// Definir sala atual
export const setCurrentRoom = (roomCode) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_ROOM_KEY, roomCode);
};

// Fazer request para API
const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
};

// Carregar tarefas da sala
export const loadTasksFromStorage = async (roomCode = null) => {
  try {
    const room = roomCode || getCurrentRoom();
    if (!room) return [];
    
    const apiUrl = getApiUrl();
    const data = await apiRequest(`${apiUrl}/api/rooms/${room}`);
    return data.tasks || [];
  } catch (error) {
    console.error('Error loading tasks from Vercel KV:', error);
    // Fallback para localStorage em caso de erro
    if (typeof window !== 'undefined') {
      const localKey = `tasktracker_room_${roomCode || getCurrentRoom()}`;
      const stored = localStorage.getItem(localKey);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  }
};

// Salvar tarefas na sala
export const saveTasksToStorage = async (tasks, roomCode = null) => {
  try {
    const room = roomCode || getCurrentRoom();
    if (!room) return;
    
    const apiUrl = getApiUrl();
    await apiRequest(`${apiUrl}/api/rooms/${room}`, {
      method: 'POST',
      body: JSON.stringify({ tasks }),
    });
    
    // Backup local para fallback
    if (typeof window !== 'undefined') {
      const localKey = `tasktracker_room_${room}`;
      localStorage.setItem(localKey, JSON.stringify(tasks));
    }
  } catch (error) {
    console.error('Error saving tasks to Vercel KV:', error);
    // Fallback para localStorage
    if (typeof window !== 'undefined') {
      const localKey = `tasktracker_room_${roomCode || getCurrentRoom()}`;
      localStorage.setItem(localKey, JSON.stringify(tasks));
    }
    throw error;
  }
};

// Limpar dados de uma sala
export const clearStorage = async (roomCode = null) => {
  try {
    const room = roomCode || getCurrentRoom();
    if (!room) return;
    
    const apiUrl = getApiUrl();
    await apiRequest(`${apiUrl}/api/rooms/${room}`, {
      method: 'DELETE',
    });
    
    // Limpar backup local também
    if (typeof window !== 'undefined') {
      const localKey = `tasktracker_room_${room}`;
      localStorage.removeItem(localKey);
    }
  } catch (error) {
    console.error('Error clearing room from Vercel KV:', error);
    // Fallback para localStorage
    if (typeof window !== 'undefined') {
      const localKey = `tasktracker_room_${roomCode || getCurrentRoom()}`;
      localStorage.removeItem(localKey);
    }
  }
};

// Verificar se uma sala existe
export const roomExists = async (roomCode) => {
  try {
    const apiUrl = getApiUrl();
    const data = await apiRequest(`${apiUrl}/api/rooms`, {
      method: 'POST',
      body: JSON.stringify({ roomCode }),
    });
    return data.exists;
  } catch (error) {
    console.error('Error checking room existence:', error);
    // Fallback para localStorage
    if (typeof window !== 'undefined') {
      const localKey = `tasktracker_room_${roomCode}`;
      return localStorage.getItem(localKey) !== null;
    }
    return false;
  }
};

// Listar todas as salas disponíveis
export const getAvailableRooms = async () => {
  try {
    const apiUrl = getApiUrl();
    const data = await apiRequest(`${apiUrl}/api/rooms`);
    return data.rooms || [];
  } catch (error) {
    console.error('Error getting available rooms:', error);
    // Fallback para localStorage
    if (typeof window !== 'undefined') {
      const rooms = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('tasktracker_room_')) {
          const roomCode = key.replace('tasktracker_room_', '');
          rooms.push(roomCode);
        }
      }
      return rooms;
    }
    return [];
  }
};

// Criar nova sala com dados iniciais
export const createRoom = async (roomCode, initialTasks = []) => {
  try {
    await saveTasksToStorage(initialTasks, roomCode);
    setCurrentRoom(roomCode);
    return roomCode;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};