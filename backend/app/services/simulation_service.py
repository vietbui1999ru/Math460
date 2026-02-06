"""
Simulation service for managing simulation lifecycle.
"""
from typing import Dict, Any, Optional
import uuid
import asyncio
from datetime import datetime
import numpy as np
import time

from app.models.schemas import SimulationConfig, SimulationStatus
from app.core.pde_simulator import PDESimulator
from app.core.stability_validator import StabilityValidator


class SimulationService:
    """
    Service layer for managing simulations.
    Handles creation, execution, and state management.
    """

    def __init__(self):
        """Initialize simulation service."""
        self.active_simulations: dict[str, dict[str, None]] = {}
        self.stability_validator = StabilityValidator()

    def create_simulation(self, config: SimulationConfig) -> str:
        """
        Create a new simulation instance.

        Args:
            config: Simulation configuration

        Returns:
            Simulation ID
        """
        simulation_id = str(uuid.uuid4())

        # Create simulator instance
        simulator = PDESimulator(config.model_dump())

        # Store simulation metadata
        self.active_simulations[simulation_id] = {
            "id": simulation_id,
            "config": config,
            "simulator": simulator,
            "status": "created",
            "created_at": datetime.utcnow(),
            "progress": 0.0
        }

        return simulation_id

    def validate_configuration(self, config: SimulationConfig) -> Dict[str, Any]:
        """
        Validate simulation configuration.

        Args:
            config: Configuration to validate

        Returns:
            Validation results
        """
        # Check parameter ranges first
        range_check = self.stability_validator.check_parameter_ranges(config.model_dump())
        if not range_check["valid"]:
            return range_check

        # Validate stability based on equation type
        if config.equation_type == "heat":
            return self.stability_validator.validate_heat_equation(
                beta=config.physical_parameters.beta or 0.1,
                dt=config.temporal_domain.dt,
                dx=config.spatial_domain.dx
            )
        elif config.equation_type == "wave":
            return self.stability_validator.validate_wave_equation(
                c=config.physical_parameters.c or 1.0,
                dt=config.temporal_domain.dt,
                dx=config.spatial_domain.dx
            )
        else:
            return {
                "valid": False,
                "errors": [f"Unknown equation type: {config.equation_type}"],
                "sigma": None
            }

    def get_simulation_status(self, simulation_id: str) -> Optional[dict]:
        """
        Get status of a simulation.

        Args:
            simulation_id: Simulation ID

        Returns:
            Simulation status or None if not found
        """
        if simulation_id not in self.active_simulations:
            return None

        sim = self.active_simulations[simulation_id]
        return {
            "simulation_id": simulation_id,
            "status": sim["status"],
            "progress": sim["progress"],
            "created_at": sim["created_at"].isoformat(),
            "message": f"Time step {int(sim['progress']*100)}% complete"
        }

    def delete_simulation(self, simulation_id: str) -> bool:
        """
        Delete a simulation.

        Args:
            simulation_id: Simulation ID

        Returns:
            True if deleted, False if not found
        """
        if simulation_id in self.active_simulations:
            del self.active_simulations[simulation_id]
            return True
        return False

    async def run_simulation(self, simulation_id: str):
        """
        Execute a simulation (async generator for streaming).

        Args:
            simulation_id: Simulation ID

        Yields:
            Solution data at each time step
        """
        if simulation_id not in self.active_simulations:
            raise ValueError(f"Simulation {simulation_id} not found")

        sim = self.active_simulations[simulation_id]
        simulator = sim["simulator"]
        config = sim["config"]

        # Update status
        sim["status"] = "running"

        # Get complete solution
        solution = simulator.solve()  # shape: (nt, nx)
        nt, nx = solution.shape

        # Create x array
        x_values = np.linspace(
            config.spatial_domain.x_min,
            config.spatial_domain.x_max,
            nx
        ).tolist()

        # Stream each time step
        for time_index in range(nt):
            # Check if paused/stopped
            if sim["status"] == "paused":
                await asyncio.sleep(0.1)
                continue
            if sim["status"] == "stopped":
                break

            # Extract solution at this time step
            u_values = solution[time_index, :].tolist()
            time_value = config.temporal_domain.t_min + time_index * config.temporal_domain.dt

            # Update progress
            sim["progress"] = (time_index + 1) / nt

            # Yield data packet
            yield {
                "simulation_id": simulation_id,
                "time_index": time_index,
                "time_value": time_value,
                "x_values": x_values,
                "u_values": u_values,
                "metadata": {
                    "max_value": float(np.max(solution[time_index, :])),
                    "min_value": float(np.min(solution[time_index, :]))
                }
            }

            # Control streaming speed (50 fps)
            await asyncio.sleep(0.02)

        # Mark as completed
        sim["status"] = "completed"
        sim["progress"] = 1.0

    def pause_simulation(self, simulation_id: str) -> bool:
        """Pause a running simulation."""
        if simulation_id in self.active_simulations:
            self.active_simulations[simulation_id]["status"] = "paused"
            return True
        return False

    def resume_simulation(self, simulation_id: str) -> bool:
        """Resume a paused simulation."""
        if simulation_id in self.active_simulations:
            self.active_simulations[simulation_id]["status"] = "running"
            return True
        return False

    def stop_simulation(self, simulation_id: str) -> bool:
        """Stop a running simulation."""
        if simulation_id in self.active_simulations:
            self.active_simulations[simulation_id]["status"] = "stopped"
            return True
        return False

    def solve_complete_simulation(self, config: SimulationConfig) -> Dict[str, Any]:
        """
        Compute complete simulation solution without storing state.

        Args:
            config: Simulation configuration

        Returns:
            Dictionary with x_values, t_values, u_values, and metadata
        """
        start_time = time.time()

        # Create simulator and solve
        simulator = PDESimulator(config.model_dump())
        solution = simulator.solve()  # Returns (nt, nx) numpy array

        computation_time_ms = (time.time() - start_time) * 1000

        # Extract dimensions
        nt, nx = solution.shape

        # Compute global bounds
        global_min = float(np.min(solution))
        global_max = float(np.max(solution))

        # Build coordinate arrays
        x_values = np.linspace(
            config.spatial_domain.x_min,
            config.spatial_domain.x_max,
            nx
        ).tolist()

        t_values = np.linspace(
            config.temporal_domain.t_min,
            config.temporal_domain.t_max,
            nt
        ).tolist()

        # Convert solution to list
        u_values = solution.tolist()

        # Calculate stability parameter
        if config.equation_type == "heat":
            sigma = (config.physical_parameters.beta or 0.1) * config.temporal_domain.dt / (config.spatial_domain.dx ** 2)
        elif config.equation_type == "wave":
            sigma = ((config.physical_parameters.c or 1.0) * config.temporal_domain.dt / config.spatial_domain.dx) ** 2
        else:
            sigma = 0.0

        return {
            "x_values": x_values,
            "t_values": t_values,
            "u_values": u_values,
            "metadata": {
                "global_min": global_min,
                "global_max": global_max,
                "nx": nx,
                "nt": nt,
                "computation_time_ms": computation_time_ms,
                "stability_parameter": sigma
            }
        }
