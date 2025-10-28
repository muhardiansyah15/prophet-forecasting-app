import React, { useState } from 'react';
import { ForecastConfigType as Config } from '../App';

interface ForecastConfigProps {
  onForecast: (config: Config) => void;
  loading: boolean;
}

const ForecastConfig: React.FC<ForecastConfigProps> = ({ onForecast, loading }) => {
  const [config, setConfig] = useState<Config>({
    periods: 30,
    yearly_seasonality: true,
    weekly_seasonality: true,
    daily_seasonality: false,
    changepoint_prior_scale: 0.05,
    seasonality_prior_scale: 10.0,
    holidays_prior_scale: 10.0,
    country_holidays: 'US',
    forecast_method: 'linear_trend',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onForecast(config);
  };

  const updateConfig = (key: keyof Config, value: any) => {
    setConfig(prev => {
      // Validate numeric fields to avoid NaN being stored in state
      if (key === 'periods') {
        const v = parseInt(value as any);
        if (isNaN(v) || v < 1) return prev;
        return { ...prev, [key]: v } as Config;
      }

      if (key === 'changepoint_prior_scale' || key === 'seasonality_prior_scale' || key === 'holidays_prior_scale') {
        const v = parseFloat(value as any);
        if (isNaN(v)) return prev;
        return { ...prev, [key]: v } as Config;
      }

      // For booleans and country_holidays
      return { ...prev, [key]: value } as Config;
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="config-grid">
        <div className="form-group">
          <label htmlFor="periods">
            <span className="form-icon">📅</span>
            Forecast Periods
          </label>
          <input
            type="number"
            id="periods"
            min="1"
            max="365"
            value={config.periods}
            onChange={(e) => updateConfig('periods', parseInt(e.target.value))}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="country_holidays">
            <span className="form-icon">🌍</span>
            Country Holidays
          </label>
          <select
            id="country_holidays"
            value={config.country_holidays || ''}
            onChange={(e) => updateConfig('country_holidays', e.target.value || undefined)}
          >
            <option value="">None</option>
            <option value="US">United States</option>
            <option value="UK">United Kingdom</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="IT">Italy</option>
            <option value="ES">Spain</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
            <option value="JP">Japan</option>
            <option value="CN">China</option>
            <option value="IN">India</option>
            <option value="BR">Brazil</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="forecast_method">
            <span className="form-icon">📈</span>
            Forecasting Method
          </label>
          <select
            id="forecast_method"
            value={config.forecast_method}
            onChange={(e) => updateConfig('forecast_method', e.target.value)}
          >
            <option value="linear_trend">Linear Trend (Recommended)</option>
            <option value="moving_average">Moving Average</option>
            <option value="exponential_smoothing">Exponential Smoothing</option>
            <option value="prophet">Facebook Prophet (Requires Setup)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="changepoint_prior_scale">
            <span className="form-icon">📊</span>
            Trend Flexibility
          </label>
          <input
            type="number"
            id="changepoint_prior_scale"
            min="0.001"
            max="0.5"
            step="any"
            value={config.changepoint_prior_scale}
            onChange={(e) => updateConfig('changepoint_prior_scale', parseFloat(e.target.value))}
            title="Higher values make the trend more flexible (0.001-0.5)"
          />
        </div>

        <div className="form-group">
          <label htmlFor="seasonality_prior_scale">
            <span className="form-icon">⚡</span>
            Seasonality Strength
          </label>
          <input
            type="number"
            id="seasonality_prior_scale"
            min="0.01"
            max="50"
            step="any"
            value={config.seasonality_prior_scale}
            onChange={(e) => updateConfig('seasonality_prior_scale', parseFloat(e.target.value))}
            title="Higher values make seasonality more flexible (0.01-50)"
          />
        </div>
      </div>

      <div className="config-grid" style={{ marginTop: '20px' }}>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={config.yearly_seasonality}
              onChange={(e) => updateConfig('yearly_seasonality', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Yearly Seasonality
          </label>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={config.weekly_seasonality}
              onChange={(e) => updateConfig('weekly_seasonality', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Weekly Seasonality
          </label>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={config.daily_seasonality}
              onChange={(e) => updateConfig('daily_seasonality', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Daily Seasonality
          </label>
        </div>
      </div>

      <button
        type="submit"
        className="btn"
        disabled={loading}
        style={{ marginTop: '20px' }}
      >
        {loading ? (
          <>
            <span className="btn-icon spinning">📈</span>
            Generating Forecast...
          </>
        ) : (
          <>
            <span className="btn-icon">▶️</span>
            Generate Forecast
          </>
        )}
      </button>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }} className="parameter-guide">
        <div className="guide-header">
          <span className="guide-icon">ℹ️</span>
          <h4>Parameter Guide:</h4>
        </div>
        <ul>
          <li><strong>Forecast Periods:</strong> Number of future time periods to predict</li>
          <li><strong>Trend Flexibility:</strong> How much the trend can change (lower = smoother)</li>
          <li><strong>Seasonality Strength:</strong> How strong seasonal patterns are</li>
          <li><strong>Seasonality Options:</strong> Enable yearly, weekly, or daily patterns</li>
          <li><strong>Country Holidays:</strong> Include country-specific holidays in the model</li>
        </ul>
      </div>
    </form>
  );
};

export default ForecastConfig;