"""
Heat equation solver using finite difference methods.
Implements forward Euler scheme with tri-diagonal matrix solver.
"""
from typing import Callable, Optional
import numpy as np


class HeatEquationSolver:
    """
    Solves 1D heat equation: ∂u/∂t = β·∂²u/∂x²
    Uses forward Euler finite difference scheme.
    """

    def __init__(
        self,
        x_min: float,
        x_max: float,
        t_min: float,
        t_max: float,
        dx: float,
        dt: float,
        beta: float
    ):
        """
        Initialize heat equation solver.

        Args:
            x_min: Minimum spatial coordinate
            x_max: Maximum spatial coordinate
            t_min: Initial time
            t_max: Final time
            dx: Spatial step size
            dt: Time step size
            beta: Thermal diffusivity coefficient
        """
        self.x_min = x_min
        self.x_max = x_max
        self.t_min = t_min
        self.t_max = t_max
        self.dx = dx
        self.dt = dt
        self.beta = beta

        # Compute grid dimensions
        self.nx = int((x_max - x_min) / dx) + 1
        self.nt = int((t_max - t_min) / dt) + 1

        # Create coordinate arrays
        self.x = np.linspace(x_min, x_max, self.nx)
        self.t = np.linspace(t_min, t_max, self.nt)

        # Stability parameter
        self.sigma = beta * dt / (dx ** 2)

        # Solution array
        self.u: Optional[np.ndarray] = None
        self.u_initial: Optional[np.ndarray] = None
        self.boundary_left: float = 0.0
        self.boundary_right: float = 0.0

    def set_initial_condition(self, initial_func: Callable[[np.ndarray], np.ndarray]):
        """
        Set initial condition u(x, 0).

        Args:
            initial_func: Function that takes x array and returns u values
        """
        self.u_initial = initial_func(self.x)

    def set_boundary_conditions(self, left_val: float, right_val: float):
        """
        Set Dirichlet boundary conditions.

        Args:
            left_val: u(x_min, t)
            right_val: u(x_max, t)
        """
        self.boundary_left = left_val
        self.boundary_right = right_val

    def check_stability(self) -> bool:
        """
        Check CFL stability condition: σ = β·Δt/Δx² < 0.5

        Returns:
            True if stable, False otherwise
        """
        return self.sigma < 0.5

    def solve(self) -> np.ndarray:
        """
        Solve the heat equation.

        Returns:
            Solution array of shape (nt, nx)
        """
        if self.u_initial is None:
            raise ValueError("Initial condition not set")

        # Build tri-diagonal matrix A
        main_diag = (1 - 2 * self.sigma) * np.ones(self.nx)
        off_diag = self.sigma * np.ones(self.nx - 1)

        A = np.diag(main_diag) + np.diag(off_diag, k=1) + np.diag(off_diag, k=-1)

        # Initialize solution matrix (nt x nx)
        u_matrix = np.zeros((self.nt, self.nx))
        u_matrix[0, :] = self.u_initial

        # Time-stepping loop
        for i in range(self.nt - 1):
            u_matrix[i + 1, :] = A @ u_matrix[i, :]
            # Enforce boundary conditions
            u_matrix[i + 1, 0] = self.boundary_left
            u_matrix[i + 1, -1] = self.boundary_right

        return u_matrix
