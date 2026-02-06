"""
Predefined simulation configurations for common PDE problems.
"""

PRESETS = [
    {
        "id": "heat-gaussian",
        "name": "Heat: Gaussian Diffusion",
        "description": "Watch a Gaussian peak spread and decay over time. Classic heat diffusion example.",
        "equation_type": "heat",
        "config": {
            "equation_type": "heat",
            "spatial_domain": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
            "temporal_domain": {"t_min": 0.0, "t_max": 0.5, "dt": 0.0001},
            "physical_parameters": {"beta": 0.1},
            "boundary_condition": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
            "initial_condition": {
                "type": "gaussian",
                "parameters": {"center": 0.5, "width": 0.1, "amplitude": 1.0}
            }
        }
    },
    {
        "id": "heat-sine",
        "name": "Heat: Sine Wave Decay",
        "description": "Sinusoidal initial condition diffusing over time.",
        "equation_type": "heat",
        "config": {
            "equation_type": "heat",
            "spatial_domain": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
            "temporal_domain": {"t_min": 0.0, "t_max": 0.3, "dt": 0.0001},
            "physical_parameters": {"beta": 0.1},
            "boundary_condition": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
            "initial_condition": {
                "type": "sine",
                "parameters": {"amplitude": 1.0, "frequency": 1.0}
            }
        }
    },
    {
        "id": "wave-standing",
        "name": "Wave: Standing Wave",
        "description": "Fundamental mode oscillation of a fixed string. Beautiful sinusoidal oscillation.",
        "equation_type": "wave",
        "config": {
            "equation_type": "wave",
            "spatial_domain": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
            "temporal_domain": {"t_min": 0.0, "t_max": 2.0, "dt": 0.005},
            "physical_parameters": {"c": 1.0},
            "boundary_condition": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
            "initial_condition": {
                "type": "sine",
                "parameters": {"amplitude": 1.0, "frequency": 1.0},
                "velocity_preset": "zero"
            }
        }
    },
    {
        "id": "wave-plucked-string",
        "name": "Wave: Plucked String",
        "description": "Triangle wave release - like plucking a guitar string.",
        "equation_type": "wave",
        "config": {
            "equation_type": "wave",
            "spatial_domain": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
            "temporal_domain": {"t_min": 0.0, "t_max": 2.0, "dt": 0.005},
            "physical_parameters": {"c": 1.0},
            "boundary_condition": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
            "initial_condition": {
                "type": "triangle_wave",
                "parameters": {"amplitude": 1.0},
                "velocity_preset": "zero"
            }
        }
    },
    {
        "id": "wave-gaussian-pulse",
        "name": "Wave: Gaussian Pulse",
        "description": "Traveling wave packet - Gaussian pulse splitting in two directions.",
        "equation_type": "wave",
        "config": {
            "equation_type": "wave",
            "spatial_domain": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
            "temporal_domain": {"t_min": 0.0, "t_max": 1.0, "dt": 0.003},
            "physical_parameters": {"c": 1.0},
            "boundary_condition": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
            "initial_condition": {
                "type": "gaussian",
                "parameters": {"center": 0.5, "width": 0.05, "amplitude": 1.0},
                "velocity_preset": "zero"
            }
        }
    },
    {
        "id": "heat-step-function",
        "name": "Heat: Step Function",
        "description": "Discontinuous initial condition smoothing out over time.",
        "equation_type": "heat",
        "config": {
            "equation_type": "heat",
            "spatial_domain": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
            "temporal_domain": {"t_min": 0.0, "t_max": 0.2, "dt": 0.00005},
            "physical_parameters": {"beta": 0.2},
            "boundary_condition": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
            "initial_condition": {
                "type": "square_wave",
                "parameters": {"amplitude": 1.0}
            }
        }
    }
]


def get_preset_by_id(preset_id: str):
    """Get a preset configuration by ID."""
    for preset in PRESETS:
        if preset["id"] == preset_id:
            return preset
    return None


def get_presets_by_equation_type(equation_type: str):
    """Get all presets for a specific equation type."""
    return [p for p in PRESETS if p["equation_type"] == equation_type]
