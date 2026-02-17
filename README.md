# PDE Simulation Platform

A modern full-stack web application for solving and visualizing **Heat** and **Wave** equations using finite difference methods. Built with FastAPI, React, and Plotly.js for real-time interactive simulations.

---

## Table of Contents

- [Overview](#overview)
- [The Mathematics: Finite Difference Method](#the-mathematics-finite-difference-method)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Design Decisions & Trade-offs](#design-decisions--trade-offs)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Development](#development)
- [Roadmap](#roadmap)

---

## Overview

This platform solves partial differential equations (PDEs) numerically and visualizes the results in real-time. It supports:

- **Heat Equation**: Models heat diffusion/conduction
- **Wave Equation**: Models wave propagation (strings, acoustics)

### Key Features

| Feature | Description |
|---------|-------------|
| **Real-time Visualization** | 2D line plots, 3D surfaces, and heatmaps via Plotly.js |
| **Client-side Playback** | Smooth 50 FPS animation with speed controls |
| **CFL Stability Validation** | Automatic checks before simulation |
| **Preset Configurations** | 6 built-in scenarios for quick demos |
| **Docker Deployment** | One-command production deployment |

---

## The Mathematics: Finite Difference Method

### What is the Finite Difference Method?

The **Finite Difference Method (FDM)** approximates derivatives by replacing them with difference quotients on a discrete grid. Instead of solving PDEs analytically (often impossible), we compute approximate solutions at discrete points.

```
Continuous Domain              Discrete Grid

u(x, t)                       u[i, n] = u(i*dx, n*dt)

    t                              n
    │                              │
    │    u(x,t)                    │  ●──●──●──●
    │   ╱                          │  │  │  │  │
    │  ╱                           │  ●──●──●──●
    │ ╱                            │  │  │  │  │
    └────────── x                  └──●──●──●──● i
```

### Heat Equation

**Physical Meaning**: Describes how temperature distributes over time in a material.

**Mathematical Form**:
```
∂u/∂t = β · ∂²u/∂x²

where:
  u(x,t) = temperature at position x and time t
  β      = thermal diffusivity (how fast heat spreads)
```

**Finite Difference Approximation**:

```
Forward difference in time:     ∂u/∂t ≈ (u[i,n+1] - u[i,n]) / Δt

Central difference in space:    ∂²u/∂x² ≈ (u[i-1,n] - 2·u[i,n] + u[i+1,n]) / Δx²
```

**Update Formula** (Forward Euler):
```
u[i, n+1] = u[i, n] + σ · (u[i-1, n] - 2·u[i, n] + u[i+1, n])

where σ = β·Δt/Δx² (stability parameter)
```

**Stability Condition**: The scheme is stable only if `σ < 0.5`

```
If σ ≥ 0.5:  Solution explodes exponentially (numerical instability)
If σ < 0.5:  Solution remains bounded and converges to true solution
```

### Wave Equation

**Physical Meaning**: Describes vibrations of a string, membrane, or acoustic waves.

**Mathematical Form**:
```
∂²u/∂t² = c² · ∂²u/∂x²

where:
  u(x,t) = displacement at position x and time t
  c      = wave speed
```

**Finite Difference Approximation** (Central differences in both time and space):

```
∂²u/∂t² ≈ (u[i,n+1] - 2·u[i,n] + u[i,n-1]) / Δt²

∂²u/∂x² ≈ (u[i-1,n] - 2·u[i,n] + u[i+1,n]) / Δx²
```

**Update Formula** (Three-level scheme):
```
u[i, n+1] = 2·u[i, n] - u[i, n-1] + σ · (u[i-1, n] - 2·u[i, n] + u[i+1, n])

where σ = (c·Δt/Δx)² (CFL number)
```

**Stability Condition** (Courant-Friedrichs-Lewy): `σ ≤ 1`

```
σ = 1:  Exact solution at grid points (optimal)
σ > 1:  Unstable - solution grows without bound
σ < 1:  Stable but introduces numerical dispersion
```

### Visual: How the Stencil Works

```
Heat Equation Stencil:           Wave Equation Stencil:

      n+1:    [ ? ]                    n+1:    [ ? ]
               ↑                                 ↑
       n:  [σ][1-2σ][σ]                 n:  [σ][2-2σ][σ]
                                                 ↓
                                       n-1:    [-1]

To compute u[i,n+1], we need:
- Heat: only values at time n
- Wave: values at times n and n-1 (requires 2 initial conditions)
```

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     React + TypeScript + Vite                    │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐    │   │
│  │  │ Parameter   │  │ Visualization │  │ Simulation          │    │   │
│  │  │ Panel       │──│ Canvas       │──│ Controls            │    │   │
│  │  │ (Config)    │  │ (Plotly.js)  │  │ (Play/Pause/Speed)  │    │   │
│  │  └─────────────┘  └──────────────┘  └─────────────────────┘    │   │
│  │         │                 ▲                                      │   │
│  │         │                 │ frameData = u_values[currentFrame]  │   │
│  │         ▼                 │                                      │   │
│  │  ┌────────────────────────────────────────────────────────┐     │   │
│  │  │              App.tsx (State Management)                 │     │   │
│  │  │  • completeSolution: {x_values, t_values, u_values}    │     │   │
│  │  │  • currentFrame: number (animated via RAF)             │     │   │
│  │  │  • playbackSpeed: 0.25x - 4x                           │     │   │
│  │  └────────────────────────────────────────────────────────┘     │   │
│  │         │                                                        │   │
│  │         │ POST /api/simulations/solve                           │   │
│  │         ▼                                                        │   │
│  │  ┌────────────────────────────────────────────────────────┐     │   │
│  │  │              API Service (Axios)                        │     │   │
│  │  └────────────────────────────────────────────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP / WebSocket
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           SERVER (FastAPI)                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         API Routes                               │   │
│  │  POST /api/simulations/solve  ─→  SimulationService.solve()     │   │
│  │  POST /api/simulations/validate ─→ StabilityValidator           │   │
│  │  GET  /api/presets            ─→  Preset configurations         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      PDESimulator                                │   │
│  │  ┌───────────────────┐        ┌───────────────────┐            │   │
│  │  │ HeatEquationSolver │        │ WaveEquationSolver │            │   │
│  │  │ (Forward Euler)   │        │ (Central Diff)     │            │   │
│  │  └───────────────────┘        └───────────────────┘            │   │
│  │           │                            │                         │   │
│  │           └────────────┬───────────────┘                         │   │
│  │                        ▼                                         │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │  NumPy Array: u_values[nt, nx]  (Complete Solution)     │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Sequence

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │     │ Frontend │     │ Backend  │     │  Solver  │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ Configure      │                │                │
     │ Parameters     │                │                │
     │───────────────>│                │                │
     │                │                │                │
     │ Click "Solve"  │                │                │
     │───────────────>│                │                │
     │                │ POST /solve    │                │
     │                │ {config}       │                │
     │                │───────────────>│                │
     │                │                │ solve(config)  │
     │                │                │───────────────>│
     │                │                │                │
     │                │                │   ┌─────────────────┐
     │                │                │   │ Time-stepping   │
     │                │                │   │ loop:           │
     │                │                │   │ for n in 0..nt  │
     │                │                │   │   u[n+1] = f(u) │
     │                │                │   └─────────────────┘
     │                │                │                │
     │                │                │<───────────────│
     │                │                │ u_values[nt,nx]│
     │                │<───────────────│                │
     │                │ CompleteSolution                │
     │                │                │                │
     │                │ ┌─────────────────────────────┐ │
     │                │ │ Animation Loop (50 FPS):    │ │
     │                │ │ frame++                     │ │
     │                │ │ render(u_values[frame])     │ │
     │                │ └─────────────────────────────┘ │
     │<───────────────│                │                │
     │ Animated       │                │                │
     │ Visualization  │                │                │
     │                │                │                │
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │  ParameterPanel │    │ PresetSelector  │    │SimulationControls│ │
│  │  ─────────────  │    │ ─────────────── │    │ ───────────────  │ │
│  │  • Equation     │    │ • Heat Gaussian │    │ • Play/Pause    │ │
│  │  • Spatial dx   │    │ • Heat Sine     │    │ • Reset         │ │
│  │  • Temporal dt  │    │ • Wave Standing │    │ • Step ±1       │ │
│  │  • Boundaries   │    │ • Wave Plucked  │    │ • Speed 0.25-4x │ │
│  │  • Initial Cond │    │ • Wave Gaussian │    │ • Time Scrubber │ │
│  │  • β or c       │    │ • Heat Step     │    │                 │ │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘ │
│           │                      │                      │          │
│           └──────────────────────┴──────────────────────┘          │
│                                  │                                  │
│                                  ▼                                  │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    VisualizationCanvas                         │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │ │
│  │  │   2D Plot   │ │  3D Surface │ │   Heatmap   │ │  Grid   │ │ │
│  │  │  u(x) line  │ │  u(x,t)     │ │   x vs t    │ │  2x2    │ │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                            BACKEND                                   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    SimulationService                         │   │
│  │  • create_simulation()   • solve_simulation()                │   │
│  │  • validate_config()     • stream_results()                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                  │                                  │
│                                  ▼                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      PDESimulator                            │   │
│  │                           │                                  │   │
│  │    ┌──────────────────────┼──────────────────────┐          │   │
│  │    ▼                      ▼                      ▼          │   │
│  │ ┌──────────────┐  ┌───────────────┐  ┌────────────────┐    │   │
│  │ │   Initial    │  │   Boundary    │  │   Stability    │    │   │
│  │ │  Condition   │  │   Condition   │  │   Validator    │    │   │
│  │ │   Manager    │  │    Manager    │  │  (CFL Check)   │    │   │
│  │ └──────────────┘  └───────────────┘  └────────────────┘    │   │
│  │                           │                                  │   │
│  │    ┌──────────────────────┴──────────────────────┐          │   │
│  │    ▼                                             ▼          │   │
│  │ ┌──────────────────────┐      ┌──────────────────────┐     │   │
│  │ │  HeatEquationSolver  │      │  WaveEquationSolver  │     │   │
│  │ │  ──────────────────  │      │  ──────────────────  │     │   │
│  │ │  • Forward Euler     │      │  • Central Diff      │     │   │
│  │ │  • σ = β·dt/dx²      │      │  • σ = (c·dt/dx)²    │     │   │
│  │ │  • Stability: σ<0.5  │      │  • Stability: σ≤1    │     │   │
│  │ └──────────────────────┘      └──────────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Backend

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | FastAPI 0.109 | Async REST API with auto-docs |
| **Server** | Uvicorn | High-performance ASGI server |
| **Validation** | Pydantic | Data models & validation |
| **Numerics** | NumPy, SciPy | Matrix operations & solvers |
| **Real-time** | WebSockets | Optional streaming support |
| **Runtime** | Python 3.11 | Latest stable Python |

### Frontend

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | React 18.2 | Component-based UI |
| **Language** | TypeScript | Type-safe development |
| **Build** | Vite 5.0 | Fast HMR & bundling |
| **Visualization** | Plotly.js 2.27 | Interactive 2D/3D plots |
| **HTTP Client** | Axios 1.6 | API requests |
| **Styling** | CSS Modules | Scoped styling |

### Infrastructure

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Containers** | Docker | Consistent environments |
| **Orchestration** | Docker Compose | Multi-service deployment |
| **Reverse Proxy** | Nginx | Static files & API proxy |
| **Build Automation** | Make | Developer commands |

---

## Design Decisions & Trade-offs

### 1. Complete Solution vs. Streaming

**Decision**: Compute the entire solution on the backend, return as one response, animate on the frontend.

| Approach | Pros | Cons |
|----------|------|------|
| **Complete Solution** (chosen) | Simple, deterministic, no sync issues | Higher memory for large grids |
| **WebSocket Streaming** | Lower latency, progressive display | Complex state, potential desync |

**Rationale**: For typical grid sizes (< 10,000 points), memory is not a concern. The complete solution approach eliminates race conditions and simplifies the frontend animation logic.

### 2. Forward Euler vs. Implicit Methods

**Decision**: Use explicit Forward Euler for the heat equation.

| Method | Pros | Cons |
|--------|------|------|
| **Forward Euler** (chosen) | Simple, fast per step, vectorizable | Requires σ < 0.5 (small time steps) |
| **Backward Euler** | Unconditionally stable | Requires solving linear system each step |
| **Crank-Nicolson** | 2nd order accurate, stable | More complex implementation |

**Rationale**: For educational purposes and interactive demos, Forward Euler's simplicity and speed are valuable. The stability restriction is communicated clearly to users.

### 3. React State vs. Redux/Zustand

**Decision**: Use React's built-in useState and useEffect hooks.

| Approach | Pros | Cons |
|----------|------|------|
| **useState** (chosen) | Simple, no dependencies, sufficient for scope | Manual prop drilling |
| **Redux** | Centralized state, time-travel debugging | Boilerplate, overkill for this app |
| **Zustand** | Minimal boilerplate, easy setup | Another dependency to manage |

**Rationale**: The application has a relatively simple state tree (config, solution, frame index, playback state). React's built-in state management is sufficient and keeps the bundle small.

### 4. Plotly.js vs. D3.js vs. Three.js

**Decision**: Use Plotly.js for all visualizations.

| Library | Pros | Cons |
|---------|------|------|
| **Plotly.js** (chosen) | Built-in 2D/3D, scientific defaults, interactive | Large bundle (~3MB) |
| **D3.js** | Maximum flexibility, small core | No built-in 3D, steep learning curve |
| **Three.js** | Best 3D performance | Overkill for surface plots |

**Rationale**: Plotly provides scientific visualization out-of-the-box with good interactivity. The bundle size trade-off is acceptable for a simulation platform.

### 5. REST vs. GraphQL

**Decision**: Use REST endpoints.

| Approach | Pros | Cons |
|----------|------|------|
| **REST** (chosen) | Simple, well-understood, good caching | Multiple requests for related data |
| **GraphQL** | Single request, typed schema | Complexity, learning curve |

**Rationale**: The API surface is simple (solve, validate, presets). REST's simplicity is preferred over GraphQL's flexibility for this use case.

### 6. Docker Multi-Stage Build

**Decision**: Use multi-stage builds for production images.

```dockerfile
# Builder stage: Node 18, npm install, build
# Production stage: Nginx Alpine, copy dist only
```

**Benefit**: Final image is ~50MB instead of ~1GB (no node_modules).

### 7. Fixed vs. Dynamic Axes

**Decision**: Fix axis ranges based on global min/max of the complete solution.

**Problem**: If axes auto-scale per frame, the plot "jumps" during animation.

**Solution**: Compute `global_min` and `global_max` from metadata, set as fixed range.

---

## Getting Started

### Prerequisites

- **Docker & Docker Compose** (recommended)
- OR **Python 3.11+** and **Node.js 18+** (for local development)

### Quick Start (Docker)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/Math460.git
cd Math460

# 2. Build and start containers
make build
make up

# 3. Access the application
# Frontend: http://localhost
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Local Development

```bash
# 1. Clone and enter directory
git clone https://github.com/your-username/Math460.git
cd Math460

# 2. Install dependencies
make install

# 3. Start development servers
make dev
# Frontend: http://localhost:5173
# Backend: http://localhost:8000
```

### Manual Setup (Without Make)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Verify Installation

```bash
# Check backend health
curl http://localhost:8000/health

# Expected response:
# {"status": "healthy", "version": "1.0.0"}
```

---

## API Reference

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/simulations/validate` | Validate configuration |
| `POST` | `/api/simulations/solve` | Compute complete solution |
| `GET` | `/api/presets` | List preset configurations |

### Solve Request

```bash
curl -X POST http://localhost:8000/api/simulations/solve \
  -H "Content-Type: application/json" \
  -d '{
    "equation_type": "heat",
    "spatial_domain": {"x_min": 0, "x_max": 1, "dx": 0.01},
    "temporal_domain": {"t_min": 0, "t_max": 0.5, "dt": 0.0001},
    "physical_parameters": {"beta": 0.1},
    "boundary_condition": {"type": "dirichlet", "left_value": 0, "right_value": 0},
    "initial_condition": {"type": "gaussian", "parameters": {"amplitude": 1, "center": 0.5, "width": 0.1}}
  }'
```

### Response Structure

```json
{
  "simulation_id": "abc123",
  "config": { ... },
  "x_values": [0, 0.01, 0.02, ...],
  "t_values": [0, 0.0001, 0.0002, ...],
  "u_values": [[...], [...], ...],
  "metadata": {
    "global_min": -0.05,
    "global_max": 1.0,
    "nx": 101,
    "nt": 5001,
    "computation_time_ms": 45,
    "stability_parameter": 0.1
  }
}
```

### WebSocket (Optional Streaming)

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/simulation/abc123');
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'data') {
    // msg.data contains { time_index, time_value, x_values, u_values }
  }
};
ws.send(JSON.stringify({ command: 'start' }));
```

---

## Project Structure

```
Math460/
├── backend/                      # FastAPI Backend
│   ├── app/
│   │   ├── main.py              # Application entry point
│   │   ├── api/
│   │   │   └── routes.py        # REST endpoints
│   │   ├── core/
│   │   │   ├── pde_simulator.py         # Solver orchestrator
│   │   │   ├── heat_equation_solver.py  # Heat equation (Forward Euler)
│   │   │   ├── wave_equation_solver.py  # Wave equation (Central Diff)
│   │   │   ├── stability_validator.py   # CFL condition checker
│   │   │   ├── initial_condition_manager.py
│   │   │   └── boundary_condition_manager.py
│   │   ├── models/
│   │   │   └── schemas.py       # Pydantic data models
│   │   ├── services/
│   │   │   └── simulation_service.py
│   │   ├── websockets/
│   │   │   └── handlers.py      # WebSocket streaming
│   │   └── presets/
│   │       └── simulation_presets.py
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                     # React Frontend
│   ├── src/
│   │   ├── App.tsx              # Main component & state
│   │   ├── main.tsx             # Entry point
│   │   ├── components/
│   │   │   ├── ParameterPanel.tsx       # Configuration UI
│   │   │   ├── VisualizationCanvas.tsx  # Plotly renderer
│   │   │   ├── SimulationControls.tsx   # Playback controls
│   │   │   ├── PresetSelector.tsx
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── api.ts           # Axios client
│   │   │   └── websocket.ts     # WebSocket client
│   │   ├── types/
│   │   │   └── simulation.ts    # TypeScript interfaces
│   │   └── utils/
│   │       └── validation.ts
│   ├── package.json
│   ├── vite.config.ts
│   ├── nginx.conf
│   └── Dockerfile
│
├── Model/                        # Original Python implementations
│   ├── wave_eq.py
│   └── wave_final.py
│
├── docker-compose.yml           # Production deployment
├── docker-compose.dev.yml       # Development with hot-reload
├── Makefile                     # Build commands
├── CLAUDE.md                    # Architecture documentation
└── README.md                    # This file
```

---

## Development

### Available Commands

```bash
make help              # Show all commands
make install           # Install all dependencies
make dev               # Run both servers locally
make build             # Build Docker images
make up                # Start production containers
make up-dev            # Start dev containers with hot-reload
make down              # Stop all containers
make logs              # View all logs
make test              # Run backend tests
make lint              # Run linters
make format            # Format code
make clean             # Clean build artifacts
```

### Running Tests

```bash
# Backend tests
cd backend
pytest tests/ -v

# With coverage
pytest tests/ --cov=app --cov-report=html
```

### Environment Variables

**Backend** (`backend/.env`):
```bash
DEBUG=true
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Frontend** (`frontend/.env`):
```bash
VITE_API_BASE_URL=http://localhost:8001
VITE_WS_BASE_URL=ws://localhost:8001
```

---

## Roadmap

### Completed

- [x] Heat equation solver with Forward Euler
- [x] Wave equation solver with central differences
- [x] CFL stability validation
- [x] REST API with FastAPI
- [x] React frontend with Plotly.js
- [x] 2D, 3D, and heatmap visualizations
- [x] Client-side animation playback
- [x] Docker containerization
- [x] 6 preset configurations

### In Progress

- [ ] WebSocket streaming refinement
- [ ] Enhanced 3D visualization controls
- [ ] Parameter sweep mode

### Planned

- [ ] 2D spatial domain (heat in a plate)
- [ ] Neumann and periodic boundary conditions
- [ ] Custom expression parser for initial conditions
- [ ] Export to MP4/GIF
- [ ] GPU acceleration (WebGL shaders)
- [ ] Simulation comparison view

---

## License

Educational and research use only. See institution guidelines.

---

## Acknowledgments

- Numerical methods based on classical finite difference theory
- Original implementations in `heat_eq.py` and `Model/wave_eq.py`
- Built with FastAPI, React, and Plotly.js communities

---

**Version**: 2.0.0
**Last Updated**: February 2026
**Status**: Active Development
