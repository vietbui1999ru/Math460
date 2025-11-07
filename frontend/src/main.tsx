/**
 * Application Entry Point
 *
 * This is the main entry file for the React application.
 * It mounts the root App component to the DOM and sets up
 * global configurations.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/App.css';

/**
 * Get the root DOM element
 * This is where the React application will be mounted
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Failed to find the root element. ' +
    'Make sure there is a <div id="root"></div> in your index.html'
  );
}

/**
 * Create React root and render the application
 * Using React 18's createRoot API for concurrent features
 */
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/**
 * Enable Hot Module Replacement (HMR) in development
 * This allows the app to update without full page reload
 */
if (import.meta.hot) {
  import.meta.hot.accept();
}

/**
 * Log application information in development mode
 */
if (import.meta.env.DEV) {
  console.log('PDE Simulation Platform');
  console.log('Environment:', import.meta.env.MODE);
  console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000');
  console.log('WebSocket URL:', import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000');
}
