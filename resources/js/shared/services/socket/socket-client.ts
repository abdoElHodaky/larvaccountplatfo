/**
 * Socket Client Service
 * Simple socket client wrapper for real-time communication
 */

export interface SocketConfig {
    url?: string;
    autoConnect?: boolean;
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
}

export interface SocketClient {
    connect: () => void;
    disconnect: () => void;
    isConnected: () => boolean;
    on: (event: string, callback: (data: any) => void) => void;
    off: (event: string, callback?: (data: any) => void) => void;
    emit: (event: string, data?: any) => void;
    join: (room: string) => void;
    leave: (room: string) => void;
}

/**
 * Simple Socket Client Implementation
 * Placeholder implementation for socket functionality
 */
class SimpleSocketClient implements SocketClient {
    private connected = false;
    private listeners: Map<string, ((data: any) => void)[]> = new Map();

    connect(): void {
        this.connected = true;
        console.log('Socket client connected (placeholder)');
    }

    disconnect(): void {
        this.connected = false;
        console.log('Socket client disconnected (placeholder)');
    }

    isConnected(): boolean {
        return this.connected;
    }

    on(event: string, callback: (data: any) => void): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
    }

    off(event: string, callback?: (data: any) => void): void {
        if (!this.listeners.has(event)) return;

        if (callback) {
            const callbacks = this.listeners.get(event)!;
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        } else {
            this.listeners.delete(event);
        }
    }

    emit(event: string, data?: any): void {
        console.log(`Socket emit: ${event}`, data);
    }

    join(room: string): void {
        console.log(`Socket join room: ${room}`);
    }

    leave(room: string): void {
        console.log(`Socket leave room: ${room}`);
    }
}

// Export singleton instance
export const socketClient = new SimpleSocketClient();

// Export default config
export const defaultSocketConfig: SocketConfig = {
    url: '/socket.io',
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
};
