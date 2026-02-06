/**
 * Performance Monitoring Utility
 *
 * Tracks FPS, memory usage, animation performance, and provides
 * detailed metrics for optimization analysis.
 */

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  averageFPS: number;
  memoryUsage?: number;
  memoryDelta?: number;
  renderTime: number;
  updateTime: number;
  totalFrames: number;
  droppedFrames: number;
  timestamp: number;
}

/**
 * Performance Monitor Class
 *
 * Tracks real-time performance metrics for animations and visualizations.
 * Helps identify bottlenecks in rendering and data updates.
 *
 * @example
 * ```tsx
 * const monitor = PerformanceMonitor.getInstance();
 * monitor.startFrame();
 * // ... do work
 * monitor.endRender();
 * // ... more work
 * monitor.endFrame();
 * const metrics = monitor.getMetrics();
 * ```
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;

  private frameStartTime: number = 0;
  private renderEndTime: number = 0;
  private frameEndTime: number = 0;
  private lastFrameTime: number = 0;

  private totalFrames: number = 0;
  private droppedFrames: number = 0;
  private fpsHistory: number[] = [];
  private frameTimeHistory: number[] = [];

  private lastMemoryUsage: number = 0;
  private enabled: boolean = false;
  private windowSize: number = 60; // Keep last 60 frames for averaging

  // Target FPS for frame time calculations
  private targetFPS: number = 50;
  private maxFrameTime: number = 1000 / this.targetFPS; // ~20ms for 50fps

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Enable performance monitoring
   */
  enable(): void {
    this.enabled = true;
    this.reset();
  }

  /**
   * Disable performance monitoring
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.totalFrames = 0;
    this.droppedFrames = 0;
    this.fpsHistory = [];
    this.frameTimeHistory = [];
    this.lastFrameTime = 0;
    this.lastMemoryUsage = 0;
  }

  /**
   * Mark start of frame
   */
  startFrame(): void {
    if (!this.enabled) return;
    this.frameStartTime = performance.now();
  }

  /**
   * Mark end of render phase
   */
  endRender(): void {
    if (!this.enabled) return;
    this.renderEndTime = performance.now();
  }

  /**
   * Mark end of frame
   */
  endFrame(): void {
    if (!this.enabled) return;

    this.frameEndTime = performance.now();
    const frameTime = this.frameEndTime - this.frameStartTime;

    // Track dropped frames (frames exceeding target time by 50%)
    if (frameTime > this.maxFrameTime * 1.5) {
      this.droppedFrames++;
    }

    this.totalFrames++;
    this.lastFrameTime = frameTime;
    this.frameTimeHistory.push(frameTime);

    // Calculate FPS
    const currentFPS = frameTime > 0 ? 1000 / frameTime : 0;
    this.fpsHistory.push(currentFPS);

    // Keep history window size reasonable
    if (this.fpsHistory.length > this.windowSize) {
      this.fpsHistory.shift();
      this.frameTimeHistory.shift();
    }

    // Capture memory usage if available (Chrome only)
    if (performance.memory) {
      const currentMemory = performance.memory.usedJSHeapSize;
      this.lastMemoryUsage = currentMemory;
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const avgFPS = this.fpsHistory.length > 0
      ? this.fpsHistory.reduce((a, b) => a + b) / this.fpsHistory.length
      : 0;

    const avgFrameTime = this.frameTimeHistory.length > 0
      ? this.frameTimeHistory.reduce((a, b) => a + b) / this.frameTimeHistory.length
      : 0;

    return {
      fps: this.fpsHistory.length > 0 ? this.fpsHistory[this.fpsHistory.length - 1] : 0,
      frameTime: this.lastFrameTime,
      averageFPS: avgFPS,
      renderTime: this.renderEndTime - this.frameStartTime,
      updateTime: this.frameEndTime - this.renderEndTime,
      totalFrames: this.totalFrames,
      droppedFrames: this.droppedFrames,
      memoryUsage: this.lastMemoryUsage,
      timestamp: performance.now()
    };
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    averageFPS: number;
    minFPS: number;
    maxFPS: number;
    averageFrameTime: number;
    droppedFramePercentage: number;
    memoryMB: number;
  } {
    const avgFPS = this.fpsHistory.length > 0
      ? this.fpsHistory.reduce((a, b) => a + b) / this.fpsHistory.length
      : 0;

    const minFPS = this.fpsHistory.length > 0
      ? Math.min(...this.fpsHistory)
      : 0;

    const maxFPS = this.fpsHistory.length > 0
      ? Math.max(...this.fpsHistory)
      : 0;

    const avgFrameTime = this.frameTimeHistory.length > 0
      ? this.frameTimeHistory.reduce((a, b) => a + b) / this.frameTimeHistory.length
      : 0;

    const droppedPercentage = this.totalFrames > 0
      ? (this.droppedFrames / this.totalFrames) * 100
      : 0;

    return {
      averageFPS: Math.round(avgFPS * 100) / 100,
      minFPS: Math.round(minFPS * 100) / 100,
      maxFPS: Math.round(maxFPS * 100) / 100,
      averageFrameTime: Math.round(avgFrameTime * 100) / 100,
      droppedFramePercentage: Math.round(droppedPercentage * 100) / 100,
      memoryMB: Math.round((this.lastMemoryUsage / 1024 / 1024) * 100) / 100
    };
  }

  /**
   * Log performance summary to console
   */
  logSummary(): void {
    const summary = this.getSummary();
    console.group('📊 Performance Summary');
    console.log(`Average FPS: ${summary.averageFPS}`);
    console.log(`FPS Range: ${summary.minFPS} - ${summary.maxFPS}`);
    console.log(`Average Frame Time: ${summary.averageFrameTime.toFixed(2)}ms`);
    console.log(`Dropped Frames: ${summary.droppedFramePercentage.toFixed(2)}%`);
    console.log(`Memory Usage: ${summary.memoryMB}MB`);
    console.groupEnd();
  }
}

/**
 * Hook for using performance monitor in React components
 */
export const usePerformanceMonitor = (enabled: boolean = false) => {
  const monitor = PerformanceMonitor.getInstance();

  if (enabled) {
    monitor.enable();
  } else {
    monitor.disable();
  }

  return monitor;
};
