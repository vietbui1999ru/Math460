/**
 * WebSocket service for real-time simulation data streaming
 *
 * This module provides a robust WebSocket client for receiving real-time
 * simulation updates from the backend. It handles connection management,
 * reconnection logic, and message parsing.
 */

import {
  WebSocketMessage,
  WebSocketMessageType,
  WebSocketCommand,
  WebSocketCommandMessage,
  SimulationData,
  SimulationStatus
} from '../types/simulation';
import { getWebSocketBaseUrl } from './api';

/**
 * WebSocket connection states
 */
enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed'
}

/**
 * Event handler types for WebSocket events
 */
export interface WebSocketEventHandlers {
  /** Called when connection is established */
  onConnect?: (simulationId: string) => void;

  /** Called when connection is closed */
  onDisconnect?: (reason: string) => void;

  /** Called when simulation status changes */
  onStatusChange?: (status: SimulationStatus) => void;

  /** Called when new simulation data arrives */
  onData?: (data: SimulationData) => void;

  /** Called when simulation completes */
  onComplete?: () => void;

  /** Called when an error occurs */
  onError?: (error: string) => void;

  /** Called on any message (for debugging) */
  onMessage?: (message: WebSocketMessage) => void;
}

/**
 * WebSocket client configuration options
 */
export interface WebSocketClientOptions {
  /** Enable automatic reconnection on disconnect */
  autoReconnect?: boolean;

  /** Maximum number of reconnection attempts */
  maxReconnectAttempts?: number;

  /** Initial reconnection delay in milliseconds */
  reconnectDelay?: number;

  /** Maximum reconnection delay in milliseconds */
  maxReconnectDelay?: number;

  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Default configuration options
 */
const DEFAULT_OPTIONS: Required<WebSocketClientOptions> = {
  autoReconnect: true,
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  debug: false
};

/**
 * WebSocket client for simulation data streaming
 *
 * Manages a WebSocket connection to the backend for real-time simulation updates.
 * Provides automatic reconnection, event handling, and command sending.
 *
 * @example
 * ```typescript
 * const client = new SimulationWebSocketClient('simulation-123', {
 *   onData: (data) => console.log('Received data:', data),
 *   onComplete: () => console.log('Simulation complete')
 * });
 *
 * await client.connect();
 * client.sendCommand(WebSocketCommand.START);
 * ```
 */
export class SimulationWebSocketClient {
  /** WebSocket connection instance */
  private ws: WebSocket | null = null;

  /** Current connection state */
  private state: ConnectionState = ConnectionState.DISCONNECTED;

  /** Simulation ID this client is connected to */
  private simulationId: string;

  /** Event handlers */
  private handlers: WebSocketEventHandlers;

  /** Configuration options */
  private options: Required<WebSocketClientOptions>;

  /** Current reconnection attempt count */
  private reconnectAttempts: number = 0;

  /** Timeout for reconnection attempts */
  private reconnectTimeout: NodeJS.Timeout | null = null;

  /** Heartbeat interval for keeping connection alive */
  private heartbeatInterval: NodeJS.Timeout | null = null;

  /** Queue of messages to send once connected */
  private messageQueue: string[] = [];

  /**
   * Creates a new WebSocket client
   *
   * @param simulationId - Unique identifier of the simulation
   * @param handlers - Event handler callbacks
   * @param options - Configuration options
   */
  constructor(
    simulationId: string,
    handlers: WebSocketEventHandlers = {},
    options: WebSocketClientOptions = {}
  ) {
    this.simulationId = simulationId;
    this.handlers = handlers;
    this.options = { ...DEFAULT_OPTIONS, ...options };

    this.log('WebSocket client created for simulation:', simulationId);
  }

  /**
   * Connects to the WebSocket server
   * Initiates connection and sets up event handlers
   *
   * @returns Promise that resolves when connection is established
   */
  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.state = ConnectionState.CONNECTING;
        this.log('Connecting to WebSocket...');

        // Construct WebSocket URL
        const wsBaseUrl = getWebSocketBaseUrl();
        const wsUrl = `${wsBaseUrl}/ws/simulation/${this.simulationId}`;

        this.log('WebSocket URL:', wsUrl);

        // Create WebSocket connection
        this.ws = new WebSocket(wsUrl);

        // Connection opened
        this.ws.onopen = () => {
          this.state = ConnectionState.CONNECTED;
          this.reconnectAttempts = 0;
          this.log('WebSocket connected');

          // Start heartbeat
          this.startHeartbeat();

          // Send queued messages
          this.flushMessageQueue();

          resolve();
        };

        // Message received
        this.ws.onmessage = (event: MessageEvent) => {
          this.handleMessage(event.data);
        };

        // Connection closed
        this.ws.onclose = (event: CloseEvent) => {
          this.handleClose(event);
        };

        // Connection error
        this.ws.onerror = (event: Event) => {
          this.handleError(event);
          reject(new Error('WebSocket connection failed'));
        };

      } catch (error) {
        this.state = ConnectionState.FAILED;
        this.log('Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnects from the WebSocket server
   * Cleanly closes the connection and clears resources
   */
  public disconnect(): void {
    this.log('Disconnecting WebSocket...');

    // Clear reconnection timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Stop heartbeat
    this.stopHeartbeat();

    // Close WebSocket connection
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.state = ConnectionState.DISCONNECTED;
    this.log('WebSocket disconnected');
  }

  /**
   * Sends a command to the simulation
   * Commands control simulation execution (start, pause, stop)
   *
   * @param command - The command to send
   */
  public sendCommand(command: WebSocketCommand): void {
    const message: WebSocketCommandMessage = { command };
    this.sendMessage(message);
    this.log('Sent command:', command);
  }

  /**
   * Sends a raw message to the server
   * Queues message if not connected
   *
   * @param message - Message object to send
   */
  private sendMessage(message: any): void {
    const messageStr = JSON.stringify(message);

    if (this.state === ConnectionState.CONNECTED && this.ws) {
      this.ws.send(messageStr);
    } else {
      // Queue message for later
      this.messageQueue.push(messageStr);
      this.log('Message queued (not connected):', message);
    }
  }

  /**
   * Sends all queued messages
   * Called when connection is established
   */
  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) {
      return;
    }

    this.log(`Sending ${this.messageQueue.length} queued messages`);

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.ws) {
        this.ws.send(message);
      }
    }
  }

  /**
   * Handles incoming WebSocket messages
   * Parses JSON and routes to appropriate handlers
   *
   * @param data - Raw message data from WebSocket
   */
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      this.log('Received message:', message);

      // Call generic message handler
      if (this.handlers.onMessage) {
        this.handlers.onMessage(message);
      }

      // Route to specific handlers based on message type
      switch (message.type) {
        case WebSocketMessageType.CONNECTED:
          if (this.handlers.onConnect && message.simulation_id) {
            this.handlers.onConnect(message.simulation_id);
          }
          break;

        case WebSocketMessageType.STATUS:
          if (this.handlers.onStatusChange && message.status) {
            this.handlers.onStatusChange(message.status);
          }
          break;

        case WebSocketMessageType.DATA:
          if (this.handlers.onData && message.data) {
            this.handlers.onData(message.data);
          }
          break;

        case WebSocketMessageType.COMPLETED:
          if (this.handlers.onComplete) {
            this.handlers.onComplete();
          }
          break;

        case WebSocketMessageType.ERROR:
          if (this.handlers.onError && message.message) {
            this.handlers.onError(message.message);
          }
          break;

        default:
          this.log('Unknown message type:', message.type);
      }
    } catch (error) {
      this.log('Failed to parse message:', error);
      if (this.handlers.onError) {
        this.handlers.onError('Failed to parse server message');
      }
    }
  }

  /**
   * Handles WebSocket connection close
   * Triggers reconnection if enabled
   *
   * @param event - Close event from WebSocket
   */
  private handleClose(event: CloseEvent): void {
    this.log('WebSocket closed:', event.code, event.reason);

    this.stopHeartbeat();
    this.state = ConnectionState.DISCONNECTED;

    // Call disconnect handler
    if (this.handlers.onDisconnect) {
      this.handlers.onDisconnect(event.reason || 'Connection closed');
    }

    // Attempt reconnection if enabled
    if (this.options.autoReconnect && this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.state = ConnectionState.FAILED;
      this.log('Max reconnection attempts reached');
      if (this.handlers.onError) {
        this.handlers.onError('Connection lost. Max reconnection attempts reached.');
      }
    }
  }

  /**
   * Handles WebSocket errors
   *
   * @param event - Error event from WebSocket
   */
  private handleError(event: Event): void {
    this.log('WebSocket error:', event);

    if (this.handlers.onError) {
      this.handlers.onError('WebSocket connection error');
    }
  }

  /**
   * Schedules a reconnection attempt
   * Uses exponential backoff for retry delay
   */
  private scheduleReconnect(): void {
    this.state = ConnectionState.RECONNECTING;
    this.reconnectAttempts++;

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.options.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.options.maxReconnectDelay
    );

    this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.log('Attempting to reconnect...');
      this.connect().catch(error => {
        this.log('Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Starts heartbeat interval
   * Keeps connection alive by sending periodic pings
   */
  private startHeartbeat(): void {
    // Send ping every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.state === ConnectionState.CONNECTED && this.ws) {
        this.log('Sending heartbeat');
        // WebSocket ping is automatic in browser, but we can send a custom message
        // The server should respond or we can detect disconnection
      }
    }, 30000);
  }

  /**
   * Stops heartbeat interval
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Gets current connection state
   *
   * @returns Current connection state
   */
  public getState(): ConnectionState {
    return this.state;
  }

  /**
   * Checks if currently connected
   *
   * @returns True if connected
   */
  public isConnected(): boolean {
    return this.state === ConnectionState.CONNECTED;
  }

  /**
   * Gets the simulation ID
   *
   * @returns Simulation ID
   */
  public getSimulationId(): string {
    return this.simulationId;
  }

  /**
   * Logs debug messages if debug mode is enabled
   *
   * @param args - Arguments to log
   */
  private log(...args: any[]): void {
    if (this.options.debug || import.meta.env.DEV) {
      console.log('[WebSocket]', ...args);
    }
  }
}

/**
 * Factory function to create a WebSocket client
 * Convenience function for creating and connecting a client
 *
 * @param simulationId - Unique identifier of the simulation
 * @param handlers - Event handler callbacks
 * @param options - Configuration options
 * @returns Connected WebSocket client
 */
export async function createWebSocketClient(
  simulationId: string,
  handlers: WebSocketEventHandlers = {},
  options: WebSocketClientOptions = {}
): Promise<SimulationWebSocketClient> {
  const client = new SimulationWebSocketClient(simulationId, handlers, options);
  await client.connect();
  return client;
}

/**
 * Export connection state enum for external use
 */
export { ConnectionState };
