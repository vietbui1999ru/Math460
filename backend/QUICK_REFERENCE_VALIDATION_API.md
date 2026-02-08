# Quick Reference: POST /api/simulations/validate

## Endpoint
```
POST http://localhost:8000/api/simulations/validate
Content-Type: application/json
```

---

## Minimal Heat Equation Payload
```json
{
  "config": {
    "equation_type": "heat",
    "spatial": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
    "temporal": {"t_min": 0.0, "t_max": 0.5, "dt": 0.0001},
    "physical": {"beta": 0.1},
    "boundary": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
    "initial": {"preset": "gaussian", "params": {}}
  }
}
```

---

## Minimal Wave Equation Payload
```json
{
  "config": {
    "equation_type": "wave",
    "spatial": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
    "temporal": {"t_min": 0.0, "t_max": 2.0, "dt": 0.005},
    "physical": {"c": 1.0},
    "boundary": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
    "initial": {"preset": "sine", "params": {}}
  }
}
```

---

## Required Fields
- `config` (wrapper object)
- `config.equation_type` ("heat" or "wave")
- `config.spatial` (object, can be empty {})
- `config.temporal` (object, can be empty {})
- `config.physical` (object, must have beta or c)
- `config.boundary` (object, can be empty {})
- `config.initial` (object, can be empty {})

---

## Valid Enum Values

### equation_type
- "heat"
- "wave"

### boundary.type
- "dirichlet" (default)
- "neumann"
- "periodic"

### initial.preset
- "gaussian" (default)
- "sine"
- "square_wave"
- "triangle_wave"
- "custom"

---

## Validation Rules
- `dx` must be > 0
- `dt` must be > 0
- `x_max` must be > `x_min`
- `t_max` must be > `t_min`
- For heat: σ = β·Δt/Δx² < 0.5 (stability)
- For wave: σ = (c·Δt/Δx)² ≤ 1 (stability)

---

## Success Response (200)
```json
{
  "valid": true,
  "errors": [],
  "sigma": 0.1,
  "message": "Configuration is stable"
}
```

---

## Unstable Response (200)
```json
{
  "valid": false,
  "errors": ["CFL condition violated: σ = 0.6000 >= 0.5. Reduce dt or increase dx."],
  "sigma": 0.6,
  "message": "Configuration is unstable"
}
```

---

## Error Response (422)
```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "config", "spatial"],
      "msg": "Field required"
    }
  ]
}
```

---

## Common 422 Errors

### Missing 'config' wrapper
```json
// WRONG
{
  "equation_type": "heat"
}

// CORRECT
{
  "config": {
    "equation_type": "heat"
  }
}
```

### Missing nested objects
```json
// WRONG
{
  "config": {
    "equation_type": "heat"
  }
}

// CORRECT
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

### Invalid enum
```json
// WRONG
{
  "config": {
    "equation_type": "diffusion"
  }
}

// CORRECT
{
  "config": {
    "equation_type": "heat"
  }
}
```

---

## curl Example
```bash
curl -X POST http://localhost:8000/api/simulations/validate \
  -H 'Content-Type: application/json' \
  -d '{"config":{"equation_type":"heat","spatial":{},"temporal":{},"physical":{"beta":0.1},"boundary":{},"initial":{}}}'
```

---

## Test Commands
```bash
# Run unit tests
pytest tests/test_validation_endpoint_unit.py -v

# Run manual test script
python test_validation_manual.py
```

---

## Files
- **Schema**: `/Users/vietquocbui/repos/PyCharm/Math460/backend/app/models/schemas.py`
- **Endpoint**: `/Users/vietquocbui/repos/PyCharm/Math460/backend/app/api/routes.py`
- **Validator**: `/Users/vietquocbui/repos/PyCharm/Math460/backend/app/core/stability_validator.py`
- **Tests**: `/Users/vietquocbui/repos/PyCharm/Math460/backend/tests/test_validation_endpoint_unit.py`
- **Presets**: `/Users/vietquocbui/repos/PyCharm/Math460/backend/app/presets/simulation_presets.py`
