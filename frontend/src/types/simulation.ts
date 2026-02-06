/**
 * Type definitions for PDE simulation platform
 *
 * This file contains all TypeScript interfaces and types used throughout
 * the application for type safety and better developer experience.
 */

/**
 * Enumeration of supported PDE equation types
 * - HEAT: Heat diffusion equation (parabolic PDE)
 * - WAVE: Wave propagation equation (hyperbolic PDE)
 */
export enum EquationType {
  HEAT = 'heat',
  WAVE = 'wave'
}

/**
 * Enumeration of boundary condition types
 * - DIRICHLET: Fixed value at boundary (u(0,t) = constant)
 * - NEUMANN: Fixed derivative at boundary (∂u/∂x = constant)
 * - PERIODIC: Periodic boundaries (u(0,t) = u(L,t))
 */
export enum BoundaryConditionType {
  DIRICHLET = 'dirichlet',
  NEUMANN = 'neumann',
  PERIODIC = 'periodic'
}

/**
 * Enumeration of predefined initial condition patterns
 * - GAUSSIAN: Bell-shaped Gaussian distribution
 * - SINE: Sinusoidal wave pattern
 * - SQUARE: Square wave (step function)
 * - TRIANGLE: Triangular wave pattern
 * - CUSTOM: User-defined mathematical expression
 */
export enum InitialConditionType {
  GAUSSIAN = 'gaussian',
  SINE = 'sine',
  SQUARE = 'square',
  TRIANGLE = 'triangle',
  CUSTOM = 'custom'
}

/**
 * Simulation execution status
 * - IDLE: Simulation not started or reset
 * - RUNNING: Actively computing time steps
 * - PAUSED: Temporarily stopped, can be resumed
 * - COMPLETED: Finished all time steps
 * - ERROR: Encountered an error during execution
 */
export enum SimulationStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ERROR = 'error'
}

/**
 * Spatial domain configuration
 * Defines the physical space where the PDE is solved
 */
export interface SpatialDomain {
  /** Minimum x-coordinate (left boundary) */
  x_min: number;

  /** Maximum x-coordinate (right boundary) */
  x_max: number;

  /** Spatial step size (grid spacing) */
  dx: number;
}

/**
 * Temporal domain configuration
 * Defines the time interval for simulation
 */
export interface TemporalDomain {
  /** Starting time (usually 0) */
  t_min: number;

  /** Final time to simulate */
  t_max: number;

  /** Time step size */
  dt: number;
}

/**
 * Boundary condition configuration
 * Specifies behavior at domain boundaries
 */
export interface BoundaryCondition {
  /** Type of boundary condition */
  type: BoundaryConditionType;

  /** Value at left boundary (x_min) */
  left_value?: number;

  /** Value at right boundary (x_max) */
  right_value?: number;

  /** Derivative value for Neumann conditions */
  left_derivative?: number;
  right_derivative?: number;
}

/**
 * Initial condition configuration
 * Defines the state at t=0
 */
export interface InitialCondition {
  /** Type of initial condition pattern */
  type: InitialConditionType;

  /** Parameters specific to the pattern type */
  parameters?: {
    /** Amplitude for wave patterns */
    amplitude?: number;

    /** Frequency for periodic patterns */
    frequency?: number;

    /** Center position for localized patterns (e.g., Gaussian) */
    center?: number;

    /** Width/spread for localized patterns */
    width?: number;

    /** Custom mathematical expression (for CUSTOM type) */
    expression?: string;
  };
}

/**
 * Physical parameters for heat equation
 * Heat equation: ∂u/∂t = β * ∂²u/∂x²
 */
export interface HeatParameters {
  /** Thermal diffusivity coefficient (β) */
  beta: number;
}

/**
 * Physical parameters for wave equation
 * Wave equation: ∂²u/∂t² = c² * ∂²u/∂x²
 */
export interface WaveParameters {
  /** Wave speed (c) */
  c: number;

  /** Initial velocity distribution (∂u/∂t at t=0) */
  initial_velocity?: InitialCondition;
}

/**
 * Complete simulation configuration
 * Contains all parameters needed to run a simulation
 */
export interface SimulationConfig {
  /** Unique identifier for the simulation */
  simulation_id?: string;

  /** Type of PDE to solve */
  equation_type: EquationType;

  /** Spatial domain settings */
  spatial_domain: SpatialDomain;

  /** Temporal domain settings */
  temporal_domain: TemporalDomain;

  /** Boundary condition settings */
  boundary_condition: BoundaryCondition;

  /** Initial condition settings */
  initial_condition: InitialCondition;

  /** Physical parameters (equation-specific) */
  physical_parameters: HeatParameters | WaveParameters;
}

/**
 * Simulation data at a single time step
 * Represents the solution u(x, t) at a specific time
 */
export interface SimulationData {
  /** Unique identifier of the simulation */
  simulation_id: string;

  /** Index of the current time step */
  time_index: number;

  /** Actual time value */
  time_value: number;

  /** Array of spatial coordinates */
  x_values: number[];

  /** Array of solution values u(x, t) */
  u_values: number[];
}

/**
 * WebSocket message types
 * Defines all possible message types for real-time communication
 */
export enum WebSocketMessageType {
  /** Initial connection established */
  CONNECTED = 'connected',

  /** Status update (running, paused, etc.) */
  STATUS = 'status',

  /** Simulation data for a time step */
  DATA = 'data',

  /** Error occurred */
  ERROR = 'error',

  /** Simulation completed */
  COMPLETED = 'completed'
}

/**
 * WebSocket message structure
 * Generic message format for all WebSocket communications
 */
export interface WebSocketMessage {
  /** Type of message */
  type: WebSocketMessageType;

  /** Optional message text */
  message?: string;

  /** Optional simulation ID */
  simulation_id?: string;

  /** Optional status update */
  status?: SimulationStatus;

  /** Optional simulation data */
  data?: SimulationData;
}

/**
 * WebSocket command types
 * Commands that can be sent to control simulation
 */
export enum WebSocketCommand {
  /** Start or resume simulation */
  START = 'start',

  /** Pause simulation */
  PAUSE = 'pause',

  /** Stop and reset simulation */
  STOP = 'stop'
}

/**
 * WebSocket command message structure
 */
export interface WebSocketCommandMessage {
  /** Command to execute */
  command: WebSocketCommand;
}

/**
 * Validation result for simulation configuration
 * Returned by the validation endpoint
 */
export interface ValidationResult {
  /** Whether configuration is valid */
  valid: boolean;

  /** Array of error messages if invalid */
  errors?: string[];

  /** Array of warning messages */
  warnings?: string[];

  /** Computed stability parameter (σ) */
  stability_parameter?: number;

  /** Whether the scheme is stable */
  is_stable?: boolean;
}

/**
 * Preset configuration template
 * Pre-configured simulation setups for common use cases
 */
export interface SimulationPreset {
  /** Unique identifier for the preset */
  id: string;

  /** Human-readable name */
  name: string;

  /** Description of what this preset demonstrates */
  description: string;

  /** Complete configuration */
  config: SimulationConfig;

  /** Optional thumbnail or preview data */
  thumbnail?: string;
}

/**
 * Simulation metadata and status
 * Information about a running or completed simulation
 */
export interface SimulationInfo {
  /** Unique identifier */
  simulation_id: string;

  /** Current status */
  status: SimulationStatus;

  /** Configuration used */
  config: SimulationConfig;

  /** Creation timestamp */
  created_at: string;

  /** Last update timestamp */
  updated_at: string;

  /** Current progress (0-100) */
  progress?: number;

  /** Error message if status is ERROR */
  error_message?: string;
}

/**
 * API response wrapper
 * Standard response format for API endpoints
 */
export interface ApiResponse<T> {
  /** Whether request was successful */
  success: boolean;

  /** Response data */
  data?: T;

  /** Error message if not successful */
  error?: string;

  /** Additional error details */
  details?: any;
}

/**
 * Plot configuration options
 * Settings for visualization rendering
 */
export interface PlotConfig {
  /** Chart title */
  title?: string;

  /** X-axis label */
  xLabel?: string;

  /** Y-axis label */
  yLabel?: string;

  /** Color scheme */
  colorScheme?: string;

  /** Show grid lines */
  showGrid?: boolean;

  /** Show legend */
  showLegend?: boolean;

  /** Animation speed (ms per frame) */
  animationSpeed?: number;
}

/**
 * Solution metadata for complete solution response
 * Contains computed bounds and dimensional info
 */
export interface SolutionMetadata {
  /** Global minimum value across entire solution */
  global_min: number;

  /** Global maximum value across entire solution */
  global_max: number;

  /** Number of spatial points */
  nx: number;

  /** Number of time steps */
  nt: number;

  /** Computation time in milliseconds */
  computation_time_ms: number;

  /** Stability parameter (σ) */
  stability_parameter: number;
}

/**
 * Complete solution response
 * Contains full pre-computed solution for client-side playback
 */
export interface CompleteSolution {
  /** Unique identifier for the simulation */
  simulation_id: string;

  /** Configuration used to generate solution */
  config: SimulationConfig;

  /** Array of spatial coordinates (length: nx) */
  x_values: number[];

  /** Array of time values (length: nt) */
  t_values: number[];

  /** 2D array of solution values [nt][nx] */
  u_values: number[][];

  /** Metadata about the solution */
  metadata: SolutionMetadata;
}

/**
 * Application state
 * Global state management for the application
 */
export interface AppState {
  /** Current simulation configuration */
  config: SimulationConfig;

  /** Current simulation status */
  status: SimulationStatus;

  /** Current simulation ID */
  simulationId: string | null;

  /** Collected simulation data */
  simulationData: SimulationData[];

  /** Current time step being displayed */
  currentTimeStep: number;

  /** Whether WebSocket is connected */
  isConnected: boolean;

  /** Error message if any */
  error: string | null;

  /** Available presets */
  presets: SimulationPreset[];
}
