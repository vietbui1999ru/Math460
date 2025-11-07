/**
 * VisualizationCanvas Component
 *
 * Renders interactive visualizations of PDE simulation data using Plotly.js.
 * Supports 2D line plots for current time step and 3D surface plots for
 * complete spatiotemporal solutions.
 */

import React, { useEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import { SimulationData, EquationType } from '../types/simulation';

/**
 * Visualization mode types
 */
export enum VisualizationMode {
  /** 2D line plot showing u(x) at current time */
  LINE_2D = '2d',

  /** 3D surface plot showing u(x,t) for all time steps */
  SURFACE_3D = '3d',

  /** Heatmap showing u(x,t) */
  HEATMAP = 'heatmap'
}

/**
 * Props for the VisualizationCanvas component
 */
interface VisualizationCanvasProps {
  /** Current simulation data to display */
  currentData: SimulationData | null;

  /** All simulation data (for 3D visualization) */
  allData?: SimulationData[];

  /** Type of equation being solved */
  equationType?: EquationType;

  /** Visualization mode */
  mode?: VisualizationMode;

  /** Chart title */
  title?: string;

  /** X-axis label */
  xLabel?: string;

  /** Y-axis label */
  yLabel?: string;

  /** Z-axis label (for 3D) */
  zLabel?: string;

  /** Color scheme */
  colorScheme?: string;

  /** Whether to show grid lines */
  showGrid?: boolean;

  /** Custom CSS class name */
  className?: string;

  /** Height of the visualization */
  height?: string | number;
}

/**
 * VisualizationCanvas Component
 *
 * Creates interactive plots of PDE solutions using Plotly.js.
 * Automatically updates when new data arrives.
 *
 * Features:
 * - 2D line plots for current time step
 * - 3D surface plots for complete solutions
 * - Heatmap visualization
 * - Interactive zooming, panning, and rotation
 * - Automatic axis scaling
 *
 * @example
 * ```tsx
 * <VisualizationCanvas
 *   currentData={currentSimulationData}
 *   allData={allSimulationData}
 *   mode={VisualizationMode.LINE_2D}
 *   equationType={EquationType.HEAT}
 *   title="Heat Equation Solution"
 * />
 * ```
 */
export const VisualizationCanvas: React.FC<VisualizationCanvasProps> = ({
  currentData,
  allData = [],
  equationType = EquationType.HEAT,
  mode = VisualizationMode.LINE_2D,
  title,
  xLabel = 'x',
  yLabel = 'u(x, t)',
  zLabel = 'u',
  colorScheme = 'Viridis',
  showGrid = true,
  className = '',
  height = '500px'
}) => {
  // Reference to the div that will contain the plot
  const plotContainerRef = useRef<HTMLDivElement>(null);

  // Track if plot has been initialized
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Initializes or updates the plot when data or mode changes
   */
  useEffect(() => {
    if (!plotContainerRef.current) {
      return;
    }

    // Determine which plot to render based on mode
    if (mode === VisualizationMode.LINE_2D) {
      render2DPlot();
    } else if (mode === VisualizationMode.SURFACE_3D) {
      render3DPlot();
    } else if (mode === VisualizationMode.HEATMAP) {
      renderHeatmap();
    }

    setIsInitialized(true);

    // Cleanup function
    return () => {
      if (plotContainerRef.current) {
        Plotly.purge(plotContainerRef.current);
      }
    };
  }, [currentData, allData, mode, equationType]);

  /**
   * Renders a 2D line plot showing u(x) at the current time step
   */
  const render2DPlot = () => {
    if (!plotContainerRef.current || !currentData) {
      return;
    }

    // Prepare data for Plotly
    const trace: Partial<Plotly.PlotData> = {
      x: currentData.x_values,
      y: currentData.u_values,
      type: 'scatter',
      mode: 'lines+markers',
      name: `t = ${currentData.time_value.toFixed(4)}`,
      line: {
        color: '#00d4ff',
        width: 2
      },
      marker: {
        size: 4,
        color: '#00d4ff'
      }
    };

    // Layout configuration
    const layout: Partial<Plotly.Layout> = {
      title: {
        text: title || `${equationType.toUpperCase()} Equation Solution (2D)`,
        font: { color: '#e0e0e0', size: 18 }
      },
      xaxis: {
        title: xLabel,
        gridcolor: showGrid ? '#333' : 'transparent',
        color: '#e0e0e0'
      },
      yaxis: {
        title: yLabel,
        gridcolor: showGrid ? '#333' : 'transparent',
        color: '#e0e0e0'
      },
      paper_bgcolor: '#1a1a1a',
      plot_bgcolor: '#1a1a1a',
      font: { color: '#e0e0e0' },
      margin: { l: 60, r: 40, t: 60, b: 60 },
      hovermode: 'closest'
    };

    // Configuration options
    const config: Partial<Plotly.Config> = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['select2d', 'lasso2d']
    };

    // Create or update the plot
    if (isInitialized) {
      Plotly.react(plotContainerRef.current, [trace], layout, config);
    } else {
      Plotly.newPlot(plotContainerRef.current, [trace], layout, config);
    }
  };

  /**
   * Renders a 3D surface plot showing u(x,t) for all time steps
   */
  const render3DPlot = () => {
    if (!plotContainerRef.current || allData.length === 0) {
      return;
    }

    // Build z-matrix (u values over x and t)
    const zMatrix: number[][] = [];
    const xValues = allData[0].x_values;
    const tValues: number[] = [];

    allData.forEach(dataPoint => {
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
        title: zLabel,
        titleside: 'right',
        tickfont: { color: '#e0e0e0' }
      }
    };

    // Layout configuration
    const layout: Partial<Plotly.Layout> = {
      title: {
        text: title || `${equationType.toUpperCase()} Equation Solution (3D)`,
        font: { color: '#e0e0e0', size: 18 }
      },
      scene: {
        xaxis: {
          title: xLabel,
          gridcolor: showGrid ? '#444' : 'transparent',
          color: '#e0e0e0',
          backgroundcolor: '#1a1a1a'
        },
        yaxis: {
          title: 't (time)',
          gridcolor: showGrid ? '#444' : 'transparent',
          color: '#e0e0e0',
          backgroundcolor: '#1a1a1a'
        },
        zaxis: {
          title: zLabel,
          gridcolor: showGrid ? '#444' : 'transparent',
          color: '#e0e0e0',
          backgroundcolor: '#1a1a1a'
        },
        bgcolor: '#1a1a1a'
      },
      paper_bgcolor: '#1a1a1a',
      plot_bgcolor: '#1a1a1a',
      font: { color: '#e0e0e0' },
      margin: { l: 0, r: 0, t: 60, b: 0 }
    };

    // Configuration options
    const config: Partial<Plotly.Config> = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false
    };

    // Create or update the plot
    if (isInitialized) {
      Plotly.react(plotContainerRef.current, [trace], layout, config);
    } else {
      Plotly.newPlot(plotContainerRef.current, [trace], layout, config);
    }
  };

  /**
   * Renders a heatmap showing u(x,t)
   */
  const renderHeatmap = () => {
    if (!plotContainerRef.current || allData.length === 0) {
      return;
    }

    // Build z-matrix (u values over x and t)
    const zMatrix: number[][] = [];
    const xValues = allData[0].x_values;
    const tValues: number[] = [];

    allData.forEach(dataPoint => {
      tValues.push(dataPoint.time_value);
      zMatrix.push(dataPoint.u_values);
    });

    // Prepare data for Plotly
    const trace: Partial<Plotly.PlotData> = {
      x: xValues,
      y: tValues,
      z: zMatrix,
      type: 'heatmap',
      colorscale: colorScheme,
      showscale: true,
      colorbar: {
        title: zLabel,
        titleside: 'right',
        tickfont: { color: '#e0e0e0' }
      }
    };

    // Layout configuration
    const layout: Partial<Plotly.Layout> = {
      title: {
        text: title || `${equationType.toUpperCase()} Equation Solution (Heatmap)`,
        font: { color: '#e0e0e0', size: 18 }
      },
      xaxis: {
        title: xLabel,
        gridcolor: showGrid ? '#333' : 'transparent',
        color: '#e0e0e0'
      },
      yaxis: {
        title: 't (time)',
        gridcolor: showGrid ? '#333' : 'transparent',
        color: '#e0e0e0'
      },
      paper_bgcolor: '#1a1a1a',
      plot_bgcolor: '#1a1a1a',
      font: { color: '#e0e0e0' },
      margin: { l: 60, r: 40, t: 60, b: 60 }
    };

    // Configuration options
    const config: Partial<Plotly.Config> = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false
    };

    // Create or update the plot
    if (isInitialized) {
      Plotly.react(plotContainerRef.current, [trace], layout, config);
    } else {
      Plotly.newPlot(plotContainerRef.current, [trace], layout, config);
    }
  };

  /**
   * Renders empty state when no data is available
   */
  if (!currentData && allData.length === 0) {
    return (
      <div className={`visualization-canvas ${className}`} style={{ height }}>
        <div className="visualization-empty">
          <p>No simulation data available</p>
          <p className="visualization-hint">Start a simulation to see visualization</p>
        </div>
      </div>
    );
  }

  /**
   * Renders 3D mode empty state when insufficient data
   */
  if ((mode === VisualizationMode.SURFACE_3D || mode === VisualizationMode.HEATMAP) && allData.length < 2) {
    return (
      <div className={`visualization-canvas ${className}`} style={{ height }}>
        <div className="visualization-empty">
          <p>Insufficient data for {mode === VisualizationMode.SURFACE_3D ? '3D' : 'heatmap'} visualization</p>
          <p className="visualization-hint">Run simulation to collect more time steps</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`visualization-canvas ${className}`}>
      <div
        ref={plotContainerRef}
        className="plot-container"
        style={{ height, width: '100%' }}
      />
    </div>
  );
};

export default VisualizationCanvas;
