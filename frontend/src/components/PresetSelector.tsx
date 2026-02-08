/**
 * PresetSelector Component
 *
 * Displays a dropdown or grid of pre-configured simulation templates.
 * Allows users to quickly load common simulation scenarios without
 * manually configuring all parameters.
 */

import React, { useEffect, useState } from 'react';
import { SimulationPreset, SimulationConfig } from '../types/simulation';
import { getPresets } from '../services/api';

/**
 * Props for the PresetSelector component
 */
interface PresetSelectorProps {
  /** Callback when a preset is selected */
  onPresetSelect: (config: SimulationConfig) => void;

  /** Currently selected preset ID (optional) */
  selectedPresetId?: string;

  /** Display mode: 'dropdown' or 'grid' */
  displayMode?: 'dropdown' | 'grid';

  /** Custom CSS class name */
  className?: string;
}

/**
 * PresetSelector Component
 *
 * Fetches available presets from the backend and displays them for selection.
 * Supports both dropdown and grid display modes.
 *
 * @example
 * ```tsx
 * <PresetSelector
 *   onPresetSelect={(config) => setSimulationConfig(config)}
 *   displayMode="grid"
 * />
 * ```
 */
export const PresetSelector: React.FC<PresetSelectorProps> = ({
  onPresetSelect,
  selectedPresetId,
  displayMode = 'dropdown',
  className = ''
}) => {
  // State for storing available presets
  const [presets, setPresets] = useState<SimulationPreset[]>([]);

  // Loading state
  const [loading, setLoading] = useState<boolean>(true);

  // Error state
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches presets from the backend on component mount
   */
  useEffect(() => {
    loadPresets();
  }, []);

  /**
   * Loads presets from the API
   * Sets loading and error states appropriately
   */
  const loadPresets = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getPresets();

      if (response.success && response.data) {
        setPresets(response.data);
      } else {
        setError(response.error || 'Failed to load presets');
      }
    } catch (err) {
      setError('Failed to load presets');
      console.error('Error loading presets:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles preset selection
   * Calls the parent callback with the selected preset's configuration
   *
   * @param preset - The selected preset
   */
  const handlePresetClick = (preset: SimulationPreset) => {
    onPresetSelect(preset.config);
  };

  /**
   * Handles dropdown selection change
   *
   * @param event - Change event from select element
   */
  const handleDropdownChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const presetId = event.target.value;

    if (presetId === '') {
      return; // No selection
    }

    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      handlePresetClick(preset);
    }
  };

  /**
   * Renders loading state
   */
  if (loading) {
    return (
      <div className={`preset-selector ${className}`}>
        <div className="preset-loading">
          <span className="spinner"></span>
          <p>Loading presets...</p>
        </div>
      </div>
    );
  }

  /**
   * Renders error state
   */
  if (error) {
    return (
      <div className={`preset-selector ${className}`}>
        <div className="preset-error">
          <p className="error-message">{error}</p>
          <button onClick={loadPresets} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  /**
   * Renders empty state (no presets available)
   */
  if (presets.length === 0) {
    return (
      <div className={`preset-selector ${className}`}>
        <div className="preset-empty">
          <p>No presets available</p>
        </div>
      </div>
    );
  }

  /**
   * Renders dropdown display mode
   */
  if (displayMode === 'dropdown') {
    return (
      <div className={`preset-selector preset-dropdown ${className}`}>
        <label htmlFor="preset-select" className="preset-label">
          Load Preset:
        </label>
        <select
          id="preset-select"
          className="preset-select"
          value={selectedPresetId}
          onChange={handleDropdownChange}
        >
          <option value="">-- Select a preset --</option>
          {presets.map(preset => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  /**
   * Renders grid display mode
   */
  return (
    <div className={`preset-selector preset-grid ${className}`}>
      <h3 className="preset-grid-title">Simulation Presets</h3>
      <div className="preset-grid-container">
        {presets.map(preset => (
          <PresetCard
            key={preset.id}
            preset={preset}
            isSelected={preset.id === selectedPresetId}
            onClick={() => handlePresetClick(preset)}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Props for the PresetCard component
 */
interface PresetCardProps {
  /** The preset to display */
  preset: SimulationPreset;

  /** Whether this preset is currently selected */
  isSelected: boolean;

  /** Click handler */
  onClick: () => void;
}

/**
 * PresetCard Component
 *
 * Displays a single preset as a card with name, description, and optional thumbnail.
 * Used in grid display mode.
 *
 * @param props - Component props
 */
const PresetCard: React.FC<PresetCardProps> = ({ preset, isSelected, onClick }) => {
  /**
   * Generates a summary of the preset configuration
   * Shows equation type and key parameters
   */
  const getConfigSummary = (): string => {
    const { equation_type, spatial_domain, temporal_domain } = preset.config;

    return `${equation_type.toUpperCase()} | ` +
      `x ∈ [${spatial_domain.x_min}, ${spatial_domain.x_max}] | ` +
      `t ∈ [${temporal_domain.t_min}, ${temporal_domain.t_max}]`;
  };

  return (
    <div
      className={`preset-card ${isSelected ? 'preset-card-selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      {/* Thumbnail (if available) */}
      {preset.thumbnail && (
        <div className="preset-card-thumbnail">
          <img src={preset.thumbnail} alt={preset.name} />
        </div>
      )}

      {/* Content */}
      <div className="preset-card-content">
        <h4 className="preset-card-title">{preset.name}</h4>
        <p className="preset-card-description">{preset.description}</p>
        <p className="preset-card-summary">{getConfigSummary()}</p>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="preset-card-indicator">
          <span className="checkmark">✓</span>
        </div>
      )}
    </div>
  );
};

export default PresetSelector;
