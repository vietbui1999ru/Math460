"""
WebSocket handlers for real-time simulation streaming.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict
import json
import asyncio

from app.services import simulation_service

router = APIRouter()

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
                # Check if simulation exists
                if simulation_id not in simulation_service.active_simulations:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Simulation {simulation_id} not found"
                    })
                    break

                # Start simulation and stream results
                await websocket.send_json({
                    "type": "status",
                    "status": "running",
                    "message": "Simulation started"
                })
                # Stream simulation data
                async for data in simulation_service.run_simulation(simulation_id):
                    await websocket.send_json({
                        "type": "data",
                        "data": data
                    })

                # Send completion message
                await websocket.send_json({
                    "type": "completed",
                    "simulation_id": simulation_id,
                    "message": "Simulation completed"
                })

            elif message.get("command") == "pause":
                # Pause simulation
                simulation_service.pause_simulation(simulation_id)
                await websocket.send_json({
                    "type": "status",
                    "status": "paused",
                    "message": "Simulation paused"
                })

            elif message.get("command") == "resume":
                # Resume simulation
                simulation_service.resume_simulation(simulation_id)
                await websocket.send_json({
                    "type": "status",
                    "status": "running",
                    "message": "Simulation resumed"
                })

            elif message.get("command") == "stop":
                # Stop simulation
                simulation_service.stop_simulation(simulation_id)
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
