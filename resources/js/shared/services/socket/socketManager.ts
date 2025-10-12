import { io, Socket } from 'socket.io-client';

/**
 * Socket.io Manager for real-time communication
 * Handles connection, reconnection, and room management
 */
class SocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private connectionPromise: Promise<Socket> | null = null;
  private eventListeners = new Map<string, Set<(...args: any[]) => void>>();
  private rooms = new Set<string>();

  /**
   * Connect to the Socket.io server
   */
  async connect(token?: string): Promise<Socket> {
    // Return existing connection if already connected
    if (this.socket?.connected) {
      return this.socket;
    }

    // Return existing connection promise if already connecting
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.createConnection(token);
    return this.connectionPromise;
  }

  /**
   * Create a new socket connection
   */
  private async createConnection(token?: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
      const authToken = token || localStorage.getItem('auth_token');
      const organizationId = localStorage.getItem('current_organization_id');

      this.socket = io(import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:6001', {
        auth: { 
          token: authToken,
          organizationId: organizationId
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        forceNew: true
      });

      this.setupEventHandlers(resolve, reject);
    });
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(resolve: (socket: Socket) => void, reject: (error: Error) => void): void {
    if (!this.socket) return;

    // Connection successful
    this.socket.on('connect', () => {
      console.log('🔌 Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.connectionPromise = null;
      
      // Rejoin all rooms after reconnection
      this.rejoinRooms();
      
      resolve(this.socket!);
    });

    // Connection failed
    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.connectionPromise = null;
        reject(new Error(`Failed to connect after ${this.maxReconnectAttempts} attempts`));
      }
    });

    // Disconnection
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.socket?.connect();
      }
    });

    // Reconnection attempt
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Socket reconnection attempt ${attemptNumber}`);
    });

    // Successful reconnection
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Socket reconnected after ${attemptNumber} attempts`);
      this.reconnectAttempts = 0;
    });

    // Authentication error
    this.socket.on('auth_error', (error) => {
      console.error('🔐 Socket authentication error:', error);
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    });

    // Server error
    this.socket.on('error', (error) => {
      console.error('🚨 Socket server error:', error);
    });
  }

  /**
   * Disconnect from the socket server
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.connectionPromise = null;
      this.rooms.clear();
      this.eventListeners.clear();
    }
  }

  /**
   * Emit an event to the server
   */
  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      console.log(`📤 Socket emit: ${event}`, data);
      this.socket.emit(event, data);
    } else {
      console.warn(`⚠️ Cannot emit ${event}: Socket not connected`);
    }
  }

  /**
   * Listen for an event from the server
   */
  on(event: string, callback: (...args: any[]) => void): () => void {
    // Store the callback for cleanup
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);

    // Add listener to socket if connected
    if (this.socket) {
      this.socket.on(event, callback);
    }

    // Return cleanup function
    return () => this.off(event, callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      // Remove specific callback
      const callbacks = this.eventListeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.eventListeners.delete(event);
        }
      }
      
      if (this.socket) {
        this.socket.off(event, callback);
      }
    } else {
      // Remove all callbacks for event
      this.eventListeners.delete(event);
      
      if (this.socket) {
        this.socket.off(event);
      }
    }
  }

  /**
   * Join a room
   */
  joinRoom(room: string): void {
    if (this.socket?.connected) {
      console.log(`🏠 Joining room: ${room}`);
      this.socket.emit('join_room', room);
      this.rooms.add(room);
    } else {
      console.warn(`⚠️ Cannot join room ${room}: Socket not connected`);
      // Store room to join later when connected
      this.rooms.add(room);
    }
  }

  /**
   * Leave a room
   */
  leaveRoom(room: string): void {
    if (this.socket?.connected) {
      console.log(`🚪 Leaving room: ${room}`);
      this.socket.emit('leave_room', room);
    }
    this.rooms.delete(room);
  }

  /**
   * Rejoin all rooms after reconnection
   */
  private rejoinRooms(): void {
    if (this.rooms.size > 0) {
      console.log(`🔄 Rejoining ${this.rooms.size} rooms`);
      this.rooms.forEach(room => {
        if (this.socket?.connected) {
          this.socket.emit('join_room', room);
        }
      });
    }
  }

  /**
   * Get connection status
   */
  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket ID
   */
  get socketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Get current rooms
   */
  get currentRooms(): string[] {
    return Array.from(this.rooms);
  }

  /**
   * Send a message to a specific room
   */
  sendToRoom(room: string, event: string, data?: any): void {
    this.emit('room_message', {
      room,
      event,
      data
    });
  }

  /**
   * Broadcast to all users in organization
   */
  broadcastToOrganization(event: string, data?: any): void {
    const organizationId = localStorage.getItem('current_organization_id');
    if (organizationId) {
      this.sendToRoom(`org:${organizationId}`, event, data);
    }
  }

  /**
   * Send private message to specific user
   */
  sendToUser(userId: string, event: string, data?: any): void {
    this.emit('private_message', {
      userId,
      event,
      data
    });
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    connected: boolean;
    socketId?: string;
    reconnectAttempts: number;
    rooms: string[];
    eventListeners: number;
  } {
    return {
      connected: this.isConnected,
      socketId: this.socketId,
      reconnectAttempts: this.reconnectAttempts,
      rooms: this.currentRooms,
      eventListeners: this.eventListeners.size
    };
  }
}

// Export singleton instance
export const socketManager = new SocketManager();

// Export types for TypeScript
export interface SocketEventCallback {
  (...args: any[]): void;
}

export interface RoomMessage {
  room: string;
  event: string;
  data?: any;
}

export interface PrivateMessage {
  userId: string;
  event: string;
  data?: any;
}

// Auto-connect when auth token is available
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('auth_token');
  if (token) {
    socketManager.connect(token).catch(error => {
      console.error('Failed to auto-connect socket:', error);
    });
  }
}
