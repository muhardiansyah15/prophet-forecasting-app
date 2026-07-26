import React, { useState } from 'react';
import { ForecastConfigType } from '../App';

interface ForecastConfigProps {
  onForecast: (config: ForecastConfigType) => void;
  loading: boolean;
}

const METHODS = [
  {
    value: 'prophet',
    name: 'Facebook Prophet',
    desc: 'Trend + seasonality + holidays, with uncertainty intervals',
    badge: 'Recommended',
  },
  { value: 'linear_trend', name: 'Linear Trend', desc: 'Straight-line fit, fast baseline' },
  { value: 'moving_average', name: 'Moving Average', desc: '7-day window with weekday pattern' },
  { value: 'exponential_smoothing', name: 'Exponential Smoothing', desc: 'Weighted recent history' },
];

const HOLIDAY_COUNTRIES = [
  { code: '', label: 'None' },
  { code: 'ID', label: 'Indonesia' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'SG', label: 'Singapore' },
  { code: 'MY', label: 'Malaysia' },
  { code: 'JP', label: 'Japan' },
  { code: 'DE', label: 'Germany' },
];

const ForecastConfig: React.FC<ForecastConfigProps> = ({ onForecast, loading }) => {
  const [method, setMethod] = useState('prophet');
  const [periods, setPeriods] = useState(30);
  const [yearly, setYearly] = useState(true);
  const [weekly, setWeekly] = useState(true);
  const [daily, setDaily] = useState(false);
  const [holidays, setHolidays] = useState('');
  const [changepointScale, setChangepointScale] = useState(0.05);
  const [seasonalityScale, setSeasonalityScale] = useState(10);

  const isProphet = method === 'prophet';

  const submit = () => {
    onForecast({
      periods,
      yearly_seasonality: yearly,
      weekly_seasonality: weekly,
      daily_seasonality: daily,
      changepoint_prior_scale: changepointScale,
      seasonality_prior_scale: seasonalityScale,
      holidays_prior_scale: 10,
      country_holidays: holidays || undefined,
      forecast_method: method,
    });
  };

  return (
    <div>
      <div className="method-row" role="radiogroup" aria-label="Forecast method">
        {METHODS.map(m => (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={method === m.value}
            className={`method-card${method === m.value ? ' selected' : ''}`}
            onClick={() => setMethod(m.value)}
          >
            {m.badge && <span className="m-badge">{m.badge}</span>}
            <span className="m-name">{m.name}</span>
            <span className="m-desc">{m.desc}</span>
          </button>
        ))}
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="periods">Forecast horizon</label>
          <div className="range-wrap">
            <input
              id="periods"
              type="range"
              min={7}
              max={365}
              value={periods}
              onChange={e => setPeriods(Number(e.target.value))}
            />
            <span className="range-value">{periods} days</span>
          </div>
        </div>

        {isProphet && (
          <div className="field">
            <label htmlFor="holidays">Country holidays</label>
            <select id="holidays" value={holidays} onChange={e => setHolidays(e.target.value)}>
              {HOLIDAY_COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isProphet && (
        <>
          <div className="toggles">
            <label className={`toggle${yearly ? ' on' : ''}`}>
              <input type="checkbox" checked={yearly} onChange={e => setYearly(e.target.checked)} />
              Yearly seasonality
            </label>
            <label className={`toggle${weekly ? ' on' : ''}`}>
              <input type="checkbox" checked={weekly} onChange={e => setWeekly(e.target.checked)} />
              Weekly seasonality
            </label>
            <label className={`toggle${daily ? ' on' : ''}`}>
              <input type="checkbox" checked={daily} onChange={e => setDaily(e.target.checked)} />
              Daily seasonality
            </label>
          </div>

          <details className="advanced">
            <summary>Advanced (Prophet priors)</summary>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="cps">
                  Changepoint prior scale — trend flexibility (default 0.05)
                </label>
                <input
                  id="cps"
                  type="number"
                  step={0.01}
                  min={0.001}
                  max={0.5}
                  value={changepointScale}
                  onChange={e => setChangepointScale(Number(e.target.value))}
                />
              </div>
              <div className="field">
                <label htmlFor="sps">
                  Seasonality prior scale — seasonality strength (default 10)
                </label>
                <input
                  id="sps"
                  type="number"
                  step={1}
                  min={0.01}
                  max={100}
                  value={seasonalityScale}
                  onChange={e => setSeasonalityScale(Number(e.target.value))}
                />
              </div>
            </div>
          </details>
        </>
      )}

      <div className="actions">
        <button className="btn btn-primary" onClick={submit} disabled={loading}>
          {loading ? 'Forecasting…' : '⚡ Generate Forecast'}
        </button>
      </div>
    </div>
  );
};

export default ForecastConfig;
