"""
Unit tests for POST /api/simulations/validate endpoint
Tests validation logic, error handling, and schema compliance
Updated for new frontend field names (spatial_domain, temporal_domain, etc.)
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestValidationEndpoint:
    """Test suite for validation endpoint."""

    def test_valid_heat_equation_gaussian(self):
        """Test valid heat equation with Gaussian initial condition."""
        payload = {
            "equation_type": "heat",
            "spatial_domain": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
            "temporal_domain": {"t_min": 0.0, "t_max": 0.5, "dt": 0.0001},
            "physical_parameters": {"beta": 0.1},
            "boundary_condition": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
            "initial_condition": {
                "type": "gaussian",
                "parameters": {"center": 0.5, "width": 0.1, "amplitude": 1.0}
            }
        }

        response = client.post("/api/simulations/validate", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["errors"] == []
        assert "sigma" in data
        assert data["sigma"] == pytest.approx(0.1, rel=1e-6)
        assert data["message"] == "Configuration is stable"

    def test_valid_wave_equation_sine(self):
        """Test valid wave equation with sine initial condition."""
        payload = {
            "equation_type": "wave",
            "spatial_domain": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
            "temporal_domain": {"t_min": 0.0, "t_max": 2.0, "dt": 0.005},
            "physical_parameters": {"c": 1.0},
            "boundary_condition": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
            "initial_condition": {
                "type": "sine",
                "parameters": {"amplitude": 1.0, "frequency": 1.0}
            }
        }

        response = client.post("/api/simulations/validate", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["errors"] == []
        assert "sigma" in data
        assert data["sigma"] == pytest.approx(0.25, rel=1e-6)

    def test_unstable_heat_equation_cfl_violation(self):
        """Test heat equation with CFL condition violation."""
        payload = {
            "equation_type": "heat",
            "spatial_domain": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
            "temporal_domain": {"t_min": 0.0, "t_max": 0.5, "dt": 0.01},  # Large dt
            "physical_parameters": {"beta": 0.5},
            "boundary_condition": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
            "initial_condition": {"type": "gaussian", "parameters": {}}
        }

        response = client.post("/api/simulations/validate", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert len(data["errors"]) > 0
        assert "CFL condition violated" in data["errors"][0]
        assert data["sigma"] == pytest.approx(50.0, rel=1e-6)

    def test_unstable_wave_equation_cfl_violation(self):
        """Test wave equation with CFL condition violation."""
        payload = {
            "equation_type": "wave",
            "spatial_domain": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
            "temporal_domain": {"t_min": 0.0, "t_max": 2.0, "dt": 0.02},  # Large dt
            "physical_parameters": {"c": 1.0},
            "boundary_condition": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
            "initial_condition": {"type": "sine", "parameters": {}}
        }

        response = client.post("/api/simulations/validate", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert len(data["errors"]) > 0
        assert "CFL condition violated" in data["errors"][0]
        assert data["sigma"] > 1.0

    def test_missing_required_field_spatial_domain(self):
        """Test request missing spatial_domain field."""
        payload = {
            "equation_type": "heat",
            # Missing spatial_domain
            "temporal_domain": {"t_min": 0.0, "t_max": 0.5, "dt": 0.0001},
            "physical_parameters": {"beta": 0.1},
            "boundary_condition": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
            "initial_condition": {"type": "gaussian", "parameters": {}}
        }

        response = client.post("/api/simulations/validate", json=payload)

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        assert any(
            error["loc"] == ["body", "spatial_domain"] and error["type"] == "missing"
            for error in data["detail"]
        )

    def test_missing_required_field_temporal_domain(self):
        """Test request missing temporal_domain field."""
        payload = {
            "equation_type": "heat",
            "spatial_domain": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
            # Missing temporal_domain
            "physical_parameters": {"beta": 0.1},
            "boundary_condition": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
            "initial_condition": {"type": "gaussian", "parameters": {}}
        }

        response = client.post("/api/simulations/validate", json=payload)

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        assert any(
            error["loc"] == ["body", "temporal_domain"] and error["type"] == "missing"
            for error in data["detail"]
        )

    def test_invalid_equation_type_enum(self):
        """Test invalid equation_type enum value."""
        payload = {
            "equation_type": "diffusion",  # Invalid
            "spatial_domain": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
            "temporal_domain": {"t_min": 0.0, "t_max": 0.5, "dt": 0.0001},
            "physical_parameters": {"beta": 0.1},
            "boundary_condition": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
            "initial_condition": {"type": "gaussian", "parameters": {}}
        }

        response = client.post("/api/simulations/validate", json=payload)

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        assert any(
            error["loc"] == ["body", "equation_type"] and error["type"] == "enum"
            for error in data["detail"]
        )

    def test_negative_dx_validation(self):
        """Test validation error for negative dx."""
        payload = {
            "equation_type": "heat",
            "spatial_domain": {"x_min": 0.0, "x_max": 1.0, "dx": -0.01},  # Negative
            "temporal_domain": {"t_min": 0.0, "t_max": 0.5, "dt": 0.0001},
            "physical_parameters": {"beta": 0.1},
            "boundary_condition": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
            "initial_condition": {"type": "gaussian", "parameters": {}}
        }

        response = client.post("/api/simulations/validate", json=payload)

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        assert any(
            error["loc"] == ["body", "spatial_domain", "dx"]
            for error in data["detail"]
        )

    def test_negative_dt_validation(self):
        """Test validation error for negative dt."""
        payload = {
            "equation_type": "heat",
            "spatial_domain": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
            "temporal_domain": {"t_min": 0.0, "t_max": 0.5, "dt": -0.0001},  # Negative
            "physical_parameters": {"beta": 0.1},
            "boundary_condition": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
            "initial_condition": {"type": "gaussian", "parameters": {}}
        }

        response = client.post("/api/simulations/validate", json=payload)

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        assert any(
            error["loc"] == ["body", "temporal_domain", "dt"]
            for error in data["detail"]
        )

    def test_with_all_default_values(self):
        """Test configuration using all default values."""
        payload = {
            "equation_type": "heat",
            "spatial_domain": {},
            "temporal_domain": {},
            "physical_parameters": {"beta": 0.1},
            "boundary_condition": {},
            "initial_condition": {}
        }

        response = client.post("/api/simulations/validate", json=payload)

        assert response.status_code == 200
        data = response.json()
        # Default values may not be stable, but should validate
        assert "valid" in data
        assert "sigma" in data

    def test_with_optional_name_field(self):
        """Test configuration with optional name field."""
        payload = {
            "equation_type": "heat",
            "name": "My Custom Simulation",
            "spatial_domain": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
            "temporal_domain": {"t_min": 0.0, "t_max": 0.5, "dt": 0.0001},
            "physical_parameters": {"beta": 0.1},
            "boundary_condition": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
            "initial_condition": {"type": "gaussian", "parameters": {}}
        }

        response = client.post("/api/simulations/validate", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True

    def test_different_initial_condition_presets(self):
        """Test various initial condition presets."""
        presets = ["gaussian", "sine", "square_wave", "triangle_wave"]

        for preset in presets:
            payload = {
                "equation_type": "heat",
                "spatial_domain": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
                "temporal_domain": {"t_min": 0.0, "t_max": 0.5, "dt": 0.0001},
                "physical_parameters": {"beta": 0.1},
                "boundary_condition": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
                "initial_condition": {"type": preset, "parameters": {}}
            }

            response = client.post("/api/simulations/validate", json=payload)
            assert response.status_code == 200, f"Failed for preset: {preset}"

    def test_different_boundary_condition_types(self):
        """Test various boundary condition types."""
        boundary_types = ["dirichlet", "neumann", "periodic"]

        for boundary_type in boundary_types:
            payload = {
                "equation_type": "heat",
                "spatial_domain": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
                "temporal_domain": {"t_min": 0.0, "t_max": 0.5, "dt": 0.0001},
                "physical_parameters": {"beta": 0.1},
                "boundary_condition": {
                    "type": boundary_type,
                    "left_value": 0.0,
                    "right_value": 0.0
                },
                "initial_condition": {"type": "gaussian", "parameters": {}}
            }

            response = client.post("/api/simulations/validate", json=payload)
            assert response.status_code == 200, f"Failed for boundary type: {boundary_type}"

    def test_validation_with_physical_parameters(self):
        """Test validation considers physical parameters correctly."""
        # Heat equation should use beta
        heat_payload = {
            "equation_type": "heat",
            "spatial_domain": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
            "temporal_domain": {"t_min": 0.0, "t_max": 0.5, "dt": 0.0001},
            "physical_parameters": {"beta": 0.2},  # Different beta
            "boundary_condition": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
            "initial_condition": {"type": "gaussian", "parameters": {}}
        }

        response = client.post("/api/simulations/validate", json=heat_payload)
        assert response.status_code == 200
        data = response.json()
        # sigma = beta * dt / dx^2 = 0.2 * 0.0001 / 0.01^2 = 0.2
        assert data["sigma"] == pytest.approx(0.2, rel=1e-6)

        # Wave equation should use c
        wave_payload = {
            "equation_type": "wave",
            "spatial_domain": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
            "temporal_domain": {"t_min": 0.0, "t_max": 2.0, "dt": 0.005},
            "physical_parameters": {"c": 2.0},  # Different wave speed
            "boundary_condition": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
            "initial_condition": {"type": "sine", "parameters": {}}
        }

        response = client.post("/api/simulations/validate", json=wave_payload)
        assert response.status_code == 200
        data = response.json()
        # sigma = (c * dt / dx)^2 = (2.0 * 0.005 / 0.01)^2 = 1.0
        assert data["sigma"] == pytest.approx(1.0, rel=1e-6)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
