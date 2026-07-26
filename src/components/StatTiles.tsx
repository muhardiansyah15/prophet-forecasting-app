import React from 'react';
import { ForecastData } from '../App';

const fmt = (n: number) =>
  Math.abs(n) >= 1000
    ? n.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : n.toLocaleString('en-US', { maximumFractionDigits: 2 });

interface StatTilesProps {
  data: ForecastData;
}

const StatTiles: React.FC<StatTilesProps> = ({ data }) => {
  const { historical, forecast, metrics } = data;

  const horizon = forecast.length;
  const forecastMean = forecast.reduce((s, d) => s + d.yhat, 0) / horizon;
  const forecastTotal = forecast.reduce((s, d) => s + d.yhat, 0);

  const recent = historical.slice(-horizon);
  const recentMean = recent.reduce((s, d) => s + d.y, 0) / recent.length;
  const growth = recentMean !== 0 ? ((forecastMean - recentMean) / Math.abs(recentMean)) * 100 : 0;
  const growingUp = growth >= 0;

  return (
    <div className="stat-row">
      <div className="stat-tile">
        <div className="stat-caption">Next {horizon} days · average</div>
        <div className="stat-value">{fmt(forecastMean)}</div>
        <div className="stat-note">per day, predicted</div>
      </div>

      <div className="stat-tile">
        <div className="stat-caption">Next {horizon} days · total</div>
        <div className="stat-value">{fmt(forecastTotal)}</div>
        <div className="stat-note">sum of predictions</div>
      </div>

      <div className="stat-tile">
        <div className="stat-caption">vs last {horizon} days</div>
        <div className={`stat-value ${growingUp ? 'delta-up' : 'delta-down'}`}>
          {growingUp ? '▲' : '▼'} {Math.abs(growth).toFixed(1)}%
        </div>
        <div className="stat-note">{growingUp ? 'trending up' : 'trending down'}</div>
      </div>

      {metrics && (
        <div className="stat-tile">
          <div className="stat-caption">Backtest error (MAPE)</div>
          <div className="stat-value">{metrics.mape.toFixed(1)}%</div>
          <div className="stat-note">
            MAE {fmt(metrics.mae)} · RMSE {fmt(metrics.rmse)} on last 20% holdout
          </div>
        </div>
      )}
    </div>
  );
};

export default StatTiles;
