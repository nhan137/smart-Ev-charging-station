import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private connected: boolean = false;

  /**
   * Connect to Socket.IO server
   */
  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket.IO] Connected to server');
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected from server');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket.IO] Connection error:', error);
      this.connected = false;
    });

    return this.socket;
  }

  /**
   * Join a booking room
   */
  joinBookingRoom(bookingId: number): void {
    if (!this.socket) {
      this.connect();
    }

    const joinRoom = () => {
      if (this.socket && this.socket.connected) {
        const room = `booking_${bookingId}`;
        this.socket.emit('join_booking_room', bookingId);
        console.log(`[Socket.IO] Joining room: ${room} (socket connected: ${this.socket.connected})`);
      } else {
        console.warn(`[Socket.IO] Socket not connected yet, waiting...`);
        // Wait for connection with timeout
        const timeout = setTimeout(() => {
          console.error(`[Socket.IO] Timeout waiting for socket connection`);
        }, 5000);

        this.socket?.once('connect', () => {
          clearTimeout(timeout);
          const room = `booking_${bookingId}`;
          this.socket?.emit('join_booking_room', bookingId);
          console.log(`[Socket.IO] Joined room after connection: ${room}`);
        });
      }
    };

    // Try immediately if connected, otherwise wait
    if (this.socket?.connected) {
      joinRoom();
    } else {
      // Wait for connection first
      this.socket?.once('connect', () => {
        joinRoom();
      });
      // Also try after a short delay in case connect event already fired
      setTimeout(joinRoom, 100);
    }
  }

  /**
   * Leave a booking room
   */
  leaveBookingRoom(bookingId: number): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_booking_room', bookingId);
      console.log(`[Socket.IO] Leaving room: booking_${bookingId}`);
    }
  }

  /**
   * Listen to charging update events
   */
  onChargingUpdate(callback: (data: any) => void): void {
    if (!this.socket) {
      this.connect();
    }

    this.socket?.on('charging_update', (data) => {
      console.log('[Socket.IO] Received charging_update:', data);
      callback(data);
    });
  }

  /**
   * Listen to charging completed events
   */
  onChargingCompleted(callback: (data: any) => void): void {
    if (!this.socket) {
      this.connect();
    }

    this.socket?.on('charging_completed', (data) => {
      console.log('[Socket.IO] Received charging_completed:', data);
      callback(data);
    });
  }

  /**
   * Listen to charging stopped events (when IoT Simulator is killed)
   */
  onChargingStopped(callback: (data: any) => void): void {
    if (!this.socket) {
      this.connect();
    }

    this.socket?.on('charging_stopped', (data) => {
      console.log('[Socket.IO] Received charging_stopped:', data);
      callback(data);
    });
  }

  /**
   * Remove all listeners for charging events
   */
  removeChargingListeners(): void {
    this.socket?.off('charging_update');
    this.socket?.off('charging_completed');
    this.socket?.off('charging_stopped');
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      console.log('[Socket.IO] Disconnected');
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;

