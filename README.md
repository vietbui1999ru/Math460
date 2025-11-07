# PDE Simulation Platform

A modern web-based platform for solving and visualizing heat and wave equation simulations using finite difference methods.

## Overview

This project has evolved from a Python-based command-line tool to a full-stack web application with real-time visualization capabilities. The original heat and wave equation solvers have been refactored into a modular architecture with a FastAPI backend and React frontend.

## Features

### Simulation Capabilities
- **Heat Equation Solver**: Forward Euler scheme with automatic CFL stability validation (σ = β·Δt/Δx² < 0.5)
- **Wave Equation Solver**: Central difference approximation for second-order PDEs (σ = (c·Δt/Δx)² ≤ 1)
- **Flexible Initial Conditions**: Gaussian, sine wave, square wave, triangle wave, or custom expressions
- **Boundary Conditions**: Dirichlet, Neumann, and periodic boundaries
- **Real-time Streaming**: WebSocket-based simulation data streaming

### Visualization
- **Interactive 2D Plots**: Real-time line plots using Plotly.js
- **3D Surface Plots**: Complete spatiotemporal solution visualization (coming soon)
- **Animation Controls**: Play, pause, reset simulation playback
- **Responsive Design**: Modern dark-themed UI

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework with automatic API documentation
- **NumPy**: High-performance numerical computations
- **WebSockets**: Real-time bidirectional communication
- **Pydantic**: Data validation and settings management
- **Uvicorn**: Lightning-fast ASGI server

### Frontend
- **React 18**: Component-based UI framework
- **TypeScript**: Type-safe JavaScript for robust development
- **Plotly.js**: Interactive scientific visualizations
- **Vite**: Next-generation build tool with HMR
- **Axios**: Promise-based HTTP client

### Infrastructure
- **Docker**: Container platform for consistent deployment
- **Docker Compose**: Multi-container orchestration
- **Nginx**: High-performance reverse proxy
- **Make**: Build automation and convenience commands

## Project Structure

```
Math460/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI application entry point
│   │   ├── api/               # REST API endpoints
│   │   │   ├── __init__.py
│   │   │   └── routes.py      # Simulation CRUD operations
│   │   ├── core/              # Simulation Engine
│   │   │   ├── __init__.py
│   │   │   ├── pde_simulator.py
│   │   │   ├── heat_equation_solver.py
│   │   │   ├── wave_equation_solver.py
│   │   │   ├── stability_validator.py
│   │   │   ├── boundary_condition_manager.py
│   │   │   └── initial_condition_manager.py
│   │   ├── models/            # Data Models
│   │   │   ├── __init__.py
│   │   │   └── schemas.py     # Pydantic schemas
│   │   ├── services/          # Business Logic
│   │   │   ├── __init__.py
│   │   │   └── simulation_service.py
│   │   └── websockets/        # Real-time Communication
│   │       ├── __init__.py
│   │       └── handlers.py
│   ├── tests/                 # Unit & Integration Tests
│   │   ├── __init__.py
│   │   ├── test_api.py
│   │   └── test_solvers.py
│   ├── .dockerignore
│   ├── .env.example           # Environment variables template
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── App.tsx            # Main application component
│   │   ├── main.tsx           # Application entry point
│   │   ├── components/        # React Components
│   │   │   ├── ParameterPanel.tsx
│   │   │   ├── VisualizationCanvas.tsx
│   │   │   ├── SimulationControls.tsx
│   │   │   └── PresetSelector.tsx
│   │   ├── services/          # API & WebSocket Clients
│   │   │   ├── api.ts
│   │   │   └── websocket.ts
│   │   ├── types/             # TypeScript Definitions
│   │   │   └── simulation.ts
│   │   ├── utils/             # Helper Functions
│   │   │   └── validation.ts
│   │   └── styles/
│   │       └── App.css
│   ├── index.html             # HTML entry point
│   ├── nginx.conf             # Nginx configuration for production
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── Model/                      # Original Implementations
│   ├── wave_eq.py             # Complete wave equation solver
│   └── wave_final.py          # Alternative wave implementation
│
├── __pycache__/               # Python cache files
├── venv/                      # Python virtual environment
│
├── heat_eq.py                 # Original heat equation class
├── main_test.py               # Original CLI test script
├── main.py                    # Simplified wave implementation
│
├── .gitignore                 # Git ignore patterns
├── .dockerignore              # Docker ignore patterns
├── docker-compose.yml         # Production deployment
├── docker-compose.dev.yml     # Development setup with hot-reload
├── Makefile                   # Build automation commands
├── CLAUDE.md                  # Architecture documentation & analysis
└── README.md                  # This file
```

## Getting Started

### Prerequisites
- **Python 3.11+** (for local development)
- **Node.js 18+** (for local development)
- **Docker & Docker Compose** (for containerized deployment)

### Quick Start (Docker - Recommended)

1. **Clone and navigate to repository**
```bash
git clone <repository-url>
cd Math460
```

2. **Build and start services**
```bash
make build
make up
```

3. **Access the application**
- 🌐 **Frontend**: http://localhost
- 🔧 **Backend API**: http://localhost:8000
- 📚 **API Docs**: http://localhost:8000/docs
- 📘 **ReDoc**: http://localhost:8000/redoc

4. **View logs**
```bash
make logs          # All services
make logs-backend  # Backend only
make logs-frontend # Frontend only
```

5. **Stop services**
```bash
make down
```

### Local Development

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend will be available at http://localhost:8000

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at http://localhost:3000

#### Run Both with Makefile
```bash
make install  # Install all dependencies
make dev      # Run both backend and frontend
```

## API Documentation

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/simulations/validate` | Validate configuration |
| POST | `/api/simulations/create` | Create new simulation |
| GET | `/api/simulations/{id}/status` | Get simulation status |
| DELETE | `/api/simulations/{id}` | Delete simulation |
| GET | `/api/presets` | Get preset configurations |

### WebSocket Endpoint

**URL**: `ws://localhost:8000/ws/simulation/{simulation_id}`

**Commands**:
```json
{"command": "start"}  // Start simulation
{"command": "pause"}  // Pause simulation
{"command": "stop"}   // Stop simulation
```

**Messages**:
```typescript
// Connection established
{"type": "connected", "simulation_id": "...", "message": "..."}

// Status update
{"type": "status", "status": "running"}

// Simulation data
{"type": "data", "data": {
  "simulation_id": "...",
  "time_index": 0,
  "time_value": 0.0,
  "x_values": [0, 0.01, 0.02, ...],
  "u_values": [0, 0.1, 0.2, ...]
}}

// Error
{"type": "error", "message": "..."}

// Completion
{"type": "completed"}
```

## Configuration

### Backend Environment Variables
Create `backend/.env` from `backend/.env.example`:
```bash
DEBUG=true
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
MAX_GRID_SIZE=10000
MAX_TIME_STEPS=100000
MAX_CONCURRENT_SIMULATIONS=10
```

### Frontend Environment Variables
Create `frontend/.env` from `frontend/.env.example`:
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
VITE_ENABLE_DEBUG=true
```

## Usage Guide

### Creating a Simulation

1. **Select Equation Type**: Choose between Heat or Wave equation
2. **Configure Spatial Domain**: Set x_min, x_max, dx
3. **Configure Temporal Domain**: Set t_min, t_max, dt
4. **Set Physical Parameters**:
   - Heat: β (thermal diffusivity)
   - Wave: c (wave speed)
5. **Define Boundary Conditions**: Dirichlet, Neumann, or Periodic
6. **Choose Initial Condition**: Gaussian, sine wave, or custom expression
7. **Click "Apply Configuration"**
8. **Start Simulation**: Click play button to begin

### Stability Considerations

The system automatically validates CFL stability conditions:

**Heat Equation**:
```
σ = β·Δt/Δx² < 0.5
```

**Wave Equation**:
```
σ = (c·Δt/Δx)² ≤ 1
```

Warnings appear if parameters may lead to instability.

## Development

### Repository Status

The project is currently in active development with the following new additions:
- Full-stack web application (backend + frontend)
- Docker containerization
- Automated build system (Makefile)
- Comprehensive test suite
- Modern development workflow

**Note**: The original Python implementations (`heat_eq.py`, `main_test.py`, `Model/`) are preserved and still functional for CLI-based usage.

### Running Tests
```bash
make test              # Run all tests
make test-coverage     # Run with coverage report
```

### Code Quality
```bash
make lint              # Run linters
make format            # Format code
```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and test locally**
   ```bash
   make dev              # Run local development servers
   make test             # Run tests
   ```

3. **Format and lint code**
   ```bash
   make format
   make lint
   ```

4. **Test with Docker**
   ```bash
   make build
   make up-dev
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin feature/your-feature-name
   ```

### Docker Development
```bash
make up-dev             # Start development mode with hot-reload
docker-compose -f docker-compose.dev.yml up  # Alternative command
```

### Available Makefile Commands

```bash
make help              # Show all available commands
make install           # Install all dependencies
make dev               # Run both backend and frontend locally
make build             # Build Docker containers
make up                # Start production containers
make up-dev            # Start development containers with hot-reload
make down              # Stop all containers
make logs              # View all container logs
make logs-backend      # View backend logs only
make logs-frontend     # View frontend logs only
make test              # Run backend tests
make test-coverage     # Run tests with coverage report
make lint              # Run linters on backend and frontend
make format            # Format code (Black for Python, Prettier for TypeScript)
make clean             # Clean build artifacts and caches
make clean-docker      # Clean Docker volumes and prune system
make deploy-prod       # Deploy to production
```

## Original Command-Line Tools

The original CLI implementations are preserved:

### Heat Equation (Original)
```bash
python main_test.py
```
Features:
- Manual configuration in code
- 3D, 2D, and animation plots
- Interactive prompts for animation

### Wave Equation (Original)
```bash
python Model/wave_eq.py      # General wave equation
python Model/wave_final.py   # Specific boundary conditions
```

## Migration from CLI to Web

If you're familiar with the original CLI version:

| Original | Web Platform |
|----------|--------------|
| Edit Python code | Configure via UI |
| `python main_test.py` | Click "Start" button |
| Matplotlib plots | Interactive Plotly visualizations |
| Terminal output | Real-time WebSocket streaming |
| Manual parameter editing | Form-based parameter input |
| Animation prompts | Play/Pause controls |

## Current Development Status

### Completed Components ✅
- **Backend Infrastructure**: FastAPI application structure with modular design
- **Frontend Infrastructure**: React + TypeScript + Vite setup
- **Docker Configuration**: Production and development compose files
- **Build Automation**: Comprehensive Makefile with all common commands
- **Test Framework**: Test structure and initial test files
- **Core Modules**:
  - Heat equation solver implementation
  - Wave equation solver implementation
  - Stability validation logic
  - Boundary condition management
  - Initial condition management
  - WebSocket handler structure

### In Progress 🚧
- API endpoint implementation and integration
- WebSocket real-time streaming
- Frontend-backend integration
- Interactive visualization components
- Parameter validation and preset system

### Not Yet Started ⏳
- 3D surface plot visualization
- Animation export (MP4, GIF)
- Custom expression parser
- User authentication system
- Simulation sharing features

## Roadmap

### Phase 1: Foundation ✅
- [x] Refactor into modular classes
- [x] FastAPI backend scaffolding
- [x] React frontend scaffolding
- [x] Docker deployment setup
- [x] Makefile build automation
- [x] Core solver implementations

### Phase 2: Core Implementation (In Progress)
- [ ] Complete API endpoint integration
- [ ] Finalize WebSocket streaming
- [ ] Connect frontend to backend
- [ ] Parameter validation UI
- [ ] Initial condition presets
- [ ] Real-time 2D plotting

### Phase 3: Advanced Visualization
- [ ] Enhanced 2D plotting with multiple datasets
- [ ] 3D surface visualization
- [ ] Advanced animation controls (speed, pause, rewind)
- [ ] Export capabilities (PNG, MP4, GIF)
- [ ] Comparison view for multiple simulations

### Phase 4: Advanced Features
- [ ] Multiple equation types
- [ ] Custom expression parser
- [ ] Simulation comparison tools
- [ ] User authentication
- [ ] Simulation sharing

### Phase 5: Optimization
- [ ] GPU acceleration (CuPy)
- [ ] Parallel processing
- [ ] Caching strategies
- [ ] Performance profiling

## Troubleshooting

### Backend Issues
```bash
# Check if backend is running
curl http://localhost:8000/health

# View backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### Frontend Issues
```bash
# Clear npm cache
cd frontend && rm -rf node_modules package-lock.json
npm install

# Check if frontend can reach backend
curl http://localhost:8000/api/presets
```

### Docker Issues
```bash
# Clean everything and rebuild
make clean-docker
make build
make up
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

Educational and research use only. See institution guidelines.

## Acknowledgments

- Original heat equation implementation: `heat_eq.py`
- Original wave equation implementation: `Model/wave_eq.py`
- Architecture design: See `CLAUDE.md` for detailed documentation

## Support

For questions, issues, or feature requests:
1. Check `CLAUDE.md` for architecture details
2. Review API documentation at http://localhost:8000/docs
3. Open a GitHub issue with detailed description

---

**Version**: 2.0.0-dev
**Last Updated**: November 2025
**Status**: Active Development - Full-Stack Migration in Progress
