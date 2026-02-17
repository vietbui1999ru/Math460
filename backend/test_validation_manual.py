#!/usr/bin/env python3
"""
Manual test script for POST /api/simulations/validate endpoint.
Run this script with the backend server running to diagnose 422 errors.

Usage:
    python test_validation_manual.py
"""
import requests
import json
from typing import Dict, Any


# Test payloads
TEST_CASES = [
    {
        "name": "Valid Heat Equation (Gaussian)",
        "should_succeed": True,
        "payload": {
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
    },
    {
        "name": "Valid Wave Equation (Sine)",
        "should_succeed": True,
        "payload": {
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
    },
    {
        "name": "Valid Heat with All Defaults",
        "should_succeed": True,
        "payload": {
            "config": {
                "equation_type": "heat",
                "spatial": {},
                "temporal": {},
                "physical": {"beta": 0.1},
                "boundary": {},
                "initial": {}
            }
        }
    },
    {
        "name": "Unstable Heat (CFL violation)",
        "should_succeed": True,  # Should validate but return unstable
        "payload": {
            "config": {
                "equation_type": "heat",
                "spatial": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
                "temporal": {"t_min": 0.0, "t_max": 0.5, "dt": 0.01},  # Large dt
                "physical": {"beta": 0.5},
                "boundary": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
                "initial": {"preset": "gaussian", "params": {}}
            }
        }
    },
    {
        "name": "Invalid: Missing 'config' wrapper",
        "should_succeed": False,
        "payload": {
            "equation_type": "heat",
            "spatial": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
            "temporal": {"t_min": 0.0, "t_max": 0.5, "dt": 0.0001},
            "physical": {"beta": 0.1},
            "boundary": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
            "initial": {"preset": "gaussian", "params": {}}
        }
    },
    {
        "name": "Invalid: Missing required nested object 'spatial'",
        "should_succeed": False,
        "payload": {
            "config": {
                "equation_type": "heat",
                # Missing spatial
                "temporal": {"t_min": 0.0, "t_max": 0.5, "dt": 0.0001},
                "physical": {"beta": 0.1},
                "boundary": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
                "initial": {"preset": "gaussian", "params": {}}
            }
        }
    },
    {
        "name": "Invalid: Wrong type for dx (string instead of float)",
        "should_succeed": False,
        "payload": {
            "config": {
                "equation_type": "heat",
                "spatial": {"x_min": 0.0, "x_max": 1.0, "dx": "0.01"},  # Wrong type
                "temporal": {"t_min": 0.0, "t_max": 0.5, "dt": 0.0001},
                "physical": {"beta": 0.1},
                "boundary": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
                "initial": {"preset": "gaussian", "params": {}}
            }
        }
    },
    {
        "name": "Invalid: Invalid equation_type enum",
        "should_succeed": False,
        "payload": {
            "config": {
                "equation_type": "diffusion",  # Invalid enum
                "spatial": {"x_min": 0.0, "x_max": 1.0, "dx": 0.01},
                "temporal": {"t_min": 0.0, "t_max": 0.5, "dt": 0.0001},
                "physical": {"beta": 0.1},
                "boundary": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
                "initial": {"preset": "gaussian", "params": {}}
            }
        }
    },
    {
        "name": "Invalid: Negative dx (validation error)",
        "should_succeed": False,
        "payload": {
            "config": {
                "equation_type": "heat",
                "spatial": {"x_min": 0.0, "x_max": 1.0, "dx": -0.01},  # Negative
                "temporal": {"t_min": 0.0, "t_max": 0.5, "dt": 0.0001},
                "physical": {"beta": 0.1},
                "boundary": {"type": "dirichlet", "left_value": 0.0, "right_value": 0.0},
                "initial": {"preset": "gaussian", "params": {}}
            }
        }
    }
]


def test_endpoint(base_url: str = "http://localhost:8001"):
    """Test the validation endpoint with various payloads."""
    endpoint = f"{base_url}/api/simulations/validate"

    print("=" * 80)
    print("VALIDATION ENDPOINT TEST")
    print("=" * 80)
    print(f"Endpoint: {endpoint}")
    print(f"Total test cases: {len(TEST_CASES)}\n")

    results = {
        "passed": 0,
        "failed": 0,
        "errors": []
    }

    for i, test_case in enumerate(TEST_CASES, 1):
        print(f"\n[Test {i}/{len(TEST_CASES)}] {test_case['name']}")
        print("-" * 80)

        try:
            response = requests.post(
                endpoint,
                json=test_case["payload"],
                headers={"Content-Type": "application/json"},
                timeout=5
            )

            print(f"Status Code: {response.status_code}")

            # Parse response
            try:
                response_data = response.json()
                print(f"Response: {json.dumps(response_data, indent=2)}")
            except json.JSONDecodeError:
                print(f"Response (raw): {response.text}")
                response_data = {"error": "Invalid JSON response"}

            # Check if result matches expectation
            if test_case["should_succeed"]:
                if response.status_code == 200:
                    print("RESULT: PASS (Expected success, got 200)")
                    results["passed"] += 1
                else:
                    print(f"RESULT: FAIL (Expected 200, got {response.status_code})")
                    results["failed"] += 1
                    results["errors"].append({
                        "test": test_case["name"],
                        "expected": "200",
                        "got": response.status_code,
                        "response": response_data
                    })
            else:
                if response.status_code == 422:
                    print("RESULT: PASS (Expected 422 validation error)")
                    results["passed"] += 1
                else:
                    print(f"RESULT: UNEXPECTED (Expected 422, got {response.status_code})")
                    results["failed"] += 1
                    results["errors"].append({
                        "test": test_case["name"],
                        "expected": "422",
                        "got": response.status_code,
                        "response": response_data
                    })

        except requests.exceptions.ConnectionError:
            print("RESULT: ERROR - Cannot connect to server")
            print("Make sure the backend server is running on http://localhost:8001")
            results["failed"] += 1
            results["errors"].append({
                "test": test_case["name"],
                "error": "Connection refused"
            })
            break
        except Exception as e:
            print(f"RESULT: ERROR - {type(e).__name__}: {e}")
            results["failed"] += 1
            results["errors"].append({
                "test": test_case["name"],
                "error": str(e)
            })

    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print(f"Passed: {results['passed']}/{len(TEST_CASES)}")
    print(f"Failed: {results['failed']}/{len(TEST_CASES)}")

    if results["errors"]:
        print("\nFailed Tests:")
        for error in results["errors"]:
            print(f"\n  - {error.get('test', 'Unknown')}")
            if "expected" in error:
                print(f"    Expected: {error['expected']}")
                print(f"    Got: {error['got']}")
            if "error" in error:
                print(f"    Error: {error['error']}")

    print("\n" + "=" * 80)
    return results


if __name__ == "__main__":
    print("\nChecking server health...")
    try:
        health_response = requests.get("http://localhost:8001/health", timeout=2)
        if health_response.status_code == 200:
            print("Server is running!")
            print("\nStarting tests...\n")
            test_endpoint()
        else:
            print(f"Server returned status {health_response.status_code}")
    except requests.exceptions.ConnectionError:
        print("\nERROR: Cannot connect to backend server!")
        print("\nPlease start the backend server first:")
        print("  cd /Users/vietquocbui/repos/PyCharm/Math460/backend")
        print("  uvicorn app.main:app --reload")
        print("\nThen run this test script again.")
