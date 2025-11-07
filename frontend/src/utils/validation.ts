/**
 * Validation utilities for simulation configuration
 *
 * This module provides client-side validation for simulation parameters
 * to catch errors early and provide immediate feedback to users.
 */

import {
  SimulationConfig,
  EquationType,
  BoundaryConditionType,
  InitialConditionType,
  HeatParameters,
  WaveParameters,
  ValidationResult
} from '../types/simulation';

/**
 * Validates the complete simulation configuration
 * Performs comprehensive checks on all parameters before submission
 *
 * @param config - The simulation configuration to validate
 * @returns ValidationResult object with validation status and messages
 */
export function validateSimulationConfig(config: SimulationConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate spatial domain
  const spatialErrors = validateSpatialDomain(config);
  errors.push(...spatialErrors);

  // Validate temporal domain
  const temporalErrors = validateTemporalDomain(config);
  errors.push(...temporalErrors);

  // Validate boundary conditions
  const boundaryErrors = validateBoundaryCondition(config);
  errors.push(...boundaryErrors);

  // Validate initial conditions
  const initialErrors = validateInitialCondition(config);
  errors.push(...initialErrors);

  // Validate physical parameters
  const physicalErrors = validatePhysicalParameters(config);
  errors.push(...physicalErrors);

  // Check stability conditions (CFL)
  const stabilityResult = checkStability(config);

  if (stabilityResult.warnings) {
    warnings.push(...stabilityResult.warnings);
  }

  if (stabilityResult.errors) {
    errors.push(...stabilityResult.errors);
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
    stability_parameter: stabilityResult.stability_parameter,
    is_stable: stabilityResult.is_stable
  };
}

/**
 * Validates spatial domain parameters
 * Ensures x_min < x_max and dx is positive and reasonable
 *
 * @param config - The simulation configuration
 * @returns Array of error messages (empty if valid)
 */
function validateSpatialDomain(config: SimulationConfig): string[] {
  const errors: string[] = [];
  const { x_min, x_max, dx } = config.spatial_domain;

  // Check if x_max is greater than x_min
  if (x_max <= x_min) {
    errors.push('Spatial domain: x_max must be greater than x_min');
  }

  // Check if dx is positive
  if (dx <= 0) {
    errors.push('Spatial domain: dx must be positive');
  }

  // Check if dx is not too small (would create too many grid points)
  const domain_length = x_max - x_min;
  const num_points = Math.floor(domain_length / dx) + 1;

  if (num_points > 10000) {
    errors.push(
      `Spatial domain: dx is too small (${num_points} grid points). ` +
      `Consider using dx >= ${(domain_length / 10000).toFixed(6)}`
    );
  }

  // Check if dx is not too large (poor resolution)
  if (num_points < 10) {
    errors.push(
      `Spatial domain: dx is too large (only ${num_points} grid points). ` +
      `Consider using dx <= ${(domain_length / 10).toFixed(6)}`
    );
  }

  return errors;
}

/**
 * Validates temporal domain parameters
 * Ensures t_min < t_max and dt is positive and reasonable
 *
 * @param config - The simulation configuration
 * @returns Array of error messages (empty if valid)
 */
function validateTemporalDomain(config: SimulationConfig): string[] {
  const errors: string[] = [];
  const { t_min, t_max, dt } = config.temporal_domain;

  // Check if t_max is greater than t_min
  if (t_max <= t_min) {
    errors.push('Temporal domain: t_max must be greater than t_min');
  }

  // Check if dt is positive
  if (dt <= 0) {
    errors.push('Temporal domain: dt must be positive');
  }

  // Check if dt is not too small (would create too many time steps)
  const time_length = t_max - t_min;
  const num_steps = Math.floor(time_length / dt) + 1;

  if (num_steps > 100000) {
    errors.push(
      `Temporal domain: dt is too small (${num_steps} time steps). ` +
      `Consider using dt >= ${(time_length / 100000).toFixed(6)}`
    );
  }

  // Check if dt is not too large (poor temporal resolution)
  if (num_steps < 10) {
    errors.push(
      `Temporal domain: dt is too large (only ${num_steps} time steps). ` +
      `Consider using dt <= ${(time_length / 10).toFixed(6)}`
    );
  }

  return errors;
}

/**
 * Validates boundary condition parameters
 * Ensures required values are provided for the selected boundary type
 *
 * @param config - The simulation configuration
 * @returns Array of error messages (empty if valid)
 */
function validateBoundaryCondition(config: SimulationConfig): string[] {
  const errors: string[] = [];
  const bc = config.boundary_condition;

  // For Dirichlet conditions, ensure boundary values are provided
  if (bc.type === BoundaryConditionType.DIRICHLET) {
    if (bc.left_value === undefined || bc.left_value === null) {
      errors.push('Boundary condition: left_value is required for Dirichlet conditions');
    }
    if (bc.right_value === undefined || bc.right_value === null) {
      errors.push('Boundary condition: right_value is required for Dirichlet conditions');
    }
  }

  // For Neumann conditions, ensure derivative values are provided
  if (bc.type === BoundaryConditionType.NEUMANN) {
    if (bc.left_derivative === undefined || bc.left_derivative === null) {
      errors.push('Boundary condition: left_derivative is required for Neumann conditions');
    }
    if (bc.right_derivative === undefined || bc.right_derivative === null) {
      errors.push('Boundary condition: right_derivative is required for Neumann conditions');
    }
  }

  return errors;
}

/**
 * Validates initial condition parameters
 * Ensures required parameters are provided for the selected pattern type
 *
 * @param config - The simulation configuration
 * @returns Array of error messages (empty if valid)
 */
function validateInitialCondition(config: SimulationConfig): string[] {
  const errors: string[] = [];
  const ic = config.initial_condition;

  // For custom expressions, ensure expression is provided
  if (ic.type === InitialConditionType.CUSTOM) {
    if (!ic.parameters?.expression || ic.parameters.expression.trim() === '') {
      errors.push('Initial condition: expression is required for custom type');
    }
  }

  // For Gaussian, ensure center and width are provided
  if (ic.type === InitialConditionType.GAUSSIAN) {
    if (ic.parameters?.center === undefined) {
      errors.push('Initial condition: center is required for Gaussian type');
    }
    if (ic.parameters?.width === undefined || ic.parameters.width <= 0) {
      errors.push('Initial condition: width must be positive for Gaussian type');
    }
  }

  // For periodic patterns (sine, square, triangle), ensure frequency is provided
  if ([InitialConditionType.SINE, InitialConditionType.SQUARE, InitialConditionType.TRIANGLE].includes(ic.type)) {
    if (ic.parameters?.frequency === undefined || ic.parameters.frequency <= 0) {
      errors.push(`Initial condition: frequency must be positive for ${ic.type} type`);
    }
  }

  return errors;
}

/**
 * Validates physical parameters based on equation type
 * Ensures equation-specific parameters are valid
 *
 * @param config - The simulation configuration
 * @returns Array of error messages (empty if valid)
 */
function validatePhysicalParameters(config: SimulationConfig): string[] {
  const errors: string[] = [];

  if (config.equation_type === EquationType.HEAT) {
    const params = config.physical_parameters as HeatParameters;

    // Beta (thermal diffusivity) must be positive
    if (params.beta === undefined || params.beta <= 0) {
      errors.push('Physical parameters: beta (thermal diffusivity) must be positive for heat equation');
    }
  } else if (config.equation_type === EquationType.WAVE) {
    const params = config.physical_parameters as WaveParameters;

    // Wave speed must be positive
    if (params.c === undefined || params.c <= 0) {
      errors.push('Physical parameters: c (wave speed) must be positive for wave equation');
    }
  }

  return errors;
}

/**
 * Checks CFL stability conditions for the numerical scheme
 *
 * For heat equation (Forward Euler):
 *   σ = β·Δt/Δx² must be < 0.5 for stability
 *
 * For wave equation (Central difference):
 *   σ = (c·Δt/Δx)² must be ≤ 1 for stability
 *
 * @param config - The simulation configuration
 * @returns Stability check result with parameter and status
 */
function checkStability(config: SimulationConfig): {
  stability_parameter?: number;
  is_stable?: boolean;
  errors?: string[];
  warnings?: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const { dx } = config.spatial_domain;
  const { dt } = config.temporal_domain;

  let sigma: number;
  let is_stable: boolean;

  if (config.equation_type === EquationType.HEAT) {
    const params = config.physical_parameters as HeatParameters;
    const beta = params.beta;

    // Calculate stability parameter: σ = β·Δt/Δx²
    sigma = (beta * dt) / (dx * dx);

    // For Forward Euler, σ < 0.5 is required for stability
    is_stable = sigma < 0.5;

    if (!is_stable) {
      errors.push(
        `Stability: Heat equation is unstable (σ = ${sigma.toFixed(4)} >= 0.5). ` +
        `Reduce dt to < ${(0.5 * dx * dx / beta).toFixed(6)} or increase dx`
      );
    } else if (sigma > 0.4) {
      warnings.push(
        `Stability: Heat equation is approaching instability (σ = ${sigma.toFixed(4)}). ` +
        `Consider reducing dt for better accuracy`
      );
    }

  } else if (config.equation_type === EquationType.WAVE) {
    const params = config.physical_parameters as WaveParameters;
    const c = params.c;

    // Calculate stability parameter: σ = (c·Δt/Δx)²
    const cfl = (c * dt) / dx;
    sigma = cfl * cfl;

    // For wave equation, σ ≤ 1 (CFL ≤ 1) is required for stability
    is_stable = sigma <= 1.0;

    if (!is_stable) {
      errors.push(
        `Stability: Wave equation is unstable (CFL = ${Math.sqrt(sigma).toFixed(4)} > 1). ` +
        `Reduce dt to <= ${(dx / c).toFixed(6)} or increase dx`
      );
    } else if (sigma > 0.9) {
      warnings.push(
        `Stability: Wave equation is approaching instability (CFL = ${Math.sqrt(sigma).toFixed(4)}). ` +
        `Consider reducing dt for better accuracy`
      );
    }

  } else {
    errors.push('Stability: Unknown equation type');
    return { errors };
  }

  return {
    stability_parameter: sigma,
    is_stable,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Validates a single numeric input
 * Ensures the value is a valid number within optional bounds
 *
 * @param value - The value to validate
 * @param fieldName - Name of the field (for error messages)
 * @param min - Optional minimum value (inclusive)
 * @param max - Optional maximum value (inclusive)
 * @returns Error message if invalid, undefined if valid
 */
export function validateNumericInput(
  value: any,
  fieldName: string,
  min?: number,
  max?: number
): string | undefined {
  // Check if value is a number
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return `${fieldName} must be a valid number`;
  }

  // Check minimum bound
  if (min !== undefined && value < min) {
    return `${fieldName} must be >= ${min}`;
  }

  // Check maximum bound
  if (max !== undefined && value > max) {
    return `${fieldName} must be <= ${max}`;
  }

  return undefined;
}

/**
 * Validates a mathematical expression string
 * Checks for potentially dangerous operations and syntax
 *
 * @param expression - The expression string to validate
 * @returns Error message if invalid, undefined if valid
 */
export function validateExpression(expression: string): string | undefined {
  if (!expression || expression.trim() === '') {
    return 'Expression cannot be empty';
  }

  // Check for potentially dangerous operations
  const dangerousPatterns = [
    /import\s/i,
    /require\s*\(/i,
    /eval\s*\(/i,
    /Function\s*\(/i,
    /setTimeout/i,
    /setInterval/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(expression)) {
      return 'Expression contains potentially dangerous operations';
    }
  }

  // Check for allowed mathematical functions
  // This is a basic check - the backend should do more thorough validation
  const allowedPattern = /^[\d\s+\-*/().x,πe\w]+$/;
  if (!allowedPattern.test(expression)) {
    return 'Expression contains invalid characters';
  }

  return undefined;
}

/**
 * Formats validation errors for display
 * Converts error array into user-friendly message
 *
 * @param errors - Array of error messages
 * @returns Formatted error string
 */
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) {
    return '';
  }

  if (errors.length === 1) {
    return errors[0];
  }

  return 'Validation errors:\n' + errors.map((err, idx) => `${idx + 1}. ${err}`).join('\n');
}

/**
 * Formats validation warnings for display
 * Converts warning array into user-friendly message
 *
 * @param warnings - Array of warning messages
 * @returns Formatted warning string
 */
export function formatValidationWarnings(warnings: string[]): string {
  if (warnings.length === 0) {
    return '';
  }

  if (warnings.length === 1) {
    return warnings[0];
  }

  return 'Warnings:\n' + warnings.map((warn, idx) => `${idx + 1}. ${warn}`).join('\n');
}

/**
 * Calculates the number of grid points from spatial domain
 *
 * @param x_min - Minimum x coordinate
 * @param x_max - Maximum x coordinate
 * @param dx - Spatial step size
 * @returns Number of grid points
 */
export function calculateGridPoints(x_min: number, x_max: number, dx: number): number {
  return Math.floor((x_max - x_min) / dx) + 1;
}

/**
 * Calculates the number of time steps from temporal domain
 *
 * @param t_min - Minimum time
 * @param t_max - Maximum time
 * @param dt - Time step size
 * @returns Number of time steps
 */
export function calculateTimeSteps(t_min: number, t_max: number, dt: number): number {
  return Math.floor((t_max - t_min) / dt) + 1;
}

/**
 * Estimates memory usage for a simulation
 * Helps users understand resource requirements
 *
 * @param config - The simulation configuration
 * @returns Estimated memory in MB
 */
export function estimateMemoryUsage(config: SimulationConfig): number {
  const numGridPoints = calculateGridPoints(
    config.spatial_domain.x_min,
    config.spatial_domain.x_max,
    config.spatial_domain.dx
  );

  const numTimeSteps = calculateTimeSteps(
    config.temporal_domain.t_min,
    config.temporal_domain.t_max,
    config.temporal_domain.dt
  );

  // Each float64 value is 8 bytes
  // We store the full solution matrix (numGridPoints × numTimeSteps)
  const bytes = numGridPoints * numTimeSteps * 8;

  // Convert to MB
  return bytes / (1024 * 1024);
}

/**
 * Estimates computation time for a simulation
 * Provides rough estimate based on grid size
 *
 * @param config - The simulation configuration
 * @returns Estimated time in seconds (rough estimate)
 */
export function estimateComputationTime(config: SimulationConfig): number {
  const numGridPoints = calculateGridPoints(
    config.spatial_domain.x_min,
    config.spatial_domain.x_max,
    config.spatial_domain.dx
  );

  const numTimeSteps = calculateTimeSteps(
    config.temporal_domain.t_min,
    config.temporal_domain.t_max,
    config.temporal_domain.dt
  );

  // Very rough estimate: assume ~1 microsecond per grid point per time step
  // This is highly hardware-dependent and just for guidance
  const totalOperations = numGridPoints * numTimeSteps;
  return totalOperations / 1000000; // Convert microseconds to seconds
}
