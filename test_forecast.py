#!/usr/bin/env python3
"""
Quick test script to verify the forecast endpoint works
"""

import requests
import json

# Test data
test_data = {
    "data": [
        {"ds": "2024-01-01", "y": 100},
        {"ds": "2024-01-02", "y": 105},
        {"ds": "2024-01-03", "y": 102},
        {"ds": "2024-01-04", "y": 108},
        {"ds": "2024-01-05", "y": 110}
    ],
    "config": {
        "periods": 5,
        "yearly_seasonality": True,
        "weekly_seasonality": True,
        "daily_seasonality": False,
        "changepoint_prior_scale": 0.05,
        "seasonality_prior_scale": 10.0,
        "holidays_prior_scale": 10.0,
        "country_holidays": "US",
        "forecast_method": "prophet"
    }
}

def test_server():
    try:
        # Test if server is running
        response = requests.get("http://localhost:8001/")
        print(f"Server status: {response.status_code}")
        print(f"Server response: {response.json()}")
        
        # Test forecast endpoint
        print("\nTesting forecast endpoint...")
        response = requests.post(
            "http://localhost:8001/api/forecast",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Forecast status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Forecast successful!")
            print(f"Historical points: {len(result['historical'])}")
            print(f"Forecast points: {len(result['forecast'])}")
            if result.get('metrics'):
                print(f"Metrics: MAE={result['metrics']['mae']:.2f}")
        else:
            print("❌ Forecast failed!")
            print(f"Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Is it running on port 8001?")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_server()