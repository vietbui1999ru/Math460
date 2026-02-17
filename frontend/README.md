# PDE Simulation Platform - Frontend

Modern React + TypeScript frontend for the PDE Simulation Platform.

## Features

- **Interactive Parameter Configuration**: Comprehensive UI for setting up simulations
- **Real-time Visualization**: Live 2D line plots, 3D surface plots, and heatmaps using Plotly.js
- **WebSocket Integration**: Real-time simulation data streaming
- **Preset Templates**: Pre-configured simulation scenarios
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Type-Safe**: Full TypeScript support with detailed type definitions

## Tech Stack

- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool with HMR
- **Plotly.js**: Interactive scientific visualizations
- **Axios**: HTTP client for API requests
- **WebSocket API**: Real-time bidirectional communication

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Configuration

1. Copy the environment template:
```bash
cp .env.example .env.local
```

2. Update `.env.local` with your backend URL:
```env
VITE_API_BASE_URL=http://localhost:8001
VITE_WS_BASE_URL=ws://localhost:8001
```

### Development

```bash
# Start development server
npm run dev

# The app will be available at http://localhost:3000
```

### Building for Production

```bash
# Type check
npm run type-check

# Build
npm run build

# Preview production build
npm run preview
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── ParameterPanel.tsx
│   │   ├── VisualizationCanvas.tsx
│   │   ├── SimulationControls.tsx
│   │   └── PresetSelector.tsx
│   ├── services/            # API and WebSocket clients
│   │   ├── api.ts
│   │   └── websocket.ts
│   ├── types/               # TypeScript type definitions
│   │   └── simulation.ts
│   ├── utils/               # Utility functions
│   │   └── validation.ts
│   ├── styles/              # CSS styles
│   │   └── App.css
│   ├── App.tsx              # Main application component
│   └── main.tsx             # Application entry point
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
└── README.md                # This file
```

## Key Components

### ParameterPanel
Comprehensive configuration interface with:
- Equation type selection (Heat/Wave)
- Spatial and temporal domain settings
- Boundary condition configuration
- Initial condition patterns
- Physical parameter inputs
- Real-time validation feedback

### VisualizationCanvas
Interactive visualization component supporting:
- 2D line plots (current time step)
- 3D surface plots (complete solution)
- Heatmap visualization
- Automatic axis scaling
- Zoom, pan, and rotation

### SimulationControls
Playback controls with:
- Play/Pause/Stop buttons
- Time step scrubbing
- Playback speed control
- Status indicators
- Progress tracking

### PresetSelector
Quick access to pre-configured simulations:
- Dropdown or grid display modes
- Preset descriptions
- One-click loading

## API Integration

The frontend communicates with the FastAPI backend through:

1. **REST API** (`/api/*`):
   - Configuration validation
   - Simulation creation
   - Status queries
   - Preset retrieval

2. **WebSocket** (`/ws/simulation/{id}`):
   - Real-time simulation data
   - Status updates
   - Command sending (start/pause/stop)

## Type Safety

All API communications are fully typed using TypeScript interfaces defined in `src/types/simulation.ts`. This ensures:
- Compile-time error checking
- Better IDE autocomplete
- Self-documenting code
- Reduced runtime errors

## Validation

Client-side validation includes:
- Parameter range checking
- CFL stability condition verification
- Grid size warnings
- Expression syntax validation
- Memory estimation

## Styling

The application uses a modern dark theme with:
- CSS custom properties for easy theming
- Responsive grid layout
- Smooth transitions and animations
- Accessible color contrasts
- Mobile-first design

## Performance Optimizations

- Code splitting (React vendor, Plotly vendor)
- Lazy loading of heavy components
- Memoization of expensive calculations
- Efficient WebSocket message handling
- Debounced input validation

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)

## Troubleshooting

### Backend Connection Issues
```bash
# Check if backend is running
curl http://localhost:8001/health

# Verify environment variables
cat .env.local
```

### Build Issues
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
```

### Type Errors
```bash
# Run type checker
npm run type-check

# Check TypeScript version
npx tsc --version
```

## Contributing

1. Follow the TypeScript style guide
2. Add comments for complex logic
3. Update type definitions when changing interfaces
4. Test responsive design on multiple screen sizes
5. Run linter before committing

## License

Educational and research use only.
