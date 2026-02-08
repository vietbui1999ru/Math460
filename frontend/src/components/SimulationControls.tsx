/**
 * SimulationControls Component
 *
 * Provides playback controls for simulations including play, pause, stop, reset,
 * and time step navigation. Similar to video player controls but for PDE simulations.
 */

import React, { useState, useEffect } from 'react';
import { SimulationStatus } from '../types/simulation';

/**
 * Props for the SimulationControls component
 */
interface SimulationControlsProps {
  /** Current simulation status */
  status: SimulationStatus;

  /** Current time step index */
  currentTimeStep: number;

  /** Total number of time steps */
  totalTimeSteps: number;

  /** Current time value */
  currentTime: number;

  /** Maximum time value */
  maxTime: number;

  /** Whether a solution exists */
  hasSolution: boolean;

  /** Callback to start playback */
  onPlay: () => void;

  /** Callback to pause playback */
  onPause: () => void;

  /** Callback to reset to frame 0 */
  onReset: () => void;

  /** Callback to seek to a specific time step */
  onSeek: (timeStep: number) => void;

  /** Callback to step forward one frame */
  onStepForward: () => void;

  /** Callback to step backward one frame */
  onStepBackward: () => void;

  /** Callback to change playback speed */
  onSpeedChange: (speed: number) => void;

  /** Playback speed multiplier (default 1.0) */
  playbackSpeed?: number;

  /** Custom CSS class name */
  className?: string;
}

/**
 * Available playback speed options
 */
const SPEED_OPTIONS = [0.25, 0.5, 1.0, 2.0, 4.0];

/**
 * SimulationControls Component
 *
 * Provides a control panel for managing simulation playback.
 * Features:
 * - Play/Pause toggle
 * - Stop and reset
 * - Time step scrubbing
 * - Playback speed control
 * - Progress display
 *
 * @example
 * ```tsx
 * <SimulationControls
 *   status={simulationStatus}
 *   currentTimeStep={currentStep}
 *   totalTimeSteps={totalSteps}
 *   currentTime={0.5}
 *   maxTime={1.0}
 *   isConnected={true}
 *   onCommand={handleCommand}
 *   onSeek={handleSeek}
 *   onReset={handleReset}
 * />
 * ```
 */
export const SimulationControls: React.FC<SimulationControlsProps> = ({
  status,
  currentTimeStep,
  totalTimeSteps,
  currentTime,
  maxTime,
  hasSolution,
  onPlay,
  onPause,
  onReset,
  onSeek,
  onStepForward,
  onStepBackward,
  onSpeedChange,
  playbackSpeed = 1.0,
  className = ''
}) => {
  // Local state for slider value (for smooth dragging)
  const [sliderValue, setSliderValue] = useState(currentTimeStep);

  // Update slider when currentTimeStep changes externally
  useEffect(() => {
    setSliderValue(currentTimeStep);
  }, [currentTimeStep]);

  /**
   * Handles play/pause button click
   * Toggles between playing and paused states
   */
  const handlePlayPause = () => {
    if (status === SimulationStatus.RUNNING) {
      onPause();
    } else {
      onPlay();
    }
  };

  /**
   * Handles reset button click
   * Resets simulation to frame 0
   */
  const handleResetClick = () => {
    onReset();
  };

  /**
   * Handles time step slider change
   * Updates local state for smooth dragging
   *
   * @param event - Change event from slider
   */
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    setSliderValue(value);
  };

  /**
   * Handles time step slider release
   * Commits the seek operation
   *
   * @param event - Change event from slider
   */
  const handleSliderRelease = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    onSeek(value);
  };

  /**
   * Handles step forward button click
   * Advances one time step
   */
  const handleStepForwardClick = () => {
    onStepForward();
  };

  /**
   * Handles step backward button click
   * Goes back one time step
   */
  const handleStepBackwardClick = () => {
    onStepBackward();
  };

  /**
   * Handles playback speed change
   *
   * @param event - Change event from speed selector
   */
  const handleSpeedChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const speed = parseFloat(event.target.value);
    if (onSpeedChange) {
      onSpeedChange(speed);
    }
  };

  /**
   * Formats time value for display
   *
   * @param time - Time value to format
   * @returns Formatted time string
   */
  const formatTime = (time: number): string => {
    return time.toFixed(4);
  };

  /**
   * Calculates progress percentage
   */
  const progressPercentage = totalTimeSteps > 0
    ? (currentTimeStep / (totalTimeSteps - 1)) * 100
    : 0;

  /**
   * Determines if controls should be disabled
   */
  const isDisabled = !hasSolution || status === SimulationStatus.ERROR;

  /**
   * Determines if play button should be disabled
   */
  const isPlayDisabled = !hasSolution || status === SimulationStatus.ERROR;

  /**
   * Gets the appropriate icon for play/pause button
   */
  const getPlayPauseIcon = (): string => {
    if (status === SimulationStatus.RUNNING) {
      return '⏸'; // Pause icon
    }
    return '▶'; // Play icon
  };

  /**
   * Gets the appropriate label for play/pause button
   */
  const getPlayPauseLabel = (): string => {
    if (status === SimulationStatus.RUNNING) {
      return 'Pause';
    }
    return 'Play';
  };

  return (
    <div className={`simulation-controls ${className}`}>
      {/* Status indicator */}
      <div className="controls-status">
        <StatusIndicator status={status} hasSolution={hasSolution} />
      </div>

      {/* Main controls */}
      <div className="controls-main">
        {/* Play/Pause button */}
        <button
          className="btn-control btn-play-pause"
          onClick={handlePlayPause}
          disabled={isPlayDisabled}
          title={getPlayPauseLabel()}
          aria-label={getPlayPauseLabel()}
        >
          <span className="icon">{getPlayPauseIcon()}</span>
        </button>

        {/* Reset button */}
        <button
          className="btn-control btn-reset"
          onClick={handleResetClick}
          disabled={isDisabled}
          title="Reset"
          aria-label="Reset"
        >
          <span className="icon">↻</span>
        </button>

        {/* Step backward button */}
        <button
          className="btn-control btn-step"
          onClick={handleStepBackwardClick}
          disabled={isDisabled || currentTimeStep === 0}
          title="Step Backward"
          aria-label="Step Backward"
        >
          <span className="icon">⏮</span>
        </button>

        {/* Step forward button */}
        <button
          className="btn-control btn-step"
          onClick={handleStepForwardClick}
          disabled={isDisabled || currentTimeStep >= totalTimeSteps - 1}
          title="Step Forward"
          aria-label="Step Forward"
        >
          <span className="icon">⏭</span>
        </button>
      </div>

      {/* Time display */}
      <div className="controls-time">
        <span className="time-current">{formatTime(currentTime)}</span>
        <span className="time-separator">/</span>
        <span className="time-max">{formatTime(maxTime)}</span>
      </div>

      {/* Progress bar and slider */}
      <div className="controls-progress">
        <input
          type="range"
          className="progress-slider"
          min={0}
          max={totalTimeSteps - 1 || 0}
          value={sliderValue}
          onChange={handleSliderChange}
          onMouseUp={(e) => handleSliderRelease(e as any)}
          onTouchEnd={(e) => handleSliderRelease(e as any)}
          disabled={isDisabled || totalTimeSteps === 0}
          aria-label="Time step"
        />
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Step counter */}
      <div className="controls-steps">
        <span className="steps-label">Step:</span>
        <span className="steps-current">{currentTimeStep}</span>
        <span className="steps-separator">/</span>
        <span className="steps-total">{totalTimeSteps - 1}</span>
      </div>

      {/* Playback speed control */}
      <div className="controls-speed">
        <label htmlFor="speed-select" className="speed-label">
          Speed:
        </label>
        <select
          id="speed-select"
          className="speed-select"
          value={playbackSpeed}
          onChange={handleSpeedChange}
          disabled={isDisabled}
        >
          {SPEED_OPTIONS.map(speed => (
            <option key={speed} value={speed}>
              {speed}×
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

/**
 * Props for the StatusIndicator component
 */
interface StatusIndicatorProps {
  /** Current simulation status */
  status: SimulationStatus;

  /** Whether a solution exists */
  hasSolution: boolean;
}

/**
 * StatusIndicator Component
 *
 * Displays the current status of the simulation with appropriate icon and color.
 *
 * @param props - Component props
 */
const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, hasSolution }) => {
  /**
   * Gets the appropriate CSS class for the status
   */
  const getStatusClass = (): string => {
    if (!hasSolution) {
      return 'status-idle';
    }

    switch (status) {
      case SimulationStatus.IDLE:
        return 'status-idle';
      case SimulationStatus.RUNNING:
        return 'status-running';
      case SimulationStatus.PAUSED:
        return 'status-paused';
      case SimulationStatus.COMPLETED:
        return 'status-completed';
      case SimulationStatus.ERROR:
        return 'status-error';
      default:
        return 'status-unknown';
    }
  };

  /**
   * Gets the status text to display
   */
  const getStatusText = (): string => {
    if (!hasSolution) {
      return 'No Solution';
    }

    switch (status) {
      case SimulationStatus.IDLE:
        return 'Ready';
      case SimulationStatus.RUNNING:
        return 'Playing';
      case SimulationStatus.PAUSED:
        return 'Paused';
      case SimulationStatus.COMPLETED:
        return 'Completed';
      case SimulationStatus.ERROR:
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  /**
   * Gets the status icon
   */
  const getStatusIcon = (): string => {
    if (!hasSolution) {
      return '○';
    }

    switch (status) {
      case SimulationStatus.IDLE:
        return '●';
      case SimulationStatus.RUNNING:
        return '▶';
      case SimulationStatus.PAUSED:
        return '⏸';
      case SimulationStatus.COMPLETED:
        return '✓';
      case SimulationStatus.ERROR:
        return '✗';
      default:
        return '?';
    }
  };

  return (
    <div className={`status-indicator ${getStatusClass()}`}>
      <span className="status-icon">{getStatusIcon()}</span>
      <span className="status-text">{getStatusText()}</span>
    </div>
  );
};

export default SimulationControls;
