#!/usr/bin/env python3
"""
Script to create sample Excel data for testing the Prophet Forecasting App
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def create_sample_data():
    """Create sample time series data with trend and seasonality"""
    
    # Generate dates for the last 2 years
    start_date = datetime(2022, 1, 1)
    end_date = datetime(2023, 12, 31)
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    
    # Create synthetic data with trend, seasonality, and noise
    np.random.seed(42)  # For reproducible results
    
    values = []
    for i, date in enumerate(dates):
        # Base trend
        trend = 100 + i * 0.1
        
        # Yearly seasonality (peak in summer)
        yearly = 20 * np.sin(2 * np.pi * date.timetuple().tm_yday / 365.25)
        
        # Weekly seasonality (lower on weekends)
        weekly = -5 if date.weekday() >= 5 else 5
        
        # Random noise
        noise = np.random.normal(0, 5)
        
        # Combine components
        value = trend + yearly + weekly + noise
        values.append(max(0, value))  # Ensure non-negative values
    
    # Create DataFrame
    df = pd.DataFrame({
        'ds': dates,
        'y': values
    })
    
    return df

def create_sales_data():
    """Create sample sales data"""
    
    start_date = datetime(2022, 1, 1)
    end_date = datetime(2023, 12, 31)
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    
    np.random.seed(123)
    
    values = []
    for i, date in enumerate(dates):
        # Base sales with growth
        base_sales = 1000 + i * 2
        
        # Seasonal effects
        month_effect = 200 * np.sin(2 * np.pi * (date.month - 1) / 12)  # Peak in summer
        week_effect = 100 if date.weekday() < 5 else -50  # Weekday vs weekend
        
        # Holiday effects (simplified)
        if date.month == 12 and date.day > 20:  # Holiday season
            holiday_effect = 300
        elif date.month == 11 and date.day > 20:  # Black Friday period
            holiday_effect = 200
        else:
            holiday_effect = 0
        
        # Random noise
        noise = np.random.normal(0, 50)
        
        value = base_sales + month_effect + week_effect + holiday_effect + noise
        values.append(max(0, int(value)))
    
    df = pd.DataFrame({
        'ds': dates,
        'y': values
    })
    
    return df

def create_website_traffic_data():
    """Create sample website traffic data"""
    
    start_date = datetime(2023, 1, 1)
    end_date = datetime(2023, 12, 31)
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    
    np.random.seed(456)
    
    values = []
    for i, date in enumerate(dates):
        # Base traffic with growth
        base_traffic = 5000 + i * 10
        
        # Weekly seasonality (higher on weekdays)
        if date.weekday() < 5:  # Monday to Friday
            weekly_effect = 2000
        else:  # Weekend
            weekly_effect = -1000
        
        # Monthly seasonality
        monthly_effect = 1000 * np.sin(2 * np.pi * (date.month - 1) / 12)
        
        # Random events (viral content, marketing campaigns)
        if np.random.random() < 0.05:  # 5% chance of spike
            event_effect = np.random.randint(2000, 8000)
        else:
            event_effect = 0
        
        # Random noise
        noise = np.random.normal(0, 200)
        
        value = base_traffic + weekly_effect + monthly_effect + event_effect + noise
        values.append(max(0, int(value)))
    
    df = pd.DataFrame({
        'ds': dates,
        'y': values
    })
    
    return df

if __name__ == "__main__":
    # Create sample datasets
    print("Creating sample datasets...")
    
    # 1. Generic time series
    sample_df = create_sample_data()
    sample_df.to_excel("sample_timeseries.xlsx", index=False)
    print(f"Created sample_timeseries.xlsx with {len(sample_df)} data points")
    
    # 2. Sales data
    sales_df = create_sales_data()
    sales_df.to_excel("sample_sales_data.xlsx", index=False)
    print(f"Created sample_sales_data.xlsx with {len(sales_df)} data points")
    
    # 3. Website traffic data
    traffic_df = create_website_traffic_data()
    traffic_df.to_excel("sample_website_traffic.xlsx", index=False)
    print(f"Created sample_website_traffic.xlsx with {len(traffic_df)} data points")
    
    # Print summary statistics
    print("\nDataset summaries:")
    print("1. Sample Time Series:")
    print(f"   Date range: {sample_df['ds'].min()} to {sample_df['ds'].max()}")
    print(f"   Value range: {sample_df['y'].min():.1f} to {sample_df['y'].max():.1f}")
    print(f"   Mean: {sample_df['y'].mean():.1f}")
    
    print("\n2. Sales Data:")
    print(f"   Date range: {sales_df['ds'].min()} to {sales_df['ds'].max()}")
    print(f"   Value range: {sales_df['y'].min()} to {sales_df['y'].max()}")
    print(f"   Mean: {sales_df['y'].mean():.0f}")
    
    print("\n3. Website Traffic:")
    print(f"   Date range: {traffic_df['ds'].min()} to {traffic_df['ds'].max()}")
    print(f"   Value range: {traffic_df['y'].min()} to {traffic_df['y'].max()}")
    print(f"   Mean: {traffic_df['y'].mean():.0f}")
    
    print("\nSample data files created successfully!")
    print("You can use these files to test the Prophet Forecasting App.")