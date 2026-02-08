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
        self.u_initial: Optional[np.ndarray] = None
        self.v_initial: Optional[np.ndarray] = None
        self.boundary_left: float = 0.0
        self.boundary_right: float = 0.0

    def set_initial_position(self, position_func: Callable[[np.ndarray], np.ndarray]):
        """
        Set initial position u(x, 0).

        Args:
            position_func: Function that takes x array and returns u values
        """
        self.u_initial = position_func(self.x)

    def set_initial_velocity(self, velocity_func: Callable[[np.ndarray], np.ndarray]):
        """
        Set initial velocity ∂u/∂t(x, 0).

        Args:
            velocity_func: Function that takes x array and returns velocity values
        """
        self.v_initial = velocity_func(self.x)

    def set_boundary_conditions(self, left_val: float, right_val: float):
        """
        Set fixed boundary conditions.

        Args:
            left_val: u(x_min, t)
            right_val: u(x_max, t)
        """
        self.boundary_left = left_val
        self.boundary_right = right_val

    def check_stability(self) -> bool:
        """
        Check CFL stability condition: σ = (c·Δt/Δx)² ≤ 1

        Returns:
            True if stable, False otherwise
        """
        return self.sigma <= 1.0

    def solve(self) -> np.ndarray:
        """
        Solve the wave equation.

        Returns:
            Solution array of shape (nt, nx)
        """
        if self.u_initial is None:
            raise ValueError("Initial position not set")
        if self.v_initial is None:
            raise ValueError("Initial velocity not set")

        # Build tri-diagonal matrix A
        main_diag = 2 * (1 - self.sigma) * np.ones(self.nx)
        off_diag = self.sigma * np.ones(self.nx - 1)

        A = np.diag(main_diag) + np.diag(off_diag, k=1) + np.diag(off_diag, k=-1)

        # Initialize solution matrix
        u_matrix = np.zeros((self.nt, self.nx))
        u_matrix[0, :] = self.u_initial

        # Compute first time step using initial velocity and position
        u_matrix[1, :] = self.u_initial + self.dt * self.v_initial
        u_matrix[1, :] = (A @ self.u_initial - u_matrix[1, :]) / 2

        # Enforce boundary conditions
        u_matrix[1, 0] = self.boundary_left
        u_matrix[1, -1] = self.boundary_right

        # Three-level time-stepping scheme
        for i in range(1, self.nt - 1):
            u_matrix[i + 1, :] = A @ u_matrix[i, :] - u_matrix[i - 1, :]

            # Enforce boundary conditions
            u_matrix[i + 1, 0] = self.boundary_left
            u_matrix[i + 1, -1] = self.boundary_right

        return u_matrix
