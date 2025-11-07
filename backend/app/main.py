"""
FastAPI main application for PDE simulation platform.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import routes
from app.websockets import handlers

app = FastAPI(
    title="PDE Simulation Platform",
    description="Heat and Wave Equation Solver with Real-time Visualization",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(routes.router, prefix="/api")

# Include WebSocket routes
app.include_router(handlers.router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "online", "service": "PDE Simulation Platform"}


@app.get("/health")
async def health():
    """Health check for container orchestration."""
    return {"status": "healthy"}
