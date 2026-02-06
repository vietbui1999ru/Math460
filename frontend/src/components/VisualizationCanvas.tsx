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
import {
  DEFAULT_OPTIMIZATION_CONFIG,
  getOptimizedPlotlyConfig,
  getOptimizedLayout,
  getRecommendedPreset,
  selectOptimalRenderMode
} from '../utils/visualizationOptimizations';
import { PerformanceMonitor } from '../utils/performanceMonitor';

/**
 * Visualization mode types
 */
export enum VisualizationMode {
  /** 2D line plot showing u(x) at current time */
  LINE_2D = '2d',

  /** 3D surface plot showing u(x,t) for all time steps */
  SURFACE_3D = '3d',

  /** Heatmap showing u(x,t) */
  HEATMAP = 'heatmap',

  /** Heatmap strip animation showing spatial distribution over time */
  HEATMAP_STRIP = 'heatmap_strip',

  /** 2x2 grid showing all four visualization modes simultaneously */
  GRID = 'grid'
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

  /** Global minimum value for fixed axis scaling */
  globalMin?: number;

  /** Global maximum value for fixed axis scaling */
  globalMax?: number;

  /** Whether to use fixed axis ranges (prevents jumping) */
  useFixedAxes?: boolean;
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
  height = '500px',
  globalMin,
  globalMax,
  useFixedAxes = false
}) => {
  // Reference to the div that will contain the plot
  const plotContainerRef = useRef<HTMLDivElement>(null);

  // Track if plot has been initialized
  const [isInitialized, setIsInitialized] = useState(false);

  // GPU acceleration and optimization config
  const optimizationConfigRef = useRef(getRecommendedPreset());
  const performanceMonitorRef = useRef(PerformanceMonitor.getInstance());

  // Enable performance monitoring in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      performanceMonitorRef.current.enable();
    }
  }, []);

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
    } else if (mode === VisualizationMode.HEATMAP_STRIP) {
      renderHeatmapStrip();
    }

    setIsInitialized(true);

    // Cleanup function
    return () => {
      if (plotContainerRef.current) {
        Plotly.purge(plotContainerRef.current);
      }
    };
  }, [currentData, allData, mode, equationType, globalMin, globalMax, useFixedAxes]);

  /**
   * Renders a 2D line plot showing u(x) at the current time step
   */
  const render2DPlot = () => {
    if (!plotContainerRef.current || !currentData) {
      return;
    }

    performanceMonitorRef.current.startFrame();

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

    // Calculate fixed axis range with padding if enabled
    let yaxisRange: [number, number] | undefined;
    if (useFixedAxes && globalMin !== undefined && globalMax !== undefined) {
      const padding = (globalMax - globalMin) * 0.1;
      yaxisRange = [globalMin - padding, globalMax + padding];
    }

    // Layout configuration with GPU optimizations
    const baseLayout: Partial<Plotly.Layout> = {
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
        color: '#e0e0e0',
        range: yaxisRange
      },
      paper_bgcolor: '#1a1a1a',
      plot_bgcolor: '#1a1a1a',
      font: { color: '#e0e0e0' },
      margin: { l: 60, r: 40, t: 60, b: 60 },
      hovermode: 'closest'
    };

    const layout = getOptimizedLayout(baseLayout, optimizationConfigRef.current);

    // Configuration options with GPU acceleration
    const config = getOptimizedPlotlyConfig(optimizationConfigRef.current);

    performanceMonitorRef.current.endRender();

    // Create or update the plot
    if (isInitialized) {
      Plotly.react(plotContainerRef.current, [trace], layout, config);
    } else {
      Plotly.newPlot(plotContainerRef.current, [trace], layout, config);
    }

    performanceMonitorRef.current.endFrame();
  };

  /**
   * Renders a 3D surface plot showing u(x,t) for all time steps
   * Uses WebGL (GPU) rendering automatically for optimal performance
   */
  const render3DPlot = () => {
    if (!plotContainerRef.current || allData.length === 0) {
      return;
    }

    performanceMonitorRef.current.startFrame();

    // Build z-matrix (u values over x and t)
    const zMatrix: number[][] = [];
    const xValues = allData[0].x_values;
    const tValues: number[] = [];

    allData.forEach(dataPoint => {
      tValues.push(dataPoint.time_value);
      zMatrix.push(dataPoint.u_values);
    });

    // Prepare data for Plotly
    // 3D surface plots in Plotly.js are automatically WebGL-rendered for GPU acceleration
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

    // Layout configuration with GPU optimizations
    const baseLayout: Partial<Plotly.Layout> = {
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

    const layout = getOptimizedLayout(baseLayout, optimizationConfigRef.current);

    // Configuration options with GPU acceleration
    const config = getOptimizedPlotlyConfig(optimizationConfigRef.current);

    performanceMonitorRef.current.endRender();

    // Create or update the plot
    if (isInitialized) {
      Plotly.react(plotContainerRef.current, [trace], layout, config);
    } else {
      Plotly.newPlot(plotContainerRef.current, [trace], layout, config);
    }

    performanceMonitorRef.current.endFrame();
  };

  /**
   * Renders a heatmap showing u(x,t)
   * Uses WebGL acceleration (heatmapgl) for large datasets when enabled
   */
  const renderHeatmap = () => {
    if (!plotContainerRef.current || allData.length === 0) {
      return;
    }

    performanceMonitorRef.current.startFrame();

    // Build z-matrix (u values over x and t)
    const zMatrix: number[][] = [];
    const xValues = allData[0].x_values;
    const tValues: number[] = [];

    allData.forEach(dataPoint => {
      tValues.push(dataPoint.time_value);
      zMatrix.push(dataPoint.u_values);
    });

    // Use heatmapgl (WebGL accelerated) for better performance when enabled
    const traceType = optimizationConfigRef.current.heatmapGLMode ? 'heatmapgl' : 'heatmap';

    // Prepare data for Plotly
    const trace: Partial<Plotly.PlotData> = {
      x: xValues,
      y: tValues,
      z: zMatrix,
      type: traceType as any,
      colorscale: colorScheme,
      showscale: true,
      colorbar: {
        title: zLabel,
        titleside: 'right',
        tickfont: { color: '#e0e0e0' }
      }
    };

    // Layout configuration with GPU optimizations
    const baseLayout: Partial<Plotly.Layout> = {
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

    const layout = getOptimizedLayout(baseLayout, optimizationConfigRef.current);

    // Configuration options with GPU acceleration
    const config = getOptimizedPlotlyConfig(optimizationConfigRef.current);

    performanceMonitorRef.current.endRender();

    // Create or update the plot
    if (isInitialized) {
      Plotly.react(plotContainerRef.current, [trace], layout, config);
    } else {
      Plotly.newPlot(plotContainerRef.current, [trace], layout, config);
    }

    performanceMonitorRef.current.endFrame();
  };

  /**
   * Renders an animated heatmap strip showing spatial temperature distribution
   * as a colored horizontal strip that updates over time
   * Uses WebGL acceleration (heatmapgl) when enabled
   */
  const renderHeatmapStrip = () => {
    if (!plotContainerRef.current || !currentData) {
      return;
    }

    performanceMonitorRef.current.startFrame();

    // Create matrix with 5 rows showing same data for visual thickness
    const stripRows = 5;
    const stripMatrix = Array(stripRows).fill(currentData.u_values);

    // Use heatmapgl (WebGL accelerated) for better performance
    const traceType = optimizationConfigRef.current.heatmapGLMode ? 'heatmapgl' : 'heatmap';

    // Prepare data for Plotly
    const trace: Partial<Plotly.PlotData> = {
      x: currentData.x_values,
      y: Array.from({ length: stripRows }, (_, i) => i), // [0, 1, 2, 3, 4]
      z: stripMatrix,
      type: traceType as any,
      colorscale: colorScheme,
      zmin: globalMin, // Fixed color scale prevents color shifting
      zmax: globalMax,
      showscale: true,
      colorbar: {
        title: { text: yLabel, side: 'right' },
        tickfont: { color: '#e0e0e0' },
        titlefont: { color: '#e0e0e0' }
      }
    };

    // Layout configuration with GPU optimizations
    const baseLayout: Partial<Plotly.Layout> = {
      title: {
        text: `${equationType.toUpperCase()} - Strip Animation (t = ${currentData.time_value.toFixed(4)})`,
        font: { color: '#e0e0e0', size: 18 }
      },
      xaxis: {
        title: xLabel,
        gridcolor: showGrid ? '#333' : 'transparent',
        color: '#e0e0e0'
      },
      yaxis: {
        visible: false,
        showticklabels: false
      },
      paper_bgcolor: '#1a1a1a',
      plot_bgcolor: '#1a1a1a',
      font: { color: '#e0e0e0' },
      margin: { l: 60, r: 120, t: 60, b: 60 },
      height: 250
    };

    const layout = getOptimizedLayout(baseLayout, optimizationConfigRef.current);

    // Configuration options with GPU acceleration
    const config = getOptimizedPlotlyConfig(optimizationConfigRef.current);

    performanceMonitorRef.current.endRender();

    // Create or update the plot
    if (isInitialized) {
      Plotly.react(plotContainerRef.current, [trace], layout, config);
    } else {
      Plotly.newPlot(plotContainerRef.current, [trace], layout, config);
    }

    performanceMonitorRef.current.endFrame();
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

  /**
   * Renders strip animation mode empty state when no current data
   */
  if (mode === VisualizationMode.HEATMAP_STRIP && !currentData) {
    return (
      <div className={`visualization-canvas ${className}`} style={{ height }}>
        <div className="visualization-empty">
          <p>No data available for strip animation</p>
          <p className="visualization-hint">Run simulation to generate solution</p>
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
