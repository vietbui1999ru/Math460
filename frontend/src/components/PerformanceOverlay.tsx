/**
 * Performance Overlay Component
 *
 * Displays real-time performance metrics in development mode.
 * Shows FPS, frame time, memory usage, and optimization status.
 */

import React, { useState, useEffect } from 'react';
import { PerformanceMonitor } from '../utils/performanceMonitor';
import { getRecommendedPreset } from '../utils/visualizationOptimizations';

interface PerformanceOverlayProps {
  enabled?: boolean;
}

/**
 * Performance Overlay Component
 *
 * Renders a floating performance monitor showing:
 * - Current and average FPS
 * - Frame time metrics
 * - Dropped frame count
 * - Memory usage (if available)
 * - GPU acceleration status
 */
export const PerformanceOverlay: React.FC<PerformanceOverlayProps> = ({
  enabled = process.env.NODE_ENV === 'development'
}) => {
  const [metrics, setMetrics] = useState<ReturnType<PerformanceMonitor['getMetrics']> | null>(null);
  const [expanded, setExpanded] = useState(false);
  const monitor = PerformanceMonitor.getInstance();
  const config = getRecommendedPreset();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    monitor.enable();

    const updateInterval = setInterval(() => {
      setMetrics(monitor.getMetrics());
    }, 500); // Update every 500ms for smoother display

    return () => {
      clearInterval(updateInterval);
      monitor.disable();
    };
  }, [enabled, monitor]);

  if (!enabled || !metrics) {
    return null;
  }

  const fpsColor =
    metrics.fps >= 50
      ? '#51cf66' // Green for good FPS
      : metrics.fps >= 30
        ? '#ffd43b' // Yellow for acceptable
        : '#ff6b6b'; // Red for poor

  const droppedPercentage = metrics.totalFrames > 0
    ? (metrics.droppedFrames / metrics.totalFrames) * 100
    : 0;

  return (
    <div className="performance-overlay">
      <div className="perf-header" onClick={() => setExpanded(!expanded)}>
        <span className="perf-icon">📊</span>
        <span className="perf-title">Performance</span>
        <span className="perf-fps" style={{ color: fpsColor }}>
          {Math.round(metrics.fps)} FPS
        </span>
        <button className="perf-toggle">
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {expanded && (
        <div className="perf-content">
          {/* FPS Section */}
          <div className="perf-section">
            <h4>Rendering</h4>
            <div className="perf-row">
              <span>Current FPS:</span>
              <span style={{ color: fpsColor }}>{Math.round(metrics.fps)}</span>
            </div>
            <div className="perf-row">
              <span>Average FPS:</span>
              <span>{Math.round(metrics.averageFPS * 10) / 10}</span>
            </div>
            <div className="perf-row">
              <span>Frame Time:</span>
              <span>{Math.round(metrics.frameTime * 100) / 100}ms</span>
            </div>
            <div className="perf-row">
              <span>Dropped Frames:</span>
              <span style={{ color: droppedPercentage > 10 ? '#ff6b6b' : '#51cf66' }}>
                {metrics.droppedFrames} ({Math.round(droppedPercentage * 10) / 10}%)
              </span>
            </div>
          </div>

          {/* Memory Section */}
          {metrics.memoryUsage !== undefined && (
            <div className="perf-section">
              <h4>Memory</h4>
              <div className="perf-row">
                <span>Heap Used:</span>
                <span>{Math.round(metrics.memoryUsage / 1024 / 1024)}MB</span>
              </div>
            </div>
          )}

          {/* GPU Acceleration Section */}
          <div className="perf-section">
            <h4>GPU Acceleration</h4>
            <div className="perf-row">
              <span>Render Mode:</span>
              <span style={{ color: '#00d4ff' }}>{config.renderMode}</span>
            </div>
            <div className="perf-row">
              <span>Virtual WebGL:</span>
              <span>{config.enableVirtualWebGL ? '✓ Enabled' : 'Disabled'}</span>
            </div>
            <div className="perf-row">
              <span>HeatmapGL:</span>
              <span>{config.heatmapGLMode ? '✓ Enabled' : 'Disabled'}</span>
            </div>
            <div className="perf-row">
              <span>ScatterGL:</span>
              <span>{config.scatterGLMode ? '✓ Enabled' : 'Disabled'}</span>
            </div>
          </div>

          {/* Frame Counter */}
          <div className="perf-section">
            <h4>Statistics</h4>
            <div className="perf-row">
              <span>Total Frames:</span>
              <span>{metrics.totalFrames}</span>
            </div>
            <div className="perf-row">
              <span>Render Time:</span>
              <span>{Math.round(metrics.renderTime * 100) / 100}ms</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceOverlay;
