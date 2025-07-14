const STORAGE_PREFIX = 'tasktracker_';
const CURRENT_ROOM_KEY = 'tasktracker_current_room';

// Gerar código único para nova sala
export const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Obter sala atual
export const getCurrentRoom = () => {
  return localStorage.getItem(CURRENT_ROOM_KEY) || null;
};

// Definir sala atual
export const setCurrentRoom = (roomCode) => {
  localStorage.setItem(CURRENT_ROOM_KEY, roomCode);
};

// Obter chave de storage para uma sala
const getRoomStorageKey = (roomCode) => {
  return `${STORAGE_PREFIX}room_${roomCode}`;
};

// Carregar tarefas da sala atual
export const loadTasksFromStorage = (roomCode = null) => {
  try {
    const room = roomCode || getCurrentRoom();
    if (!room) return [];
    
    const storageKey = getRoomStorageKey(room);
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading tasks from storage:', error);
    return [];
  }
};

// Salvar tarefas na sala atual
export const saveTasksToStorage = (tasks, roomCode = null) => {
  try {
    const room = roomCode || getCurrentRoom();
    if (!room) return;
    
    const storageKey = getRoomStorageKey(room);
    localStorage.setItem(storageKey, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving tasks to storage:', error);
  }
};

// Limpar dados de uma sala
export const clearStorage = (roomCode = null) => {
  const room = roomCode || getCurrentRoom();
  if (!room) return;
  
  const storageKey = getRoomStorageKey(room);
  localStorage.removeItem(storageKey);
};

// Verificar se uma sala existe (tem dados)
export const roomExists = (roomCode) => {
  const storageKey = getRoomStorageKey(roomCode);
  return localStorage.getItem(storageKey) !== null;
};

// Listar todas as salas disponíveis
export const getAvailableRooms = () => {
  const rooms = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`${STORAGE_PREFIX}room_`)) {
      const roomCode = key.replace(`${STORAGE_PREFIX}room_`, '');
      rooms.push(roomCode);
    }
  }
  return rooms;
};

// Criar nova sala com dados iniciais
export const createRoom = (roomCode, initialTasks = []) => {
  saveTasksToStorage(initialTasks, roomCode);
  setCurrentRoom(roomCode);
  return roomCode;
};