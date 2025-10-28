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
          config,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate forecast');
      }

      const result = await response.json();
      setForecastData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="title-section">
            <div className="app-icon">📈</div>
            <div>
              <h1>Prophet Forecasting App</h1>
              <p>Advanced time series forecasting using Facebook Prophet and alternative methods</p>
            </div>
          </div>
          
          <div className="author-credits">
            <div className="author-info">
              <span className="author-icon">👨‍💻</span>
              <span>Built by <strong>Muhardiansyah</strong></span>
            </div>
            <div className="social-links">
              <a href="https://github.com/muhardiansyah15" target="_blank" rel="noopener noreferrer" className="social-link">
                GitHub
              </a>
              <a href="https://linkedin.com/in/muhardiansyah15" target="_blank" rel="noopener noreferrer" className="social-link">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Upload Section */}
      <div className="upload-section">
        <div className="section-header">
          <span className="section-icon">📁</span>
          <h2>Upload Data</h2>
        </div>
        <FileUpload onDataUpload={handleDataUpload} />
      </div>

      {/* Data Preview */}
      {uploadedData && (
        <div className="config-section">
          <div className="section-header">
            <span className="section-icon">📊</span>
            <h2>Data Preview</h2>
          </div>
          <DataPreview data={uploadedData.slice(0, 10)} />
        </div>
      )}

      {/* Configuration */}
      {uploadedData && (
        <div className="config-section">
          <div className="section-header">
            <span className="section-icon">⚙️</span>
            <h2>Forecast Configuration</h2>
          </div>
          <ForecastConfig onForecast={handleForecast} loading={loading} />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error">
          <span className="error-icon">⚠️</span>
          <div>
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading">
          <span className="loading-icon spinning">📈</span>
          <p>Generating forecast... This may take a few moments.</p>
        </div>
      )}

      {/* Results */}
      {forecastData && (
        <div className="results-section">
          <div className="section-header">
            <span className="section-icon">📈</span>
            <h2>Forecast Results</h2>
          </div>
          <ForecastChart data={forecastData} />
          
          {forecastData.metrics && (
            <div className="metrics">
              <h3>Accuracy Metrics</h3>
              <div className="metrics-grid">
                <div className="metric">
                  <span className="metric-label">MAE</span>
                  <span className="metric-value">{forecastData.metrics.mae.toFixed(2)}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">RMSE</span>
                  <span className="metric-value">{forecastData.metrics.rmse.toFixed(2)}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">MAPE</span>
                  <span className="metric-value">{forecastData.metrics.mape.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-left">
            <span className="footer-icon">📈</span>
            <span>Prophet Forecasting App</span>
          </div>
          <div className="footer-center">
            <p>Created with ❤️ by Muhardiansyah using React, FastAPI, and Facebook Prophet</p>
          </div>
          <div className="footer-right">
            <a href="https://github.com/muhardiansyah15/prophet-forecasting-app" target="_blank" rel="noopener noreferrer" className="footer-link">
              View Source
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;