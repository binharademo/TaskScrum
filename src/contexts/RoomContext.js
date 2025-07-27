import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { SupabaseService } from '../services/SupabaseService';

const RoomContext = createContext({});

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};

export const RoomProvider = ({ children }) => {
  // Auth context
  const { isAuthenticated, user, canUseSupabase } = useAuth();

  // Room state
  const [currentRoom, setCurrentRoom] = useState(null);
  const [userRooms, setUserRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Service instance
  const [roomService, setRoomService] = useState(null);

  // Initialize service when auth state changes
  useEffect(() => {
    if (isAuthenticated && canUseSupabase) {
      const service = new SupabaseService();
      service.initialize()
        .then(() => {
          setRoomService(service);
          loadUserRooms();
        })
        .catch(err => {
          console.error('Failed to initialize room service:', err);
          setError(err.message);
        });
    } else {
      setRoomService(null);
      setUserRooms([]);
      setCurrentRoom(null);
    }
  }, [isAuthenticated, canUseSupabase]);

  // Load user rooms
  const loadUserRooms = useCallback(async () => {
    if (!roomService || !isAuthenticated) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const rooms = await roomService.getRooms();
      setUserRooms(rooms);
    } catch (err) {
      console.error('Failed to load user rooms:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [roomService, isAuthenticated]);

  // Create room
  const createRoom = async (roomData) => {
    if (!roomService || !isAuthenticated) {
      throw new Error('Service not available or user not authenticated');
    }

    setError(null);

    try {
      const newRoom = await roomService.createRoom(roomData);
      
      // Add to user rooms list
      setUserRooms(prev => [newRoom, ...prev]);
      
      // Auto-select the new room
      setCurrentRoom(newRoom);
      roomService.setCurrentRoom(newRoom.id);
      
      return newRoom;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Join room by code
  const joinRoom = async (roomCode) => {
    if (!roomService || !isAuthenticated) {
      throw new Error('Service not available or user not authenticated');
    }

    setError(null);

    try {
      const room = await roomService.joinRoom(roomCode);
      
      // Reload user rooms to include the new one
      await loadUserRooms();
      
      // Auto-select the joined room
      setCurrentRoom(room);
      roomService.setCurrentRoom(room.id);
      
      return room;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Select current room
  const selectRoom = (room) => {
    setCurrentRoom(room);
    if (roomService) {
      roomService.setCurrentRoom(room.id);
    }
  };

  // Leave room
  const leaveRoom = async (roomId) => {
    if (!roomService || !isAuthenticated) {
      throw new Error('Service not available or user not authenticated');
    }

    setError(null);

    try {
      // Note: This would need a leaveRoom method in SupabaseService
      // For now, we'll just remove from local state
      setUserRooms(prev => prev.filter(room => room.id !== roomId));
      
      // If leaving current room, clear selection
      if (currentRoom?.id === roomId) {
        setCurrentRoom(null);
        roomService.setCurrentRoom(null);
      }
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update room
  const updateRoom = async (roomId, updates) => {
    if (!roomService || !isAuthenticated) {
      throw new Error('Service not available or user not authenticated');
    }

    setError(null);

    try {
      // Note: This would need an updateRoom method in SupabaseService
      // For now, we'll simulate the update
      const updatedRoom = { ...currentRoom, ...updates };
      
      // Update in rooms list
      setUserRooms(prev => 
        prev.map(room => room.id === roomId ? updatedRoom : room)
      );
      
      // Update current room if it's the one being updated
      if (currentRoom?.id === roomId) {
        setCurrentRoom(updatedRoom);
      }
      
      return updatedRoom;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Get room by ID
  const getRoomById = (roomId) => {
    return userRooms.find(room => room.id === roomId) || null;
  };

  // Get room by code
  const getRoomByCode = (roomCode) => {
    return userRooms.find(room => 
      room.room_code === roomCode.toUpperCase()
    ) || null;
  };

  // Check if user owns room
  const isRoomOwner = (room) => {
    if (!room || !user) return false;
    return room.owner_id === user.id;
  };

  // Get user role in room
  const getUserRoleInRoom = (room) => {
    if (!room || !user) return 'none';
    
    if (room.owner_id === user.id) {
      return 'owner';
    }
    
    // Would need to check room_access table for actual role
    // For now, assume member if in userRooms
    return userRooms.some(r => r.id === room.id) ? 'member' : 'none';
  };

  // Check if user can edit room
  const canEditRoom = (room) => {
    const role = getUserRoleInRoom(room);
    return ['owner', 'admin'].includes(role);
  };

  // Check if user can manage members
  const canManageMembers = (room) => {
    const role = getUserRoleInRoom(room);
    return ['owner', 'admin'].includes(role);
  };

  // Access management functions (placeholder - would need backend implementation)
  const inviteUser = async (roomId, email, role = 'member') => {
    // Placeholder for invite functionality
    console.log('Invite user:', { roomId, email, role });
    return { success: true, message: 'Convite enviado' };
  };

  const removeUser = async (roomId, userId) => {
    // Placeholder for remove user functionality
    console.log('Remove user:', { roomId, userId });
    return { success: true };
  };

  const changeUserRole = async (roomId, userId, newRole) => {
    // Placeholder for change role functionality
    console.log('Change user role:', { roomId, userId, newRole });
    return { success: true };
  };

  // Statistics
  const getRoomStats = (room) => {
    if (!room) return null;
    
    return {
      taskCount: room.tasks?.length || 0,
      memberCount: room.member_count || 1,
      isPublic: room.is_public,
      createdAt: room.created_at,
      updatedAt: room.updated_at
    };
  };

  // Clear error
  const clearError = () => setError(null);

  // Refresh data
  const refresh = () => {
    if (roomService && isAuthenticated) {
      loadUserRooms();
    }
  };

  const value = {
    // Room state
    currentRoom,
    userRooms,
    loading,
    error,

    // Room management
    createRoom,
    joinRoom,
    selectRoom,
    leaveRoom,
    updateRoom,

    // Room queries
    getRoomById,
    getRoomByCode,
    getRoomStats,

    // Permission checks
    isRoomOwner,
    getUserRoleInRoom,
    canEditRoom,
    canManageMembers,

    // Access management
    inviteUser,
    removeUser,
    changeUserRole,

    // Utilities
    refresh,
    clearError,

    // Service availability
    isServiceAvailable: !!roomService && isAuthenticated,
    hasRooms: userRooms.length > 0
  };

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
};

export default RoomContext;