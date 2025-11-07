"""
WebSocket handlers for real-time simulation streaming.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict
import json
import asyncio

from app.services.simulation_service import SimulationService

router = APIRouter()
simulation_service = SimulationService()

# Track active WebSocket connections
active_connections: Dict[str, WebSocket] = {}


@router.websocket("/ws/simulation/{simulation_id}")
async def simulation_websocket(websocket: WebSocket, simulation_id: str):
    """
    WebSocket endpoint for streaming simulation results.

    Args:
        websocket: WebSocket connection
        simulation_id: ID of the simulation to stream
    """
    await websocket.accept()
    active_connections[simulation_id] = websocket

    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connected",
            "simulation_id": simulation_id,
            "message": "WebSocket connection established"
        })

        # Listen for client messages (start, pause, stop commands)
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("command") == "start":
                # TODO: Start simulation and stream results
                await websocket.send_json({
                    "type": "status",
                    "status": "running",
                    "message": "Simulation started"
                })
                # Stream simulation data
                # for time_step in simulation_service.run_simulation(simulation_id):
                #     await websocket.send_json(time_step)

            elif message.get("command") == "pause":
                # TODO: Pause simulation
                pass

            elif message.get("command") == "stop":
                # TODO: Stop simulation
                break

    except WebSocketDisconnect:
        if simulation_id in active_connections:
            del active_connections[simulation_id]
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })
    finally:
        if simulation_id in active_connections:
            del active_connections[simulation_id]


@router.websocket("/ws/health")
async def health_websocket(websocket: WebSocket):
    """
    Health check WebSocket endpoint.
    """
    await websocket.accept()
    await websocket.send_json({"status": "healthy"})
    await websocket.close()
