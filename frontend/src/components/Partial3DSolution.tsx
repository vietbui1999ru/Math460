/**
 * Partial 3D Solution Visualization
 *
 * Displays a time slice of the solution showing:
 * - X-axis: Position (full spatial domain)
 * - Y-axis: Time (narrow range around current time)
 * - Z-axis: Solution value u(x,t)
 *
 * Useful for seeing temporal evolution in a compact 3D view.
 */

import React, { useEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import { SimulationData, EquationType } from '../types/simulation';
import { getOptimizedPlotlyConfig, getOptimizedLayout } from '../utils/visualizationOptimizations';

interface Partial3DSolutionProps {
  /** All simulation data (for time slicing) */
  allData: SimulationData[];

  /** Current time index */
  currentTimeIndex: number;

  /** Type of equation being solved */
  equationType?: EquationType;

  /** Number of time steps to include in the partial solution (before and after current) */
  timeSliceSize?: number;

  /** Global minimum for color scaling */
  globalMin?: number;

  /** Global maximum for color scaling */
  globalMax?: number;

  /** Height of the visualization */
  height?: string | number;

  /** Color scheme */
  colorScheme?: string;

  /** Show grid lines */
  showGrid?: boolean;

  /** Title override */
  title?: string;
}

/**
 * Partial 3D Solution Component
 *
 * Creates a 3D surface showing a temporal slice of the solution.
 * The time window slides as the simulation progresses, always centered
 * on the current time step.
 *
 * @example
 * ```tsx
 * <Partial3DSolution
 *   allData={allData}
 *   currentTimeIndex={currentTimeIndex}
 *   equationType={EquationType.HEAT}
 *   timeSliceSize={15}  // Show 30 time steps total (15 before, current, 15 after)
 * />
 * ```
 */
export const Partial3DSolution: React.FC<Partial3DSolutionProps> = ({
  allData,
  currentTimeIndex,
  equationType = EquationType.HEAT,
  timeSliceSize = 15, // Total window is 2*timeSliceSize + 1 frames
  globalMin,
  globalMax,
  height = '500px',
  colorScheme = 'Viridis',
  showGrid = true,
  title
}) => {
  const plotContainerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Render partial 3D solution
   */
  const renderPartial3DSolution = () => {
    if (!plotContainerRef.current || allData.length === 0) {
      return;
    }

    // Calculate time window bounds
    const startIdx = Math.max(0, currentTimeIndex - timeSliceSize);
    const endIdx = Math.min(allData.length - 1, currentTimeIndex + timeSliceSize);

    // Extract data for the time slice
    const timeSliceData = allData.slice(startIdx, endIdx + 1);
    if (timeSliceData.length < 2) {
      return; // Need at least 2 time steps for a surface
    }

    // Build z-matrix (u values over x and t)
    const zMatrix: number[][] = [];
    const xValues = timeSliceData[0].x_values;
    const tValues: number[] = [];
    const baseTime = allData[startIdx].time_value;

    timeSliceData.forEach(dataPoint => {
      tValues.push(dataPoint.time_value);
      zMatrix.push(dataPoint.u_values);
    });

    // Prepare data for Plotly
    const trace: Partial<Plotly.PlotData> = {
      x: xValues,
      y: tValues,
      z: zMatrix,
      type: 'surface',
      colorscale: colorScheme,
      showscale: true,
      colorbar: {
        title: 'u(x,t)',
        titleside: 'right',
        tickfont: { color: '#e0e0e0' }
      },
      // Fixed color scale for consistent visualization
      zmin: globalMin,
      zmax: globalMax
    };

    // Layout configuration
    const baseLayout: Partial<Plotly.Layout> = {
      title: {
        text:
          title ||
          `${equationType.toUpperCase()} - Partial 3D Solution (t = ${allData[currentTimeIndex].time_value.toFixed(4)})`,
        font: { color: '#e0e0e0', size: 16 }
      },
      scene: {
        xaxis: {
          title: 'Position (x)',
          gridcolor: showGrid ? '#444' : 'transparent',
          color: '#e0e0e0',
          backgroundcolor: '#1a1a1a'
        },
        yaxis: {
          title: 'Time (t)',
          gridcolor: showGrid ? '#444' : 'transparent',
          color: '#e0e0e0',
          backgroundcolor: '#1a1a1a'
        },
        zaxis: {
          title: 'Solution u(x,t)',
          gridcolor: showGrid ? '#444' : 'transparent',
          color: '#e0e0e0',
          backgroundcolor: '#1a1a1a'
        },
        bgcolor: '#1a1a1a',
        camera: {
          eye: { x: 1.5, y: 1.5, z: 1.2 }
        }
      },
      paper_bgcolor: '#1a1a1a',
      plot_bgcolor: '#1a1a1a',
      font: { color: '#e0e0e0' },
      margin: { l: 0, r: 0, t: 60, b: 0 }
    };

    const layout = getOptimizedLayout(baseLayout, {
      renderMode: 'webgl',
      enableVirtualWebGL: false,
      scatterGLMode: true,
      heatmapGLMode: true,
      disableAnimations: false,
      reduceDataPoints: false,
      maxDataPoints: 100000,
      enableBuffering: true
    });

    const config = getOptimizedPlotlyConfig({
      renderMode: 'webgl',
      enableVirtualWebGL: false,
      scatterGLMode: true,
      heatmapGLMode: true,
      disableAnimations: false,
      reduceDataPoints: false,
      maxDataPoints: 100000,
      enableBuffering: true
    });

    // Create or update the plot
    if (isInitialized) {
      Plotly.react(plotContainerRef.current, [trace], layout, config);
    } else {
      Plotly.newPlot(plotContainerRef.current, [trace], layout, config);
    }

    setIsInitialized(true);
  };

  // Render when data or current time changes
  useEffect(() => {
    renderPartial3DSolution();

    return () => {
      if (plotContainerRef.current) {
        Plotly.purge(plotContainerRef.current);
      }
    };
  }, [currentTimeIndex, allData, equationType, globalMin, globalMax, timeSliceSize]);

  if (allData.length < 2) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#a0a0a0', textAlign: 'center' }}>
          <p>Insufficient data for partial 3D visualization</p>
          <p style={{ fontSize: '0.85rem', color: '#707070' }}>Run simulation to collect more time steps</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={plotContainerRef}
      style={{
        width: '100%',
        height,
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    />
  );
};

export default Partial3DSolution;
