/**
 * Draggable Grid Visualization Component
 *
 * Allows users to freely drag visualization panels around.
 * Panels snap to quadrants and intelligently rearrange other panels.
 * Supports 2x2 grid layout with dynamic position management.
 */

import React, { useState, useRef, useEffect } from 'react';
import VisualizationCanvas, { VisualizationMode } from './VisualizationCanvas';
import { SimulationData, EquationType } from '../types/simulation';

/**
 * Visualization panel types and positions
 */
type PanelPosition = 'tl' | 'tr' | 'bl' | 'br'; // top-left, top-right, bottom-left, bottom-right

interface VisualizationPanel {
  id: string;
  position: PanelPosition;
  mode: VisualizationMode;
  title: string;
  isDragging: boolean;
  dragOffset: { x: number; y: number };
}

interface DraggableGridVisualizationProps {
  currentData: SimulationData | null;
  allData?: SimulationData[];
  equationType?: EquationType;
  globalMin?: number;
  globalMax?: number;
  useFixedAxes?: boolean;
  colorScheme?: string;
  showGrid?: boolean;
  currentTimeIndex?: number;
  totalTimeSteps?: number;
}

/**
 * Default visualization panels configuration
 */
const DEFAULT_PANELS: VisualizationPanel[] = [
  {
    id: 'panel-2d',
    position: 'tl',
    mode: VisualizationMode.LINE_2D,
    title: '2D Line Plot',
    isDragging: false,
    dragOffset: { x: 0, y: 0 }
  },
  {
    id: 'panel-3d',
    position: 'tr',
    mode: VisualizationMode.SURFACE_3D,
    title: '3D Surface',
    isDragging: false,
    dragOffset: { x: 0, y: 0 }
  },
  {
    id: 'panel-heatmap',
    position: 'bl',
    mode: VisualizationMode.HEATMAP,
    title: 'Heatmap',
    isDragging: false,
    dragOffset: { x: 0, y: 0 }
  },
  {
    id: 'panel-strip',
    position: 'br',
    mode: VisualizationMode.HEATMAP_STRIP,
    title: 'Strip Animation',
    isDragging: false,
    dragOffset: { x: 0, y: 0 }
  }
];

/**
 * DraggableGridVisualization Component
 *
 * Renders a 2x2 grid of visualizations that users can:
 * - Drag individual panels to different quadrants
 * - Panels snap to grid positions
 * - Other panels rearrange intelligently
 * - All visualizations update synchronously
 *
 * @example
 * ```tsx
 * <DraggableGridVisualization
 *   currentData={currentData}
 *   allData={allData}
 *   equationType={EquationType.HEAT}
 * />
 * ```
 */
export const DraggableGridVisualization: React.FC<DraggableGridVisualizationProps> = ({
  currentData,
  allData = [],
  equationType = EquationType.HEAT,
  globalMin,
  globalMax,
  useFixedAxes = false,
  colorScheme = 'Viridis',
  showGrid = true,
  currentTimeIndex = 0,
  totalTimeSteps = 0
}) => {
  // State for panel positions and dragging
  const [panels, setPanels] = useState<VisualizationPanel[]>(DEFAULT_PANELS);
  const gridRef = useRef<HTMLDivElement>(null);
  const draggedPanelRef = useRef<VisualizationPanel | null>(null);

  // Get panel by position
  const getPanelAtPosition = (position: PanelPosition): VisualizationPanel | undefined => {
    return panels.find(p => p.position === position);
  };

  // Get closest quadrant based on mouse position
  const getClosestQuadrant = (clientX: number, clientY: number): PanelPosition | null => {
    if (!gridRef.current) return null;

    const gridRect = gridRef.current.getBoundingClientRect();
    const relX = clientX - gridRect.left;
    const relY = clientY - gridRect.top;

    const midX = gridRect.width / 2;
    const midY = gridRect.height / 2;

    if (relY < midY) {
      return relX < midX ? 'tl' : 'tr';
    } else {
      return relX < midX ? 'bl' : 'br';
    }
  };

  // Swap panels between positions
  const swapPanels = (fromPosition: PanelPosition, toPosition: PanelPosition) => {
    const fromPanel = panels.find(p => p.position === fromPosition);
    const toPanel = panels.find(p => p.position === toPosition);

    if (!fromPanel || !toPanel) return;

    setPanels(
      panels.map(panel => {
        if (panel.id === fromPanel.id) {
          return { ...panel, position: toPosition, isDragging: false };
        }
        if (panel.id === toPanel.id) {
          return { ...panel, position: fromPosition };
        }
        return panel;
      })
    );
  };

  // Handle panel drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, panelId: string) => {
    const panel = panels.find(p => p.id === panelId);
    if (!panel) return;

    draggedPanelRef.current = panel;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('panelId', panelId);
  };

  // Handle drag over grid
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    const panelId = e.dataTransfer.getData('panelId');
    const draggedPanel = panels.find(p => p.id === panelId);

    if (!draggedPanel) return;

    const targetPosition = getClosestQuadrant(e.clientX, e.clientY);
    if (!targetPosition) return;

    if (draggedPanel.position !== targetPosition) {
      swapPanels(draggedPanel.position, targetPosition);
    }

    draggedPanelRef.current = null;
  };

  // Render individual panel
  const renderPanel = (position: PanelPosition) => {
    const panel = getPanelAtPosition(position);
    if (!panel) return null;

    const panelHeight = '100%';

    return (
      <div
        key={panel.id}
        className={`draggable-grid-panel grid-panel-${position}`}
        draggable={true}
        onDragStart={(e) => handleDragStart(e, panel.id)}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="draggable-panel-header">
          <span className="draggable-panel-title">{panel.title}</span>
          <span className="draggable-handle">⋮⋮</span>
        </div>

        <div className="draggable-panel-content">
          <VisualizationCanvas
            currentData={currentData}
            allData={allData}
            mode={panel.mode}
            equationType={equationType}
            title={panel.title}
            showGrid={showGrid}
            globalMin={globalMin}
            globalMax={globalMax}
            useFixedAxes={useFixedAxes}
            colorScheme={colorScheme}
            height={panelHeight}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="draggable-grid-visualization">
      <div className="draggable-grid-header">
        <h3>Interactive 2x2 Visualization Grid</h3>
        <p className="draggable-grid-subtitle">Drag panels to rearrange • Snaps to grid positions</p>
      </div>

      <div
        ref={gridRef}
        className="draggable-grid-container"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Top-Left */}
        {renderPanel('tl')}

        {/* Top-Right */}
        {renderPanel('tr')}

        {/* Bottom-Left */}
        {renderPanel('bl')}

        {/* Bottom-Right */}
        {renderPanel('br')}
      </div>

      {/* Info Indicator */}
      <div className="draggable-grid-info">
        <span className="info-icon">ℹ️</span>
        <span>Drag panel headers to rearrange • Panels snap to quadrants automatically</span>
      </div>
    </div>
  );
};

export default DraggableGridVisualization;
