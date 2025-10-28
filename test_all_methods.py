#!/usr/bin/env python3
"""
Test script that tries different forecasting methods
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
        "forecast_method": "linear_trend"  # Start with fallback method
    }
}

def test_method(method_name):
    print(f"\n🧪 Testing {method_name} method...")
    test_data["config"]["forecast_method"] = method_name
    
    try:
        response = requests.post(
            "http://localhost:8001/api/forecast",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ {method_name} successful!")
            print(f"   Historical points: {len(result['historical'])}")
            print(f"   Forecast points: {len(result['forecast'])}")
            if result.get('metrics'):
                print(f"   MAE: {result['metrics']['mae']:.2f}")
            return True
        else:
            print(f"❌ {method_name} failed!")
            print(f"   Error: {response.json()['detail']}")
            return False
            
    except Exception as e:
        print(f"❌ {method_name} error: {e}")
        return False

def main():
    print("🚀 Testing Prophet Forecasting API...")
    
    # Test server connection
    try:
        response = requests.get("http://localhost:8001/")
        print(f"✅ Server is running: {response.json()['message']}")
    except:
        print("❌ Cannot connect to server!")
        return
    
    # Test Prophet status
    try:
        response = requests.get("http://localhost:8001/api/prophet_status")
        status = response.json()
        print(f"\n📊 Prophet Status:")
        print(f"   Imported: {status.get('prophet_imported', False)}")
        print(f"   Functional: {status.get('prophet_functional', False)}")
        if status.get('prophet_error') or status.get('prophet_import_error'):
            print(f"   Error: {status.get('prophet_error') or status.get('prophet_import_error')}")
    except Exception as e:
        print(f"❌ Could not check Prophet status: {e}")
    
    # Test different forecasting methods
    methods = ["linear_trend", "moving_average", "exponential_smoothing", "prophet"]
    working_methods = []
    
    for method in methods:
        if test_method(method):
            working_methods.append(method)
    
    print(f"\n🎯 Summary:")
    print(f"   Working methods: {working_methods}")
    if "prophet" not in working_methods:
        print(f"   📝 To enable Prophet, see: backend/PROPHET_SETUP.md")
        print(f"   💡 For now, use: linear_trend, moving_average, or exponential_smoothing")

if __name__ == "__main__":
    main()