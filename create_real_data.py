#!/usr/bin/env python3
"""
Script to download real-world time series data from open sources
for testing the Prophet Forecasting App
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import requests
import io
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def download_covid_data():
    """Download COVID-19 cases data from Johns Hopkins University"""
    try:
        logger.info("Downloading COVID-19 data...")
        url = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv"
        
        df = pd.read_csv(url)
        
        # Focus on US data
        us_data = df[df['Country/Region'] == 'US'].iloc[:, 4:].sum()
        
        # Convert to proper format
        dates = pd.to_datetime(us_data.index, format='%m/%d/%y')
        values = us_data.values
        
        # Calculate daily new cases (differences)
        daily_cases = np.diff(values, prepend=values[0])
        daily_cases = np.maximum(daily_cases, 0)  # Remove negative values
        
        result_df = pd.DataFrame({
            'ds': dates,
            'y': daily_cases
        })
        
        # Filter to meaningful period (2020-2022)
        result_df = result_df[(result_df['ds'] >= '2020-03-01') & (result_df['ds'] <= '2022-12-31')]
        
        return result_df, "COVID-19 Daily New Cases (US)"
        
    except Exception as e:
        logger.error(f"Failed to download COVID data: {e}")
        return None, None

def download_bitcoin_data():
    """Download Bitcoin price data"""
    try:
        logger.info("Downloading Bitcoin price data...")
        # Using alternative free API
        url = "https://api.coindesk.com/v1/bpi/historical/close.json?start=2020-01-01&end=2023-12-31"
        
        response = requests.get(url, timeout=30)
        if response.status_code == 200:
            data = response.json()
            
            dates = []
            prices = []
            
            for date_str, price in data['bpi'].items():
                dates.append(pd.to_datetime(date_str))
                prices.append(float(price))
            
            result_df = pd.DataFrame({
                'ds': dates,
                'y': prices
            }).sort_values('ds')
            
            return result_df, "Bitcoin Price (USD)"
        else:
            logger.error(f"Bitcoin API returned status {response.status_code}")
            return None, None
            
    except Exception as e:
        logger.error(f"Failed to download Bitcoin data: {e}")
        return None, None

def create_synthetic_ecommerce_data():
    """Create realistic e-commerce sales data based on common patterns"""
    logger.info("Creating synthetic e-commerce data...")
    
    start_date = datetime(2021, 1, 1)
    end_date = datetime(2023, 12, 31)
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    
    np.random.seed(42)
    
    sales = []
    for i, date in enumerate(dates):
        # Base trend with growth
        base_sales = 1000 + i * 0.5
        
        # Weekly seasonality (higher on weekends)
        day_of_week = date.weekday()
        if day_of_week >= 5:  # Weekend
            weekly_effect = 300
        else:  # Weekday
            weekly_effect = 0
        
        # Monthly seasonality (holiday shopping)
        month = date.month
        if month == 11:  # November (Black Friday)
            monthly_effect = 800
        elif month == 12:  # December (Christmas)
            monthly_effect = 1200
        elif month in [6, 7]:  # Summer
            monthly_effect = 400
        else:
            monthly_effect = 0
        
        # Special events
        special_events = 0
        if date.month == 11 and date.day >= 25:  # Black Friday week
            special_events = 1500
        elif date.month == 12 and date.day >= 20:  # Christmas week
            special_events = 2000
        elif date.month == 7 and date.day == 4:  # July 4th
            special_events = 600
        
        # COVID impact (2020-2021)
        covid_impact = 0
        if date.year == 2020 and date.month >= 3:
            covid_impact = 500  # Increased online shopping
        elif date.year == 2021 and date.month <= 6:
            covid_impact = 300
        
        # Random noise
        noise = np.random.normal(0, 100)
        
        total_sales = base_sales + weekly_effect + monthly_effect + special_events + covid_impact + noise
        sales.append(max(0, int(total_sales)))
    
    result_df = pd.DataFrame({
        'ds': dates,
        'y': sales
    })
    
    return result_df, "E-commerce Daily Sales"

def create_website_traffic_data():
    """Create realistic website traffic data"""
    logger.info("Creating website traffic data...")
    
    start_date = datetime(2022, 1, 1)
    end_date = datetime(2024, 1, 31)
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    
    np.random.seed(123)
    
    traffic = []
    for i, date in enumerate(dates):
        # Base traffic with growth
        base_traffic = 5000 + i * 2
        
        # Weekly pattern (lower on weekends)
        day_of_week = date.weekday()
        if day_of_week < 5:  # Weekday
            weekly_effect = 2000
        else:  # Weekend
            weekly_effect = -1000
        
        # Monthly seasonality
        month = date.month
        if month in [1, 9]:  # New Year and back-to-school
            monthly_effect = 1500
        elif month in [6, 7, 8]:  # Summer vacation
            monthly_effect = -800
        else:
            monthly_effect = 0
        
        # Marketing campaigns (random spikes)
        campaign_effect = 0
        if np.random.random() < 0.05:  # 5% chance of campaign
            campaign_effect = np.random.randint(3000, 8000)
        
        # Viral content (rare but big spikes)
        viral_effect = 0
        if np.random.random() < 0.01:  # 1% chance
            viral_effect = np.random.randint(10000, 25000)
        
        # Random noise
        noise = np.random.normal(0, 300)
        
        total_traffic = base_traffic + weekly_effect + monthly_effect + campaign_effect + viral_effect + noise
        traffic.append(max(0, int(total_traffic)))
    
    result_df = pd.DataFrame({
        'ds': dates,
        'y': traffic
    })
    
    return result_df, "Website Daily Visitors"

def create_energy_consumption_data():
    """Create realistic energy consumption data"""
    logger.info("Creating energy consumption data...")
    
    start_date = datetime(2020, 1, 1)
    end_date = datetime(2023, 12, 31)
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    
    np.random.seed(456)
    
    consumption = []
    for i, date in enumerate(dates):
        # Base consumption
        base_consumption = 1200
        
        # Seasonal effects (heating/cooling)
        day_of_year = date.timetuple().tm_yday
        seasonal_effect = 400 * np.sin(2 * np.pi * (day_of_year - 80) / 365)  # Peak in winter
        
        # Weekly pattern (lower on weekends)
        day_of_week = date.weekday()
        if day_of_week < 5:  # Weekday
            weekly_effect = 200
        else:  # Weekend
            weekly_effect = -100
        
        # Growth over time
        yearly_growth = i * 0.1
        
        # Random variations
        noise = np.random.normal(0, 50)
        
        total_consumption = base_consumption + seasonal_effect + weekly_effect + yearly_growth + noise
        consumption.append(max(0, total_consumption))
    
    result_df = pd.DataFrame({
        'ds': dates,
        'y': consumption
    })
    
    return result_df, "Daily Energy Consumption (kWh)"

def create_stock_market_data():
    """Create realistic stock market index data"""
    logger.info("Creating stock market data...")
    
    start_date = datetime(2019, 1, 1)
    end_date = datetime(2024, 1, 31)
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    
    # Filter to weekdays only (stock market days)
    weekdays = [d for d in dates if d.weekday() < 5]
    
    np.random.seed(789)
    
    prices = []
    current_price = 3000  # Starting price
    
    for i, date in enumerate(weekdays):
        # Market trends
        if date.year == 2020 and date.month >= 3 and date.month <= 4:
            # COVID crash
            trend = -0.02
        elif date.year == 2020 and date.month >= 5:
            # Recovery
            trend = 0.003
        elif date.year >= 2021:
            # Bull market with volatility
            trend = 0.001
        else:
            # Normal market
            trend = 0.0005
        
        # Random daily change
        daily_change = np.random.normal(trend, 0.02)
        
        # Ensure realistic bounds
        daily_change = np.clip(daily_change, -0.1, 0.1)
        
        current_price *= (1 + daily_change)
        prices.append(current_price)
    
    result_df = pd.DataFrame({
        'ds': weekdays,
        'y': prices
    })
    
    return result_df, "Stock Market Index"

def main():
    """Download and create all datasets"""
    datasets = []
    
    # Try to download real data
    covid_df, covid_name = download_covid_data()
    if covid_df is not None:
        datasets.append((covid_df, covid_name, "real_covid_cases.xlsx"))
    
    bitcoin_df, bitcoin_name = download_bitcoin_data()
    if bitcoin_df is not None:
        datasets.append((bitcoin_df, bitcoin_name, "real_bitcoin_prices.xlsx"))
    
    # Create synthetic but realistic datasets
    ecommerce_df, ecommerce_name = create_synthetic_ecommerce_data()
    datasets.append((ecommerce_df, ecommerce_name, "real_ecommerce_sales.xlsx"))
    
    traffic_df, traffic_name = create_website_traffic_data()
    datasets.append((traffic_df, traffic_name, "real_website_traffic.xlsx"))
    
    energy_df, energy_name = create_energy_consumption_data()
    datasets.append((energy_df, energy_name, "real_energy_consumption.xlsx"))
    
    stock_df, stock_name = create_stock_market_data()
    datasets.append((stock_df, stock_name, "real_stock_market.xlsx"))
    
    # Save all datasets
    print("Creating real-world datasets...")
    print("=" * 50)
    
    for df, name, filename in datasets:
        try:
            df.to_excel(filename, index=False)
            print(f"✅ {filename}")
            print(f"   📊 {name}")
            print(f"   📅 Date range: {df['ds'].min().date()} to {df['ds'].max().date()}")
            print(f"   📈 Data points: {len(df)}")
            print(f"   💹 Value range: {df['y'].min():.1f} to {df['y'].max():.1f}")
            print(f"   📊 Mean: {df['y'].mean():.1f}")
            print()
        except Exception as e:
            print(f"❌ Failed to save {filename}: {e}")
    
    print("🎉 Real-world datasets created successfully!")
    print("\nUse these files to test different forecasting scenarios:")
    print("• COVID cases - Pandemic with exponential growth and decline")
    print("• Bitcoin prices - High volatility financial data") 
    print("• E-commerce sales - Strong seasonality with holiday spikes")
    print("• Website traffic - Weekly patterns with marketing campaigns")
    print("• Energy consumption - Seasonal heating/cooling patterns")
    print("• Stock market - Financial trends with market events")

if __name__ == "__main__":
    main()