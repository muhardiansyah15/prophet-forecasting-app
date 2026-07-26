import React, { useEffect, useState } from 'react';
import FileUpload from './components/FileUpload';
import ForecastConfig from './components/ForecastConfig';
import StatTiles from './components/StatTiles';
import ForecastChart from './components/ForecastChart';
import ComponentsCharts from './components/ComponentsCharts';
import ForecastTable from './components/ForecastTable';

export interface DataPoint { ds: string; y: number; }
export interface ForecastPoint { ds: string; yhat: number; yhat_lower: number; yhat_upper: number; }

export interface ForecastData {
  historical: DataPoint[];
  fitted: ForecastPoint[];
  forecast: ForecastPoint[];
  metrics?: { mae: number; rmse: number; mape: number };
  components?: {
    trend: Array<{ ds: string; value: number }>;
    weekly: Array<{ label: string; value: number }>;
    yearly: Array<{ label: string; value: number }>;
  };
  changepoints: string[];
  method_used: string;
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

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

function DataSummary({ data }: { data: DataPoint[] }) {
  const values = data.map(d => d.y);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return (
    <div className="chips">
      <span className="chip"><b>{data.length.toLocaleString()}</b> rows</span>
      <span className="chip">{data[0].ds} → {data[data.length - 1].ds}</span>
      <span className="chip">mean <b>{fmt(mean)}</b></span>
      <span className="chip">min <b>{fmt(Math.min(...values))}</b></span>
      <span className="chip">max <b>{fmt(Math.max(...values))}</b></span>
    </div>
  );
}

function App() {
  const [uploadedData, setUploadedData] = useState<DataPoint[] | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiUp, setApiUp] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/`)
      .then(r => setApiUp(r.ok))
      .catch(() => setApiUp(false));
  }, []);

  const handleDataUpload = (data: DataPoint[]) => {
    setUploadedData(data);
    setForecastData(null);
    setError(null);
  };

  const handleForecast = async (config: ForecastConfigType) => {
    if (!uploadedData) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: uploadedData, config }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to generate forecast');
      }
      const result: ForecastData = await response.json();
      setForecastData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-logo" aria-hidden="true">📈</span>
          <div>
            <h1>Prophet Forecast Studio</h1>
            <p>Upload a time series, get a full forecast dashboard — powered by Facebook Prophet</p>
          </div>
        </div>
        <div className="topbar-links">
          <span className={`api-pill ${apiUp === null ? '' : apiUp ? 'up' : 'down'}`}>
            <span className="api-dot" />
            {apiUp === null ? 'checking API…' : apiUp ? 'API online' : 'API offline'}
          </span>
          <a href="https://facebook.github.io/prophet/" target="_blank" rel="noopener noreferrer">Prophet Docs</a>
          <a href="https://github.com/muhardiansyah15/prophet-forecasting-app" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </header>

      <section className="card">
        <div className="card-head">
          <h2><span className="step-num">1</span>Upload your data</h2>
        </div>
        <p className="card-sub">
          Excel (.xlsx/.xls) or CSV with a date column and a value column.
          Columns named <code>ds</code>/<code>y</code> (Prophet's convention) are used directly;
          otherwise they are auto-detected.
        </p>
        <FileUpload onDataUpload={handleDataUpload} />
        {uploadedData && (
          <div style={{ marginTop: 14 }}>
            <DataSummary data={uploadedData} />
          </div>
        )}
      </section>

      {uploadedData && (
        <section className="card">
          <div className="card-head">
            <h2><span className="step-num">2</span>Configure the forecast</h2>
          </div>
          <ForecastConfig onForecast={handleForecast} loading={loading} />
          {loading && (
            <div className="loading-panel">
              <span className="spinner" aria-hidden="true" />
              Fitting the model and generating your forecast…
            </div>
          )}
          {error && (
            <div className="alert alert-error" role="alert">
              <span aria-hidden="true">⚠️</span>
              <div><strong>Error:</strong> {error}</div>
            </div>
          )}
        </section>
      )}

      {forecastData && (
        <>
          <StatTiles data={forecastData} />

          <section className="card">
            <div className="card-head">
              <h2>Forecast — history, fit &amp; {forecastData.forecast.length} periods ahead</h2>
            </div>
            <p className="card-sub">
              Shaded band is the model's uncertainty interval. Method:{' '}
              {forecastData.method_used === 'prophet' ? 'Facebook Prophet' : forecastData.method_used.replace('_', ' ')}
            </p>
            <div className="chart-box">
              <ForecastChart data={forecastData} />
            </div>
          </section>

          {forecastData.components && forecastData.components.trend.length > 0 && (
            <div className="components-wrap">
              <ComponentsCharts components={forecastData.components} changepoints={forecastData.changepoints} />
            </div>
          )}

          <section className="card">
            <div className="card-head">
              <h2>Forecast table</h2>
            </div>
            <ForecastTable forecast={forecastData.forecast} />
          </section>
        </>
      )}

      <footer className="footer">
        <span>Built by <a href="https://muhardiansyah.netlify.app/" target="_blank" rel="noopener noreferrer">Muhardiansyah</a> · React + FastAPI + Prophet</span>
        <span><a href="https://facebook.github.io/prophet/docs/quick_start.html" target="_blank" rel="noopener noreferrer">How Prophet works</a></span>
      </footer>
    </div>
  );
}

export default App;
