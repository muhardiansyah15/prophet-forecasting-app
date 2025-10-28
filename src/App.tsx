import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import ForecastConfig from './components/ForecastConfig';
import ForecastChart from './components/ForecastChart';
import DataPreview from './components/DataPreview';

export interface ForecastData {
  historical: Array<{ ds: string; y: number }>;
  forecast: Array<{ ds: string; yhat: number; yhat_lower: number; yhat_upper: number }>;
  metrics?: {
    mae: number;
    rmse: number;
    mape: number;
  };
}

export interface ForecastConfigType {
  periods: number;
  yearly_seasonality: boolean;
  weekly_seasonality: boolean;
  daily_seasonality: boolean;
  changepoint_prior_scale: number;
  seasonality_prior_scale: number;
  holidays_prior_scale: number;
  country_holidays?: string;
  forecast_method: string;
}

function App() {
  const [uploadedData, setUploadedData] = useState<Array<{ ds: string; y: number }> | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDataUpload = (data: Array<{ ds: string; y: number }>) => {
    setUploadedData(data);
    setForecastData(null);
    setError(null);
  };

  const handleForecast = async (config: ForecastConfigType) => {
    if (!uploadedData) {
      setError('Please upload data first');
      return;
    }
    // Basic validation on numeric config values
    if (!Number.isFinite(config.periods) || config.periods <= 0) {
      setError('Forecast periods must be a positive integer');
      return;
    }
    if (!Number.isFinite(config.changepoint_prior_scale) || config.changepoint_prior_scale <= 0) {
      setError('Trend flexibility must be a positive number');
      return;
    }
    if (!Number.isFinite(config.seasonality_prior_scale) || config.seasonality_prior_scale <= 0) {
      setError('Seasonality strength must be a positive number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8001/api/forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: uploadedData,
          config: config,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setForecastData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during forecasting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Prophet Forecasting App</h1>
        <p>Upload your Excel files and perform time series forecasting using Facebook Prophet</p>
      </header>

      <div className="upload-section">
        <h2>Upload Data</h2>
        <FileUpload onDataUpload={handleDataUpload} />
      </div>

      {uploadedData && (
        <div className="config-section">
          <h2>Data Preview</h2>
          <DataPreview data={uploadedData.slice(0, 10)} />
          <p>Showing first 10 rows of {uploadedData.length} total records</p>
        </div>
      )}

      {uploadedData && (
        <div className="config-section">
          <h2>Forecast Configuration</h2>
          <ForecastConfig onForecast={handleForecast} loading={loading} />
        </div>
      )}

      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && (
        <div className="loading">
          <p>Generating forecast... This may take a few moments.</p>
        </div>
      )}

      {forecastData && (
        <div className="results-section">
          <h2>Forecast Results</h2>
          <ForecastChart data={forecastData} />
          
          {forecastData.metrics && (
            <div className="metrics-grid">
              <div className="metric-card">
                <h4>Mean Absolute Error</h4>
                <div className="value">{forecastData.metrics.mae.toFixed(2)}</div>
              </div>
              <div className="metric-card">
                <h4>Root Mean Square Error</h4>
                <div className="value">{forecastData.metrics.rmse.toFixed(2)}</div>
              </div>
              <div className="metric-card">
                <h4>Mean Absolute Percentage Error</h4>
                <div className="value">{forecastData.metrics.mape.toFixed(2)}%</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;