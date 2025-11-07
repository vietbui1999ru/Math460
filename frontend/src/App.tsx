/**
 * Main Application Component
 *
 * Root component that manages the entire PDE simulation platform.
 * Handles state management, API communication, WebSocket connections,
 * and orchestrates all child components.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './styles/App.css';
import {
  SimulationConfig,
  SimulationData,
  SimulationStatus,
  EquationType,
  BoundaryConditionType,
  InitialConditionType,
  WebSocketCommand,
  SimulationPreset
} from './types/simulation';
import { createSimulation, validateConfiguration } from './services/api';
import { SimulationWebSocketClient, createWebSocketClient } from './services/websocket';
import ParameterPanel from './components/ParameterPanel';
import VisualizationCanvas, { VisualizationMode } from './components/VisualizationCanvas';
import SimulationControls from './components/SimulationControls';
import PresetSelector from './components/PresetSelector';

/**
 * Default simulation configuration
 * Used as initial state and for reset operations
 */
const DEFAULT_CONFIG: SimulationConfig = {
  equation_type: EquationType.HEAT,
  spatial_domain: {
    x_min: 0.0,
    x_max: 1.0,
    dx: 0.01
  },
  temporal_domain: {
    t_min: 0.0,
    t_max: 1.0,
    dt: 0.001
  },
  boundary_condition: {
    type: BoundaryConditionType.DIRICHLET,
    left_value: 0.0,
    right_value: 0.0
  },
  initial_condition: {
    type: InitialConditionType.SINE,
    parameters: {
      amplitude: 1.0,
      frequency: 1.0
    }
  },
  physical_parameters: {
    beta: 1.0
  }
};

/**
 * Main App Component
 *
 * Central hub of the application that:
 * - Manages global state
 * - Coordinates API and WebSocket communication
 * - Handles simulation lifecycle
 * - Orchestrates UI components
 *
 * @example
 * ```tsx
 * ReactDOM.render(<App />, document.getElementById('root'));
 * ```
 */
export const App: React.FC = () => {
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  /** Current simulation configuration */
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);

  /** Current simulation ID (null if no simulation created) */
  const [simulationId, setSimulationId] = useState<string | null>(null);

  /** Current simulation status */
  const [status, setStatus] = useState<SimulationStatus>(SimulationStatus.IDLE);

  /** All received simulation data */
  const [simulationData, setSimulationData] = useState<SimulationData[]>([]);

  /** Current time step being displayed */
  const [currentTimeStep, setCurrentTimeStep] = useState<number>(0);

  /** Whether WebSocket is connected */
  const [isConnected, setIsConnected] = useState<boolean>(false);

  /** Error message (if any) */
  const [error, setError] = useState<string | null>(null);

  /** Loading state */
  const [loading, setLoading] = useState<boolean>(false);

  /** Visualization mode */
  const [vizMode, setVizMode] = useState<VisualizationMode>(VisualizationMode.LINE_2D);

  /** Playback speed multiplier */
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  /** WebSocket client reference */
  const wsClientRef = useRef<SimulationWebSocketClient | null>(null);

  // ============================================================
  // COMPUTED VALUES
  // ============================================================

  /** Current data point being displayed */
  const currentData = simulationData[currentTimeStep] || null;

  /** Total number of time steps */
  const totalTimeSteps = Math.floor(
    (config.temporal_domain.t_max - config.temporal_domain.t_min) /
    config.temporal_domain.dt
  ) + 1;

  /** Current time value */
  const currentTime = currentData?.time_value || config.temporal_domain.t_min;

  /** Maximum time value */
  const maxTime = config.temporal_domain.t_max;

  // ============================================================
  // LIFECYCLE HOOKS
  // ============================================================

  /**
   * Cleanup on component unmount
   * Ensures WebSocket is properly disconnected
   */
  useEffect(() => {
    return () => {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
      }
    };
  }, []);

  /**
   * Auto-advance time step when new data arrives in running state
   */
  useEffect(() => {
    if (status === SimulationStatus.RUNNING && simulationData.length > 0) {
      setCurrentTimeStep(simulationData.length - 1);
    }
  }, [simulationData.length, status]);

  // ============================================================
  // SIMULATION LIFECYCLE HANDLERS
  // ============================================================

  /**
   * Applies the current configuration and creates a new simulation
   * Validates config, creates simulation on backend, and establishes WebSocket
   */
  const handleApplyConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate configuration
      console.log('[App] Validating configuration...');
      const validationResult = await validateConfiguration(config);

      if (!validationResult.success || !validationResult.data?.valid) {
        const errors = validationResult.data?.errors || ['Validation failed'];
        setError(errors.join('\n'));
        setLoading(false);
        return;
      }

      // Create simulation
      console.log('[App] Creating simulation...');
      const createResult = await createSimulation(config);

      if (!createResult.success || !createResult.data) {
        setError(createResult.error || 'Failed to create simulation');
        setLoading(false);
        return;
      }

      const newSimulationId = createResult.data.simulation_id;
      setSimulationId(newSimulationId);
      console.log('[App] Simulation created:', newSimulationId);

      // Connect WebSocket
      await connectWebSocket(newSimulationId);

      setLoading(false);
    } catch (err) {
      console.error('[App] Error applying configuration:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setLoading(false);
    }
  };

  /**
   * Establishes WebSocket connection to the simulation
   *
   * @param simId - Simulation ID to connect to
   */
  const connectWebSocket = async (simId: string) => {
    try {
      console.log('[App] Connecting to WebSocket...');

      // Disconnect existing connection if any
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
      }

      // Create new WebSocket client
      const client = await createWebSocketClient(
        simId,
        {
          onConnect: (sid) => {
            console.log('[App] WebSocket connected:', sid);
            setIsConnected(true);
            setError(null);
          },
          onDisconnect: (reason) => {
            console.log('[App] WebSocket disconnected:', reason);
            setIsConnected(false);
          },
          onStatusChange: (newStatus) => {
            console.log('[App] Status changed:', newStatus);
            setStatus(newStatus);
          },
          onData: (data) => {
            console.log('[App] Received data:', data.time_index);
            setSimulationData(prev => {
              // Add new data or update existing
              const newData = [...prev];
              newData[data.time_index] = data;
              return newData;
            });
          },
          onComplete: () => {
            console.log('[App] Simulation completed');
            setStatus(SimulationStatus.COMPLETED);
          },
          onError: (errorMsg) => {
            console.error('[App] WebSocket error:', errorMsg);
            setError(errorMsg);
            setStatus(SimulationStatus.ERROR);
          }
        },
        {
          autoReconnect: true,
          debug: true
        }
      );

      wsClientRef.current = client;
    } catch (err) {
      console.error('[App] Failed to connect WebSocket:', err);
      setError('Failed to establish real-time connection');
      setIsConnected(false);
    }
  };

  /**
   * Resets the simulation to initial state
   * Clears all data and disconnects WebSocket
   */
  const handleReset = () => {
    console.log('[App] Resetting simulation');

    // Disconnect WebSocket
    if (wsClientRef.current) {
      wsClientRef.current.disconnect();
      wsClientRef.current = null;
    }

    // Reset state
    setSimulationId(null);
    setStatus(SimulationStatus.IDLE);
    setSimulationData([]);
    setCurrentTimeStep(0);
    setIsConnected(false);
    setError(null);
  };

  // ============================================================
  // SIMULATION CONTROL HANDLERS
  // ============================================================

  /**
   * Sends a command to the simulation via WebSocket
   *
   * @param command - Command to send (START, PAUSE, STOP)
   */
  const handleSendCommand = (command: WebSocketCommand) => {
    console.log('[App] Sending command:', command);

    if (!wsClientRef.current) {
      console.error('[App] No WebSocket connection');
      setError('Not connected to simulation');
      return;
    }

    wsClientRef.current.sendCommand(command);

    // Update local status optimistically
    if (command === WebSocketCommand.START) {
      setStatus(SimulationStatus.RUNNING);
    } else if (command === WebSocketCommand.PAUSE) {
      setStatus(SimulationStatus.PAUSED);
    } else if (command === WebSocketCommand.STOP) {
      handleReset();
    }
  };

  /**
   * Seeks to a specific time step
   *
   * @param timeStep - Time step index to seek to
   */
  const handleSeek = (timeStep: number) => {
    console.log('[App] Seeking to time step:', timeStep);

    if (timeStep >= 0 && timeStep < simulationData.length) {
      setCurrentTimeStep(timeStep);
    }
  };

  // ============================================================
  // PRESET HANDLERS
  // ============================================================

  /**
   * Handles preset selection
   * Loads preset configuration into the form
   *
   * @param presetConfig - Configuration from the selected preset
   */
  const handlePresetSelect = (presetConfig: SimulationConfig) => {
    console.log('[App] Preset selected');
    setConfig(presetConfig);

    // Reset simulation if one is running
    if (simulationId) {
      handleReset();
    }
  };

  // ============================================================
  // VISUALIZATION MODE HANDLERS
  // ============================================================

  /**
   * Handles visualization mode change
   *
   * @param newMode - New visualization mode
   */
  const handleVisualizationModeChange = (newMode: VisualizationMode) => {
    console.log('[App] Visualization mode changed:', newMode);
    setVizMode(newMode);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <h1>PDE Simulation Platform</h1>
        <p className="app-subtitle">
          Interactive solver for Heat and Wave equations using finite difference methods
        </p>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠</span>
          <span className="error-message">{error}</span>
          <button className="error-close" onClick={() => setError(null)}>
            ✕
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Setting up simulation...</p>
        </div>
      )}

      {/* Main Content */}
      <div className="app-content">
        {/* Left Panel: Configuration */}
        <aside className="sidebar-left">
          <div className="sidebar-section">
            <PresetSelector
              onPresetSelect={handlePresetSelect}
              displayMode="dropdown"
            />
          </div>

          <div className="sidebar-section">
            <ParameterPanel
              config={config}
              onChange={setConfig}
              onApply={handleApplyConfiguration}
              showValidation={true}
            />
          </div>
        </aside>

        {/* Center Panel: Visualization */}
        <main className="main-content">
          {/* Visualization Mode Selector */}
          <div className="viz-mode-selector">
            <button
              className={`viz-mode-btn ${vizMode === VisualizationMode.LINE_2D ? 'active' : ''}`}
              onClick={() => handleVisualizationModeChange(VisualizationMode.LINE_2D)}
            >
              2D Line Plot
            </button>
            <button
              className={`viz-mode-btn ${vizMode === VisualizationMode.SURFACE_3D ? 'active' : ''}`}
              onClick={() => handleVisualizationModeChange(VisualizationMode.SURFACE_3D)}
              disabled={simulationData.length < 2}
            >
              3D Surface
            </button>
            <button
              className={`viz-mode-btn ${vizMode === VisualizationMode.HEATMAP ? 'active' : ''}`}
              onClick={() => handleVisualizationModeChange(VisualizationMode.HEATMAP)}
              disabled={simulationData.length < 2}
            >
              Heatmap
            </button>
          </div>

          {/* Visualization */}
          <div className="visualization-container">
            <VisualizationCanvas
              currentData={currentData}
              allData={simulationData}
              mode={vizMode}
              equationType={config.equation_type}
              showGrid={true}
            />
          </div>

          {/* Controls */}
          <div className="controls-container">
            <SimulationControls
              status={status}
              currentTimeStep={currentTimeStep}
              totalTimeSteps={totalTimeSteps}
              currentTime={currentTime}
              maxTime={maxTime}
              isConnected={isConnected}
              onCommand={handleSendCommand}
              onSeek={handleSeek}
              onReset={handleReset}
              playbackSpeed={playbackSpeed}
              onSpeedChange={setPlaybackSpeed}
            />
          </div>

          {/* Info Panel */}
          <div className="info-panel">
            <div className="info-item">
              <span className="info-label">Equation:</span>
              <span className="info-value">{config.equation_type.toUpperCase()}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Data Points:</span>
              <span className="info-value">{simulationData.length}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Grid Size:</span>
              <span className="info-value">
                {currentData ? currentData.x_values.length : 0} points
              </span>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          PDE Simulation Platform | Built with React + TypeScript + FastAPI |{' '}
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            Documentation
          </a>
        </p>
      </footer>
    </div>
  );
};

export default App;
