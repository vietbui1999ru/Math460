/**
 * API service for communicating with the backend
 *
 * This module provides a clean interface for all HTTP requests to the
 * FastAPI backend. It handles request formatting, error handling, and
 * response parsing.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  SimulationConfig,
  ValidationResult,
  SimulationInfo,
  SimulationPreset,
  ApiResponse,
  CompleteSolution
} from '../types/simulation';

/**
 * Base API configuration
 * Reads from environment variables with fallback defaults
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Axios instance with default configuration
 * All API requests use this configured instance
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout for requests
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor
 * Logs all outgoing requests in development mode
 */
apiClient.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * Logs all responses and handles common errors
 */
apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.url}`, response.data);
    }
    return response;
  },
  (error: AxiosError) => {
    console.error('[API Response Error]', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Health check endpoint
 * Verifies that the backend is running and accessible
 *
 * @returns Promise resolving to health status
 * @throws Error if backend is unreachable
 */
export async function checkHealth(): Promise<ApiResponse<{ status: string }>> {
  try {
    const response = await apiClient.get('/health');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return handleApiError(error, 'Health check failed');
  }
}

/**
 * Validates a simulation configuration
 * Sends config to backend for comprehensive validation including stability checks
 *
 * @param config - The simulation configuration to validate
 * @returns Promise resolving to validation result
 */
export async function validateConfiguration(
  config: SimulationConfig
): Promise<ApiResponse<ValidationResult>> {
  try {
    const response = await apiClient.post('/api/simulations/validate', config);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return handleApiError(error, 'Configuration validation failed');
  }
}

/**
 * Creates a new simulation
 * Initializes a simulation on the backend and returns a unique ID
 *
 * @param config - The simulation configuration
 * @returns Promise resolving to simulation info with ID
 */
export async function createSimulation(
  config: SimulationConfig
): Promise<ApiResponse<SimulationInfo>> {
  try {
    const response = await apiClient.post('/api/simulations/create', config);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return handleApiError(error, 'Failed to create simulation');
  }
}

/**
 * Solves a complete simulation and returns all data
 * Computes the full solution and returns it for client-side playback
 *
 * @param config - The simulation configuration
 * @returns Promise resolving to complete solution with all data
 */
export async function solveSimulation(
  config: SimulationConfig
): Promise<ApiResponse<CompleteSolution>> {
  try {
    const response = await apiClient.post('/api/simulations/solve', config);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return handleApiError(error, 'Failed to solve simulation');
  }
}

/**
 * Gets the status of a simulation
 * Retrieves current state, progress, and metadata
 *
 * @param simulationId - Unique identifier of the simulation
 * @returns Promise resolving to simulation info
 */
export async function getSimulationStatus(
  simulationId: string
): Promise<ApiResponse<SimulationInfo>> {
  try {
    const response = await apiClient.get(`/api/simulations/${simulationId}/status`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return handleApiError(error, 'Failed to get simulation status');
  }
}

/**
 * Deletes a simulation
 * Removes simulation from backend and frees resources
 *
 * @param simulationId - Unique identifier of the simulation
 * @returns Promise resolving to success status
 */
export async function deleteSimulation(
  simulationId: string
): Promise<ApiResponse<{ message: string }>> {
  try {
    const response = await apiClient.delete(`/api/simulations/${simulationId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return handleApiError(error, 'Failed to delete simulation');
  }
}

/**
 * Gets all available simulation presets
 * Retrieves pre-configured simulation templates
 *
 * @returns Promise resolving to array of presets
 */
export async function getPresets(): Promise<ApiResponse<SimulationPreset[]>> {
  try {
    const response = await apiClient.get('/api/presets');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return handleApiError(error, 'Failed to load presets');
  }
}

/**
 * Gets a specific preset by ID
 * Retrieves a single preset configuration
 *
 * @param presetId - Unique identifier of the preset
 * @returns Promise resolving to preset details
 */
export async function getPreset(
  presetId: string
): Promise<ApiResponse<SimulationPreset>> {
  try {
    const response = await apiClient.get(`/api/presets/${presetId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return handleApiError(error, 'Failed to load preset');
  }
}

/**
 * Generic error handler for API requests
 * Converts various error types into standardized ApiResponse
 *
 * @param error - The error object (usually AxiosError)
 * @param defaultMessage - Default error message if none provided
 * @returns ApiResponse with error information
 */
function handleApiError<T>(error: any, defaultMessage: string): ApiResponse<T> {
  // Handle axios errors
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;

    // Server responded with error status
    if (axiosError.response) {
      return {
        success: false,
        error: axiosError.response.data?.error || axiosError.response.data?.message || defaultMessage,
        details: axiosError.response.data,
      };
    }

    // Request made but no response received
    if (axiosError.request) {
      return {
        success: false,
        error: 'No response from server. Please check your connection.',
        details: { code: 'NO_RESPONSE' },
      };
    }
  }

  // Generic error
  return {
    success: false,
    error: error.message || defaultMessage,
    details: error,
  };
}

/**
 * Checks if the API is reachable
 * Simple connectivity test without authentication
 *
 * @returns Promise resolving to boolean indicating connectivity
 */
export async function isApiReachable(): Promise<boolean> {
  try {
    const result = await checkHealth();
    return result.success;
  } catch (error) {
    return false;
  }
}

/**
 * Gets API base URL
 * Useful for constructing WebSocket URLs
 *
 * @returns The configured API base URL
 */
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

/**
 * Gets WebSocket base URL
 * Converts HTTP URL to WebSocket URL
 *
 * @returns The WebSocket base URL
 */
export function getWebSocketBaseUrl(): string {
  const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL;

  if (wsBaseUrl) {
    return wsBaseUrl;
  }

  // Convert HTTP to WS
  return API_BASE_URL.replace(/^http/, 'ws');
}

/**
 * Custom hook for API error messages
 * Extracts user-friendly error messages from API responses
 *
 * @param response - API response that may contain errors
 * @returns User-friendly error message or null
 */
export function getErrorMessage(response: ApiResponse<any>): string | null {
  if (response.success) {
    return null;
  }

  return response.error || 'An unknown error occurred';
}

/**
 * Retry helper for failed requests
 * Automatically retries failed requests with exponential backoff
 *
 * @param fn - The async function to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param delay - Initial delay in milliseconds
 * @returns Promise resolving to the function result
 */
export async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Don't retry on client errors (4xx)
      if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
        break;
      }

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }

  throw lastError;
}

/**
 * Batch request helper
 * Executes multiple API requests in parallel
 *
 * @param requests - Array of request functions
 * @returns Promise resolving to array of results
 */
export async function batchRequests<T>(
  requests: Array<() => Promise<ApiResponse<T>>>
): Promise<Array<ApiResponse<T>>> {
  try {
    return await Promise.all(requests.map(req => req()));
  } catch (error) {
    console.error('[Batch Request Error]', error);
    throw error;
  }
}

// Export the configured axios instance for advanced usage
export { apiClient };
