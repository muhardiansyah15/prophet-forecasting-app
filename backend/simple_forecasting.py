#!/usr/bin/env python3
"""
Simple forecasting backends that don't require Prophet/CmdStan
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any

def linear_trend_forecast(data: pd.DataFrame, periods: int) -> pd.DataFrame:
    """Simple linear trend forecasting that returns a DataFrame like Prophet"""
    df = data.copy()
    df['ds'] = pd.to_datetime(df['ds'])
    df = df.sort_values('ds').reset_index(drop=True)
    
    # Calculate linear trend
    x = np.arange(len(df))
    y = df['y'].values
    
    # Linear regression
    A = np.vstack([x, np.ones(len(x))]).T
    slope, intercept = np.linalg.lstsq(A, y, rcond=None)[0]
    
    # Generate future dates
    last_date = df['ds'].iloc[-1]
    future_dates = [last_date + timedelta(days=i+1) for i in range(periods)]
    
    # Forecast with linear trend
    future_x = np.arange(len(df), len(df) + periods)
    forecast_values = slope * future_x + intercept
    
    # Add some confidence intervals (simple approach)
    residuals = y - (slope * x + intercept)
    std_error = np.std(residuals)
    
    # Create forecast DataFrame (like Prophet output)
    forecast_df = df.copy()
    
    # Add historical predictions
    forecast_df['yhat'] = slope * x + intercept
    forecast_df['yhat_lower'] = forecast_df['yhat'] - 1.96 * std_error
    forecast_df['yhat_upper'] = forecast_df['yhat'] + 1.96 * std_error
    
    # Add future predictions
    future_df = pd.DataFrame({
        'ds': future_dates,
        'yhat': forecast_values,
        'yhat_lower': forecast_values - 1.96 * std_error,
        'yhat_upper': forecast_values + 1.96 * std_error
    })
    
    # Combine historical and future
    result_df = pd.concat([forecast_df, future_df], ignore_index=True)
    
    return result_df

def moving_average_forecast(data: pd.DataFrame, periods: int, window: int = 7) -> pd.DataFrame:
    """Moving average forecasting that returns a DataFrame like Prophet"""
    df = data.copy()
    df['ds'] = pd.to_datetime(df['ds'])
    df = df.sort_values('ds').reset_index(drop=True)
    
    # Calculate moving average
    df['ma'] = df['y'].rolling(window=window, min_periods=1).mean()
    
    # Use last moving average as forecast
    last_ma = df['ma'].iloc[-1]
    last_date = df['ds'].iloc[-1]
    
    # Generate future dates and forecasts
    future_dates = [last_date + timedelta(days=i+1) for i in range(periods)]
    
    # Simple seasonality detection (day of week effect)
    df['day_of_week'] = df['ds'].dt.dayofweek
    weekly_pattern = df.groupby('day_of_week')['y'].mean() - df['y'].mean()
    
    # Create forecast DataFrame
    forecast_df = df.copy()
    forecast_df['yhat'] = df['ma']
    std_dev = df['y'].std()
    forecast_df['yhat_lower'] = forecast_df['yhat'] - 1.96 * std_dev
    forecast_df['yhat_upper'] = forecast_df['yhat'] + 1.96 * std_dev
    
    # Add future predictions
    future_data = []
    for i, date in enumerate(future_dates):
        day_of_week = date.weekday()
        seasonal_adj = weekly_pattern.get(day_of_week, 0)
        base_value = last_ma + seasonal_adj
        
        future_data.append({
            'ds': date,
            'yhat': base_value,
            'yhat_lower': base_value - 1.96 * std_dev,
            'yhat_upper': base_value + 1.96 * std_dev
        })
    
    future_df = pd.DataFrame(future_data)
    
    # Combine historical and future
    result_df = pd.concat([forecast_df[['ds', 'yhat', 'yhat_lower', 'yhat_upper']], future_df], ignore_index=True)
    
    return result_df

def exponential_smoothing_forecast(data: pd.DataFrame, periods: int, alpha: float = 0.3) -> pd.DataFrame:
    """Exponential smoothing forecasting that returns a DataFrame like Prophet"""
    df = data.copy()
    df['ds'] = pd.to_datetime(df['ds'])
    df = df.sort_values('ds').reset_index(drop=True)
    
    # Exponential smoothing
    smoothed = [df['y'].iloc[0]]
    for i in range(1, len(df)):
        smoothed.append(alpha * df['y'].iloc[i] + (1 - alpha) * smoothed[-1])
    
    # Forecast
    last_smoothed = smoothed[-1]
    last_date = df['ds'].iloc[-1]
    future_dates = [last_date + timedelta(days=i+1) for i in range(periods)]
    
    # Create forecast DataFrame
    forecast_df = df.copy()
    forecast_df['yhat'] = smoothed
    std_dev = df['y'].std()
    forecast_df['yhat_lower'] = forecast_df['yhat'] - 1.96 * std_dev
    forecast_df['yhat_upper'] = forecast_df['yhat'] + 1.96 * std_dev
    
    # Add future predictions
    future_data = []
    for date in future_dates:
        future_data.append({
            'ds': date,
            'yhat': last_smoothed,
            'yhat_lower': last_smoothed - 1.96 * std_dev,
            'yhat_upper': last_smoothed + 1.96 * std_dev
        })
    
    future_df = pd.DataFrame(future_data)
    
    # Combine historical and future
    result_df = pd.concat([forecast_df[['ds', 'yhat', 'yhat_lower', 'yhat_upper']], future_df], ignore_index=True)
    
    return result_df