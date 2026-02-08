# Diagnostic Report: POST /api/simulations/validate 422 Error

## Executive Summary

**Status**: ENDPOINT IS WORKING CORRECTLY
**Issue**: User-reported 422 errors are likely due to malformed request payloads
**Testing**: All 14 unit tests pass successfully
**Root Cause**: Missing required fields or incorrect request structure

---

## Endpoint Analysis

### Endpoint Details
- **URL**: `POST http://localhost:8000/api/simulations/validate`
- **File**: `/Users/vietquocbui/repos/PyCharm/Math460/backend/app/api/routes.py:18-25`
- **Request Model**: `ValidateConfigRequest`
- **Response Model**: `Dict[str, Any]`

### Request Schema Structure

```
ValidateConfigRequest (root)
└── config: SimulationConfig (REQUIRED)
    ├── equation_type: "heat" | "wave" (REQUIRED)
    ├── spatial: SpatialDiscretization (REQUIRED)
    │   ├── x_min: float = 0.0
    │   ├── x_max: float = 1.0
    │   └── dx: float = 0.01 (must be > 0)
    ├── temporal: TemporalDiscretization (REQUIRED)
    │   ├── t_min: float = 0.0
    │   ├── t_max: float = 1.0
    │   └── dt: float = 0.001 (must be > 0)
    ├── physical: PhysicalParameters (REQUIRED)
    │   ├── beta: float | None (for heat equation)
    │   └── c: float | None (for wave equation)
    ├── boundary: BoundaryCondition (REQUIRED)
    │   ├── type: "dirichlet" | "neumann" | "periodic" = "dirichlet"
    │   ├── left_value: float = 0.0
    │   ├── right_value: float = 0.0
    │   └── time_dependent: bool = False
    ├── initial: InitialCondition (REQUIRED)
    │   ├── preset: "gaussian" | "sine" | "square_wave" | "triangle_wave" | "custom"
    │   ├── expression: str | None
    │   └── params: dict = {}
    └── name: str | None = "Unnamed Simulation"
```

---

## Testing Results

### Test Summary
```
Total Tests: 14
Passed: 14
Failed: 0
Success Rate: 100%
```

### Test Coverage

1. **Valid Configurations** (PASS)
   - Heat equation with Gaussian initial condition
   - Wave equation with sine initial condition
   - Configuration with all default values
   - Configuration with optional name field

2. **Stability Validation** (PASS)
   - Stable heat equation (CFL satisfied)
   - Stable wave equation (CFL satisfied)
   - Unstable heat equation (CFL violated)
   - Unstable wave equation (CFL violated)

3. **Error Detection** (PASS)
   - Missing 'config' wrapper (422 error correctly thrown)
   - Missing required nested objects (422 error correctly thrown)
   - Invalid equation_type enum (422 error correctly thrown)
   - Negative dx validation (422 error correctly thrown)
   - Negative dt validation (422 error correctly thrown)

4. **Parameter Variations** (PASS)
   - Different initial condition presets
   - Different boundary condition types
   - Different physical parameters (beta, c)

---

## Common 422 Error Causes and Solutions

### 1. Missing 'config' Wrapper
**Symptom**: Error message shows `Field required` at `["body", "config"]`

**Wrong**:
```json
{
  "equation_type": "heat",
  "spatial": {...},
  ...
}
```

**Correct**:
```json
{
  "config": {
    "equation_type": "heat",
    "spatial": {...},
    ...
  }
}
```

---

### 2. Missing Required Nested Objects
**Symptom**: Error shows `Field required` at `["body", "config", "spatial"]` (or temporal, physical, boundary, initial)

**Wrong**:
```json
{
  "config": {
    "equation_type": "heat"
    // Missing spatial, temporal, physical, boundary, initial
  }
}
```

**Correct**:
```json
{
  "config": {
    "equation_type": "heat",
    "spatial": {},      // Can be empty if using defaults
    "temporal": {},
    "physical": {"beta": 0.1},
    "boundary": {},
    "initial": {}
  }
}
```

---

### 3. Invalid Enum Values
**Symptom**: Error shows `Input should be 'heat' or 'wave'`

**Wrong**:
```json
{
  "config": {
    "equation_type": "diffusion",  // Invalid enum value
    ...
  }
}
```

**Correct**:
```json
{
  "config": {
    "equation_type": "heat",  // or "wave"
    ...
  }
}
```

**Valid Enum Values**:
- `equation_type`: "heat", "wave"
- `boundary.type`: "dirichlet", "neumann", "periodic"
- `initial.preset`: "gaussian", "sine", "square_wave", "triangle_wave", "custom"

---

### 4. Negative or Zero Values for dx/dt
**Symptom**: Error shows `Value error, dx must be positive` at `["body", "config", "spatial", "dx"]`

**Wrong**:
```json
{
  "config": {
    "spatial": {"dx": -0.01},  // Negative
    "temporal": {"dt": 0},     // Zero
    ...
  }
}
```

**Correct**:
```json
{
  "config": {
    "spatial": {"dx": 0.01},   // Positive
    "temporal": {"dt": 0.001}, // Positive
    ...
  }
}
```

---

### 5. Invalid JSON Syntax
**Symptom**: Error parsing JSON

**Wrong**:
```json
{
  "config": {
    "equation_type": "heat",  // Missing comma or extra comma
  }
}
```

**Correct**:
```json
{
  "config": {
    "equation_type": "heat"
  }
}
```

---

## Valid Example Payloads

### Minimal Heat Equation (Recommended)
```json
{
  "config": {
    "equation_type": "heat",
    "spatial": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
    "temporal": {"t_min": 0.0, "t_max": 0.5, "dt": 0.0001},
    "physical": {"beta": 0.1},
    "boundary": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
    "initial": {
      "preset": "gaussian",
      "params": {"center": 0.5, "width": 0.1, "amplitude": 1.0}
    }
  }
}
```

**Expected Response**:
```json
{
  "valid": true,
  "errors": [],
  "sigma": 0.1,
  "message": "Configuration is stable"
}
```

---

### Minimal Wave Equation (Recommended)
```json
{
  "config": {
    "equation_type": "wave",
    "spatial": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
    "temporal": {"t_min": 0.0, "t_max": 2.0, "dt": 0.005},
    "physical": {"c": 1.0},
    "boundary": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
    "initial": {
      "preset": "sine",
      "params": {"amplitude": 1.0, "frequency": 1.0}
    }
  }
}
```

**Expected Response**:
```json
{
  "valid": true,
  "errors": [],
  "sigma": 0.25,
  "message": "Configuration is stable"
}
```

---

### Ultra-Minimal (Using Defaults)
```json
{
  "config": {
    "equation_type": "heat",
    "spatial": {},
    "temporal": {},
    "physical": {"beta": 0.1},
    "boundary": {},
    "initial": {}
  }
}
```

**Expected Response** (may be unstable with default values):
```json
{
  "valid": false,
  "errors": ["CFL condition violated: σ = 1.0000 >= 0.5. Reduce dt or increase dx."],
  "sigma": 1.0,
  "message": "Configuration is unstable"
}
```

---

## Testing Commands

### Using curl
```bash
curl -X POST http://localhost:8000/api/simulations/validate \
  -H 'Content-Type: application/json' \
  -d '{
    "config": {
      "equation_type": "heat",
      "spatial": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
      "temporal": {"t_min": 0.0, "t_max": 0.5, "dt": 0.0001},
      "physical": {"beta": 0.1},
      "boundary": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
      "initial": {"preset": "gaussian", "params": {"center": 0.5, "width": 0.1, "amplitude": 1.0}}
    }
  }'
```

### Using Python Test Script
```bash
cd /Users/vietquocbui/repos/PyCharm/Math460/backend
python test_validation_manual.py
```

### Using pytest Unit Tests
```bash
cd /Users/vietquocbui/repos/PyCharm/Math460/backend
python -m pytest tests/test_validation_endpoint_unit.py -v
```

---

## Validation Logic

### Heat Equation Stability Check
**CFL Condition**: σ = β·Δt/Δx² < 0.5

**File**: `/Users/vietquocbui/repos/PyCharm/Math460/backend/app/core/stability_validator.py:17-57`

**Example**:
- beta = 0.1
- dt = 0.0001
- dx = 0.01
- σ = 0.1 × 0.0001 / 0.01² = 0.1 < 0.5 ✓ STABLE

---

### Wave Equation Stability Check
**CFL Condition**: σ = (c·Δt/Δx)² ≤ 1

**File**: `/Users/vietquocbui/repos/PyCharm/Math460/backend/app/core/stability_validator.py:59-99`

**Example**:
- c = 1.0
- dt = 0.005
- dx = 0.01
- σ = (1.0 × 0.005 / 0.01)² = 0.25 ≤ 1 ✓ STABLE

---

## Files Created for Testing

1. **VALIDATION_ENDPOINT_DIAGNOSTIC.md**
   - Comprehensive schema documentation
   - Field-by-field analysis
   - Common error causes and fixes

2. **test_validation_manual.py**
   - Manual testing script
   - Tests 9 different scenarios
   - Includes valid and invalid cases

3. **tests/test_validation_endpoint_unit.py**
   - 14 unit tests using pytest
   - Complete endpoint coverage
   - All tests passing (100%)

4. **DIAGNOSTIC_REPORT_422_ERROR.md** (this file)
   - Executive summary
   - Testing results
   - Usage guide

---

## Recommendations

### For Users Getting 422 Errors:

1. **Verify JSON Structure**: Ensure your request has the `"config": {...}` wrapper

2. **Include All Required Objects**: Even if empty, include:
   - spatial
   - temporal
   - physical
   - boundary
   - initial

3. **Use Valid Enum Values**: Check that equation_type, boundary.type, and initial.preset use valid values

4. **Ensure Positive Values**: dx and dt must be > 0

5. **Test with Example Payloads**: Use the provided minimal examples first

6. **Check FastAPI Validation Errors**: The 422 response body contains detailed error information showing exactly which field is problematic

### For Developers:

1. **Run Unit Tests**: `pytest tests/test_validation_endpoint_unit.py -v`

2. **Use Test Script**: `python test_validation_manual.py` for manual verification

3. **Check Presets**: `/Users/vietquocbui/repos/PyCharm/Math460/backend/app/presets/simulation_presets.py` contains verified working configurations

4. **Refer to Schema**: `/Users/vietquocbui/repos/PyCharm/Math460/backend/app/models/schemas.py` is the source of truth

---

## Conclusion

The `/api/simulations/validate` endpoint is **working correctly**. All 14 unit tests pass, and the endpoint properly:

- Accepts valid configurations (returns 200 with validation result)
- Rejects invalid configurations (returns 422 with detailed error messages)
- Validates stability conditions (CFL for heat and wave equations)
- Handles all required and optional fields correctly

**422 errors are caused by malformed request payloads**, not by bugs in the endpoint. Users should:
1. Ensure proper JSON structure with 'config' wrapper
2. Include all required nested objects
3. Use valid enum values
4. Follow the example payloads provided

**No bugs were found**. The endpoint behavior matches expected FastAPI validation patterns.
