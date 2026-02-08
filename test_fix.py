#!/usr/bin/env python3
"""
Test script to verify the validation endpoint works with the fixed field names.
"""
import json
import sys
sys.path.insert(0, '/Users/vietquocbui/repos/PyCharm/Math460/backend')

from app.models.schemas import SimulationConfig, SpatialDiscretization, TemporalDiscretization, PhysicalParameters, BoundaryCondition, InitialCondition, EquationType, BoundaryConditionType, InitialConditionPreset
from app.services.simulation_service import SimulationService

print("=" * 60)
print("Testing Backend Validation Fix")
print("=" * 60)

# Test 1: Create config with new field names
print("\n1. Creating SimulationConfig with new field names...")
try:
    config = SimulationConfig(
        equation_type=EquationType.HEAT,
        spatial_domain=SpatialDiscretization(x_min=0, x_max=1, dx=0.01),
        temporal_domain=TemporalDiscretization(t_min=0, t_max=0.5, dt=0.0001),
        physical_parameters=PhysicalParameters(beta=0.1),
        boundary_condition=BoundaryCondition(type=BoundaryConditionType.DIRICHLET, left_value=0.0, right_value=0.0),
        initial_condition=InitialCondition(type=InitialConditionPreset.GAUSSIAN, parameters={'center': 0.5, 'width': 0.1})
    )
    print("✓ Config created successfully")
    print(f"  - Equation type: {config.equation_type}")
    print(f"  - Spatial domain: x_min={config.spatial_domain.x_min}, x_max={config.spatial_domain.x_max}, dx={config.spatial_domain.dx}")
except Exception as e:
    print(f"✗ Failed to create config: {e}")
    sys.exit(1)

# Test 2: Validate the config
print("\n2. Validating configuration...")
try:
    service = SimulationService()
    result = service.validate_configuration(config)
    print(f"✓ Validation completed")
    print(f"  - Valid: {result.get('valid')}")
    print(f"  - Sigma: {result.get('sigma')}")
    print(f"  - Message: {result.get('message')}")
    if result.get('errors'):
        print(f"  - Errors: {result.get('errors')}")
except Exception as e:
    print(f"✗ Validation failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 3: Test model_dump() to see what gets sent as JSON
print("\n3. Testing model_dump() (what gets sent to frontend)...")
try:
    config_dict = config.model_dump()
    print("✓ Config dumped successfully")
    print(f"  - Keys: {list(config_dict.keys())}")
    print(f"  - Spatial domain key: {'spatial_domain' if 'spatial_domain' in config_dict else 'NOT FOUND'}")
    print(f"  - Temporal domain key: {'temporal_domain' if 'temporal_domain' in config_dict else 'NOT FOUND'}")
    print(f"  - Physical parameters key: {'physical_parameters' if 'physical_parameters' in config_dict else 'NOT FOUND'}")
    print(f"  - Initial condition: {config_dict.get('initial_condition')}")
except Exception as e:
    print(f"✗ model_dump() failed: {e}")
    sys.exit(1)

# Test 4: Test that the frontend JSON format works
print("\n4. Testing frontend JSON format...")
frontend_json = {
    "equation_type": "heat",
    "spatial_domain": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
    "temporal_domain": {"t_min": 0.0, "t_max": 0.5, "dt": 0.0001},
    "physical_parameters": {"beta": 0.1},
    "boundary_condition": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
    "initial_condition": {"type": "gaussian", "parameters": {"center": 0.5, "width": 0.1}}
}

try:
    config_from_json = SimulationConfig(**frontend_json)
    print("✓ Frontend JSON format parsed successfully")
    print(f"  - Equation type: {config_from_json.equation_type}")
except Exception as e:
    print(f"✗ Failed to parse frontend JSON: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "=" * 60)
print("All tests passed! ✓")
print("=" * 60)
