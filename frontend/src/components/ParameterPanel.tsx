/**
 * ParameterPanel Component
 *
 * Comprehensive configuration panel for simulation parameters.
 * Provides input fields for all aspects of the PDE simulation including:
 * - Equation type selection
 * - Spatial and temporal domain configuration
 * - Boundary conditions
 * - Initial conditions
 * - Physical parameters
 *
 * Features validation feedback and preset loading.
 */

import React, { useState, useEffect } from 'react';
import {
  SimulationConfig,
  EquationType,
  BoundaryConditionType,
  InitialConditionType,
  HeatParameters,
  WaveParameters,
  SpatialDomain,
  TemporalDomain,
  BoundaryCondition,
  InitialCondition
} from '../types/simulation';
import {
  validateSimulationConfig,
  validateNumericInput,
  validateExpression,
  formatValidationErrors,
  formatValidationWarnings,
  calculateGridPoints,
  calculateTimeSteps,
  estimateMemoryUsage,
  estimateComputationTime
} from '../utils/validation';

/**
 * Props for the ParameterPanel component
 */
interface ParameterPanelProps {
  /** Current simulation configuration */
  config: SimulationConfig;

  /** Callback when configuration changes */
  onChange: (config: SimulationConfig) => void;

  /** Callback when "Apply Configuration" is clicked */
  onApply: () => void;

  /** Whether to show validation errors */
  showValidation?: boolean;

  /** Custom CSS class name */
  className?: string;
}

/**
 * ParameterPanel Component
 *
 * Main configuration panel for all simulation parameters.
 * Organized into collapsible sections for better UX.
 *
 * @example
 * ```tsx
 * <ParameterPanel
 *   config={simulationConfig}
 *   onChange={setSimulationConfig}
 *   onApply={handleApplyConfig}
 *   showValidation={true}
 * />
 * ```
 */
export const ParameterPanel: React.FC<ParameterPanelProps> = ({
  config,
  onChange,
  onApply,
  showValidation = true,
  className = ''
}) => {
  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [stabilityParameter, setStabilityParameter] = useState<number | undefined>();

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['equation', 'spatial', 'temporal'])
  );

  /**
   * Validates configuration whenever it changes
   */
  useEffect(() => {
    if (showValidation) {
      const result = validateSimulationConfig(config);
      setValidationErrors(result.errors || []);
      setValidationWarnings(result.warnings || []);
      setStabilityParameter(result.stability_parameter);
    }
  }, [config, showValidation]);

  /**
   * Toggles section expansion
   *
   * @param section - Section identifier
   */
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  /**
   * Updates equation type and resets equation-specific parameters
   */
  const handleEquationTypeChange = (newType: EquationType) => {
    const newConfig = { ...config };
    newConfig.equation_type = newType;

    // Reset physical parameters based on equation type
    if (newType === EquationType.HEAT) {
      newConfig.physical_parameters = { beta: 1.0 } as HeatParameters;
    } else if (newType === EquationType.WAVE) {
      newConfig.physical_parameters = { c: 1.0 } as WaveParameters;
    }

    onChange(newConfig);
  };

  /**
   * Updates spatial domain
   */
  const handleSpatialDomainChange = (field: keyof SpatialDomain, value: number) => {
    onChange({
      ...config,
      spatial_domain: {
        ...config.spatial_domain,
        [field]: value
      }
    });
  };

  /**
   * Updates temporal domain
   */
  const handleTemporalDomainChange = (field: keyof TemporalDomain, value: number) => {
    onChange({
      ...config,
      temporal_domain: {
        ...config.temporal_domain,
        [field]: value
      }
    });
  };

  /**
   * Updates boundary condition
   */
  const handleBoundaryConditionChange = (updates: Partial<BoundaryCondition>) => {
    onChange({
      ...config,
      boundary_condition: {
        ...config.boundary_condition,
        ...updates
      }
    });
  };

  /**
   * Updates initial condition
   */
  const handleInitialConditionChange = (updates: Partial<InitialCondition>) => {
    onChange({
      ...config,
      initial_condition: {
        ...config.initial_condition,
        ...updates,
        parameters: {
          ...config.initial_condition.parameters,
          ...updates.parameters
        }
      }
    });
  };

  /**
   * Updates physical parameters
   */
  const handlePhysicalParametersChange = (field: string, value: number) => {
    onChange({
      ...config,
      physical_parameters: {
        ...config.physical_parameters,
        [field]: value
      }
    });
  };

  /**
   * Calculates grid information
   */
  const gridInfo = {
    numPoints: calculateGridPoints(
      config.spatial_domain.x_min,
      config.spatial_domain.x_max,
      config.spatial_domain.dx
    ),
    numSteps: calculateTimeSteps(
      config.temporal_domain.t_min,
      config.temporal_domain.t_max,
      config.temporal_domain.dt
    ),
    memoryMB: estimateMemoryUsage(config),
    estimatedTime: estimateComputationTime(config)
  };

  return (
    <div className={`parameter-panel ${className}`}>
      {/* Header */}
      <div className="panel-header">
        <h2>Simulation Parameters</h2>
      </div>

      {/* Validation Summary */}
      {showValidation && (validationErrors.length > 0 || validationWarnings.length > 0) && (
        <div className="validation-summary">
          {validationErrors.length > 0 && (
            <div className="validation-errors">
              <strong>⚠ Errors:</strong>
              <ul>
                {validationErrors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          {validationWarnings.length > 0 && (
            <div className="validation-warnings">
              <strong>⚠ Warnings:</strong>
              <ul>
                {validationWarnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Grid Information */}
      <div className="grid-info">
        <div className="info-item">
          <span className="info-label">Grid Points:</span>
          <span className="info-value">{gridInfo.numPoints}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Time Steps:</span>
          <span className="info-value">{gridInfo.numSteps}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Memory:</span>
          <span className="info-value">{gridInfo.memoryMB.toFixed(2)} MB</span>
        </div>
        {stabilityParameter !== undefined && (
          <div className="info-item">
            <span className="info-label">Stability (σ):</span>
            <span className="info-value">{stabilityParameter.toFixed(4)}</span>
          </div>
        )}
      </div>

      {/* Equation Type Section */}
      <Section
        title="Equation Type"
        id="equation"
        expanded={expandedSections.has('equation')}
        onToggle={() => toggleSection('equation')}
      >
        <div className="form-group">
          <label>PDE Type:</label>
          <select
            value={config.equation_type}
            onChange={(e) => handleEquationTypeChange(e.target.value as EquationType)}
            className="form-control"
          >
            <option value={EquationType.HEAT}>Heat Equation</option>
            <option value={EquationType.WAVE}>Wave Equation</option>
          </select>
          <p className="help-text">
            {config.equation_type === EquationType.HEAT
              ? 'Heat equation: ∂u/∂t = β·∂²u/∂x² (parabolic PDE)'
              : 'Wave equation: ∂²u/∂t² = c²·∂²u/∂x² (hyperbolic PDE)'}
          </p>
        </div>
      </Section>

      {/* Spatial Domain Section */}
      <Section
        title="Spatial Domain"
        id="spatial"
        expanded={expandedSections.has('spatial')}
        onToggle={() => toggleSection('spatial')}
      >
        <div className="form-group">
          <label>x min:</label>
          <input
            type="number"
            value={config.spatial_domain.x_min}
            onChange={(e) => handleSpatialDomainChange('x_min', parseFloat(e.target.value))}
            className="form-control"
            step="0.1"
          />
        </div>
        <div className="form-group">
          <label>x max:</label>
          <input
            type="number"
            value={config.spatial_domain.x_max}
            onChange={(e) => handleSpatialDomainChange('x_max', parseFloat(e.target.value))}
            className="form-control"
            step="0.1"
          />
        </div>
        <div className="form-group">
          <label>dx (spatial step):</label>
          <input
            type="number"
            value={config.spatial_domain.dx}
            onChange={(e) => handleSpatialDomainChange('dx', parseFloat(e.target.value))}
            className="form-control"
            step="0.01"
            min="0.001"
          />
          <p className="help-text">Grid spacing in space (smaller = more accurate but slower)</p>
        </div>
      </Section>

      {/* Temporal Domain Section */}
      <Section
        title="Temporal Domain"
        id="temporal"
        expanded={expandedSections.has('temporal')}
        onToggle={() => toggleSection('temporal')}
      >
        <div className="form-group">
          <label>t min:</label>
          <input
            type="number"
            value={config.temporal_domain.t_min}
            onChange={(e) => handleTemporalDomainChange('t_min', parseFloat(e.target.value))}
            className="form-control"
            step="0.1"
          />
        </div>
        <div className="form-group">
          <label>t max:</label>
          <input
            type="number"
            value={config.temporal_domain.t_max}
            onChange={(e) => handleTemporalDomainChange('t_max', parseFloat(e.target.value))}
            className="form-control"
            step="0.1"
          />
        </div>
        <div className="form-group">
          <label>dt (time step):</label>
          <input
            type="number"
            value={config.temporal_domain.dt}
            onChange={(e) => handleTemporalDomainChange('dt', parseFloat(e.target.value))}
            className="form-control"
            step="0.001"
            min="0.0001"
          />
          <p className="help-text">Time step size (must satisfy CFL stability condition)</p>
        </div>
      </Section>

      {/* Physical Parameters Section */}
      <Section
        title="Physical Parameters"
        id="physical"
        expanded={expandedSections.has('physical')}
        onToggle={() => toggleSection('physical')}
      >
        {config.equation_type === EquationType.HEAT ? (
          <div className="form-group">
            <label>β (thermal diffusivity):</label>
            <input
              type="number"
              value={(config.physical_parameters as HeatParameters).beta}
              onChange={(e) => handlePhysicalParametersChange('beta', parseFloat(e.target.value))}
              className="form-control"
              step="0.1"
              min="0.01"
            />
            <p className="help-text">Controls how fast heat diffuses through the material</p>
          </div>
        ) : (
          <div className="form-group">
            <label>c (wave speed):</label>
            <input
              type="number"
              value={(config.physical_parameters as WaveParameters).c}
              onChange={(e) => handlePhysicalParametersChange('c', parseFloat(e.target.value))}
              className="form-control"
              step="0.1"
              min="0.1"
            />
            <p className="help-text">Speed of wave propagation</p>
          </div>
        )}
      </Section>

      {/* Boundary Conditions Section */}
      <Section
        title="Boundary Conditions"
        id="boundary"
        expanded={expandedSections.has('boundary')}
        onToggle={() => toggleSection('boundary')}
      >
        <div className="form-group">
          <label>Boundary Type:</label>
          <select
            value={config.boundary_condition.type}
            onChange={(e) =>
              handleBoundaryConditionChange({ type: e.target.value as BoundaryConditionType })
            }
            className="form-control"
          >
            <option value={BoundaryConditionType.DIRICHLET}>Dirichlet (fixed value)</option>
            <option value={BoundaryConditionType.NEUMANN}>Neumann (fixed derivative)</option>
            <option value={BoundaryConditionType.PERIODIC}>Periodic</option>
          </select>
        </div>

        {config.boundary_condition.type === BoundaryConditionType.DIRICHLET && (
          <>
            <div className="form-group">
              <label>Left boundary value:</label>
              <input
                type="number"
                value={config.boundary_condition.left_value || 0}
                onChange={(e) =>
                  handleBoundaryConditionChange({ left_value: parseFloat(e.target.value) })
                }
                className="form-control"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label>Right boundary value:</label>
              <input
                type="number"
                value={config.boundary_condition.right_value || 0}
                onChange={(e) =>
                  handleBoundaryConditionChange({ right_value: parseFloat(e.target.value) })
                }
                className="form-control"
                step="0.1"
              />
            </div>
          </>
        )}

        {config.boundary_condition.type === BoundaryConditionType.NEUMANN && (
          <>
            <div className="form-group">
              <label>Left boundary derivative:</label>
              <input
                type="number"
                value={config.boundary_condition.left_derivative || 0}
                onChange={(e) =>
                  handleBoundaryConditionChange({ left_derivative: parseFloat(e.target.value) })
                }
                className="form-control"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label>Right boundary derivative:</label>
              <input
                type="number"
                value={config.boundary_condition.right_derivative || 0}
                onChange={(e) =>
                  handleBoundaryConditionChange({ right_derivative: parseFloat(e.target.value) })
                }
                className="form-control"
                step="0.1"
              />
            </div>
          </>
        )}
      </Section>

      {/* Initial Conditions Section */}
      <Section
        title="Initial Conditions"
        id="initial"
        expanded={expandedSections.has('initial')}
        onToggle={() => toggleSection('initial')}
      >
        <div className="form-group">
          <label>Pattern Type:</label>
          <select
            value={config.initial_condition.type}
            onChange={(e) =>
              handleInitialConditionChange({ type: e.target.value as InitialConditionType })
            }
            className="form-control"
          >
            <option value={InitialConditionType.GAUSSIAN}>Gaussian</option>
            <option value={InitialConditionType.SINE}>Sine Wave</option>
            <option value={InitialConditionType.SQUARE}>Square Wave</option>
            <option value={InitialConditionType.TRIANGLE}>Triangle Wave</option>
            <option value={InitialConditionType.CUSTOM}>Custom Expression</option>
          </select>
        </div>

        {config.initial_condition.type === InitialConditionType.GAUSSIAN && (
          <>
            <div className="form-group">
              <label>Amplitude:</label>
              <input
                type="number"
                value={config.initial_condition.parameters?.amplitude || 1.0}
                onChange={(e) =>
                  handleInitialConditionChange({
                    parameters: { ...config.initial_condition.parameters, amplitude: parseFloat(e.target.value) }
                  })
                }
                className="form-control"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label>Center:</label>
              <input
                type="number"
                value={config.initial_condition.parameters?.center || 0.5}
                onChange={(e) =>
                  handleInitialConditionChange({
                    parameters: { ...config.initial_condition.parameters, center: parseFloat(e.target.value) }
                  })
                }
                className="form-control"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label>Width (σ):</label>
              <input
                type="number"
                value={config.initial_condition.parameters?.width || 0.1}
                onChange={(e) =>
                  handleInitialConditionChange({
                    parameters: { ...config.initial_condition.parameters, width: parseFloat(e.target.value) }
                  })
                }
                className="form-control"
                step="0.01"
                min="0.01"
              />
            </div>
          </>
        )}

        {[InitialConditionType.SINE, InitialConditionType.SQUARE, InitialConditionType.TRIANGLE].includes(
          config.initial_condition.type
        ) && (
          <>
            <div className="form-group">
              <label>Amplitude:</label>
              <input
                type="number"
                value={config.initial_condition.parameters?.amplitude || 1.0}
                onChange={(e) =>
                  handleInitialConditionChange({
                    parameters: { ...config.initial_condition.parameters, amplitude: parseFloat(e.target.value) }
                  })
                }
                className="form-control"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label>Frequency:</label>
              <input
                type="number"
                value={config.initial_condition.parameters?.frequency || 1.0}
                onChange={(e) =>
                  handleInitialConditionChange({
                    parameters: { ...config.initial_condition.parameters, frequency: parseFloat(e.target.value) }
                  })
                }
                className="form-control"
                step="0.1"
                min="0.1"
              />
            </div>
          </>
        )}

        {config.initial_condition.type === InitialConditionType.CUSTOM && (
          <div className="form-group">
            <label>Expression (function of x):</label>
            <input
              type="text"
              value={config.initial_condition.parameters?.expression || ''}
              onChange={(e) =>
                handleInitialConditionChange({
                  parameters: { ...config.initial_condition.parameters, expression: e.target.value }
                })
              }
              className="form-control"
              placeholder="e.g., sin(2*π*x) or exp(-x^2)"
            />
            <p className="help-text">Use x as the variable. Supported: +, -, *, /, ^, sin, cos, exp, etc.</p>
          </div>
        )}
      </Section>
    </div>
  );
};

/**
 * Props for the Section component
 */
interface SectionProps {
  title: string;
  id: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

/**
 * Collapsible Section Component
 *
 * A collapsible section for organizing parameters.
 */
const Section: React.FC<SectionProps> = ({ title, id, expanded, onToggle, children }) => {
  return (
    <div className={`panel-section ${expanded ? 'expanded' : 'collapsed'}`}>
      <div className="section-header" onClick={onToggle}>
        <h3>{title}</h3>
        <span className="section-toggle">{expanded ? '▼' : '▶'}</span>
      </div>
      {expanded && <div className="section-content">{children}</div>}
    </div>
  );
};

export default ParameterPanel;
