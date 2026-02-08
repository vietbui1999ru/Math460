"""
Initial condition management for PDE simulations.
Supports function-based and preset initial conditions.
"""
from typing import Callable, Dict, Any
import numpy as np


class InitialConditionManager:
    """
    Manages initial conditions for PDE simulations.
    """

    def __init__(self):
        """Initialize initial condition manager."""
        self.position_func: Callable[[np.ndarray], np.ndarray] = lambda x: np.zeros_like(x)
        self.velocity_func: Callable[[np.ndarray], np.ndarray] = lambda x: np.zeros_like(x)

    def set_from_function(self, func: Callable[[np.ndarray], np.ndarray]):
        """
        Set initial condition from mathematical function.

        Args:
            func: Function that takes x array and returns u values
        """
        self.position_func = func

    def set_from_expression(self, expression: str):
        """
        Set initial condition from string expression.
        Example: "sin(2*pi*x)" or "exp(-x**2)"

        Args:
            expression: Mathematical expression string
        """
        import ast
        import operator
        # Create a safe namespace for eval
        safe_dict = {
            'sin': np.sin,
            'cos': np.cos,
            'exp': np.exp,
            'pi': np.pi,
            'sqrt': np.sqrt,
            'abs': np.abs
        }
        def expr_func(x):
            safe_dict['x'] = x
            try:
                return eval(expression, {"__builtins__": {}}, safe_dict)
            except:
                return np.zeros_like(x)
        self.position_func = expr_func

    def set_preset(self, preset_name: str, params: Dict[str, Any]):
        """
        Set initial condition from preset.

        Args:
            preset_name: Name of preset (gaussian, sine, square_wave, etc.)
            params: Parameters for the preset
        """
        if preset_name == "gaussian":
            center = params.get("center", 0.5)
            width = params.get("width", 0.1)
            amplitude = params.get("amplitude", 1.0)
            self.position_func = self.get_gaussian(center, width, amplitude)
        elif preset_name == "sine":
            frequency = params.get("frequency", 1.0)
            amplitude = params.get("amplitude", 1.0)
            phase = params.get("phase", 0.0)
            self.position_func = self.get_sine_wave(frequency, amplitude, phase)
        elif preset_name == "square_wave":
            amplitude = params.get("amplitude", 1.0)
            def square_wave(x):
                return amplitude * np.where(x < 0.5, 1.0, -1.0)
            self.position_func = square_wave
        elif preset_name == "triangle_wave":
            amplitude = params.get("amplitude", 1.0)
            def triangle_wave(x):
                return amplitude * (1 - 2 * np.abs(x - 0.5))
            self.position_func = triangle_wave
        elif preset_name == "zero":
            self.position_func = lambda x: np.zeros_like(x)
        else:
            # Default to zero
            self.position_func = lambda x: np.zeros_like(x)

    def get_initial_condition(self) -> Callable:
        """
        Get the current initial condition function.

        Returns:
            Position function
        """
        return self.position_func

    def get_initial_velocity(self) -> Callable:
        """
        Get the current initial velocity function.

        Returns:
            Velocity function
        """
        return self.velocity_func

    def set_initial_velocity(self, preset_name: str, params: Dict[str, Any] = None):
        """
        Set initial velocity from preset.

        Args:
            preset_name: Name of preset (zero, sine, gaussian, etc.)
            params: Parameters for the preset
        """
        if params is None:
            params = {}
        if preset_name == "zero":
            self.velocity_func = lambda x: np.zeros_like(x)
        elif preset_name == "sine":
            frequency = params.get("frequency", 1.0)
            amplitude = params.get("amplitude", 1.0)
            self.velocity_func = self.get_sine_wave(frequency, amplitude)
        else:
            self.velocity_func = lambda x: np.zeros_like(x)

    def get_gaussian(self, center: float, width: float, amplitude: float) -> Callable:
        """
        Generate Gaussian initial condition.

        Args:
            center: Center position
            width: Standard deviation
            amplitude: Peak amplitude

        Returns:
            Gaussian function
        """
        def gaussian(x):
            return amplitude * np.exp(-((x - center) ** 2) / (2 * width ** 2))
        return gaussian

    def get_sine_wave(self, frequency: float, amplitude: float, phase: float = 0) -> Callable:
        """
        Generate sinusoidal initial condition.

        Args:
            frequency: Wave frequency
            amplitude: Wave amplitude
            phase: Phase shift

        Returns:
            Sine wave function
        """
        def sine_wave(x):
            return amplitude * np.sin(2 * np.pi * frequency * x + phase)
        return sine_wave
