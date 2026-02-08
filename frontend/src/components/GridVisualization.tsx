/**
 * GridVisualization Component
 *
 * Displays all four visualization modes in a 2x2 grid layout.
 * Shows: 2D Line Plot, 3D Surface, Heatmap, and Strip Animation simultaneously.
 */

import React from 'react';
import VisualizationCanvas, { VisualizationMode } from './VisualizationCanvas';
import { SimulationData, EquationType } from '../types/simulation';

/**
 * Props for the GridVisualization component
 */
interface GridVisualizationProps {
  /** Current simulation data to display */
  currentData: SimulationData | null;

  /** All simulation data (for 3D visualization) */
  allData?: SimulationData[];

  /** Type of equation being solved */
  equationType?: EquationType;

  /** Global minimum value for fixed axis scaling */
  globalMin?: number;

  /** Global maximum value for fixed axis scaling */
  globalMax?: number;

  /** Whether to use fixed axis ranges */
  useFixedAxes?: boolean;

  /** Color scheme for heatmap */
  colorScheme?: string;

  /** Whether to show grid lines */
  showGrid?: boolean;
}

/**
 * GridVisualization Component
 *
 * Renders a 2x2 grid containing:
 * - Top-left: 2D Line Plot (current time step)
 * - Top-right: 3D Surface Plot (complete solution)
 * - Bottom-left: Heatmap (u(x,t))
 * - Bottom-right: Strip Animation (current spatial distribution)
 *
 * All four visualizations are updated simultaneously with the same data.
 *
 * @example
 * ```tsx
 * <GridVisualization
 *   currentData={currentData}
 *   allData={allData}
 *   equationType={EquationType.HEAT}
 *   useFixedAxes={true}
 * />
 * ```
 */
export const GridVisualization: React.FC<GridVisualizationProps> = ({
  currentData,
  allData = [],
  equationType = EquationType.HEAT,
  globalMin,
  globalMax,
  useFixedAxes = false,
  colorScheme = 'Viridis',
  showGrid = true
}) => {
  // Check if we have sufficient data for all visualizations
  const hasCurrentData = currentData !== null;
  const hasAllData = allData.length >= 2;

  return (
    <div className="grid-visualization">
      <div className="grid-visualization-header">
        <h3>Four-Panel Visualization</h3>
        <p className="grid-subtitle">View all visualization modes simultaneously</p>
      </div>

      {/* 2x2 Grid Container */}
      <div className="grid-visualization-grid">
        {/* Top-Left: 2D Line Plot */}
        <div className="grid-panel grid-panel-tl">
          <div className="grid-panel-title">2D Line Plot</div>
          <VisualizationCanvas
            currentData={currentData}
            allData={allData}
            mode={VisualizationMode.LINE_2D}
            equationType={equationType}
            title={`${equationType.toUpperCase()} - Current Time Step`}
            xLabel="Position (x)"
            yLabel="Solution Value"
            showGrid={showGrid}
            globalMin={globalMin}
            globalMax={globalMax}
            useFixedAxes={useFixedAxes}
            height="100%"
          />
        </div>

        {/* Top-Right: 3D Surface Plot */}
        <div className="grid-panel grid-panel-tr">
          <div className="grid-panel-title">3D Surface</div>
          {hasAllData ? (
            <VisualizationCanvas
              currentData={currentData}
              allData={allData}
              mode={VisualizationMode.SURFACE_3D}
              equationType={equationType}
              title={`${equationType.toUpperCase()} - Complete Solution`}
              xLabel="Position (x)"
              zLabel="Solution Value"
              showGrid={showGrid}
              colorScheme={colorScheme}
              globalMin={globalMin}
              globalMax={globalMax}
              useFixedAxes={useFixedAxes}
              height="100%"
            />
          ) : (
            <div className="grid-panel-empty">
              <p>Insufficient data for 3D visualization</p>
              <p className="grid-hint">Run simulation to collect more time steps</p>
            </div>
          )}
        </div>

        {/* Bottom-Left: Heatmap */}
        <div className="grid-panel grid-panel-bl">
          <div className="grid-panel-title">Heatmap</div>
          {hasAllData ? (
            <VisualizationCanvas
              currentData={currentData}
              allData={allData}
              mode={VisualizationMode.HEATMAP}
              equationType={equationType}
              title={`${equationType.toUpperCase()} - Heatmap View`}
              xLabel="Position (x)"
              yLabel="Time (t)"
              zLabel="Solution Value"
              showGrid={showGrid}
              colorScheme={colorScheme}
              globalMin={globalMin}
              globalMax={globalMax}
              useFixedAxes={useFixedAxes}
              height="100%"
            />
          ) : (
            <div className="grid-panel-empty">
              <p>Insufficient data for heatmap visualization</p>
              <p className="grid-hint">Run simulation to collect more time steps</p>
            </div>
          )}
        </div>

        {/* Bottom-Right: Strip Animation */}
        <div className="grid-panel grid-panel-br">
          <div className="grid-panel-title">Strip Animation</div>
          {hasCurrentData ? (
            <VisualizationCanvas
              currentData={currentData}
              allData={allData}
              mode={VisualizationMode.HEATMAP_STRIP}
              equationType={equationType}
              title={`${equationType.toUpperCase()} - Spatial Distribution`}
              xLabel="Position (x)"
              yLabel="Intensity"
              showGrid={showGrid}
              colorScheme={colorScheme}
              globalMin={globalMin}
              globalMax={globalMax}
              useFixedAxes={useFixedAxes}
              height="100%"
            />
          ) : (
            <div className="grid-panel-empty">
              <p>No data available for strip animation</p>
              <p className="grid-hint">Run simulation to generate solution</p>
            </div>
          )}
        </div>
      </div>

      {/* Legend/Info */}
      <div className="grid-info-legend">
        <div className="legend-item">
          <span className="legend-label">TL: 2D Line Plot</span>
          <span className="legend-desc">Solution at current time step</span>
        </div>
        <div className="legend-item">
          <span className="legend-label">TR: 3D Surface</span>
          <span className="legend-desc">Complete spatiotemporal solution</span>
        </div>
        <div className="legend-item">
          <span className="legend-label">BL: Heatmap</span>
          <span className="legend-desc">Colored view of u(x,t)</span>
        </div>
        <div className="legend-item">
          <span className="legend-label">BR: Strip Animation</span>
          <span className="legend-desc">Current spatial distribution</span>
        </div>
      </div>
    </div>
  );
};

export default GridVisualization;
