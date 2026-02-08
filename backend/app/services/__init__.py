"""
Business logic services
"""
from app.services.simulation_service import SimulationService

# Global shared instance - used by both routes and WebSocket handlers
simulation_service = SimulationService()
