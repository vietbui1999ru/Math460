# POST /api/simulations/validate Endpoint Diagnostic Report

## Endpoint Details
- **URL**: `POST /api/simulations/validate`
- **Location**: `/Users/vietquocbui/repos/PyCharm/Math460/backend/app/api/routes.py:18-25`
- **Expected Input**: `ValidateConfigRequest` with nested `SimulationConfig`
- **Response**: `Dict[str, Any]` with validation results

## Schema Structure Analysis

### 1. ValidateConfigRequest (Root)
**File**: `app/models/schemas.py:91-93`

```python
class ValidateConfigRequest(BaseModel):
    config: SimulationConfig  # REQUIRED - nested configuration object
```

**Required Fields**:
- `config` (SimulationConfig) - The complete simulation configuration

---

### 2. SimulationConfig (Nested Object)
**File**: `app/models/schemas.py:80-88`

```python
class SimulationConfig(BaseModel):
    equation_type: EquationType              # REQUIRED
    spatial: SpatialDiscretization           # REQUIRED
    temporal: TemporalDiscretization         # REQUIRED
    physical: PhysicalParameters             # REQUIRED
    boundary: BoundaryCondition              # REQUIRED
    initial: InitialCondition                # REQUIRED
    name: Optional[str] = "Unnamed Simulation"  # OPTIONAL (has default)
```

**Required Fields**:
- `equation_type` (str enum): Must be "heat" or "wave"
- `spatial` (SpatialDiscretization object)
- `temporal` (TemporalDiscretization object)
- `physical` (PhysicalParameters object)
- `boundary` (BoundaryCondition object)
- `initial` (InitialCondition object)

**Optional Fields**:
- `name` (str): Defaults to "Unnamed Simulation"

---

### 3. SpatialDiscretization
**File**: `app/models/schemas.py:46-57`

```python
class SpatialDiscretization(BaseModel):
    x_min: float = 0.0      # OPTIONAL (has default)
    x_max: float = 1.0      # OPTIONAL (has default)
    dx: float = 0.01        # OPTIONAL (has default, validated > 0)
```

**All fields have defaults**, but `dx` must be positive.

---

### 4. TemporalDiscretization
**File**: `app/models/schemas.py:60-71`

```python
class TemporalDiscretization(BaseModel):
    t_min: float = 0.0      # OPTIONAL (has default)
    t_max: float = 1.0      # OPTIONAL (has default)
    dt: float = 0.001       # OPTIONAL (has default, validated > 0)
```

**All fields have defaults**, but `dt` must be positive.

---

### 5. PhysicalParameters
**File**: `app/models/schemas.py:74-77`

```python
class PhysicalParameters(BaseModel):
    beta: Optional[float] = None  # OPTIONAL - for heat equation
    c: Optional[float] = None     # OPTIONAL - for wave equation
```

**Both fields are optional**, but:
- For heat equations: `beta` is required (defaults to 0.1 in validation logic)
- For wave equations: `c` is required (defaults to 1.0 in validation logic)

---

### 6. BoundaryCondition
**File**: `app/models/schemas.py:31-36`

```python
class BoundaryCondition(BaseModel):
    type: BoundaryConditionType = BoundaryConditionType.DIRICHLET  # OPTIONAL
    left_value: float = 0.0          # OPTIONAL
    right_value: float = 0.0         # OPTIONAL
    time_dependent: bool = False     # OPTIONAL
```

**All fields have defaults**.

---

### 7. InitialCondition
**File**: `app/models/schemas.py:39-43`

```python
class InitialCondition(BaseModel):
    preset: InitialConditionPreset = InitialConditionPreset.GAUSSIAN  # OPTIONAL
    expression: Optional[str] = None      # OPTIONAL
    params: Dict[str, Any] = Field(default_factory=dict)  # OPTIONAL
```

**All fields have defaults**.

---

## Valid JSON Payload Structure

### Minimal Valid Payload (Heat Equation)
```json
{
  "config": {
    "equation_type": "heat",
    "spatial": {
      "x_min": 0.0,
      "x_max": 1.0,
      "dx": 0.01
    },
    "temporal": {
      "t_min": 0.0,
      "t_max": 0.5,
      "dt": 0.0001
    },
    "physical": {
      "beta": 0.1
    },
    "boundary": {
      "type": "dirichlet",
      "left_value": 0.0,
      "right_value": 0.0
    },
    "initial": {
      "preset": "gaussian",
      "params": {
        "center": 0.5,
        "width": 0.1,
        "amplitude": 1.0
      }
    }
  }
}
```

### Minimal Valid Payload (Wave Equation)
```json
{
  "config": {
    "equation_type": "wave",
    "spatial": {
      "x_min": 0.0,
      "x_max": 1.0,
      "dx": 0.01
    },
    "temporal": {
      "t_min": 0.0,
      "t_max": 2.0,
      "dt": 0.005
    },
    "physical": {
      "c": 1.0
    },
    "boundary": {
      "type": "dirichlet",
      "left_value": 0.0,
      "right_value": 0.0
    },
    "initial": {
      "preset": "sine",
      "params": {
        "amplitude": 1.0,
        "frequency": 1.0
      }
    }
  }
}
```

### Ultra-Minimal Payload (Using All Defaults)
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

---

## Common 422 Error Causes

### 1. Missing Required Top-Level Field
**Error**: Missing `config` wrapper
```json
{
  "equation_type": "heat",
  "spatial": {...}
  // Missing "config" wrapper
}
```
**Fix**: Wrap entire configuration in `"config": {...}`

---

### 2. Missing Required Nested Objects
**Error**: Missing nested objects (spatial, temporal, physical, boundary, initial)
```json
{
  "config": {
    "equation_type": "heat"
    // Missing spatial, temporal, physical, boundary, initial
  }
}
```
**Fix**: Include all required nested objects (can be empty `{}` if using defaults)

---

### 3. Invalid Enum Values
**Error**: Invalid `equation_type` value
```json
{
  "config": {
    "equation_type": "diffusion"  // Should be "heat" or "wave"
  }
}
```
**Fix**: Use valid enum values:
- `equation_type`: "heat" or "wave"
- `boundary.type`: "dirichlet", "neumann", or "periodic"
- `initial.preset`: "gaussian", "sine", "square_wave", "triangle_wave", or "custom"

---

### 4. Invalid Data Types
**Error**: String instead of number
```json
{
  "config": {
    "spatial": {
      "dx": "0.01"  // Should be float, not string
    }
  }
}
```
**Fix**: Use correct types (float for numbers, string for enums)

---

### 5. Validation Failures
**Error**: Negative or zero values for dx/dt
```json
{
  "config": {
    "spatial": {"dx": -0.01},  // Must be positive
    "temporal": {"dt": 0}      // Must be positive
  }
}
```
**Fix**: Ensure `dx > 0` and `dt > 0`

---

## Field Summary Table

| Field Path | Type | Required | Default | Validation |
|------------|------|----------|---------|------------|
| `config` | SimulationConfig | YES | - | - |
| `config.equation_type` | "heat"\|"wave" | YES | - | Must be enum value |
| `config.spatial` | Object | YES | - | Can be empty {} |
| `config.spatial.x_min` | float | NO | 0.0 | - |
| `config.spatial.x_max` | float | NO | 1.0 | Must be > x_min |
| `config.spatial.dx` | float | NO | 0.01 | Must be > 0 |
| `config.temporal` | Object | YES | - | Can be empty {} |
| `config.temporal.t_min` | float | NO | 0.0 | - |
| `config.temporal.t_max` | float | NO | 1.0 | Must be > t_min |
| `config.temporal.dt` | float | NO | 0.001 | Must be > 0 |
| `config.physical` | Object | YES | - | Can be empty {} |
| `config.physical.beta` | float\|null | NO | null | For heat: should be > 0 |
| `config.physical.c` | float\|null | NO | null | For wave: should be > 0 |
| `config.boundary` | Object | YES | - | Can be empty {} |
| `config.boundary.type` | enum | NO | "dirichlet" | "dirichlet"\|"neumann"\|"periodic" |
| `config.boundary.left_value` | float | NO | 0.0 | - |
| `config.boundary.right_value` | float | NO | 0.0 | - |
| `config.boundary.time_dependent` | bool | NO | false | - |
| `config.initial` | Object | YES | - | Can be empty {} |
| `config.initial.preset` | enum | NO | "gaussian" | See InitialConditionPreset |
| `config.initial.expression` | string\|null | NO | null | Custom expression |
| `config.initial.params` | object | NO | {} | Preset-specific params |
| `config.name` | string\|null | NO | "Unnamed Simulation" | - |

---

## Testing Commands

### Using curl
```bash
# Test with heat equation
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

# Test with wave equation
curl -X POST http://localhost:8000/api/simulations/validate \
  -H 'Content-Type: application/json' \
  -d '{
    "config": {
      "equation_type": "wave",
      "spatial": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
      "temporal": {"t_min": 0.0, "t_max": 2.0, "dt": 0.005},
      "physical": {"c": 1.0},
      "boundary": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
      "initial": {"preset": "sine", "params": {"amplitude": 1.0, "frequency": 1.0}}
    }
  }'
```

### Using Python requests
```python
import requests
import json

url = "http://localhost:8000/api/simulations/validate"

payload = {
    "config": {
        "equation_type": "heat",
        "spatial": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
        "temporal": {"t_min": 0.0, "t_max": 0.5, "dt": 0.0001},
        "physical": {"beta": 0.1},
        "boundary": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
        "initial": {"preset": "gaussian", "params": {"center": 0.5, "width": 0.1, "amplitude": 1.0}}
    }
}

response = requests.post(url, json=payload)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")
```

---

## Expected Responses

### Success Response (Valid Configuration)
```json
{
  "valid": true,
  "errors": [],
  "sigma": 0.1,
  "message": "Configuration is stable"
}
```

### Failure Response (Unstable Configuration)
```json
{
  "valid": false,
  "errors": [
    "CFL condition violated: σ = 0.6000 >= 0.5. Reduce dt or increase dx."
  ],
  "sigma": 0.6,
  "message": "Configuration is unstable"
}
```

### 422 Error Response (Invalid Request)
```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "config", "spatial"],
      "msg": "Field required",
      "input": {...}
    }
  ]
}
```

---

## Debugging Checklist

When you receive a 422 error, check:

1. **Wrapper structure**: Is the configuration wrapped in `"config": {...}`?
2. **Required objects**: Are all 6 required nested objects present (spatial, temporal, physical, boundary, initial)?
3. **Enum values**: Are equation_type, boundary.type, and initial.preset valid enum strings?
4. **Data types**: Are all numbers floats/ints (not strings)?
5. **Validation rules**: Is dx > 0? Is dt > 0? Is x_max > x_min? Is t_max > t_min?
6. **JSON syntax**: Is the JSON properly formatted (commas, quotes, brackets)?

---

## Reference: Working Example from Presets
The presets in `app/presets/simulation_presets.py` contain verified working configurations. Example:

```json
{
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
```

**Note**: This is the `config` value. For the `/validate` endpoint, wrap it:
```json
{
  "config": { /* configuration from preset */ }
}
```
