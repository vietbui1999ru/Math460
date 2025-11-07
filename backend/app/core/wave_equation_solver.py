"""
Wave equation solver using finite difference methods.
Implements central difference approximation for second-order PDE.
"""
from typing import Callable, Optional
import numpy as np


class WaveEquationSolver:
    """
    Solves 1D wave equation: ∂²u/∂t² = c²·∂²u/∂x²
    Uses central difference finite difference scheme.
    """

    def __init__(
        self,
        x_min: float,
        x_max: float,
        t_min: float,
        t_max: float,
        dx: float,
        dt: float,
        c: float
    ):
        """
        Initialize wave equation solver.

        Args:
            x_min: Minimum spatial coordinate
            x_max: Maximum spatial coordinate
            t_min: Initial time
            t_max: Final time
            dx: Spatial step size
            dt: Time step size
            c: Wave speed
        """
        self.x_min = x_min
        self.x_max = x_max
        self.t_min = t_min
        self.t_max = t_max
        self.dx = dx
        self.dt = dt
        self.c = c

        # Compute grid dimensions
        self.nx = int((x_max - x_min) / dx) + 1
        self.nt = int((t_max - t_min) / dt) + 1

        # Create coordinate arrays
        self.x = np.linspace(x_min, x_max, self.nx)
        self.t = np.linspace(t_min, t_max, self.nt)

        # Stability parameter
        self.sigma = (c * dt / dx) ** 2

        # Solution array
        self.u: Optional[np.ndarray] = None

    def set_initial_position(self, position_func: Callable[[np.ndarray], np.ndarray]):
        """
        Set initial position u(x, 0).

        Args:
            position_func: Function that takes x array and returns u values
        """
        # TODO: Implement initial position setting
        pass

    def set_initial_velocity(self, velocity_func: Callable[[np.ndarray], np.ndarray]):
        """
        Set initial velocity ∂u/∂t(x, 0).

        Args:
            velocity_func: Function that takes x array and returns velocity values
        """
        # TODO: Implement initial velocity setting
        pass

    def set_boundary_conditions(self, left_val: float, right_val: float):
        """
        Set fixed boundary conditions.

        Args:
            left_val: u(x_min, t)
            right_val: u(x_max, t)
        """
        # TODO: Implement boundary condition setting
        pass

    def check_stability(self) -> bool:
        """
        Check CFL stability condition: σ = (c·Δt/Δx)² ≤ 1

        Returns:
            True if stable, False otherwise
        """
        # TODO: Implement stability check
        pass

    def solve(self) -> np.ndarray:
        """
        Solve the wave equation.

        Returns:
            Solution array of shape (nt, nx)
        """
        # TODO: Implement solver
        pass
