"""
Stability validation for numerical schemes.
Checks CFL and other stability conditions.
"""
from typing import Dict, Any, List


class StabilityValidator:
    """
    Validates stability conditions for PDE numerical schemes.
    """

    def __init__(self):
        """Initialize stability validator."""
        self.validation_results: List[Dict[str, Any]] = []

    def validate_heat_equation(
        self,
        beta: float,
        dt: float,
        dx: float
    ) -> Dict[str, Any]:
        """
        Validate stability for heat equation.
        CFL condition: σ = β·Δt/Δx² < 0.5

        Args:
            beta: Thermal diffusivity
            dt: Time step
            dx: Spatial step

        Returns:
            Validation result dictionary
        """
        errors = []

        # Check parameter validity
        if beta <= 0:
            errors.append("beta (thermal diffusivity) must be positive")
        if dt <= 0:
            errors.append("dt (time step) must be positive")
        if dx <= 0:
            errors.append("dx (spatial step) must be positive")

        # Calculate stability parameter
        sigma = beta * dt / (dx ** 2) if dx > 0 else float('inf')

        # Check CFL condition
        if sigma >= 0.5:
            errors.append(f"CFL condition violated: σ = {sigma:.4f} >= 0.5. Reduce dt or increase dx.")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "sigma": sigma,
            "message": "Configuration is stable" if len(errors) == 0 else "Configuration is unstable"
        }

    def validate_wave_equation(
        self,
        c: float,
        dt: float,
        dx: float
    ) -> Dict[str, Any]:
        """
        Validate stability for wave equation.
        CFL condition: σ = (c·Δt/Δx)² ≤ 1

        Args:
            c: Wave speed
            dt: Time step
            dx: Spatial step

        Returns:
            Validation result dictionary
        """
        errors = []

        # Check parameter validity
        if c <= 0:
            errors.append("c (wave speed) must be positive")
        if dt <= 0:
            errors.append("dt (time step) must be positive")
        if dx <= 0:
            errors.append("dx (spatial step) must be positive")

        # Calculate stability parameter
        sigma = (c * dt / dx) ** 2 if dx > 0 else float('inf')

        # Check CFL condition
        if sigma > 1.0:
            errors.append(f"CFL condition violated: σ = {sigma:.4f} > 1.0. Reduce dt or increase dx.")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "sigma": sigma,
            "message": "Configuration is stable" if len(errors) == 0 else "Configuration is unstable"
        }

    def check_parameter_ranges(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check if parameters are within acceptable ranges.

        Args:
            config: Configuration dictionary

        Returns:
            Validation result dictionary
        """
        errors = []

        # Check spatial discretization (handle both old and new field names)
        spatial = config.get("spatial_domain") or config.get("spatial", {})
        if spatial.get("dx", 0) <= 0:
            errors.append("dx must be positive")
        if spatial.get("x_max", 0) <= spatial.get("x_min", 0):
            errors.append("x_max must be greater than x_min")

        # Check temporal discretization (handle both old and new field names)
        temporal = config.get("temporal_domain") or config.get("temporal", {})
        if temporal.get("dt", 0) <= 0:
            errors.append("dt must be positive")
        if temporal.get("t_max", 0) <= temporal.get("t_min", 0):
            errors.append("t_max must be greater than t_min")

        return {
            "valid": len(errors) == 0,
            "errors": errors
        }
