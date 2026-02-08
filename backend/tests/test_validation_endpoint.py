"""
Test for POST /api/simulations/validate endpoint
Diagnoses 422 Unprocessable Entity errors
"""
import json


# Test payload 1: Minimal heat equation configuration
MINIMAL_HEAT_CONFIG = {
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

# Test payload 2: Minimal wave equation configuration
MINIMAL_WAVE_CONFIG = {
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

# Test payload 3: Configuration with optional fields
FULL_CONFIG = {
    "config": {
        "equation_type": "heat",
        "name": "Test Simulation",
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
            "beta": 0.1,
            "c": None
        },
        "boundary": {
            "type": "dirichlet",
            "left_value": 0.0,
            "right_value": 0.0,
            "time_dependent": False
        },
        "initial": {
            "preset": "gaussian",
            "expression": None,
            "params": {
                "center": 0.5,
                "width": 0.1,
                "amplitude": 1.0
            }
        }
    }
}

# Test payload 4: Invalid configuration (missing required fields)
INVALID_MISSING_FIELDS = {
    "config": {
        "equation_type": "heat",
        "spatial": {
            "x_min": 0.0,
            "x_max": 1.0
            # Missing dx
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
            "type": "dirichlet"
        },
        "initial": {
            "preset": "gaussian"
        }
    }
}

# Test payload 5: Invalid configuration (wrong types)
INVALID_WRONG_TYPES = {
    "config": {
        "equation_type": "heat",
        "spatial": {
            "x_min": "zero",  # Should be float
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
            "params": {}
        }
    }
}


def print_payload(name: str, payload: dict):
    """Print formatted payload for testing."""
    print(f"\n{'='*60}")
    print(f"{name}")
    print('='*60)
    print(json.dumps(payload, indent=2))
    print()


if __name__ == "__main__":
    print("VALIDATION ENDPOINT TEST PAYLOADS")
    print("Use these payloads to test POST /api/simulations/validate")
    print("\nEndpoint: http://localhost:8000/api/simulations/validate")
    print("Method: POST")
    print("Content-Type: application/json")

    print_payload("1. MINIMAL HEAT EQUATION CONFIG (Should work)", MINIMAL_HEAT_CONFIG)
    print_payload("2. MINIMAL WAVE EQUATION CONFIG (Should work)", MINIMAL_WAVE_CONFIG)
    print_payload("3. FULL CONFIG WITH OPTIONAL FIELDS (Should work)", FULL_CONFIG)
    print_payload("4. INVALID: MISSING REQUIRED FIELDS (Should fail 422)", INVALID_MISSING_FIELDS)
    print_payload("5. INVALID: WRONG TYPES (Should fail 422)", INVALID_WRONG_TYPES)

    print("\n" + "="*60)
    print("CURL COMMAND EXAMPLES")
    print("="*60)

    print("\n# Test minimal heat config:")
    print("curl -X POST http://localhost:8000/api/simulations/validate \\")
    print("  -H 'Content-Type: application/json' \\")
    print(f"  -d '{json.dumps(MINIMAL_HEAT_CONFIG)}'")

    print("\n# Test minimal wave config:")
    print("curl -X POST http://localhost:8000/api/simulations/validate \\")
    print("  -H 'Content-Type: application/json' \\")
    print(f"  -d '{json.dumps(MINIMAL_WAVE_CONFIG)}'")
