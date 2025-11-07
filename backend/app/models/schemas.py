"""
Pydantic schemas for API request/response validation.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, Literal
from enum import Enum


class EquationType(str, Enum):
    """Supported equation types."""
    HEAT = "heat"
    WAVE = "wave"


class BoundaryConditionType(str, Enum):
    """Boundary condition types."""
    DIRICHLET = "dirichlet"
    NEUMANN = "neumann"
    PERIODIC = "periodic"


class InitialConditionPreset(str, Enum):
    """Preset initial conditions."""
    GAUSSIAN = "gaussian"
    SINE = "sine"
    SQUARE_WAVE = "square_wave"
    TRIANGLE_WAVE = "triangle_wave"
    CUSTOM = "custom"


class BoundaryCondition(BaseModel):
    """Boundary condition configuration."""
    type: BoundaryConditionType = BoundaryConditionType.DIRICHLET
    left_value: float = 0.0
    right_value: float = 0.0
    time_dependent: bool = False


class InitialCondition(BaseModel):
    """Initial condition configuration."""
    preset: InitialConditionPreset = InitialConditionPreset.GAUSSIAN
    expression: Optional[str] = None
    params: Dict[str, Any] = Field(default_factory=dict)


class SpatialDiscretization(BaseModel):
    """Spatial discretization parameters."""
    x_min: float = 0.0
    x_max: float = 1.0
    dx: float = 0.01

    @field_validator('dx')
    @classmethod
    def validate_dx(cls, v, info):
        if v <= 0:
            raise ValueError("dx must be positive")
        return v


class TemporalDiscretization(BaseModel):
    """Temporal discretization parameters."""
    t_min: float = 0.0
    t_max: float = 1.0
    dt: float = 0.001

    @field_validator('dt')
    @classmethod
    def validate_dt(cls, v, info):
        if v <= 0:
            raise ValueError("dt must be positive")
        return v


class PhysicalParameters(BaseModel):
    """Physical parameters for the equation."""
    beta: Optional[float] = Field(None, description="Thermal diffusivity (heat equation)")
    c: Optional[float] = Field(None, description="Wave speed (wave equation)")


class SimulationConfig(BaseModel):
    """Complete simulation configuration."""
    equation_type: EquationType
    spatial: SpatialDiscretization
    temporal: TemporalDiscretization
    physical: PhysicalParameters
    boundary: BoundaryCondition
    initial: InitialCondition
    name: Optional[str] = "Unnamed Simulation"


class ValidateConfigRequest(BaseModel):
    """Request to validate configuration."""
    config: SimulationConfig


class SimulationResponse(BaseModel):
    """Response for simulation creation."""
    simulation_id: str
    status: Literal["created", "running", "completed", "failed"]
    message: Optional[str] = None
    websocket_url: Optional[str] = None


class SimulationStatus(BaseModel):
    """Current simulation status."""
    simulation_id: str
    status: Literal["created", "running", "completed", "failed"]
    progress: float = Field(0.0, ge=0.0, le=1.0)
    current_time: Optional[float] = None
    message: Optional[str] = None


class SimulationData(BaseModel):
    """Simulation data packet for WebSocket streaming."""
    simulation_id: str
    time_index: int
    time_value: float
    x_values: list[float]
    u_values: list[float]
    metadata: Optional[Dict[str, Any]] = None
