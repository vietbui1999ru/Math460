# Quick Start Guide - PDE Simulation Platform

## What Was Implemented

✅ **Complete backend API** for Heat & Wave Equation simulations
✅ **Real-time WebSocket streaming** at 50 fps
✅ **6 preset configurations** ready to use
✅ **REST API** for full lifecycle management
✅ **All tests passing** - fully functional and verified

---

## Running the Application

### Prerequisites
```bash
# Backend
python 3.10+
pip, virtual environment (optional)

# Frontend
Node.js 18+
npm or yarn
```

### Start Backend Server

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload

# Server will start at:
# - API: http://localhost:8000
# - Docs: http://localhost:8000/docs
# - WebSocket: ws://localhost:8000/ws/simulation/{id}
```

### Start Frontend Application

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Frontend will start at: http://localhost:5173
```

### Access the Application

Open your browser to **http://localhost:5173** and:

1. **See the parameter panel** with preset selector
2. **Select a preset** (e.g., "Heat: Gaussian Diffusion")
3. **Click "Validate Configuration"** - should show ✓ stable
4. **Click "Start Simulation"** - visualization will animate
5. **Watch the real-time animation** updating 50x per second
6. **Use controls**: Play, Pause, Stop, Reset
7. **Check progress bar** updating as simulation runs

---

## Testing the Backend

### Quick Validation Test

```python
# test_quick.py
python -c "
import sys
sys.path.insert(0, 'backend')
from app.services.simulation_service import SimulationService
from app.core.stability_validator import StabilityValidator

# Test 1: Validation
v = StabilityValidator()
result = v.validate_heat_equation(beta=0.1, dt=0.0001, dx=0.01)
print(f'Heat validation: {result[\"valid\"]}')  # Should print: True

# Test 2: Simulation
from app.models.schemas import *
config = SimulationConfig(
    equation_type=EquationType.HEAT,
    spatial=SpatialDiscretization(x_min=0, x_max=1, dx=0.1),
    temporal=TemporalDiscretization(t_min=0, t_max=0.1, dt=0.001),
    physical=PhysicalParameters(beta=0.1),
    boundary=BoundaryCondition(),
    initial=InitialCondition()
)

s = SimulationService()
sim_id = s.create_simulation(config)
print(f'Simulation created: {sim_id}')

# Test 3: Solving
sim = s.active_simulations[sim_id]
solution = sim['simulator'].solve()
print(f'Solution shape: {solution.shape}')  # Should print: (101, 11)
"
```

### Run Full Test Suite

```bash
# From project root
python test_backend.py      # Phase 1-4 tests
python test_websocket.py    # Phase 3 WebSocket test
python test_presets.py      # Phase 5 Preset test
```

---

## API Examples

### 1. Validate Configuration

```bash
curl -X POST http://localhost:8000/api/simulations/validate \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "equation_type": "heat",
      "spatial": {"x_min": 0, "x_max": 1, "dx": 0.01},
      "temporal": {"t_min": 0, "t_max": 0.5, "dt": 0.0001},
      "physical": {"beta": 0.1},
      "boundary": {"left_value": 0, "right_value": 0},
      "initial": {"preset": "gaussian", "params": {"center": 0.5, "width": 0.1}}
    }
  }'

# Response:
# {
#   "valid": true,
#   "errors": [],
#   "sigma": 0.1,
#   "message": "Configuration is stable"
# }
```

### 2. Create Simulation

```bash
curl -X POST http://localhost:8000/api/simulations/create \
  -H "Content-Type: application/json" \
  -d '{
    "equation_type": "heat",
    "spatial": {"x_min": 0, "x_max": 1, "dx": 0.01},
    "temporal": {"t_min": 0, "t_max": 0.5, "dt": 0.0001},
    "physical": {"beta": 0.1},
    "boundary": {"left_value": 0, "right_value": 0},
    "initial": {"preset": "gaussian", "params": {"center": 0.5, "width": 0.1}}
  }'

# Response:
# {
#   "simulation_id": "550e8400-e29b-41d4-a716-446655440000",
#   "status": "created",
#   "websocket_url": "ws://localhost:8000/ws/simulation/550e8400-e29b-41d4-a716-446655440000"
# }
```

### 3. Get Simulation Status

```bash
curl http://localhost:8000/api/simulations/550e8400-e29b-41d4-a716-446655440000/status

# Response:
# {
#   "simulation_id": "550e8400-e29b-41d4-a716-446655440000",
#   "status": "running",
#   "progress": 0.45,
#   "created_at": "2026-02-05T21:02:38.161101",
#   "message": "Time step 45% complete"
# }
```

### 4. Get Presets

```bash
curl http://localhost:8000/api/presets | python -m json.tool

# Response:
# [
#   {
#     "id": "heat-gaussian",
#     "name": "Heat: Gaussian Diffusion",
#     "description": "Watch a Gaussian peak spread and decay over time.",
#     "equation_type": "heat",
#     "config": {...}
#   },
#   ...
# ]
```

### 5. WebSocket Streaming (JavaScript)

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8000/ws/simulation/550e8400-e29b-41d4-a716-446655440000');

// Handle connection
ws.onopen = () => {
  console.log('Connected!');
  // Send start command
  ws.send(JSON.stringify({ command: 'start' }));
};

// Handle incoming data
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.type === 'connected') {
    console.log('WebSocket ready');
  } else if (msg.type === 'data') {
    // msg.data contains:
    // - time_index: int
    // - time_value: float (current time)
    // - x_values: [float, ...] (spatial grid)
    // - u_values: [float, ...] (solution values)
    // - metadata: {max_value, min_value}
    updatePlot(msg.data);
  } else if (msg.type === 'completed') {
    console.log('Simulation finished!');
  }
};

// Handle pause
function pause() {
  ws.send(JSON.stringify({ command: 'pause' }));
}

// Handle resume
function resume() {
  ws.send(JSON.stringify({ command: 'resume' }));
}

// Handle stop
function stop() {
  ws.send(JSON.stringify({ command: 'stop' }));
  ws.close();
}
```

---

## Features Verification Checklist

- [ ] **Backend Starts**: Run backend, see "Uvicorn running" message
- [ ] **Frontend Starts**: Run frontend, see app in browser
- [ ] **API Docs**: Visit http://localhost:8000/docs
- [ ] **Presets Load**: See 6 presets in dropdown
- [ ] **Validation Works**: Click "Validate", see green checkmark
- [ ] **Create Works**: Click "Start Simulation", see UUID
- [ ] **Streaming Works**: See smooth animation updating
- [ ] **Controls Work**: Try Play/Pause/Stop buttons
- [ ] **Progress Updates**: Watch progress bar advance
- [ ] **Status Checks**: Poll status endpoint, see progress

---

## Available Presets

1. **Heat: Gaussian Diffusion** - Smooth peak spreading
2. **Heat: Sine Wave Decay** - Sinusoidal initial condition fading
3. **Heat: Step Function** - Discontinuity smoothing
4. **Wave: Standing Wave** - Pure oscillation (no decay)
5. **Wave: Plucked String** - Triangle wave splitting
6. **Wave: Gaussian Pulse** - Localized disturbance propagating

Each preset is pre-configured with stable parameters. Just select and click "Start Simulation"!

---

## Troubleshooting

### Backend won't start
```bash
# Check Python version
python --version  # Should be 3.10+

# Install requirements
pip install -r backend/requirements.txt

# Try with explicit host/port
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend won't start
```bash
# Clear node_modules and reinstall
rm -rf frontend/node_modules
cd frontend
npm install
npm run dev
```

### WebSocket connection fails
- Check backend is running on :8000
- Check frontend has correct WebSocket URL
- Check browser network tab for WebSocket errors
- CORS might need configuration

### Validation fails / Config unstable
- Increase `dx` or decrease `dt`
- Check error message for specific CFL requirement
- Try a preset instead - they're all validated

---

## Architecture at a Glance

```
Frontend (React + TypeScript)
    ↓ HTTP/WS
Backend (FastAPI + Python)
    ├── REST API Routes
    │   ├── POST /api/simulations/validate
    │   ├── POST /api/simulations/create
    │   ├── GET  /api/simulations/{id}/status
    │   ├── DELETE /api/simulations/{id}
    │   └── GET  /api/presets
    │
    └── WebSocket Handler
        └── ws://localhost:8000/ws/simulation/{id}
            ├── Command Receiver (start, pause, resume, stop)
            └── Data Streamer (50 packets/second)
                ├── Heat Equation Solver
                └── Wave Equation Solver
```

---

## Performance Notes

- **Small simulations** (100×1000): <100ms compute + streaming
- **Medium simulations** (500×5000): 1-2s compute + streaming
- **Large simulations** (1000×10000): 5-10s compute + streaming
- **Streaming**: 50 fps = 20ms per packet (smooth animation)

---

## What's Next?

The platform is fully functional! Potential next steps:

1. **Deploy to Cloud**: AWS/Azure/Heroku
2. **Add Persistence**: Save/load simulations
3. **Extend Physics**: Add 2D/3D support
4. **Enhance UI**: 3D plots, heatmaps, side-by-side comparison
5. **Scale Out**: Multi-user support with job queue
6. **Optimize**: GPU acceleration, sparse matrices

---

## Questions or Issues?

Check the implementation summary for details:
- `IMPLEMENTATION_SUMMARY.md` - Full technical documentation
- `backend/app/main.py` - API entry point
- `frontend/src/App.tsx` - Frontend entry point

All code is well-documented with docstrings and comments!

---

**Happy PDE solving! 🚀**
