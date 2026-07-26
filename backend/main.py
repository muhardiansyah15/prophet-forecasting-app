from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
import pandas as pd
import numpy as np
import io
import logging

from simple_forecasting import (
    linear_trend_forecast,
    moving_average_forecast,
    exponential_smoothing_forecast,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Prophet availability (import once; wheels since prophet 1.1 bundle cmdstan,
# so no separate CmdStan install step is needed)
# ---------------------------------------------------------------------------
try:
    from prophet import Prophet  # type: ignore

    PROPHET_AVAILABLE = True
    PROPHET_IMPORT_ERROR: Optional[str] = None
except Exception as e:  # pragma: no cover
    Prophet = None  # type: ignore
    PROPHET_AVAILABLE = False
    PROPHET_IMPORT_ERROR = str(e)

app = FastAPI(title="Prophet Forecasting API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.(onrender\.com|vercel\.app|netlify\.app)|https://muhardiansyah15\.github\.io|http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
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
    forecast_method: str = "prophet"  # prophet | linear_trend | moving_average | exponential_smoothing


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


class TrendPoint(BaseModel):
    ds: str
    value: float


class NamedValue(BaseModel):
    label: str
    value: float


class ForecastComponents(BaseModel):
    trend: List[TrendPoint] = []
    weekly: List[NamedValue] = []      # effect per day of week (Mon..Sun)
    yearly: List[NamedValue] = []      # average effect per month (Jan..Dec)


class ForecastResponse(BaseModel):
    historical: List[DataPoint]
    fitted: List[ForecastPoint]        # in-sample fit over the historical range
    forecast: List[ForecastPoint]      # future periods only
    metrics: Optional[ForecastMetrics] = None
    components: Optional[ForecastComponents] = None
    changepoints: List[str] = []
    method_used: str = "prophet"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def calculate_metrics(actual: np.ndarray, predicted: np.ndarray) -> ForecastMetrics:
    mae = float(np.mean(np.abs(actual - predicted)))
    rmse = float(np.sqrt(np.mean((actual - predicted) ** 2)))
    mape_values = np.abs((actual - predicted) / np.where(actual != 0, actual, 1))
    mape = float(np.mean(mape_values) * 100)
    return ForecastMetrics(mae=mae, rmse=rmse, mape=mape)


def detect_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Return a dataframe with columns ds (datetime) and y (numeric).

    Accepts the Prophet convention ('ds'/'y') directly; otherwise auto-detects
    the first date-like column and the first numeric column.
    """
    df = df.copy()
    df.columns = [str(c).strip() for c in df.columns]
    lower_map = {c.lower(): c for c in df.columns}

    ds_col = lower_map.get("ds")
    y_col = lower_map.get("y")

    if ds_col is None:
        for c in df.columns:
            if c == y_col:
                continue
            parsed = pd.to_datetime(df[c], errors="coerce")
            if parsed.notna().mean() > 0.9:
                ds_col = c
                break
    if y_col is None:
        for c in df.columns:
            if c == ds_col:
                continue
            values = pd.to_numeric(df[c], errors="coerce")
            if values.notna().mean() > 0.9:
                y_col = c
                break

    if ds_col is None or y_col is None:
        raise ValueError(
            "Could not find a date column and a numeric column. "
            "Use Prophet's convention: a 'ds' (date) column and a 'y' (value) column."
        )

    out = pd.DataFrame(
        {
            "ds": pd.to_datetime(df[ds_col], errors="coerce"),
            "y": pd.to_numeric(df[y_col], errors="coerce"),
        }
    ).dropna()
    out = out.sort_values("ds").reset_index(drop=True)
    if out.empty:
        raise ValueError("No valid rows found after parsing dates and values.")
    return out


def parse_uploaded_file(filename: str, content: bytes) -> pd.DataFrame:
    name = (filename or "").lower()
    if name.endswith((".xls", ".xlsx")):
        raw = pd.read_excel(io.BytesIO(content))
    elif name.endswith(".csv"):
        raw = pd.read_csv(io.BytesIO(content))
    else:
        raise ValueError("File must be .xlsx, .xls, or .csv")
    return detect_columns(raw)


WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def extract_components(model: "Prophet", forecast_df: pd.DataFrame) -> ForecastComponents:
    """Summarize Prophet's decomposition for the dashboard."""
    components = ForecastComponents()

    components.trend = [
        TrendPoint(ds=row["ds"].strftime("%Y-%m-%d"), value=float(row["trend"]))
        for _, row in forecast_df[["ds", "trend"]].iterrows()
    ]

    if "weekly" in forecast_df.columns:
        weekly = forecast_df.groupby(forecast_df["ds"].dt.dayofweek)["weekly"].mean()
        components.weekly = [
            NamedValue(label=WEEKDAYS[d], value=float(weekly.get(d, 0.0)))
            for d in range(7)
        ]

    if "yearly" in forecast_df.columns:
        yearly = forecast_df.groupby(forecast_df["ds"].dt.month)["yearly"].mean()
        components.yearly = [
            NamedValue(label=MONTHS[m - 1], value=float(yearly.get(m, 0.0)))
            for m in range(1, 13)
        ]

    return components


def significant_changepoints(model: "Prophet", threshold: float = 0.01) -> List[str]:
    """Changepoints where the trend actually shifted (|delta| above threshold)."""
    try:
        deltas = np.nanmean(model.params["delta"], axis=0)
        return [
            cp.strftime("%Y-%m-%d")
            for cp, delta in zip(model.changepoints, deltas)
            if abs(delta) >= threshold
        ]
    except Exception:
        return []


def build_prophet_model(config: ForecastConfig) -> "Prophet":
    model = Prophet(
        yearly_seasonality=config.yearly_seasonality,
        weekly_seasonality=config.weekly_seasonality,
        daily_seasonality=config.daily_seasonality,
        changepoint_prior_scale=config.changepoint_prior_scale,
        seasonality_prior_scale=config.seasonality_prior_scale,
        holidays_prior_scale=config.holidays_prior_scale,
    )
    if config.country_holidays:
        try:
            model.add_country_holidays(country_name=config.country_holidays)
        except Exception as e:
            logger.warning(f"Could not add holidays for {config.country_holidays}: {e}")
    return model


def run_simple_method(method: str, df: pd.DataFrame, periods: int) -> pd.DataFrame:
    if method == "moving_average":
        return moving_average_forecast(df, periods=periods)
    if method == "exponential_smoothing":
        return exponential_smoothing_forecast(df, periods=periods)
    return linear_trend_forecast(df, periods=periods)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/")
async def root():
    return {
        "message": "Prophet Forecasting API",
        "version": "2.0.0",
        "prophet_available": PROPHET_AVAILABLE,
    }


@app.get("/api/prophet_status")
async def prophet_status():
    return {
        "prophet_available": PROPHET_AVAILABLE,
        "prophet_import_error": PROPHET_IMPORT_ERROR,
    }


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload and parse an Excel/CSV file into (ds, y) data points."""
    try:
        content = await file.read()
        if len(content) > 10 * 1024 * 1024:
            raise ValueError("File size must be less than 10MB")
        df = parse_uploaded_file(file.filename, content)
        logger.info(f"Parsed {len(df)} rows from {file.filename}")
        return {
            "message": f"Successfully parsed {len(df)} data points",
            "data": [
                {"ds": row["ds"].strftime("%Y-%m-%d"), "y": float(row["y"])}
                for _, row in df.iterrows()
            ],
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/forecast", response_model=ForecastResponse)
async def generate_forecast(request: ForecastRequest):
    try:
        df = pd.DataFrame([{"ds": dp.ds, "y": dp.y} for dp in request.data])
        df["ds"] = pd.to_datetime(df["ds"])
        df = df.sort_values("ds").reset_index(drop=True)
        if len(df) < 2:
            raise HTTPException(status_code=400, detail="Need at least 2 data points")

        method = request.config.forecast_method
        logger.info(f"Forecasting {len(df)} points, periods={request.config.periods}, method={method}")

        components: Optional[ForecastComponents] = None
        changepoints: List[str] = []

        if method == "prophet":
            if not PROPHET_AVAILABLE:
                raise HTTPException(
                    status_code=503,
                    detail=(
                        "Prophet is not available on the server: "
                        f"{PROPHET_IMPORT_ERROR}. Choose another method or reinstall prophet."
                    ),
                )
            model = build_prophet_model(request.config)
            model.fit(df)
            future = model.make_future_dataframe(periods=request.config.periods)
            forecast_df = model.predict(future)
            components = extract_components(model, forecast_df)
            changepoints = significant_changepoints(model)
        else:
            forecast_df = run_simple_method(method, df, request.config.periods)

        fitted_df = forecast_df.iloc[: len(df)]
        future_df = forecast_df.iloc[len(df):]

        # Holdout metrics: refit on the first 80%, score the last 20%
        metrics = None
        if len(df) > 10:
            try:
                split = int(len(df) * 0.8)
                train_df, test_df = df.iloc[:split], df.iloc[split:]
                if method == "prophet":
                    val_model = build_prophet_model(request.config)
                    val_model.fit(train_df)
                    val_future = val_model.make_future_dataframe(periods=len(test_df))
                    val_pred = val_model.predict(val_future).tail(len(test_df))["yhat"].values
                else:
                    val_pred = (
                        run_simple_method(method, train_df, len(test_df))
                        .tail(len(test_df))["yhat"]
                        .values
                    )
                metrics = calculate_metrics(test_df["y"].values, val_pred)
            except Exception as e:
                logger.warning(f"Could not calculate metrics: {e}")

        def to_points(frame: pd.DataFrame) -> List[ForecastPoint]:
            return [
                ForecastPoint(
                    ds=row["ds"].strftime("%Y-%m-%d"),
                    yhat=float(row["yhat"]),
                    yhat_lower=float(row["yhat_lower"]),
                    yhat_upper=float(row["yhat_upper"]),
                )
                for _, row in frame.iterrows()
            ]

        return ForecastResponse(
            historical=[
                DataPoint(ds=row["ds"].strftime("%Y-%m-%d"), y=float(row["y"]))
                for _, row in df.iterrows()
            ],
            fitted=to_points(fitted_df),
            forecast=to_points(future_df),
            metrics=metrics,
            components=components,
            changepoints=changepoints,
            method_used=method,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating forecast: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating forecast: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    print("🚀 Starting Prophet Forecasting API...")
    print("📍 Server: http://localhost:8001  ·  Docs: http://localhost:8001/docs")
    uvicorn.run(app, host="0.0.0.0", port=8001)
