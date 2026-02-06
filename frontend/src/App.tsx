/**
 * Main Application Component
 *
 * Root component that manages the entire PDE simulation platform.
 * Now uses client-side playback control with REST API pre-computed solutions.
 * Handles state management, animation loop, and orchestrates all child components.
 */

import React, { useState, useEffect, useRef } from 'react';
import './styles/App.css';
import {
  SimulationConfig,
  SimulationData,
  SimulationStatus,
  EquationType,
  BoundaryConditionType,
  InitialConditionType,
  CompleteSolution
} from './types/simulation';
import { solveSimulation, validateConfiguration } from './services/api';
import ParameterPanel from './components/ParameterPanel';
import VisualizationCanvas, { VisualizationMode } from './components/VisualizationCanvas';
import DraggableGridVisualization from './components/DraggableGridVisualization';
import Enhanced3DViewer from './components/Enhanced3DViewer';
import SimulationControls from './components/SimulationControls';
import PresetSelector from './components/PresetSelector';
import PerformanceOverlay from './components/PerformanceOverlay';
import {
  initializeVirtualWebGL,
  wouldExceedWebGLLimit,
  logOptimizationSettings,
  getRecommendedPreset
} from './utils/visualizationOptimizations';

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
 * - Manages global state (complete solution, current frame, playback state)
 * - Coordinates REST API communication
 * - Implements client-side animation loop with requestAnimationFrame
 * - Handles playback controls (play/pause/reset/seek/speed)
 * - Orchestrates UI components
 *
 * Architecture: REST + Client-Side Playback
 * - Backend computes complete solution once via /api/simulations/solve
 * - Frontend stores full solution in state
 * - Animation loop uses requestAnimationFrame for smooth 50 fps playback
 * - All controls (play/pause/reset/seek) handled client-side
 * - Fixed axes prevent "jumping" during animation
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

  /** Complete pre-computed solution (null if not solved yet) */
  const [completeSolution, setCompleteSolution] = useState<CompleteSolution | null>(null);

  /** Current time step index being displayed */
  const [currentTimeIndex, setCurrentTimeIndex] = useState<number>(0);

  /** Whether animation is currently playing */
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  /** Whether computation is in progress */
  const [isComputing, setIsComputing] = useState<boolean>(false);

  /** Current simulation status */
  const [status, setStatus] = useState<SimulationStatus>(SimulationStatus.IDLE);

  /** Error message (if any) */
  const [error, setError] = useState<string | null>(null);

  /** Visualization mode */
  const [vizMode, setVizMode] = useState<VisualizationMode>(VisualizationMode.LINE_2D);

  /** Playback speed multiplier (1.0 = 50 fps baseline) */
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  /** Reference to animation frame ID for cleanup */
  const animationFrameRef = useRef<number | null>(null);

  /** Reference to last frame timestamp for FPS control */
  const lastFrameTimeRef = useRef<number>(0);

  // ============================================================
  // COMPUTED VALUES
  // ============================================================

  /** Current data frame extracted from complete solution */
  const currentData: SimulationData | null = completeSolution
    ? {
        simulation_id: completeSolution.simulation_id,
        time_index: currentTimeIndex,
        time_value: completeSolution.t_values[currentTimeIndex],
        x_values: completeSolution.x_values,
        u_values: completeSolution.u_values[currentTimeIndex]
      }
    : null;

  /** All data for 3D/heatmap visualization */
  const allData: SimulationData[] = completeSolution
    ? completeSolution.u_values.map((u_vals, timeIdx) => ({
        simulation_id: completeSolution.simulation_id,
        time_index: timeIdx,
        time_value: completeSolution.t_values[timeIdx],
        x_values: completeSolution.x_values,
        u_values: u_vals
      }))
    : [];

  /** Total number of time steps */
  const totalTimeSteps = completeSolution?.metadata.nt || 0;

  /** Current time value */
  const currentTime = currentData?.time_value || 0;

  /** Maximum time value */
  const maxTime = config.temporal_domain.t_max;

  // ============================================================
  // LIFECYCLE HOOKS
  // ============================================================

  /**
   * Animation loop using requestAnimationFrame
   * Controls smooth playback at target frame rate with variable speed
   */
  useEffect(() => {
    if (!isPlaying || !completeSolution) {
      return;
    }

    const animate = (timestamp: number) => {
      // Initialize lastFrameTime on first call
      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = timestamp;
      }

      const elapsed = timestamp - lastFrameTimeRef.current;
      const targetFrameTime = 20 / playbackSpeed;  // 50 fps baseline (20ms per frame)

      // Advance frame if enough time has elapsed
      if (elapsed >= targetFrameTime) {
        setCurrentTimeIndex(prev => {
          // Stop at end of animation
          if (prev >= completeSolution.metadata.nt - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
        lastFrameTimeRef.current = timestamp;
      }

      // Continue animation loop
      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup: cancel animation frame on unmount or state change
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        lastFrameTimeRef.current = 0;
      }
    };
  }, [isPlaying, playbackSpeed, completeSolution]);

  /**
   * Cleanup on component unmount
   */
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  /**
   * Initialize GPU acceleration and Virtual WebGL support
   * Detects if we need Virtual WebGL and loads it from CDN
   */
  useEffect(() => {
    const initGPUAcceleration = async () => {
      const config = getRecommendedPreset();
      logOptimizationSettings(config);

      // Check if we need Virtual WebGL (for grid mode with multiple plots)
      if (vizMode === VisualizationMode.GRID) {
        if (wouldExceedWebGLLimit(4)) {
          console.log('⚠️ Initializing Virtual WebGL to support multiple WebGL plots');
          try {
            await initializeVirtualWebGL();
          } catch (err) {
            console.warn('Virtual WebGL initialization failed, falling back to standard rendering');
          }
        }
      }
    };

    initGPUAcceleration();
  }, [vizMode]);

  // ============================================================
  // SIMULATION LIFECYCLE HANDLERS
  // ============================================================

  /**
   * Applies the current configuration and computes complete solution
   * Validates config, calls /api/simulations/solve, stores full solution
   */
  const handleApplyConfiguration = async () => {
    try {
      setIsComputing(true);
      setError(null);
      setStatus(SimulationStatus.RUNNING);

      // Validate configuration
      console.log('[App] Validating configuration...');
      const validationResult = await validateConfiguration(config);

      if (!validationResult.success || !validationResult.data?.valid) {
        const errors = validationResult.data?.errors || ['Validation failed'];
        setError(errors.join('\n'));
        setIsComputing(false);
        setStatus(SimulationStatus.ERROR);
        return;
      }

      // Solve complete simulation
      console.log('[App] Solving simulation...');
      const solveResult = await solveSimulation(config);

      if (!solveResult.success || !solveResult.data) {
        setError(solveResult.error || 'Failed to solve simulation');
        setIsComputing(false);
        setStatus(SimulationStatus.ERROR);
        return;
      }

      // Store complete solution and reset playback
      setCompleteSolution(solveResult.data);
      setCurrentTimeIndex(0);
      setIsPlaying(false);
      setStatus(SimulationStatus.COMPLETED);
      setIsComputing(false);

      console.log('[App] Simulation solved successfully:', solveResult.data.simulation_id);
    } catch (err) {
      console.error('[App] Error applying configuration:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIsComputing(false);
      setStatus(SimulationStatus.ERROR);
    }
  };

  // ============================================================
  // PLAYBACK CONTROL HANDLERS (Client-Side Only)
  // ============================================================

  /**
   * Play animation from current frame
   * Restarts from frame 0 if at end
   */
  const handlePlay = () => {
    if (!completeSolution) return;

    // If at end, restart from beginning
    if (currentTimeIndex >= completeSolution.metadata.nt - 1) {
      setCurrentTimeIndex(0);
    }

    setIsPlaying(true);
    setStatus(SimulationStatus.RUNNING);
  };

  /**
   * Pause animation at current frame
   */
  const handlePause = () => {
    setIsPlaying(false);
    setStatus(SimulationStatus.PAUSED);
  };

  /**
   * Reset to frame 0 without clearing solution
   * Allows instant replay without re-computation
   */
  const handleReset = () => {
    console.log('[App] Resetting to frame 0');
    setIsPlaying(false);
    setCurrentTimeIndex(0);
    setStatus(SimulationStatus.COMPLETED);
  };

  /**
   * Jump to specific time frame
   *
   * @param timeIndex - Time step index to seek to
   */
  const handleSeek = (timeIndex: number) => {
    console.log('[App] Seeking to time step:', timeIndex);

    if (!completeSolution) return;

    const clamped = Math.max(0, Math.min(timeIndex, completeSolution.metadata.nt - 1));
    setCurrentTimeIndex(clamped);
  };

  /**
   * Step forward one frame
   */
  const handleStepForward = () => {
    if (!completeSolution) return;

    setCurrentTimeIndex(prev =>
      Math.min(prev + 1, completeSolution.metadata.nt - 1)
    );
  };

  /**
   * Step backward one frame
   */
  const handleStepBackward = () => {
    setCurrentTimeIndex(prev => Math.max(prev - 1, 0));
  };

  /**
   * Change playback speed
   *
   * @param speed - Speed multiplier (0.5, 1.0, 2.0, etc.)
   */
  const handleSpeedChange = (speed: number) => {
    console.log('[App] Playback speed changed to:', speed);
    setPlaybackSpeed(speed);
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

    // Reset solution if one exists
    if (completeSolution) {
      setCompleteSolution(null);
      setCurrentTimeIndex(0);
      setIsPlaying(false);
      setStatus(SimulationStatus.IDLE);
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
      {(isComputing) && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Computing simulation...</p>
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
              disabled={allData.length < 2}
            >
              3D Surface (Enhanced)
            </button>
            <button
              className={`viz-mode-btn ${vizMode === VisualizationMode.HEATMAP ? 'active' : ''}`}
              onClick={() => handleVisualizationModeChange(VisualizationMode.HEATMAP)}
              disabled={allData.length < 2}
            >
              Heatmap
            </button>
            <button
              className={`viz-mode-btn ${vizMode === VisualizationMode.HEATMAP_STRIP ? 'active' : ''}`}
              onClick={() => handleVisualizationModeChange(VisualizationMode.HEATMAP_STRIP)}
              disabled={!currentData}
            >
              Strip Animation
            </button>
            <button
              className={`viz-mode-btn ${vizMode === VisualizationMode.GRID ? 'active' : ''}`}
              onClick={() => handleVisualizationModeChange(VisualizationMode.GRID)}
              disabled={!currentData}
              title="Interactive 3x2 grid - drag panels to rearrange • 6 visualization types"
            >
              📊 3x2 Grid (Interactive)
            </button>
          </div>

          {/* Visualization */}
          <div className={`visualization-container ${vizMode === VisualizationMode.GRID ? 'grid-mode' : ''}`}>
            {vizMode === VisualizationMode.SURFACE_3D ? (
              // Enhanced 3D Viewer with complete/partial toggle
              <Enhanced3DViewer
                currentData={currentData}
                allData={allData}
                currentTimeIndex={currentTimeIndex}
                totalTimeSteps={totalTimeSteps}
                equationType={config.equation_type}
                globalMin={completeSolution?.metadata.global_min}
                globalMax={completeSolution?.metadata.global_max}
                useFixedAxes={true}
                showGrid={true}
                partialTimeSliceSize={Math.min(15, Math.floor(totalTimeSteps / 10))}
              />
            ) : vizMode === VisualizationMode.GRID ? (
              // Interactive 3x2 Grid Visualization
              <DraggableGridVisualization
                currentData={currentData}
                allData={allData}
                equationType={config.equation_type}
                globalMin={completeSolution?.metadata.global_min}
                globalMax={completeSolution?.metadata.global_max}
                useFixedAxes={true}
                showGrid={true}
                currentTimeIndex={currentTimeIndex}
                totalTimeSteps={totalTimeSteps}
              />
            ) : (
              // Standard single visualization
              <VisualizationCanvas
                currentData={currentData}
                allData={allData}
                mode={vizMode}
                equationType={config.equation_type}
                showGrid={true}
                globalMin={completeSolution?.metadata.global_min}
                globalMax={completeSolution?.metadata.global_max}
                useFixedAxes={true}
              />
            )}
          </div>

          {/* Controls */}
          <div className="controls-container">
            <SimulationControls
              status={status}
              currentTimeStep={currentTimeIndex}
              totalTimeSteps={totalTimeSteps}
              currentTime={currentTime}
              maxTime={maxTime}
              hasSolution={completeSolution !== null}
              onPlay={handlePlay}
              onPause={handlePause}
              onReset={handleReset}
              onSeek={handleSeek}
              onStepForward={handleStepForward}
              onStepBackward={handleStepBackward}
              onSpeedChange={handleSpeedChange}
              playbackSpeed={playbackSpeed}
            />
          </div>

          {/* Info Panel */}
          <div className="info-panel">
            <div className="info-item">
              <span className="info-label">Equation:</span>
              <span className="info-value">{config.equation_type.toUpperCase()}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Solution Data:</span>
              <span className="info-value">
                {completeSolution ? `${totalTimeSteps} time steps` : 'Not computed'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Grid Size:</span>
              <span className="info-value">
                {completeSolution ? `${completeSolution.metadata.nx} points` : '-'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Compute Time:</span>
              <span className="info-value">
                {completeSolution ? `${completeSolution.metadata.computation_time_ms.toFixed(1)}ms` : '-'}
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

      {/* Performance Overlay (Development Mode) */}
      <PerformanceOverlay enabled={process.env.NODE_ENV === 'development'} />
    </div>
  );
};

export default App;
