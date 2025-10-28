from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
import pandas as pd
import numpy as np
# from prophet import Prophet  # Commented out - using simple forecasting instead
from simple_forecasting import linear_trend_forecast, moving_average_forecast, exponential_smoothing_forecast
import os
from pathlib import Path

# Prophet / CmdStan diagnostic flags (filled by check_prophet_status)
PROPHET_AVAILABLE = False
PROPHET_IMPORT_ERROR: Optional[str] = None
CMDSTAN_INSTALLED = False
CMDSTAN_PATH: Optional[str] = None

def check_prophet_status() -> Dict[str, Any]:
    """Check whether Prophet and CmdStan are available and return diagnostics."""
    global PROPHET_AVAILABLE, PROPHET_IMPORT_ERROR, CMDSTAN_INSTALLED, CMDSTAN_PATH
    PROPHET_AVAILABLE = False
    PROPHET_IMPORT_ERROR = None
    CMDSTAN_INSTALLED = False
    CMDSTAN_PATH = None
    diagnostics: Dict[str, Any] = {}
    
    try:
        # Try importing Prophet dynamically
        from prophet import Prophet  # type: ignore
        diagnostics['prophet_imported'] = True
        
        # Try actually creating a Prophet model to test if stan_backend works
        test_model = Prophet()
        # Try to access the stan_backend attribute that typically fails
        backend = getattr(test_model, 'stan_backend', None)
        if backend is None:
            PROPHET_AVAILABLE = False
            PROPHET_IMPORT_ERROR = "Prophet imported but stan_backend attribute is missing"
            diagnostics['prophet_functional'] = False
            diagnostics['prophet_error'] = PROPHET_IMPORT_ERROR
        else:
            PROPHET_AVAILABLE = True
            diagnostics['prophet_functional'] = True
            
    except Exception as e:
        PROPHET_AVAILABLE = False
        PROPHET_IMPORT_ERROR = str(e)
        diagnostics['prophet_imported'] = False
        diagnostics['prophet_functional'] = False
        diagnostics['prophet_import_error'] = PROPHET_IMPORT_ERROR

    # If cmdstanpy is installed, check whether CmdStan is installed/built
    try:
        import cmdstanpy
        try:
            # cmdstanpy.cmdstan_path() returns a Path-like string when installed
            path = cmdstanpy.cmdstan_path()
            if path and Path(path).exists():
                CMDSTAN_INSTALLED = True
                CMDSTAN_PATH = str(path)
            else:
                CMDSTAN_INSTALLED = False
                CMDSTAN_PATH = str(path) if path else None
        except Exception:
            # Older cmdstanpy versions may not have cmdstan_path helper
            CMDSTAN_INSTALLED = False
            CMDSTAN_PATH = None
        diagnostics['cmdstanpy_available'] = True
        diagnostics['cmdstan_installed'] = CMDSTAN_INSTALLED
        diagnostics['cmdstan_path'] = CMDSTAN_PATH
    except Exception:
        diagnostics['cmdstanpy_available'] = False
        diagnostics['cmdstan_installed'] = False

    return diagnostics

# Run diagnostic on import/startup
PROPHET_DIAGNOSTICS = check_prophet_status()
import io
import json
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Prophet Forecasting API", version="1.0.0")

# Enable CORS for React frontend and production deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "https://muhardiansyah15.github.io",
        "https://*.onrender.com",
        "https://*.vercel.app",
        "https://*.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DataPoint(BaseModel):
    ds: str
    y: float

class ForecastConfig(BaseModel):
    periods: int = 30
    yearly_seasonality: bool = True
    weekly_seasonality: bool = True
    daily_seasonality: bool = False
    changepoint_prior_scale: float = 0.05
    seasonality_prior_scale: float = 10.0
    holidays_prior_scale: float = 10.0
    country_holidays: Optional[str] = None
    forecast_method: str = "linear_trend"  # New: linear_trend, moving_average, exponential_smoothing

class ForecastRequest(BaseModel):
    data: List[DataPoint]
    config: ForecastConfig

class ForecastPoint(BaseModel):
    ds: str
    yhat: float
    yhat_lower: float
    yhat_upper: float

class ForecastMetrics(BaseModel):
    mae: float
    rmse: float
    mape: float

class ForecastResponse(BaseModel):
    historical: List[DataPoint]
    forecast: List[ForecastPoint]
    metrics: Optional[ForecastMetrics] = None

def calculate_metrics(actual: np.ndarray, predicted: np.ndarray) -> ForecastMetrics:
    """Calculate forecast accuracy metrics"""
    mae = np.mean(np.abs(actual - predicted))
    rmse = np.sqrt(np.mean((actual - predicted) ** 2))
    
    # Calculate MAPE, avoid division by zero
    mape_values = np.abs((actual - predicted) / np.where(actual != 0, actual, 1))
    mape = np.mean(mape_values) * 100
    
    return ForecastMetrics(mae=mae, rmse=rmse, mape=mape)

def parse_excel_file(file_content: bytes) -> List[DataPoint]:
    """Parse Excel file and return data points"""
    try:
        # Try reading as Excel file
        df = pd.read_excel(io.BytesIO(file_content))
        
        # Check if required columns exist
        if 'ds' not in df.columns or 'y' not in df.columns:
            raise ValueError("Excel file must contain 'ds' (date) and 'y' (value) columns")
        
        # Convert ds column to datetime if it's not already
        if not pd.api.types.is_datetime64_any_dtype(df['ds']):
            df['ds'] = pd.to_datetime(df['ds'])
        
        # Format ds column as string in YYYY-MM-DD format
        df['ds'] = df['ds'].dt.strftime('%Y-%m-%d')
        
        # Remove rows with missing values
        df = df.dropna(subset=['ds', 'y'])
        
        # Convert to list of DataPoint objects
        data_points = []
        for _, row in df.iterrows():
            try:
                data_points.append(DataPoint(ds=row['ds'], y=float(row['y'])))
            except (ValueError, TypeError) as e:
                logger.warning(f"Skipping invalid row: {row}. Error: {e}")
                continue
        
        if len(data_points) == 0:
            raise ValueError("No valid data points found in the file")
        
        return data_points
        
    except Exception as e:
        logger.error(f"Error parsing Excel file: {e}")
        raise ValueError(f"Error parsing Excel file: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Prophet Forecasting API", "version": "1.0.0"}


@app.get("/api/prophet_status")
async def prophet_status():
    """Return diagnostics about Prophet and CmdStan availability."""
    try:
        diag = check_prophet_status()
        return diag
    except Exception as e:
        logger.error(f"Error while checking prophet status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload and parse Excel file"""
    try:
        # Validate file type
        if not file.filename.endswith(('.xls', '.xlsx')):
            raise HTTPException(status_code=400, detail="File must be an Excel file (.xls or .xlsx)")
        
        # Read file content
        content = await file.read()
        
        # Parse Excel file
        data_points = parse_excel_file(content)
        
        logger.info(f"Successfully parsed {len(data_points)} data points from {file.filename}")
        
        return {
            "message": f"Successfully uploaded and parsed {len(data_points)} data points",
            "data": [{"ds": dp.ds, "y": dp.y} for dp in data_points]
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/forecast", response_model=ForecastResponse)
async def generate_forecast(request: ForecastRequest):
    """Generate forecast using simple forecasting methods"""
    try:
        # Convert data to DataFrame
        df = pd.DataFrame([{"ds": dp.ds, "y": dp.y} for dp in request.data])
        
        # Ensure ds column is datetime
        df['ds'] = pd.to_datetime(df['ds'])
        
        # Sort by date
        df = df.sort_values('ds').reset_index(drop=True)
        
        logger.info(f"Starting forecast with {len(df)} data points, method={request.config.forecast_method}")

        # If user explicitly requested Prophet, attempt it and provide actionable errors if it's not ready
        if request.config.forecast_method == 'prophet':
            # Re-check Prophet availability at request time
            diag = check_prophet_status()
            if not diag.get('prophet_functional', False):
                error_msg = diag.get('prophet_error', diag.get('prophet_import_error', 'Unknown Prophet error'))
                msg = (
                    "Prophet is not functional in the current environment. "
                    "This typically means CmdStan is not properly installed or configured. "
                    "Please see backend/PROPHET_SETUP.md for installation instructions. "
                    f"Error: {error_msg}")
                logger.error(msg)
                raise HTTPException(status_code=500, detail=msg)

            # If we reach here, try to import Prophet and run forecasting
            from prophet import Prophet  # type: ignore

            # Initialize Prophet model
            model = Prophet(
                yearly_seasonality=request.config.yearly_seasonality,
                weekly_seasonality=request.config.weekly_seasonality,
                daily_seasonality=request.config.daily_seasonality,
                changepoint_prior_scale=request.config.changepoint_prior_scale,
                seasonality_prior_scale=request.config.seasonality_prior_scale,
                holidays_prior_scale=request.config.holidays_prior_scale
            )

            # Add country holidays if specified
            if request.config.country_holidays:
                try:
                    model.add_country_holidays(country_name=request.config.country_holidays)
                except Exception as e:
                    logger.warning(f"Could not add holidays for {request.config.country_holidays}: {e}")

            # Fit the model
            model.fit(df)

            # Create future dataframe
            future = model.make_future_dataframe(periods=request.config.periods)

            # Generate forecast
            forecast_df = model.predict(future)
        else:
            # Use simple forecasting fallbacks (fast, pure-python)
            if request.config.forecast_method == 'moving_average':
                forecast_df = moving_average_forecast(df, periods=request.config.periods)
            elif request.config.forecast_method == 'exponential_smoothing':
                forecast_df = exponential_smoothing_forecast(df, periods=request.config.periods)
            else:
                # Default to linear trend
                forecast_df = linear_trend_forecast(df, periods=request.config.periods)
        
        # Split historical and forecast data
        historical_data = df.copy()
        forecast_data = forecast_df.tail(request.config.periods).copy()
        
        # Calculate metrics using cross-validation on historical data
        metrics = None
        if len(df) > 10:  # Only calculate metrics if we have enough data
            try:
                # Use the last 20% of data for validation
                split_point = int(len(df) * 0.8)
                train_df = df.iloc[:split_point]
                test_df = df.iloc[split_point:]
                
                # Fit model on training data based on the forecast method used
                if request.config.forecast_method == 'prophet':
                    # Only use Prophet for metrics calculation if we're using Prophet for forecasting
                    from prophet import Prophet  # type: ignore
                    val_model = Prophet(
                        yearly_seasonality=request.config.yearly_seasonality,
                        weekly_seasonality=request.config.weekly_seasonality,
                        daily_seasonality=request.config.daily_seasonality,
                        changepoint_prior_scale=request.config.changepoint_prior_scale,
                        seasonality_prior_scale=request.config.seasonality_prior_scale,
                        holidays_prior_scale=request.config.holidays_prior_scale
                    )
                    
                    if request.config.country_holidays:
                        try:
                            val_model.add_country_holidays(country_name=request.config.country_holidays)
                        except:
                            pass
                    
                    val_model.fit(train_df)
                    
                    # Predict on test data
                    test_future = val_model.make_future_dataframe(periods=len(test_df))
                    test_forecast = val_model.predict(test_future)
                    test_predictions = test_forecast.tail(len(test_df))['yhat'].values
                else:
                    # Use the same simple forecasting method for validation
                    if request.config.forecast_method == 'moving_average':
                        val_forecast = moving_average_forecast(train_df, periods=len(test_df))
                    elif request.config.forecast_method == 'exponential_smoothing':
                        val_forecast = exponential_smoothing_forecast(train_df, periods=len(test_df))
                    else:
                        # Default to linear trend
                        val_forecast = linear_trend_forecast(train_df, periods=len(test_df))
                    
                    test_predictions = val_forecast.tail(len(test_df))['yhat'].values
                
                # Calculate metrics
                metrics = calculate_metrics(test_df['y'].values, test_predictions)
                
            except Exception as e:
                logger.warning(f"Could not calculate metrics: {e}")
        
        # Format response
        historical = [
            DataPoint(ds=row['ds'].strftime('%Y-%m-%d'), y=row['y'])
            for _, row in historical_data.iterrows()
        ]
        
        forecast = [
            ForecastPoint(
                ds=row['ds'].strftime('%Y-%m-%d'),
                yhat=row['yhat'],
                yhat_lower=row['yhat_lower'],
                yhat_upper=row['yhat_upper']
            )
            for _, row in forecast_data.iterrows()
        ]
        
        logger.info(f"Successfully generated forecast with {len(forecast)} future points")
        
        return ForecastResponse(
            historical=historical,
            forecast=forecast,
            metrics=metrics
        )
        
    except Exception as e:
        logger.error(f"Error generating forecast: {e}")
        # If it's an HTTPException already, re-raise
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Error generating forecast: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Prophet Forecasting API...")
    print("📍 Server will be available at: http://localhost:8001")
    print("📖 API documentation at: http://localhost:8001/docs")
    uvicorn.run(app, host="0.0.0.0", port=8001)